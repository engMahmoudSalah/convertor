/** Largest font size (up to `size`) at which rotated text still fits inside the page with a small margin. */
export function fitStampSize(widthAt: (size: number) => number, size: number, angleDeg: number, pageW: number, pageH: number): number {
  const a = (angleDeg * Math.PI) / 180; const c = Math.abs(Math.cos(a)); const s = Math.abs(Math.sin(a));
  const w = widthAt(size); const bw = w * c + size * s; const bh = w * s + size * c;
  if (!(bw > 0) || !(bh > 0)) return size;
  const k = Math.min(1, (0.92 * pageW) / bw, (0.92 * pageH) / bh);
  return Math.max(4, size * k);
}
