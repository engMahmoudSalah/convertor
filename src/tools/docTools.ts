import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import mammoth from 'mammoth';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { baseName } from '../lib/util';
import { openPdf } from '../lib/pdfjs';
import type { Out, Ctx } from './types';

const latin = (s: string) => s.replace(/\t/g, '    ').replace(/[^\x20-\x7e\u00a0-\u00ff]/g, '?');
const NONLATIN = /[^\u0000-\u00ff\u2018-\u201f\u2022\u2026]/;
async function canvasTextPdf(paras: { t: string; bold?: boolean; size?: number }[], size: number) {
  const S = 2, W = 794, H = 1123, M = 64; const rtl = paras.filter((p) => /[\u0590-\u08ff]/.test(p.t)).length >= paras.filter((p) => p.t.trim()).length / 2;
  const d = await PDFDocument.create(); let cv!: HTMLCanvasElement, g!: CanvasRenderingContext2D, y = 0;
  const flushPage = async () => { const blob: Blob = await new Promise((r) => cv.toBlob((b) => r(b!), 'image/jpeg', 0.92)); const im = await d.embedJpg(await blob.arrayBuffer()); d.addPage([595.28, 841.89]).drawImage(im, { x: 0, y: 0, width: 595.28, height: 841.89 }); };
  const fresh = () => { cv = document.createElement('canvas'); cv.width = W * S; cv.height = H * S; g = cv.getContext('2d')!; g.scale(S, S); g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); g.fillStyle = '#111'; y = M; };
  fresh();
  for (const p of paras) {
    const sz = (p.size ?? size) * 1.33; const lh = sz * 1.5; g.font = `${p.bold ? 'bold ' : ''}${sz}px "Noto Sans Arabic", "Segoe UI", Tahoma, Arial, sans-serif`;
    const isAr = /[\u0590-\u08ff]/.test(p.t) || (rtl && !/[a-z]/i.test(p.t)); (g as any).direction = isAr ? 'rtl' : 'ltr'; g.textAlign = isAr ? 'right' : 'left'; const x = isAr ? W - M : M;
    if (!p.t.trim()) { y += lh * 0.6; continue; }
    const words = p.t.split(/\s+/); let line = ''; const out = async () => { if (y + lh > H - M) { await flushPage(); fresh(); g.font = `${p.bold ? 'bold ' : ''}${sz}px "Noto Sans Arabic", "Segoe UI", Tahoma, Arial, sans-serif`; (g as any).direction = isAr ? 'rtl' : 'ltr'; g.textAlign = isAr ? 'right' : 'left'; } g.fillText(line, x, y + sz); y += lh; line = ''; };
    for (const w of words) { const t = line ? line + ' ' + w : w; if (g.measureText(t).width > W - M * 2 && line) { await out(); line = w; } else line = t; }
    if (line) await out(); y += sz * 0.3;
  }
  await flushPage(); return new Blob([await d.save()], { type: 'application/pdf' });
}
export async function textToPdfBlob(paras: { t: string; bold?: boolean; size?: number }[], size: number) {
  if (typeof document !== 'undefined' && paras.some((p) => NONLATIN.test(p.t))) { await document.fonts?.ready; return canvasTextPdf(paras, size); }
  const d = await PDFDocument.create(); const f = await d.embedFont(StandardFonts.Helvetica); const fb = await d.embedFont(StandardFonts.HelveticaBold);
  const W = 595.28, H = 841.89, M = 56; let page = d.addPage([W, H]); let y = H - M;
  for (const p of paras) {
    const sz = p.size ?? size; const font = p.bold ? fb : f; const lh = sz * 1.35;
    const words = latin(p.t).split(' '); let line = '';
    const flush = () => { if (y < M) { page = d.addPage([W, H]); y = H - M; } page.drawText(line, { x: M, y, size: sz, font, color: rgb(0.1, 0.1, 0.1) }); y -= lh; line = ''; };
    if (!p.t.trim()) { y -= lh * 0.6; continue; }
    for (const w of words) { const t = line ? line + ' ' + w : w; if (font.widthOfTextAtSize(t, sz) > W - M * 2 && line) { flush(); line = w; } else line = t; }
    if (line) flush(); y -= sz * 0.4;
  }
  return new Blob([await d.save()], { type: 'application/pdf' });
}
const read = (f: File) => f.text();

