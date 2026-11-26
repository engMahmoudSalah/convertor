// QR Code encoder (byte mode, versions 1 to 10, error levels L/M/Q/H). Written for this project.
const ECC_PER_BLOCK: Record<string, number[]> = { L: [7, 10, 15, 20, 26, 18, 20, 24, 30, 18], M: [10, 16, 26, 18, 24, 16, 18, 22, 22, 26], Q: [13, 22, 18, 26, 18, 24, 18, 22, 20, 24], H: [17, 28, 22, 16, 22, 28, 26, 26, 24, 28] };
const BLOCKS: Record<string, number[]> = { L: [1, 1, 1, 1, 1, 2, 2, 2, 2, 4], M: [1, 1, 1, 2, 2, 4, 4, 4, 5, 5], Q: [1, 1, 2, 2, 4, 4, 6, 6, 8, 8], H: [1, 1, 2, 4, 4, 4, 5, 6, 8, 8] };
const FMT: Record<string, number> = { L: 1, M: 0, Q: 3, H: 2 };

const rawModules = (v: number) => { let r = (16 * v + 128) * v + 64; if (v >= 2) { const a = Math.floor(v / 7) + 2; r -= (25 * a - 10) * a - 55; if (v >= 7) r -= 36; } return r; };
const dataCodewords = (v: number, e: string) => Math.floor(rawModules(v) / 8) - ECC_PER_BLOCK[e][v - 1] * BLOCKS[e][v - 1];

const EXP = new Uint8Array(512), LOG = new Uint8Array(256);
(() => { let x = 1; for (let i = 0; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 256) x ^= 0x11d; } for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255]; })();
const mul = (a: number, b: number) => (a && b ? EXP[LOG[a] + LOG[b]] : 0);
const rsGen = (n: number) => { let p = [1]; for (let i = 0; i < n; i++) { const q = new Array(p.length + 1).fill(0); for (let j = 0; j < p.length; j++) { q[j] ^= p[j]; q[j + 1] ^= mul(p[j], EXP[i]); } p = q; } return p; };
const rsRem = (data: number[], n: number) => { const g = rsGen(n); const r = new Array(n).fill(0); for (const b of data) { const f = b ^ r.shift()!; r.push(0); for (let i = 0; i < n; i++) r[i] ^= mul(g[i + 1], f); } return r; };

