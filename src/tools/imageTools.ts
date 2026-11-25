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
