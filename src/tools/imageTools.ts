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
    let w = ow, h = oh; let box: [number, number] | null = null;
    if (o.mode === 'percent') { w = Math.round(ow * o.percent / 100); h = Math.round(oh * o.percent / 100); }
    else {
      w = Number(o.width) || 0; h = Number(o.height) || 0;
      if (w && !h) h = Math.round(oh * w / ow); else if (h && !w) w = Math.round(ow * h / oh);
      else if (w && h && (o.fit === 'fill' || o.fit === 'pad')) { box = [w, h]; }
      else if (w && h && o.keep) { const s = Math.min(w / ow, h / oh); w = Math.round(ow * s); h = Math.round(oh * s); }
      if (!w || !h) throw new Error('Enter a width or a height');
    }
    const ext = files[i].name.split('.').pop()!.toLowerCase(); const fmt = ext === 'jpeg' ? 'jpg' : MIME[ext] ? ext : 'png';
    let cv: HTMLCanvasElement;
    if (box) {
      const [bw, bh] = box; cv = document.createElement('canvas'); cv.width = bw; cv.height = bh; const g = cv.getContext('2d')!;
      if (fmt === 'jpg' || o.fit === 'pad') { g.fillStyle = fmt === 'jpg' ? '#fff' : (o.padColor || '#ffffff'); if (fmt === 'jpg' || o.padColor) g.fillRect(0, 0, bw, bh); }
      if (o.fit === 'fill') { const sc = Math.max(bw / ow, bh / oh); const sw = bw / sc, sh = bh / sc; g.drawImage(img, (ow - sw) / 2, (oh - sh) / 2, sw, sh, 0, 0, bw, bh); }
      else { const sc = Math.min(bw / ow, bh / oh); const dw = Math.round(ow * sc), dh = Math.round(oh * sc); g.drawImage(img, Math.round((bw - dw) / 2), Math.round((bh - dh) / 2), dw, dh); }
      w = bw; h = bh;
    } else cv = drawImage(img, w, h, fmt === 'jpg' ? '#fff' : undefined);
    outs.push({ name: `${baseName(files[i].name)}-${w}x${h}.${fmt}`, blob: await encode(cv, fmt, 0.92), note: `${ow}x${oh} to ${w}x${h}` });
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

export async function svgToPng(files: File[], o: any, c: Ctx): Promise<Out[]> {
  const outs: Out[] = [];
  for (let i = 0; i < files.length; i++) {
    c.progress(i, files.length);
    const img = await loadImage(files[i]); const k = Math.max(1, Math.min(8, Number(o.scale) || 2));
    const w = Math.round((img.naturalWidth || 512) * k), h = Math.round((img.naturalHeight || 512) * k);
    if (w * h > 64_000_000) throw new Error('That size is too big for the browser. Use a smaller scale.');
    outs.push({ name: `${baseName(files[i].name)}@${k}x.png`, blob: await encode(drawImage(img, w, h, o.bg === 'white' ? '#fff' : undefined), 'png', 1), note: `${w}x${h} PNG${o.bg === 'white' ? '' : ', transparent'}` });
  }
  return outs;
}