export function qrMatrix(text: string, ecl: 'L' | 'M' | 'Q' | 'H' = 'M'): boolean[][] {
  const bytes = [...new TextEncoder().encode(text)]; if (!bytes.length) throw new Error('Type some text or a link first.');
  let ver = 1; for (; ver <= 10; ver++) { const cap = dataCodewords(ver, ecl) * 8; if (4 + (ver < 10 ? 8 : 16) + bytes.length * 8 <= cap) break; }
  if (ver > 10) throw new Error('This text is too long for the QR codes made here. Use a shorter text or a lower error level.');
  const bits: number[] = []; const put = (v: number, n: number) => { for (let i = n - 1; i >= 0; i--) bits.push((v >>> i) & 1); };
  put(4, 4); put(bytes.length, ver < 10 ? 8 : 16); bytes.forEach((b) => put(b, 8));
  const cap = dataCodewords(ver, ecl) * 8; put(0, Math.min(4, cap - bits.length)); while (bits.length % 8) bits.push(0);
  for (let pad = 0xec; bits.length < cap; pad ^= 0xec ^ 0x11) put(pad, 8);
  const data: number[] = []; for (let i = 0; i < bits.length; i += 8) data.push(parseInt(bits.slice(i, i + 8).join(''), 2));
  const nb = BLOCKS[ecl][ver - 1], eb = ECC_PER_BLOCK[ecl][ver - 1], raw = Math.floor(rawModules(ver) / 8), short = nb - (raw % nb), sl = Math.floor(raw / nb);
  const blocks: number[][] = [], ecs: number[][] = []; let k = 0;
  for (let i = 0; i < nb; i++) { const len = sl - eb + (i < short ? 0 : 1); const d = data.slice(k, k + len); k += len; blocks.push(d); ecs.push(rsRem(d, eb)); }
  const all: number[] = []; for (let i = 0; i < Math.max(...blocks.map((b) => b.length)); i++) blocks.forEach((b) => { if (i < b.length) all.push(b[i]); });
  for (let i = 0; i < eb; i++) ecs.forEach((e) => all.push(e[i]));

  const size = ver * 4 + 17; const M = Array.from({ length: size }, () => new Array<boolean>(size).fill(false)); const F = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
  const set = (x: number, y: number, d: boolean) => { if (x >= 0 && y >= 0 && x < size && y < size) { M[y][x] = d; F[y][x] = true; } };
  for (let i = 0; i < size; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
  for (const [cx, cy] of [[3, 3], [size - 4, 3], [3, size - 4]]) for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) { const d = Math.max(Math.abs(dx), Math.abs(dy)); set(cx + dx, cy + dy, d !== 2 && d !== 4); }
  if (ver > 1) { const n = Math.floor(ver / 7) + 2, step = Math.ceil((ver * 4 + 4) / (n * 2 - 2)) * 2; const pos = [6]; for (let p = size - 7; pos.length < n; p -= step) pos.splice(1, 0, p);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { if ((i === 0 && j === 0) || (i === 0 && j === n - 1) || (i === n - 1 && j === 0)) continue; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(pos[i] + dx, pos[j] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1); } }
  const drawFormat = (mask: number) => {
    const d = (FMT[ecl] << 3) | mask; let r = d; for (let i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537); const bitsF = ((d << 10) | r) ^ 0x5412; const g = (i: number) => ((bitsF >>> i) & 1) !== 0;
    for (let i = 0; i <= 5; i++) set(8, i, g(i)); set(8, 7, g(6)); set(8, 8, g(7)); set(7, 8, g(8)); for (let i = 9; i < 15; i++) set(14 - i, 8, g(i));
    for (let i = 0; i < 8; i++) set(size - 1 - i, 8, g(i)); for (let i = 8; i < 15; i++) set(8, size - 15 + i, g(i)); set(8, size - 8, true);
  };
  drawFormat(0);
  if (ver >= 7) { let r = ver; for (let i = 0; i < 12; i++) r = (r << 1) ^ ((r >>> 11) * 0x1f25); const b = (ver << 12) | r; for (let i = 0; i < 18; i++) { const bit = ((b >>> i) & 1) !== 0; const a = size - 11 + (i % 3), c = Math.floor(i / 3); set(a, c, bit); set(c, a, bit); } }
  const fixed = F.map((r) => [...r]);
  let bi = 0; for (let right = size - 1; right >= 1; right -= 2) { if (right === 6) right = 5; for (let v = 0; v < size; v++) for (let j = 0; j < 2; j++) { const x = right - j, up = ((right + 1) & 2) === 0, y = up ? size - 1 - v : v; if (!fixed[y][x] && bi < all.length * 8) { M[y][x] = ((all[bi >>> 3] >>> (7 - (bi & 7))) & 1) !== 0; bi++; } } }
  const maskFn = [(x: number, y: number) => (x + y) % 2 === 0, (_x: number, y: number) => y % 2 === 0, (x: number) => x % 3 === 0, (x: number, y: number) => (x + y) % 3 === 0, (x: number, y: number) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0, (x: number, y: number) => ((x * y) % 2) + ((x * y) % 3) === 0, (x: number, y: number) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0, (x: number, y: number) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0];
  const apply = (m: number) => { for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (!fixed[y][x] && maskFn[m](x, y)) M[y][x] = !M[y][x]; };
  const penalty = () => { let p = 0; for (let t = 0; t < 2; t++) for (let a = 0; a < size; a++) { let run = 1; for (let b = 1; b < size; b++) { const cur = t ? M[b][a] : M[a][b], prev = t ? M[b - 1][a] : M[a][b - 1]; if (cur === prev) { run++; if (run === 5) p += 3; else if (run > 5) p++; } else run = 1; } }
    for (let y = 0; y < size - 1; y++) for (let x = 0; x < size - 1; x++) if (M[y][x] === M[y][x + 1] && M[y][x] === M[y + 1][x] && M[y][x] === M[y + 1][x + 1]) p += 3;
    let dark = 0; M.forEach((r) => r.forEach((v) => { if (v) dark++; })); p += Math.floor(Math.abs(dark * 20 - size * size * 10) / (size * size)) * 10; return p; };
  let best = 0, bp = Infinity; for (let m = 0; m < 8; m++) { apply(m); drawFormat(m); const p = penalty(); if (p < bp) { bp = p; best = m; } apply(m); }
  apply(best); drawFormat(best); return M;
}

export function qrSvg(text: string, o: { ecl?: 'L' | 'M' | 'Q' | 'H'; margin?: number; fg?: string; bg?: string }): string {
  const m = qrMatrix(text, o.ecl ?? 'M'); const q = Math.max(0, Math.min(10, Math.round(o.margin ?? 4))); const n = m.length + q * 2; let d = '';
  m.forEach((row, y) => { let x = 0; while (x < row.length) { if (row[x]) { let e = x; while (e < row.length && row[e]) e++; d += `M${x + q} ${y + q}h${e - x}v1h-${e - x}z`; x = e; } else x++; } });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges"><rect width="${n}" height="${n}" fill="${o.bg ?? '#ffffff'}"/><path d="${d}" fill="${o.fg ?? '#000000'}"/></svg>`;
}
