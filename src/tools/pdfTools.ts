import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import { zipSync } from 'fflate';
import { baseName, parseRanges, flatPages, loadImage, canvasBlob, drawImage } from '../lib/util';
import { openPdf, renderPage } from '../lib/pdfjs';
import type { Out, Ctx } from './types';

const bytes = (f: Blob) => f.arrayBuffer();
const loadPdf = async (f: File) => {
  try { return await PDFDocument.load(await bytes(f), { ignoreEncryption: false }); }
  catch (e: any) {
    if (/encrypt/i.test(String(e?.message))) throw new Error(`"${f.name}" is password protected. Unlock it first.`);
    throw new Error(`"${f.name}" is not a valid PDF`);
  }
};
const toBlob = async (d: PDFDocument) => new Blob([await d.save()], { type: 'application/pdf' });

export async function merge(files: File[], _o: any, c: Ctx): Promise<Out[]> {
  const out = await PDFDocument.create();
  for (let i = 0; i < files.length; i++) {
    c.progress(i, files.length, `Adding ${files[i].name}`);
    const src = await loadPdf(files[i]);
    (await out.copyPages(src, src.getPageIndices())).forEach((p) => out.addPage(p));
  }
  return [{ name: 'merged.pdf', blob: await toBlob(out), note: `${out.getPageCount()} pages` }];
}

async function subset(src: PDFDocument, idx: number[]) {
  const d = await PDFDocument.create();
  (await d.copyPages(src, idx)).forEach((p) => d.addPage(p));
  return toBlob(d);
}

export async function split(files: File[], o: any, c: Ctx): Promise<Out[]> {
  const src = await loadPdf(files[0]); const n = src.getPageCount(); const b = baseName(files[0].name);
  let groups: number[][];
  if (o.mode === 'each') groups = src.getPageIndices().map((i) => [i]);
  else if (o.mode === 'every') {
    const k = Math.max(1, Math.floor(o.every)); groups = [];
    for (let i = 0; i < n; i += k) groups.push(src.getPageIndices().slice(i, i + k));
  } else groups = parseRanges(o.ranges, n);
  const outs: Out[] = [];
  for (let i = 0; i < groups.length; i++) {
    c.progress(i, groups.length);
    outs.push({ name: `${b}-part${i + 1}.pdf`, blob: await subset(src, groups[i]), note: `${groups[i].length} pages` });
  }
  return outs;
}

