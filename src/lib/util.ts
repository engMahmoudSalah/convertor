export const baseName = (n: string) => n.replace(/\.[^.]+$/, '');
export const fmtSize = (b: number) =>
  b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(2)} MB`;

/** "1-3,5,8-" -> zero-based index groups. Throws on bad input. */
export function parseRanges(input: string, total: number): number[][] {
  const groups: number[][] = [];
  const s = input.trim().toLowerCase();
  if (!s || s === 'all') return [Array.from({ length: total }, (_, i) => i)];
  for (const part of s.split(',').map((p) => p.trim()).filter(Boolean)) {
    const m = part.match(/^(\d*)\s*-\s*(\d*)$/);
    let a: number, b: number;
    if (m) {
      a = m[1] ? parseInt(m[1]) : 1;
      b = m[2] ? parseInt(m[2]) : total;
    } else if (/^\d+$/.test(part)) {
      a = b = parseInt(part);
    } else throw new Error(`Bad page range "${part}"`);
    if (a < 1 || b > total || a > b) throw new Error(`Range "${part}" is outside 1-${total}`);
    groups.push(Array.from({ length: b - a + 1 }, (_, i) => a - 1 + i));
  }
  return groups;
}
export const flatPages = (g: number[][]) => g.flat();

export function loadImage(file: Blob): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); res(img); };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('Could not read image')); };
    img.src = url;
  });
}
export function canvasBlob(c: HTMLCanvasElement, type: string, q?: number): Promise<Blob> {
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('Encode failed'))), type, q));
}
export function drawImage(img: CanvasImageSource, w: number, h: number, bg?: string) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d')!;
  if (bg) { g.fillStyle = bg; g.fillRect(0, 0, w, h); }
  g.drawImage(img, 0, 0, w, h);
  return c;
}
/** 24-bit BMP encoder (canvas cannot export BMP). */
export function canvasToBmp(c: HTMLCanvasElement): Blob {
  const w = c.width, h = c.height;
  const data = c.getContext('2d')!.getImageData(0, 0, w, h).data;
  const row = Math.ceil((w * 3) / 4) * 4;
  const size = 54 + row * h;
  const buf = new ArrayBuffer(size);
  const v = new DataView(buf);
  v.setUint16(0, 0x4d42, true); v.setUint32(2, size, true); v.setUint32(10, 54, true);
  v.setUint32(14, 40, true); v.setInt32(18, w, true); v.setInt32(22, h, true);
  v.setUint16(26, 1, true); v.setUint16(28, 24, true); v.setUint32(34, row * h, true);
  const u = new Uint8Array(buf);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const s = ((h - 1 - y) * w + x) * 4, d = 54 + y * row + x * 3;
    const a = data[s + 3] / 255;
    u[d] = data[s + 2] * a + 255 * (1 - a); u[d + 1] = data[s + 1] * a + 255 * (1 - a); u[d + 2] = data[s] * a + 255 * (1 - a);
  }
  return new Blob([buf], { type: 'image/bmp' });
}