const u16 = (n: number) => [n & 255, (n >> 8) & 255]; const u32 = (n: number) => [n & 255, (n >> 8) & 255, (n >> 16) & 255, (n >>> 24) & 255];
export async function faviconPack(files: File[], _o: any, c: Ctx): Promise<Out[]> {
  const img = await loadImage(files[0]); const outs: Out[] = []; const sizes = [16, 32, 48, 180, 192, 512];
  const side = Math.min(img.naturalWidth, img.naturalHeight); const sx = (img.naturalWidth - side) / 2, sy = (img.naturalHeight - side) / 2;
  const png: Record<number, Uint8Array> = {};
  for (let i = 0; i < sizes.length; i++) {
    c.progress(i, sizes.length); const s = sizes[i]; const cv = document.createElement('canvas'); cv.width = cv.height = s;
    const g = cv.getContext('2d')!; g.imageSmoothingQuality = 'high'; g.drawImage(img, sx, sy, side, side, 0, 0, s, s);
    const b = await encode(cv, 'png', 1); png[s] = new Uint8Array(await b.arrayBuffer());
    outs.push({ name: s === 180 ? 'apple-touch-icon.png' : s >= 192 ? `android-chrome-${s}.png` : `favicon-${s}x${s}.png`, blob: b, note: `${s}x${s}` });
  }
  const ico = [16, 32, 48]; const head = [0, 0, 1, 0, ...u16(ico.length)]; let off = 6 + 16 * ico.length; const dir: number[] = []; const body: Uint8Array[] = [];
  for (const s of ico) { const d = png[s]; dir.push(s, s, 0, 0, ...u16(1), ...u16(32), ...u32(d.length), ...u32(off)); off += d.length; body.push(d); }
  outs.unshift({ name: 'favicon.ico', blob: new Blob([new Uint8Array([...head, ...dir]), ...body as BlobPart[]], { type: 'image/x-icon' }), note: '16, 32 and 48 px inside' });
  outs.push({ name: 'head-snippet.html', blob: new Blob([`<link rel="icon" href="/favicon.ico" sizes="48x48">\n<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">\n<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">\n<link rel="apple-touch-icon" href="/apple-touch-icon.png">\n`], { type: 'text/html' }), note: 'Paste into your <head>' });
  return outs;
}

export async function colorPalette(files: File[], o: any, c: Ctx): Promise<Out[]> {
  const outs: Out[] = []; const n = Math.max(2, Math.min(12, Math.round(Number(o.count) || 6)));
  for (let i = 0; i < files.length; i++) {
    c.progress(i, files.length);
    const img = await loadImage(files[i]); const sc = Math.min(1, 96 / Math.max(img.naturalWidth, img.naturalHeight));
    const cv = drawImage(img, Math.max(1, Math.round(img.naturalWidth * sc)), Math.max(1, Math.round(img.naturalHeight * sc)));
    const d = cv.getContext('2d')!.getImageData(0, 0, cv.width, cv.height).data; const bins = new Map<number, { r: number; g: number; b: number; n: number }>();
    for (let p = 0; p < d.length; p += 4) { if (d[p + 3] < 128) continue; const key = ((d[p] >> 4) << 8) | ((d[p + 1] >> 4) << 4) | (d[p + 2] >> 4); const e = bins.get(key) ?? { r: 0, g: 0, b: 0, n: 0 }; e.r += d[p]; e.g += d[p + 1]; e.b += d[p + 2]; e.n++; bins.set(key, e); }
    const all = [...bins.values()].sort((a, b) => b.n - a.n).map((e) => [Math.round(e.r / e.n), Math.round(e.g / e.n), Math.round(e.b / e.n), e.n] as number[]);
    const pick: number[][] = []; for (const col of all) { if (pick.every((q) => Math.hypot(q[0] - col[0], q[1] - col[1], q[2] - col[2]) > 48)) pick.push(col); if (pick.length === n) break; }
    if (!pick.length) throw new Error('No visible colours found in this image.');
    const hex = (q: number[]) => '#' + q.slice(0, 3).map((x) => x.toString(16).padStart(2, '0')).join('').toUpperCase();
    const W = 160 * pick.length, sw = document.createElement('canvas'); sw.width = W; sw.height = 220; const g = sw.getContext('2d')!;
    pick.forEach((q, k) => { g.fillStyle = hex(q); g.fillRect(k * 160, 0, 160, 220); const lum = 0.299 * q[0] + 0.587 * q[1] + 0.114 * q[2]; g.fillStyle = lum > 150 ? '#111' : '#fff'; g.font = 'bold 22px monospace'; g.textAlign = 'center'; g.fillText(hex(q), k * 160 + 80, 190); });
    outs.push({ name: `${baseName(files[i].name)}-palette.png`, blob: await encode(sw, 'png', 1), note: pick.map(hex).join('  ') });
    outs.push({ name: `${baseName(files[i].name)}-palette.txt`, blob: new Blob([pick.map((q) => `${hex(q)}  rgb(${q[0]}, ${q[1]}, ${q[2]})`).join('\n') + '\n'], { type: 'text/plain' }), note: 'HEX and RGB values' });
  }
  return outs;
}