export async function textToPdf(files: File[], o: any): Promise<Out[]> {
  const outs: Out[] = [];
  for (const f of files) {
    const paras = (await read(f)).split(/\r?\n/).map((t) => ({ t }));
    outs.push({ name: `${baseName(f.name)}.pdf`, blob: await textToPdfBlob(paras, Number(o.size)), note: 'Arabic and other scripts are supported (page images); Latin-only text stays selectable' });
  }
  return outs;
}
export async function docxToPdf(files: File[], o: any, c: Ctx): Promise<Out[]> {
  const outs: Out[] = [];
  for (let i = 0; i < files.length; i++) {
    c.progress(i, files.length, files[i].name);
    const html = (await mammoth.convertToHtml({ arrayBuffer: await files[i].arrayBuffer() })).value;
    const doc = new DOMParser().parseFromString(html, 'text/html'); const paras: any[] = [];
    doc.body.querySelectorAll('h1,h2,h3,h4,p,li,td').forEach((e) => {
      const tag = e.tagName; const t = (e.textContent ?? '').trim();
      const heading = /^H[1-4]$/.test(tag);
      paras.push({ t: (tag === 'LI' ? '- ' : '') + t, bold: heading, size: heading ? { H1: 22, H2: 18, H3: 15, H4: 13 }[tag as 'H1'] : undefined });
    });
    outs.push({ name: `${baseName(files[i].name)}.pdf`, blob: await textToPdfBlob(paras, Number(o.size)), note: 'Text, headings and lists are kept. Images and complex layout are not yet.' });
  }
  return outs;
}
export async function docxToText(files: File[]): Promise<Out[]> {
  const outs: Out[] = [];
  for (const f of files) { const r = await mammoth.extractRawText({ arrayBuffer: await f.arrayBuffer() }); outs.push({ name: `${baseName(f.name)}.txt`, blob: new Blob([r.value], { type: 'text/plain' }) }); }
  return outs;
}
export async function docxToHtml(files: File[]): Promise<Out[]> {
  const outs: Out[] = [];
  for (const f of files) { const r = await mammoth.convertToHtml({ arrayBuffer: await f.arrayBuffer() });
    outs.push({ name: `${baseName(f.name)}.html`, blob: new Blob([`<!doctype html><meta charset="utf-8"><title>${baseName(f.name)}</title>${r.value}`], { type: 'text/html' }) }); }
  return outs;
}
export async function pdfToDocx(files: File[], _o: any, c: Ctx): Promise<Out[]> {
  const src = await openPdf(files[0]); const paras: Paragraph[] = [];
  for (let i = 1; i <= src.numPages; i++) {
    c.progress(i - 1, src.numPages);
    const tc = await (await src.getPage(i)).getTextContent(); let line = '', lastY: number | null = null; const lines: string[] = [];
    for (const it of tc.items as any[]) { const y = it.transform[5]; if (lastY !== null && Math.abs(y - lastY) > 2) { lines.push(line.trim()); line = ''; } line += it.str + ' '; lastY = y; }
    if (line.trim()) lines.push(line.trim());
    lines.forEach((l) => paras.push(new Paragraph({ children: [new TextRun(l)], pageBreakBefore: false })));
    if (i < src.numPages) paras.push(new Paragraph({ children: [new TextRun({ break: 1 })], pageBreakBefore: true }));
  }
  const blob = await Packer.toBlob(new Document({ sections: [{ children: paras }] }));
  return [{ name: `${baseName(files[0].name)}.docx`, blob, note: 'Text only. Layout, tables and images are not reconstructed yet.' }];
}
