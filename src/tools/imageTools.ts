import { baseName, loadImage, drawImage, canvasBlob, canvasToBmp } from '../lib/util';
import type { Out, Ctx } from './types';

const MIME: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp', bmp: 'image/bmp' };
async function encode(c: HTMLCanvasElement, fmt: string, q: number) {
  if (fmt === 'bmp') return canvasToBmp(c);
  const b = await canvasBlob(c, MIME[fmt], q);
  if (b.type !== MIME[fmt]) throw new Error(`This browser cannot encode ${fmt.toUpperCase()}`);
  return b;
}
export async function convertImages(files: File[], o: any, c: Ctx): Promise<Out[]> {
  const outs: Out[] = [];
  for (let i = 0; i < files.length; i++) {
    c.progress(i, files.length, files[i].name);
    const img = await loadImage(files[i]);
    const w = img.naturalWidth || 1024, h = img.naturalHeight || 1024;
    const cv = drawImage(img, w, h, o.format === 'jpg' || o.format === 'bmp' ? '#ffffff' : undefined);
    outs.push({ name: `${baseName(files[i].name)}.${o.format}`, blob: await encode(cv, o.format, Number(o.quality) / 100) });
  }
  return outs;
}
export async function resizeImages(files: File[], o: any, c: Ctx): Promise<Out[]> {
  const outs: Out[] = [];
  for (let i = 0; i < files.length; i++) {
    c.progress(i, files.length);
    const img = await loadImage(files[i]); const ow = img.naturalWidth, oh = img.naturalHeight;
    let w = ow, h = oh;
    if (o.mode === 'percent') { w = Math.round(ow * o.percent / 100); h = Math.round(oh * o.percent / 100); }
    else {
      w = Number(o.width) || 0; h = Number(o.height) || 0;
      if (w && !h) h = Math.round(oh * w / ow); else if (h && !w) w = Math.round(ow * h / oh);
      else if (w && h && o.keep) { const s = Math.min(w / ow, h / oh); w = Math.round(ow * s); h = Math.round(oh * s); }
      if (!w || !h) throw new Error('Enter a width or a height');
    }
    const ext = files[i].name.split('.').pop()!.toLowerCase(); const fmt = ext === 'jpeg' ? 'jpg' : MIME[ext] ? ext : 'png';
    outs.push({ name: `${baseName(files[i].name)}-${w}x${h}.${fmt}`, blob: await encode(drawImage(img, w, h, fmt === 'jpg' ? '#fff' : undefined), fmt, 0.92), note: `${ow}x${oh} to ${w}x${h}` });
  }
  return outs;
}
export async function compressImages(files: File[], o: any, c: Ctx): Promise<Out[]> {
  const outs: Out[] = [];
  for (let i = 0; i < files.length; i++) {
    c.progress(i, files.length);
    const img = await loadImage(files[i]);
    const keepPng = o.format === 'keep' && files[i].type === 'image/png';
    const fmt = o.format === 'webp' ? 'webp' : 'jpg';
    const cv = drawImage(img, img.naturalWidth, img.naturalHeight, '#fff');
    const b = keepPng ? files[i] : await encode(cv, fmt, Number(o.quality) / 100);
    const better = b.size < files[i].size;
    outs.push({ name: better ? `${baseName(files[i].name)}-small.${keepPng ? 'png' : fmt}` : files[i].name, blob: better ? b : files[i], note: better ? `${Math.round((1 - b.size / files[i].size) * 100)}% smaller` : 'Already small, original kept' });
  }
  return outs;
}

/** Background tool: remove a solid background, fill with a colour, or place on an image. */
export function processBackground(img: CanvasImageSource & { width?: number; height?: number }, w: number, h: number, o: any, bg?: HTMLImageElement | null): HTMLCanvasElement {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d', { willReadFrequently: true })!;
  g.drawImage(img, 0, 0, w, h);
  if (o.mode === 'remove' || o.removeOld) {
    const d = g.getImageData(0, 0, w, h); const px = d.data; const at = (x: number, y: number) => (y * w + x) * 4;
    const corners = [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]].map(([x, y]) => [px[at(x, y)], px[at(x, y) + 1], px[at(x, y) + 2]]);
    const ref = [0, 1, 2].map((k) => Math.round(corners.reduce((a, c2) => a + c2[k], 0) / 4)); const tol = (Number(o.tol) / 100) * 441;
    const dist = (i: number) => Math.hypot(px[i] - ref[0], px[i + 1] - ref[1], px[i + 2] - ref[2]);
    const seen = new Uint8Array(w * h); const stack: number[] = [];
    const push = (x: number, y: number) => { const k = y * w + x; if (!seen[k] && dist(k * 4) <= tol) { seen[k] = 1; stack.push(k); } };
    for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); } for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }
    while (stack.length) { const k = stack.pop()!; const x = k % w, y = (k / w) | 0; if (x > 0) push(x - 1, y); if (x < w - 1) push(x + 1, y); if (y > 0) push(x, y - 1); if (y < h - 1) push(x, y + 1); }
    for (let k = 0; k < w * h; k++) if (seen[k]) px[k * 4 + 3] = 0;
    for (let k = 0; k < w * h; k++) if (!seen[k]) { const x = k % w, y = (k / w) | 0; // soften the 1px edge
      if ((x > 0 && seen[k - 1]) || (x < w - 1 && seen[k + 1]) || (y > 0 && seen[k - w]) || (y < h - 1 && seen[k + w])) px[k * 4 + 3] = Math.min(px[k * 4 + 3], 150); }
    g.putImageData(d, 0, 0);
  }
  if (o.mode === 'remove') return c;
  const out = document.createElement('canvas'); out.width = w; out.height = h; const og = out.getContext('2d')!;
  if (o.mode === 'image' && bg) { const s = Math.max(w / bg.naturalWidth, h / bg.naturalHeight); const bw = bg.naturalWidth * s, bh = bg.naturalHeight * s; og.drawImage(bg, (w - bw) / 2, (h - bh) / 2, bw, bh); }
  else { og.fillStyle = o.color || '#ffffff'; og.fillRect(0, 0, w, h); }
  og.drawImage(c, 0, 0); return out;
}
export async function backgroundImages(files: File[], o: any, c: Ctx): Promise<Out[]> {
  if (o.mode === 'image' && !o.bgfile) throw new Error('Choose a background image first');
  const bg = o.mode === 'image' ? await loadImage(o.bgfile) : null; const outs: Out[] = [];
  const fmt = o.mode === 'remove' ? 'png' : o.format;
  for (let i = 0; i < files.length; i++) {
    c.progress(i, files.length, files[i].name); const img = await loadImage(files[i]);
    const cv = processBackground(img, img.naturalWidth, img.naturalHeight, o, bg);
    outs.push({ name: `${baseName(files[i].name)}-${o.mode === 'remove' ? 'nobg' : 'bg'}.${fmt}`, blob: await encode(cv, fmt, 0.92) });
  }
  return outs;
}