export async function removePages(files: File[], o: any): Promise<Out[]> {
  const src = await loadPdf(files[0]); const n = src.getPageCount();
  const del = new Set(flatPages(parseRanges(o.pages, n)));
  if (del.size >= n) throw new Error('You cannot remove every page');
  const keep = src.getPageIndices().filter((i) => !del.has(i));
  return [{ name: `${baseName(files[0].name)}-edited.pdf`, blob: await subset(src, keep), note: `${keep.length} pages left` }];
}
export async function extractPages(files: File[], o: any): Promise<Out[]> {
  const src = await loadPdf(files[0]);
  const idx = flatPages(parseRanges(o.pages, src.getPageCount()));
  return [{ name: `${baseName(files[0].name)}-extract.pdf`, blob: await subset(src, idx), note: `${idx.length} pages` }];
}
export async function reorder(files: File[], o: any): Promise<Out[]> {
  const src = await loadPdf(files[0]); const n = src.getPageCount();
  let idx: number[];
  const s = String(o.order).trim().toLowerCase();
  if (s === 'reverse') idx = src.getPageIndices().reverse();
  else {
    idx = s.split(',').map((x) => parseInt(x.trim()) - 1);
    if (idx.some((i) => isNaN(i) || i < 0 || i >= n)) throw new Error(`Order must list page numbers between 1 and ${n}`);
  }
  return [{ name: `${baseName(files[0].name)}-reordered.pdf`, blob: await subset(src, idx), note: `${idx.length} pages` }];
}
export async function rotate(files: File[], o: any): Promise<Out[]> {
  const d = await loadPdf(files[0]);
  const sel = new Set(flatPages(parseRanges(o.pages, d.getPageCount())));
  d.getPages().forEach((p, i) => { if (sel.has(i)) p.setRotation(degrees((p.getRotation().angle + Number(o.angle)) % 360)); });
  return [{ name: `${baseName(files[0].name)}-rotated.pdf`, blob: await toBlob(d) }];
}
export async function pageNumbers(files: File[], o: any): Promise<Out[]> {
  const d = await loadPdf(files[0]); const f = await d.embedFont(StandardFonts.Helvetica);
  const total = d.getPageCount();
  d.getPages().forEach((p, i) => {
    const t = String(o.format).replace('{n}', String(i + Number(o.start))).replace('{total}', String(total + Number(o.start) - 1));
    const { width, height } = p.getSize(); const w = f.widthOfTextAtSize(t, 11);
    const [v, h] = String(o.position).split('-');
    const x = h === 'left' ? 30 : h === 'right' ? width - 30 - w : (width - w) / 2;
    const y = v === 'top' ? height - 30 : 22;
    p.drawText(t, { x, y, size: 11, font: f, color: rgb(0.2, 0.2, 0.2) });
  });
  return [{ name: `${baseName(files[0].name)}-numbered.pdf`, blob: await toBlob(d) }];
}
export async function watermark(files: File[], o: any): Promise<Out[]> {
  const d = await loadPdf(files[0]); const f = await d.embedFont(StandardFonts.HelveticaBold);
  const text = String(o.text).replace(/[^\x20-\x7e]/g, '?') || 'WATERMARK';
  d.getPages().forEach((p) => {
    const { width, height } = p.getSize(); const size = Number(o.size);
    const w = f.widthOfTextAtSize(text, size); const ang = (Number(o.angle) * Math.PI) / 180;
    p.drawText(text, {
      x: width / 2 - (w / 2) * Math.cos(ang), y: height / 2 - (w / 2) * Math.sin(ang), size, font: f,
      color: rgb(0.5, 0.5, 0.5), opacity: Number(o.opacity), rotate: degrees(Number(o.angle)),
    });
  });
  return [{ name: `${baseName(files[0].name)}-watermarked.pdf`, blob: await toBlob(d) }];
}
export async function setMeta(files: File[], o: any): Promise<Out[]> {
  const d = await loadPdf(files[0]);
  d.setTitle(o.title); d.setAuthor(o.author); d.setSubject(o.subject); d.setKeywords(String(o.keywords).split(',').map((s) => s.trim()).filter(Boolean));
  return [{ name: `${baseName(files[0].name)}-meta.pdf`, blob: await toBlob(d) }];
}

export async function compress(files: File[], o: any, c: Ctx): Promise<Out[]> {
  const lvl = { low: [1.0, 0.5], med: [1.4, 0.7], high: [2.0, 0.85] }[o.level as 'low'] ?? [1.4, 0.7];
  const src = await openPdf(files[0]); const out = await PDFDocument.create();
  for (let i = 1; i <= src.numPages; i++) {
    c.progress(i - 1, src.numPages, `Page ${i}/${src.numPages}`);
    const cv = await renderPage(src, i, lvl[0]);
    const jpg = await out.embedJpg(await bytes(await canvasBlob(cv, 'image/jpeg', lvl[1])));
    const pg = await src.getPage(i); const vp = pg.getViewport({ scale: 1 });
    out.addPage([vp.width, vp.height]).drawImage(jpg, { x: 0, y: 0, width: vp.width, height: vp.height });
  }
  const blob = await toBlob(out);
  if (blob.size >= files[0].size)
    return [{ name: files[0].name, blob: files[0], note: 'Already optimal, original returned (compressed copy was larger)' }];
  const pct = Math.round((1 - blob.size / files[0].size) * 100);
  return [{ name: `${baseName(files[0].name)}-compressed.pdf`, blob, note: `${pct}% smaller. Text becomes an image at this level.` }];
}

