import { PDFDocument, StandardFonts } from 'pdf-lib';
import { baseName, loadImage, canvasBlob, drawImage } from '../lib/util';
import { openPdf, renderPage } from '../lib/pdfjs';
import type { Out, Ctx } from './types';

async function worker(lang: string, c: Ctx, label: string) {
  const { createWorker } = await import('tesseract.js');
  return createWorker(lang, 1, {
    workerPath: '/ocr/worker.min.js', corePath: '/ocr', langPath: '/ocr', gzip: false,
    logger: (m: any) => { if (m.status === 'recognizing text') c.progress(Math.floor(m.progress * 100), 100, `${label}: reading text ${Math.round(m.progress * 100)}%`); },
  } as any);
}
export async function ocrImage(files: File[], o: any, c: Ctx): Promise<Out[]> {
  const w = await worker(o.lang, c, 'Image'); const outs: Out[] = [];
  try { for (const f of files) { const { data } = await w.recognize(f); outs.push({ name: `${baseName(f.name)}.txt`, blob: new Blob([data.text], { type: 'text/plain' }), note: data.text.trim() ? `Confidence ${Math.round(data.confidence)}%` : 'No text found' }); } }
  finally { await w.terminate(); }
  return outs;
}
export async function ocrPdf(files: File[], o: any, c: Ctx): Promise<Out[]> {
  const src = await openPdf(files[0]); const w = await worker(o.lang, c, 'Page'); const out = await PDFDocument.create(); const font = await out.embedFont(StandardFonts.Helvetica); let all = ''; let conf = 0;
  try {
    for (let i = 1; i <= src.numPages; i++) {
      c.progress(i - 1, src.numPages, `Page ${i}/${src.numPages}`);
      const S = 2; const cv = await renderPage(src, i, S); const { data } = await w.recognize(cv, {}, { blocks: true } as any); all += data.text + `\n\n`; conf += data.confidence;
      const vp = (await src.getPage(i)).getViewport({ scale: 1 }); const img = await out.embedJpg(await (await canvasBlob(cv, 'image/jpeg', 0.85)).arrayBuffer());
      const page = out.addPage([vp.width, vp.height]); page.drawImage(img, { x: 0, y: 0, width: vp.width, height: vp.height });
      if (o.layer) for (const wd of ((data as any).blocks ?? []).flatMap((b: any) => b.paragraphs.flatMap((p: any) => p.lines.flatMap((l: any) => l.words)))) {
        const t = String(wd.text).replace(/[^\x20-\x7e]/g, ''); if (!t) continue; const h = (wd.bbox.y1 - wd.bbox.y0) / S;
        page.drawText(t, { x: wd.bbox.x0 / S, y: vp.height - wd.bbox.y1 / S + h * 0.2, size: Math.max(4, h * 0.85), font, opacity: 0 });
      }
    }
  } finally { await w.terminate(); }
  const outs: Out[] = [{ name: `${baseName(files[0].name)}.txt`, blob: new Blob([all], { type: 'text/plain' }), note: `Average confidence ${Math.round(conf / src.numPages)}%` }];
  if (o.layer) outs.unshift({ name: `${baseName(files[0].name)}-searchable.pdf`, blob: new Blob([await out.save()], { type: 'application/pdf' }), note: 'Searchable PDF (Latin text layer; other scripts are in the .txt)' });
  return outs;
}
export async function scanToPdf(files: File[], o: any, c: Ctx): Promise<Out[]> {
  const d = await PDFDocument.create(); const A4: [number, number] = [595.28, 841.89];
  for (let i = 0; i < files.length; i++) {
    c.progress(i, files.length, files[i].name); const img = await loadImage(files[i]); const maxSide = 2000; const s = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const cv = drawImage(img, Math.round(img.naturalWidth * s), Math.round(img.naturalHeight * s), '#fff'); const g = cv.getContext('2d')!;
    if (o.filter !== 'original') { const dt = g.getImageData(0, 0, cv.width, cv.height); const p = dt.data;
      for (let k = 0; k < p.length; k += 4) { let v = 0.299 * p[k] + 0.587 * p[k + 1] + 0.114 * p[k + 2]; if (o.filter === 'document') { v = (v - 128) * 1.9 + 128 + 25; v = v > 200 ? 255 : v < 70 ? 0 : v; } else v = (v - 128) * 1.15 + 128; v = Math.max(0, Math.min(255, v)); p[k] = p[k + 1] = p[k + 2] = v; }
      g.putImageData(dt, 0, 0); }
    const emb = await d.embedJpg(await (await canvasBlob(cv, 'image/jpeg', 0.85)).arrayBuffer()); const land = emb.width > emb.height; const [pw, ph] = land ? [A4[1], A4[0]] : A4; const m = 18;
    const k = Math.min((pw - m * 2) / emb.width, (ph - m * 2) / emb.height); const w = emb.width * k, h = emb.height * k;
    d.addPage([pw, ph]).drawImage(emb, { x: (pw - w) / 2, y: (ph - h) / 2, width: w, height: h });
  }
  return [{ name: 'scan.pdf', blob: new Blob([await d.save()], { type: 'application/pdf' }), note: `${files.length} page(s)` }];
}
