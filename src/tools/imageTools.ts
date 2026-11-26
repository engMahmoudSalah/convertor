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

const outFmt = (name: string) => { const e = name.split('.').pop()!.toLowerCase(); return e === 'jpeg' ? 'jpg' : MIME[e] ? e : 'png'; };

export async function rotateImages(files: File[], o: any, c: Ctx): Promise<Out[]> {
  const outs: Out[] = [];
  for (let i = 0; i < files.length; i++) {
    c.progress(i, files.length);
    const img = await loadImage(files[i]); const w = img.naturalWidth, h = img.naturalHeight;
    const a = Number(o.angle) || 0; const swap = a === 90 || a === 270;
    const cv = document.createElement('canvas'); cv.width = swap ? h : w; cv.height = swap ? w : h;
    const g = cv.getContext('2d')!; const fmt = outFmt(files[i].name);
    if (fmt === 'jpg') { g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height); }
    g.translate(cv.width / 2, cv.height / 2); g.rotate(a * Math.PI / 180);
    g.scale(o.flip === 'h' || o.flip === 'both' ? -1 : 1, o.flip === 'v' || o.flip === 'both' ? -1 : 1);
    g.drawImage(img, -w / 2, -h / 2);
    outs.push({ name: `${baseName(files[i].name)}-rotated.${fmt}`, blob: await encode(cv, fmt, 0.92), note: `${a}°${o.flip && o.flip !== 'none' ? ', flipped' : ''}` });
  }
  return outs;
}

export async function filterImages(files: File[], o: any, c: Ctx): Promise<Out[]> {
  const outs: Out[] = [];
  const f = `brightness(${o.brightness}%) contrast(${o.contrast}%) saturate(${o.saturation}%) blur(${o.blur}px) grayscale(${o.grayscale ? 100 : 0}%) sepia(${o.sepia ? 100 : 0}%)`;
  for (let i = 0; i < files.length; i++) {
    c.progress(i, files.length);
    const img = await loadImage(files[i]); const w = img.naturalWidth, h = img.naturalHeight;
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const g = cv.getContext('2d')!; const fmt = outFmt(files[i].name);
    if (fmt === 'jpg') { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); }
    const native = 'filter' in g && (() => { const tc = document.createElement('canvas'); tc.width = tc.height = 1; const x = tc.getContext('2d')!; x.filter = 'invert(100%)'; x.fillStyle = '#000'; x.fillRect(0, 0, 1, 1); return x.getImageData(0, 0, 1, 1).data[0] === 255; })();
    if (native) { g.filter = f; g.drawImage(img, 0, 0, w, h); }
    else { g.drawImage(img, 0, 0, w, h); manualFilter(g, w, h, o); }
    outs.push({ name: `${baseName(files[i].name)}-filtered.${fmt}`, blob: await encode(cv, fmt, 0.92), note: `${w}x${h}` });
  }
  return outs;
}

export async function roundImages(files: File[], o: any, c: Ctx): Promise<Out[]> {
  const outs: Out[] = [];
  for (let i = 0; i < files.length; i++) {
    c.progress(i, files.length);
    const img = await loadImage(files[i]); const w = img.naturalWidth, h = img.naturalHeight;
    const r = Math.min(w, h) / 2 * (Number(o.radius) / 100); const b = Math.round(Number(o.border) || 0);
    const W = w + b * 2, H = h + b * 2; const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const g = cv.getContext('2d')!;
    const path = (x: number, y: number, ww: number, hh: number, rr: number) => { g.beginPath(); g.roundRect(x, y, ww, hh, Math.max(0, rr)); };
    if (b) { g.fillStyle = o.color || '#ffffff'; path(0, 0, W, H, r + b); g.fill(); }
    g.save(); path(b, b, w, h, r); g.clip(); g.drawImage(img, b, b, w, h); g.restore();
    outs.push({ name: `${baseName(files[i].name)}-rounded.png`, blob: await encode(cv, 'png', 1), note: 'PNG with transparent corners' });
  }
  return outs;
}

// Fallback for browsers without canvas ctx.filter (older Safari): the same maths done on pixels.
function manualFilter(g: CanvasRenderingContext2D, w: number, h: number, o: any) {
  const im = g.getImageData(0, 0, w, h); const d = im.data;
  const br = Number(o.brightness) / 100, ct = Number(o.contrast) / 100, sa = Number(o.saturation) / 100;
  const cl = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : v);
  for (let i = 0; i < d.length; i += 4) {
    let r = d[i] * br, gg = d[i + 1] * br, b = d[i + 2] * br;
    r = (r - 127.5) * ct + 127.5; gg = (gg - 127.5) * ct + 127.5; b = (b - 127.5) * ct + 127.5;
    const l = 0.2126 * r + 0.7152 * gg + 0.0722 * b; r = l + (r - l) * sa; gg = l + (gg - l) * sa; b = l + (b - l) * sa;
    if (o.grayscale) { const y = 0.2126 * r + 0.7152 * gg + 0.0722 * b; r = gg = b = y; }
    if (o.sepia) { const R = 0.393 * r + 0.769 * gg + 0.189 * b, G = 0.349 * r + 0.686 * gg + 0.168 * b, B = 0.272 * r + 0.534 * gg + 0.131 * b; r = R; gg = G; b = B; }
    d[i] = cl(r); d[i + 1] = cl(gg); d[i + 2] = cl(b);
  }
  g.putImageData(im, 0, 0);
  const rad = Math.round(Number(o.blur) || 0);
  if (rad > 0) boxBlur(g, w, h, rad);
}
function boxBlur(g: CanvasRenderingContext2D, w: number, h: number, rad: number) {
  const im = g.getImageData(0, 0, w, h); let a = im.data; let b = new Uint8ClampedArray(a.length);
  const pass = (src: Uint8ClampedArray, dst: Uint8ClampedArray, horiz: boolean) => {
    const n = horiz ? w : h, lines = horiz ? h : w, step = horiz ? 4 : w * 4, lineStep = horiz ? w * 4 : 4, win = 2 * rad + 1;
    for (let l = 0; l < lines; l++) {
      const base = l * lineStep;
      for (let c = 0; c < 4; c++) {
        let sum = 0;
        for (let k = -rad; k <= rad; k++) sum += src[base + Math.min(n - 1, Math.max(0, k)) * step + c];
        for (let x = 0; x < n; x++) {
          dst[base + x * step + c] = sum / win;
          sum += src[base + Math.min(n - 1, x + rad + 1) * step + c] - src[base + Math.max(0, x - rad) * step + c];
        }
      }
    }
  };
  for (let i = 0; i < 2; i++) { pass(a, b, true); pass(b, a, false); }
  g.putImageData(im, 0, 0);
}