export async function imagesToPdf(files: File[], o: any, c: Ctx): Promise<Out[]> {
  const d = await PDFDocument.create(); const A4: [number, number] = [595.28, 841.89]; const m = Number(o.margin);
  for (let i = 0; i < files.length; i++) {
    c.progress(i, files.length, files[i].name);
    const img = await loadImage(files[i]);
    const png = files[i].type === 'image/png';
    const cv = drawImage(img, img.naturalWidth, img.naturalHeight, png ? undefined : '#fff');
    const emb = png ? await d.embedPng(await bytes(await canvasBlob(cv, 'image/png'))) : await d.embedJpg(await bytes(await canvasBlob(cv, 'image/jpeg', 0.92)));
    let [pw, ph] = o.size === 'fit' ? [emb.width + m * 2, emb.height + m * 2] : [...A4];
    if (o.size === 'a4-landscape') [pw, ph] = [A4[1], A4[0]];
    if (o.size === 'a4' && emb.width > emb.height && o.auto) [pw, ph] = [A4[1], A4[0]];
    const s = Math.min((pw - m * 2) / emb.width, (ph - m * 2) / emb.height, o.size === 'fit' ? 1 : Infinity);
    const w = emb.width * s, h = emb.height * s;
    d.addPage([pw, ph]).drawImage(emb, { x: (pw - w) / 2, y: (ph - h) / 2, width: w, height: h });
  }
  return [{ name: 'images.pdf', blob: await toBlob(d), note: `${files.length} images` }];
}

export async function pdfToImages(files: File[], o: any, c: Ctx): Promise<Out[]> {
  const src = await openPdf(files[0]); const b = baseName(files[0].name);
  const type = o.format === 'png' ? 'image/png' : o.format === 'webp' ? 'image/webp' : 'image/jpeg'; const ext = o.format === 'jpg' ? 'jpg' : o.format;
  const outs: Out[] = [];
  for (let i = 1; i <= src.numPages; i++) {
    c.progress(i - 1, src.numPages, `Page ${i}/${src.numPages}`);
    outs.push({ name: `${b}-page${i}.${ext}`, blob: await canvasBlob(await renderPage(src, i, Number(o.dpi) / 72), type, 0.9) });
  }
  return outs;
}
export async function pdfToText(files: File[], _o: any, c: Ctx): Promise<Out[]> {
  const src = await openPdf(files[0]); let t = '';
  for (let i = 1; i <= src.numPages; i++) {
    c.progress(i - 1, src.numPages);
    const tc = await (await src.getPage(i)).getTextContent();
    let line = '', lastY: number | null = null;
    for (const it of tc.items as any[]) {
      const y = it.transform[5];
      if (lastY !== null && Math.abs(y - lastY) > 2) { t += line.trimEnd() + '\n'; line = ''; }
      line += it.str + (it.hasEOL ? '\n' : ' '); lastY = y;
    }
    t += line.trimEnd() + `\n\n--- page ${i} ---\n\n`;
  }
  const plain = t.replace(/--- page \d+ ---/g, '').trim();
  return [{ name: `${baseName(files[0].name)}.txt`, blob: new Blob([t], { type: 'text/plain' }), note: plain ? undefined : 'No text layer found (scanned PDF). OCR is on the roadmap.' }];
}
export const zipOuts = (outs: Out[]) => Promise.all(outs.map(async (o) => [o.name, new Uint8Array(await o.blob.arrayBuffer())] as const))
  .then((e) => new Blob([zipSync(Object.fromEntries(e), { level: 0 })], { type: 'application/zip' }));

export async function nupPdf(files: File[], o: any, c: Ctx): Promise<Out[]> {
  const src = await loadPdf(files[0]); const out = await PDFDocument.create(); const per = Number(o.per) || 2; const n = src.getPageCount();
  const grid: Record<number, [number, number]> = { 2: [2, 1], 4: [2, 2], 6: [3, 2], 9: [3, 3] }; const [cols, rows] = grid[per] ?? [2, 1];
  const land = o.layout === 'landscape' || (o.layout === 'auto' && cols > rows); const W = land ? 842 : 595, H = land ? 595 : 842; const m = 18, gap = 8;
  const cw = (W - 2 * m - gap * (cols - 1)) / cols, ch = (H - 2 * m - gap * (rows - 1)) / rows;
  for (let i = 0; i < n; i += per) {
    c.progress(i / per, Math.ceil(n / per)); const page = out.addPage([W, H]);
    const embedded = await out.embedPdf(src, Array.from({ length: Math.min(per, n - i) }, (_, k) => i + k));
    embedded.forEach((e, k) => {
      const s = Math.min(cw / e.width, ch / e.height); const w = e.width * s, h = e.height * s; const col = k % cols, row = Math.floor(k / cols);
      const x = m + col * (cw + gap) + (cw - w) / 2, y = H - m - row * (ch + gap) - ch + (ch - h) / 2;
      page.drawPage(e, { x, y, width: w, height: h });
      if (o.border) page.drawRectangle({ x, y, width: w, height: h, borderColor: rgb(0.6, 0.6, 0.6), borderWidth: 0.5 });
    });
  }
  return [{ name: `${baseName(files[0].name)}-${per}up.pdf`, blob: await toBlob(out), note: `${n} pages on ${Math.ceil(n / per)} sheets` }];
}

