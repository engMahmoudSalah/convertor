import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { encryptPDF } from '@pdfsmaller/pdf-encrypt-lite';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import PptxGenJS from 'pptxgenjs';
import * as pdfjs from 'pdfjs-dist';
import { baseName, parseRanges, canvasBlob, flatPages } from '../lib/util';
import { openPdf, renderPage } from '../lib/pdfjs';
import type { Out, Ctx } from './types';

const buf = (f: Blob) => f.arrayBuffer();
const pdfBlob = async (d: PDFDocument) => new Blob([await d.save()], { type: 'application/pdf' });

export async function protect(files: File[], o: any): Promise<Out[]> {
  if (!o.password) throw new Error('Enter a password');
  const src = new Uint8Array(await buf(files[0]));
  const out = await encryptPDF(src, o.password, { ownerPassword: o.password, allowCopying: !!o.copy, allowModifying: false, allowPrinting: !!o.print } as any);
  return [{ name: `${baseName(files[0].name)}-protected.pdf`, blob: new Blob([out], { type: 'application/pdf' }), note: 'RC4 128-bit encryption. Keep your password safe, it cannot be recovered.' }];
}
async function rasterRebuild(file: File, password: string, scale = 2): Promise<Blob> {
  const data = new Uint8Array(await buf(file)); const doc = await pdfjs.getDocument({ data, password }).promise; const out = await PDFDocument.create();
  for (let i = 1; i <= doc.numPages; i++) {
    const c = await renderPage(doc, i, scale); const j = await out.embedJpg(await buf(await canvasBlob(c, 'image/jpeg', 0.9)));
    const vp = (await doc.getPage(i)).getViewport({ scale: 1 }); out.addPage([vp.width, vp.height]).drawImage(j, { x: 0, y: 0, width: vp.width, height: vp.height });
  }
  return pdfBlob(out);
}
export async function unlock(files: File[], o: any): Promise<Out[]> {
  const bytes = new Uint8Array(await buf(files[0]));
  try { await PDFDocument.load(bytes); return [{ name: files[0].name, blob: files[0], note: 'This PDF is not password protected.' }]; } catch { /* encrypted */ }
  try { return [{ name: `${baseName(files[0].name)}-unlocked.pdf`, blob: await rasterRebuild(files[0], o.password || ''), note: 'Unlocked. Pages are rebuilt as images, so text is not selectable.' }]; }
  catch (e: any) { throw new Error(e?.name === 'PasswordException' ? 'Wrong or missing password' : `Could not unlock: ${e?.message}`); }
}
export async function repair(files: File[]): Promise<Out[]> {
  const bytes = await buf(files[0]);
  try {
    const src = await PDFDocument.load(bytes, { ignoreEncryption: true, throwOnInvalidObject: false, updateMetadata: false } as any);
    const out = await PDFDocument.create(); (await out.copyPages(src, src.getPageIndices())).forEach((p) => out.addPage(p));
    return [{ name: `${baseName(files[0].name)}-repaired.pdf`, blob: await pdfBlob(out), note: `Rebuilt structure, ${out.getPageCount()} pages recovered` }];
  } catch {
    try { return [{ name: `${baseName(files[0].name)}-repaired.pdf`, blob: await rasterRebuild(files[0], ''), note: 'Recovered by rendering pages (text not selectable)' }]; }
    catch { throw new Error('This file is too damaged to repair'); }
  }
}
export async function crop(files: File[], o: any): Promise<Out[]> {
  const d = await PDFDocument.load(await buf(files[0])); const sel = new Set(flatPages(parseRanges(o.pages, d.getPageCount())));
  d.getPages().forEach((p, i) => { if (!sel.has(i)) return; const { width: w, height: h } = p.getSize();
    const l = +o.left, r = +o.right, t = +o.top, b = +o.bottom; if (l + r >= w || t + b >= h) throw new Error('Margins are larger than the page');
    p.setCropBox(l, b, w - l - r, h - t - b); });
  return [{ name: `${baseName(files[0].name)}-cropped.pdf`, blob: await pdfBlob(d) }];
}
export async function sign(files: File[], o: any): Promise<Out[]> {
  if (!String(o.name).trim()) throw new Error('Type your name');
  const d = await PDFDocument.load(await buf(files[0])); const f = await d.embedFont(StandardFonts.TimesRomanItalic); const sm = await d.embedFont(StandardFonts.Helvetica);
  const sel = new Set(flatPages(parseRanges(o.pages, d.getPageCount())));
  d.getPages().forEach((p, i) => { if (!sel.has(i)) return; const { width: w } = p.getSize(); const t = String(o.name).replace(/[^\x20-\x7e]/g, '?'); const tw = f.widthOfTextAtSize(t, 26);
    const x = o.position === 'left' ? 50 : o.position === 'center' ? (w - tw) / 2 : w - tw - 50; const y = +o.y;
    p.drawText(t, { x, y, size: 26, font: f, color: rgb(0.05, 0.1, 0.5) }); p.drawLine({ start: { x: x - 4, y: y - 4 }, end: { x: x + tw + 4, y: y - 4 }, thickness: 0.6, color: rgb(0.3, 0.3, 0.3) });
    if (o.date) p.drawText(`Signed ${new Date().toISOString().slice(0, 10)}`, { x, y: y - 16, size: 8, font: sm, color: rgb(0.35, 0.35, 0.35) }); });
  return [{ name: `${baseName(files[0].name)}-signed.pdf`, blob: await pdfBlob(d), note: 'Visual signature (not a cryptographic certificate signature)' }];
}
export async function redact(files: File[], o: any, c: Ctx): Promise<Out[]> {
  const terms = String(o.terms).split(',').map((s) => s.trim().toLowerCase()).filter(Boolean); if (!terms.length) throw new Error('Enter words to redact, separated by commas');
  const src = await openPdf(files[0]); const out = await PDFDocument.create(); let hits = 0; const S = 2;
  for (let i = 1; i <= src.numPages; i++) {
    c.progress(i - 1, src.numPages); const page = await src.getPage(i); const vp = page.getViewport({ scale: 1 });
    const items = (await page.getTextContent()).items as any[]; const boxes = items.filter((it) => terms.some((t) => it.str.toLowerCase().includes(t)));
    if (!boxes.length) { const [cp] = await out.copyPages(await PDFDocument.load(await buf(files[0])), [i - 1]); out.addPage(cp); continue; }
    hits += boxes.length; const cv = await renderPage(src, i, S); const g = cv.getContext('2d')!; g.fillStyle = '#000';
    boxes.forEach((it) => { const [, , , , x, y] = it.transform; g.fillRect((x - 1) * S, (vp.height - y - it.height * 0.25 - 1) * S, (it.width + 2) * S, (it.height + 3) * S); });
    const j = await out.embedJpg(await buf(await canvasBlob(cv, 'image/jpeg', 0.92))); out.addPage([vp.width, vp.height]).drawImage(j, { x: 0, y: 0, width: vp.width, height: vp.height });
  }
  if (!hits) return [{ name: files[0].name, blob: files[0], note: 'No matches found, file unchanged' }];
  return [{ name: `${baseName(files[0].name)}-redacted.pdf`, blob: await pdfBlob(out), note: `${hits} text blocks blacked out. Affected pages are flattened to images so the text is really removed.` }];
}
async function pageLines(f: File) {
  const src = await openPdf(f); const pages: string[][] = [];
  for (let i = 1; i <= src.numPages; i++) {
    const items = (await (await src.getPage(i)).getTextContent()).items as any[]; const rows = new Map<number, any[]>();
    items.forEach((it) => { const y = Math.round(it.transform[5] / 3); rows.set(y, [...(rows.get(y) ?? []), it]); });
    pages.push([...rows.entries()].sort((a, b) => b[0] - a[0]).map(([, r]) => r.sort((a, b) => a.transform[4] - b.transform[4]).map((x) => x.str).join(' ').trim()).filter(Boolean));
  } return pages;
}
export async function compare(files: File[]): Promise<Out[]> {
  const [A, B] = await Promise.all([pageLines(files[0]), pageLines(files[1])]); const a = A.flat(), b = B.flat();
  const n = a.length, m = b.length; const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const rows: string[] = []; let i = 0, j = 0, add = 0, del = 0; const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]!));
  while (i < n || j < m) {
    if (i < n && j < m && a[i] === b[j]) { rows.push(`<div>${esc(a[i])}</div>`); i++; j++; }
    else if (j < m && (i === n || dp[i][j + 1] >= dp[i + 1][j])) { rows.push(`<div style="background:#d1fae5">+ ${esc(b[j])}</div>`); j++; add++; }
    else { rows.push(`<div style="background:#fee2e2;text-decoration:line-through">- ${esc(a[i])}</div>`); i++; del++; }
  }
  const html = `<!doctype html><meta charset="utf-8"><title>Compare</title><body style="font:14px system-ui;max-width:800px;margin:2rem auto"><h2>${esc(files[0].name)} vs ${esc(files[1].name)}</h2><p>${add} lines added, ${del} lines removed. Pages: ${A.length} vs ${B.length}.</p>${rows.join('')}`;
  return [{ name: 'comparison.html', blob: new Blob([html], { type: 'text/html' }), note: add + del === 0 ? 'The text of both PDFs is identical' : `${add} added, ${del} removed` }];
}
export async function pdfToMarkdown(files: File[], _o: any, c: Ctx): Promise<Out[]> {
  const src = await openPdf(files[0]); const lines: { t: string; h: number }[] = []; const hs: number[] = [];
  for (let i = 1; i <= src.numPages; i++) { c.progress(i - 1, src.numPages);
    const items = (await (await src.getPage(i)).getTextContent()).items as any[]; const rows = new Map<number, any[]>();
    items.forEach((it) => { if (!it.str.trim()) return; const y = Math.round(it.transform[5] / 3); rows.set(y, [...(rows.get(y) ?? []), it]); });
    [...rows.entries()].sort((a, b) => b[0] - a[0]).forEach(([, r]) => { r.sort((a, b) => a.transform[4] - b.transform[4]); const h = Math.max(...r.map((x) => x.height)); hs.push(h); lines.push({ t: r.map((x) => x.str).join(' ').trim(), h }); });
    lines.push({ t: '', h: 0 }); }
  const body = [...hs].sort((a, b) => a - b)[Math.floor(hs.length / 2)] || 10; const md = lines.map((l) => (l.h > body * 1.5 ? `# ${l.t}` : l.h > body * 1.2 ? `## ${l.t}` : /^[-•*]\s/.test(l.t) ? l.t.replace(/^[•*]/, '-') : l.t)).join('\n').replace(/\n{3,}/g, '\n\n');
  return [{ name: `${baseName(files[0].name)}.md`, blob: new Blob([md], { type: 'text/markdown' }) }];
}
export async function excelToPdf(files: File[]): Promise<Out[]> {
  const outs: Out[] = [];
  for (const f of files) {
    const wb = XLSX.read(await buf(f)); const d = await PDFDocument.create(); const font = await d.embedFont(StandardFonts.Courier); const fb = await d.embedFont(StandardFonts.CourierBold);
    const W = 841.89, H = 595.28, M = 36, sz = 8, lh = 11, cw = font.widthOfTextAtSize('0', sz);
    for (const name of wb.SheetNames) {
      const rows: any[][] = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, raw: false, defval: '' }); if (!rows.length) continue;
      const cols = Math.max(...rows.map((r) => r.length)); const widths = Array.from({ length: cols }, (_, c) => Math.min(30, Math.max(3, ...rows.map((r) => String(r[c] ?? '').length))));
      let page = d.addPage([W, H]), y = H - M; page.drawText(`Sheet: ${name}`.replace(/[^\x20-\x7e]/g, '?'), { x: M, y, size: 10, font: fb }); y -= 18;
      rows.forEach((r, ri) => { if (y < M) { page = d.addPage([W, H]); y = H - M; } let x = M;
        widths.forEach((w, c) => { const t = String(r[c] ?? '').replace(/[^\x20-\x7e]/g, '?').slice(0, w); if (x + w * cw < W - M) page.drawText(t, { x, y, size: sz, font: ri === 0 ? fb : font }); x += (w + 2) * cw; }); y -= lh; });
    }
    outs.push({ name: `${baseName(f.name)}.pdf`, blob: await pdfBlob(d), note: 'Each sheet becomes a table page set (text values)' });
  } return outs;
}
export async function pdfToExcel(files: File[], _o: any, c: Ctx): Promise<Out[]> {
  const src = await openPdf(files[0]); const wb = XLSX.utils.book_new();
  for (let i = 1; i <= src.numPages; i++) { c.progress(i - 1, src.numPages);
    const items = (await (await src.getPage(i)).getTextContent()).items as any[]; const rows = new Map<number, any[]>();
    items.forEach((it) => { if (!it.str.trim()) return; const y = Math.round(it.transform[5] / 4); rows.set(y, [...(rows.get(y) ?? []), it]); });
    const data = [...rows.entries()].sort((a, b) => b[0] - a[0]).map(([, r]) => { r.sort((a, b) => a.transform[4] - b.transform[4]); const cells: string[] = []; let lastEnd = -1e9;
      r.forEach((it) => { const x = it.transform[4]; if (cells.length && x - lastEnd < 8) cells[cells.length - 1] += (/\s$/.test(cells[cells.length - 1]) ? '' : ' ') + it.str; else cells.push(it.str); lastEnd = x + it.width; }); return cells.map((s) => s.trim()); });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(data.length ? data : [['']]), `Page ${i}`); }
  const out = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return [{ name: `${baseName(files[0].name)}.xlsx`, blob: new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), note: 'One sheet per page. Columns are detected from text positions.' }];
}
export async function pptxToPdf(files: File[]): Promise<Out[]> {
  const outs: Out[] = [];
  for (const f of files) {
    const z = await JSZip.loadAsync(await buf(f)); const names = Object.keys(z.files).filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n)).sort((a, b) => parseInt(a.match(/\d+/)![0]) - parseInt(b.match(/\d+/)![0]));
    if (!names.length) throw new Error(`"${f.name}" has no slides`);
    const d = await PDFDocument.create(); const font = await d.embedFont(StandardFonts.Helvetica); const fb = await d.embedFont(StandardFonts.HelveticaBold);
    for (let i = 0; i < names.length; i++) {
      const xml = new DOMParser().parseFromString(await z.files[names[i]].async('string'), 'text/xml'); const paras: string[] = [];
      xml.querySelectorAll('a\\:p, p').forEach((p) => { const t = [...p.querySelectorAll('a\\:t, t')].map((x) => x.textContent).join(''); if (t.trim()) paras.push(t); });
      const pg = d.addPage([960, 540]); pg.drawRectangle({ x: 0, y: 0, width: 960, height: 540, color: rgb(1, 1, 1) });
      pg.drawText(`${i + 1}`.padStart(2), { x: 920, y: 18, size: 10, font, color: rgb(0.5, 0.5, 0.5) });
      let y = 480; paras.forEach((t, k) => { const sz = k === 0 ? 34 : 20; const text = t.replace(/[^\x20-\x7e]/g, '?'); let line = '';
        for (const w of text.split(' ')) { const tt = line ? `${line} ${w}` : w; if ((k === 0 ? fb : font).widthOfTextAtSize(tt, sz) > 840) { pg.drawText(line, { x: 60, y, size: sz, font: k === 0 ? fb : font }); y -= sz * 1.3; line = w; } else line = tt; }
        pg.drawText(line, { x: 60, y, size: sz, font: k === 0 ? fb : font }); y -= sz * 1.5 + (k === 0 ? 12 : 0); });
    }
    outs.push({ name: `${baseName(f.name)}.pdf`, blob: await pdfBlob(d), note: `${names.length} slides. Slide text is kept; images and shapes are not yet.` });
  } return outs;
}
export async function pdfToPptx(files: File[], _o: any, c: Ctx): Promise<Out[]> {
  const src = await openPdf(files[0]); const p = new PptxGenJS(); p.layout = 'LAYOUT_WIDE';
  for (let i = 1; i <= src.numPages; i++) { c.progress(i - 1, src.numPages); const cv = await renderPage(src, i, 1.6); const s = p.addSlide();
    const r = Math.min(13.33 / (cv.width / 96), 7.5 / (cv.height / 96)); const w = (cv.width / 96) * r, h = (cv.height / 96) * r;
    s.addImage({ data: cv.toDataURL('image/jpeg', 0.85), x: (13.33 - w) / 2, y: (7.5 - h) / 2, w, h }); }
  const blob = (await p.write({ outputType: 'blob' })) as Blob;
  return [{ name: `${baseName(files[0].name)}.pptx`, blob, note: 'Each page becomes a slide image' }];
}
