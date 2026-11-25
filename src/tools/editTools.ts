import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import { baseName, parseRanges, flatPages, loadImage, drawImage, canvasBlob } from '../lib/util';
import type { Out } from './types';

const hex = (h: string) => { const n = parseInt((h || '#000000').slice(1), 16); return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255); };
export async function editPdf(files: File[], o: any): Promise<Out[]> {
  const d = await PDFDocument.load(await files[0].arrayBuffer());
  const fonts: Record<string, any> = { sans: await d.embedFont(StandardFonts.Helvetica), bold: await d.embedFont(StandardFonts.HelveticaBold), serif: await d.embedFont(StandardFonts.TimesRoman), mono: await d.embedFont(StandardFonts.Courier) };
  const sel = new Set(flatPages(parseRanges(o.pages, d.getPageCount())));
  const text = String(o.text ?? '').split('\n').map((l) => l.replace(/[^\x20-\x7e\u00a0-\u00ff]/g, '?'));
  const hasText = text.join('').trim().length > 0; const hasShape = o.shape !== 'none'; let img: any = null;
  if (o.image) { const im = await loadImage(o.image); const c = drawImage(im, im.naturalWidth, im.naturalHeight); const blob = await canvasBlob(c, 'image/png'); img = await d.embedPng(await blob.arrayBuffer()); }
  if (!hasText && !hasShape && !img) throw new Error('Add some text, a shape or an image first');
  const px = +o.x / 100, py = +o.y / 100;
  d.getPages().forEach((p, i) => {
    if (!sel.has(i)) return; const { width: W, height: H } = p.getSize();
    if (hasShape) { const w = (+o.sw / 100) * W, h = (+o.sh / 100) * H; const x = px * W, y = H - py * H - h; const col = hex(o.scolor);
      if (o.shape === 'line') p.drawLine({ start: { x, y: y + h / 2 }, end: { x: x + w, y: y + h / 2 }, thickness: 2, color: col, opacity: +o.opacity / 100 });
      else p.drawRectangle({ x, y, width: w, height: h, ...(o.shape === 'box' ? { borderColor: col, borderWidth: 2, opacity: 1, borderOpacity: 1 } : { color: col, opacity: +o.opacity / 100 }) }); }
    if (img) { const w = (+o.iw / 100) * W; const h = w * (img.height / img.width); p.drawImage(img, { x: +o.ix / 100 * W, y: H - (+o.iy / 100) * H - h, width: w, height: h, opacity: +o.opacity2 / 100 }); }
    if (hasText) { const f = fonts[o.font]; const size = +o.size; text.forEach((line, k) => p.drawText(line, { x: px * W, y: H - py * H - size - k * size * 1.25, size, font: f, color: hex(o.color), rotate: degrees(+o.rotate || 0) })); }
  });
  return [{ name: `${baseName(files[0].name)}-edited.pdf`, blob: new Blob([await d.save()], { type: 'application/pdf' }), note: `Edited ${sel.size} page(s). Text uses standard Latin fonts.` }];
}