export async function headerFooter(files: File[], o: any): Promise<Out[]> {
  const d = await loadPdf(files[0]); const f = await d.embedFont(StandardFonts.Helvetica); const total = d.getPageCount(); const size = Number(o.size) || 10;
  const fill = (t: string, i: number) => String(t).replace('{n}', String(i + 1)).replace('{total}', String(total)).replace('{date}', new Date().toISOString().slice(0, 10)).replace('{file}', files[0].name.replace(/\.pdf$/i, ''));
  if (!String(o.header).trim() && !String(o.footer).trim()) throw new Error('Type a header or a footer text.');
  try {
    d.getPages().forEach((p, i) => {
      const { width, height } = p.getSize();
      for (const [txt, top] of [[o.header, true], [o.footer, false]] as [string, boolean][]) {
        if (!String(txt).trim()) continue; const t = fill(txt, i); const w = f.widthOfTextAtSize(t, size);
        const x = o.align === 'left' ? 36 : o.align === 'right' ? width - 36 - w : (width - w) / 2; const y = top ? height - 30 : 22;
        p.drawText(t, { x, y, size, font: f, color: rgb(0.2, 0.2, 0.2) });
      }
    });
  } catch { throw new Error('Header and footer support Latin letters and numbers only. Remove other characters.'); }
  return [{ name: `${baseName(files[0].name)}-headfoot.pdf`, blob: await toBlob(d) }];
}

export async function flattenPdf(files: File[], o: any, c: Ctx): Promise<Out[]> {
  const q = { draft: [1.2, 0.6], standard: [1.8, 0.8], sharp: [2.6, 0.9] }[o.quality as 'draft'] ?? [1.8, 0.8];
  const src = await openPdf(files[0]); const out = await PDFDocument.create();
  for (let i = 1; i <= src.numPages; i++) {
    c.progress(i - 1, src.numPages, `Page ${i}/${src.numPages}`);
    const cv = await renderPage(src, i, q[0]); const img = o.format === 'png' ? await out.embedPng(await bytes(await canvasBlob(cv, 'image/png'))) : await out.embedJpg(await bytes(await canvasBlob(cv, 'image/jpeg', q[1])));
    const vp = (await src.getPage(i)).getViewport({ scale: 1 }); out.addPage([vp.width, vp.height]).drawImage(img, { x: 0, y: 0, width: vp.width, height: vp.height });
  }
  return [{ name: `${baseName(files[0].name)}-flattened.pdf`, blob: await toBlob(out), note: 'Form fields, annotations and text are now part of the page picture' }];
}

export async function pageSize(files: File[], o: any): Promise<Out[]> {
  const sizes: Record<string, [number, number]> = { a4: [595.28, 841.89], a3: [841.89, 1190.55], a5: [419.53, 595.28], letter: [612, 792], legal: [612, 1008] };
  const src = await loadPdf(files[0]); const out = await PDFDocument.create(); const margin = Math.max(0, Math.min(100, Number(o.margin) || 0));
  const pages = await out.embedPdf(src, src.getPageIndices());
  pages.forEach((e) => {
    let [w, h] = sizes[o.size] ?? sizes.a4; const landscape = o.orient === 'landscape' || (o.orient === 'auto' && e.width > e.height); if (landscape) [w, h] = [h, w];
    const s = Math.min((w - 2 * margin) / e.width, (h - 2 * margin) / e.height); const dw = e.width * s, dh = e.height * s;
    out.addPage([w, h]).drawPage(e, { x: (w - dw) / 2, y: (h - dh) / 2, width: dw, height: dh });
  });
  return [{ name: `${baseName(files[0].name)}-${o.size}.pdf`, blob: await toBlob(out), note: `Every page fitted to ${String(o.size).toUpperCase()}` }];
}