export async function cropImages(files: File[], o: any, c: Ctx): Promise<Out[]> {
  const outs: Out[] = [];
  for (let i = 0; i < files.length; i++) {
    c.progress(i, files.length);
    const img = await loadImage(files[i]); const W = img.naturalWidth, H = img.naturalHeight; let w = W, h = H;
    if (o.ratio === 'custom') {
      const t = Math.max(0, Math.min(45, Number(o.top) || 0)), b = Math.max(0, Math.min(45, Number(o.bottom) || 0)), l = Math.max(0, Math.min(45, Number(o.left) || 0)), r = Math.max(0, Math.min(45, Number(o.right) || 0));
      const x = Math.round(W * l / 100), y = Math.round(H * t / 100); w = Math.round(W * (1 - (l + r) / 100)); h = Math.round(H * (1 - (t + b) / 100));
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d')!; const fmt = outFmt(files[i].name); if (fmt === 'jpg') { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); }
      g.drawImage(img, x, y, w, h, 0, 0, w, h);
      outs.push({ name: `${baseName(files[i].name)}-cropped.${fmt}`, blob: await encode(cv, fmt, 0.92), note: `${W}x${H} to ${w}x${h}` }); continue;
    }
    const [a, bb] = String(o.ratio).split(':').map(Number); const target = a / bb;
    if (W / H > target) w = Math.round(H * target); else h = Math.round(W / target);
    const ax = o.anchor === 'start' ? 0 : o.anchor === 'end' ? 1 : 0.5; const x = Math.round((W - w) * ax), y = Math.round((H - h) * ax);
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d')!; const fmt = outFmt(files[i].name); if (fmt === 'jpg') { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); }
    g.drawImage(img, x, y, w, h, 0, 0, w, h);
    outs.push({ name: `${baseName(files[i].name)}-${a}x${bb}.${fmt}`, blob: await encode(cv, fmt, 0.92), note: `${W}x${H} to ${w}x${h}` });
  }
  return outs;
}

export async function watermarkImages(files: File[], o: any, c: Ctx): Promise<Out[]> {
  const outs: Out[] = []; const text = String(o.text || '').trim(); if (!text) throw new Error('Type the watermark text.');
  for (let i = 0; i < files.length; i++) {
    c.progress(i, files.length);
    const img = await loadImage(files[i]); const W = img.naturalWidth, H = img.naturalHeight; const cv = drawImage(img, W, H, outFmt(files[i].name) === 'jpg' ? '#fff' : undefined); const g = cv.getContext('2d')!;
    const size = Math.max(10, Math.round(Math.min(W, H) * (Number(o.size) || 6) / 100)); g.font = `700 ${size}px system-ui, "Segoe UI", Arial, sans-serif`; g.globalAlpha = Math.max(0.05, Math.min(1, Number(o.opacity) || 0.5)); g.fillStyle = o.color || '#ffffff';
    g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = size / 8; g.textBaseline = 'middle';
    if (o.position === 'tile') { g.save(); g.translate(W / 2, H / 2); g.rotate(-Math.PI / 6); g.textAlign = 'center'; const sx = g.measureText(text).width + size * 2, sy = size * 3; const R = Math.hypot(W, H); for (let y = -R; y < R; y += sy) for (let x = -R; x < R; x += sx) g.fillText(text, x + ((Math.round(y / sy) % 2) * sx) / 2, y); g.restore(); }
    else { const pad = size; const [v, h] = String(o.position).split('-'); g.textAlign = h === 'left' ? 'left' : h === 'right' ? 'right' : 'center'; g.fillText(text, h === 'left' ? pad : h === 'right' ? W - pad : W / 2, v === 'top' ? pad + size / 2 : v === 'middle' ? H / 2 : H - pad - size / 2); }
    const fmt = outFmt(files[i].name); outs.push({ name: `${baseName(files[i].name)}-watermarked.${fmt}`, blob: await encode(cv, fmt, 0.92), note: `${W}x${H}` });
  }
  return outs;
}
