import { qrSvg } from '../lib/qr';
// Text and developer tools: pure functions, run on every keystroke in the browser.
type Fn = (text: string, o: any, second?: string) => string | Promise<string>;

const words = (s: string) => s.split(/[^\p{L}\p{N}']+/u).filter(Boolean);
const title = (s: string) => s.toLowerCase().replace(/(^|[\s\-_/(])(\p{L})/gu, (_, a, b) => a + b.toUpperCase());
const parts = (s: string) => s.replace(/([a-z0-9])([A-Z][a-z])/g, '$1 $2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2').split(/[^\p{L}\p{N}]+/u).filter(Boolean).map((x) => x.toLowerCase());

const caseConv: Fn = (t, o) => {
  switch (o.mode) {
    case 'upper': return t.toUpperCase();
    case 'lower': return t.toLowerCase();
    case 'title': return title(t);
    case 'sentence': return t.toLowerCase().replace(/(^\s*|[.!?؟]\s+)(\p{L})/gu, (_, a, b) => a + b.toUpperCase());
    case 'camel': return t.split('\n').map((l) => { const p = parts(l); return p.map((x, i) => (i ? x[0].toUpperCase() + x.slice(1) : x)).join(''); }).join('\n');
    case 'snake': return t.split('\n').map((l) => parts(l).join('_')).join('\n');
    case 'kebab': return t.split('\n').map((l) => parts(l).join('-')).join('\n');
    default: return t;
  }
};

const counter: Fn = (t) => {
  const w = words(t).length; const chars = [...t].length; const noSp = [...t.replace(/\s/g, '')].length;
  const sentences = (t.match(/[^.!?؟]+[.!?؟]+|[^.!?؟]+$/g) ?? []).filter((x) => x.trim()).length;
  const paras = t.split(/\n\s*\n/).filter((x) => x.trim()).length; const lines = t ? t.split('\n').length : 0;
  const mins = w / 200;
  return [`Words: ${w}`, `Characters: ${chars}`, `Characters without spaces: ${noSp}`, `Sentences: ${sentences}`, `Paragraphs: ${paras}`, `Lines: ${lines}`, `Reading time: ${mins < 1 ? '< 1' : Math.round(mins)} min`].join('\n');
};

const diff: Fn = (a, o, b = '') => {
  const norm = (s: string) => (o.ignoreCase ? s.toLowerCase() : s).replace(o.ignoreSpace ? /\s+/g : /$^/, ' ').trimEnd();
  const A = a.split('\n'), B = b.split('\n');
  if (A.length * B.length > 4_000_000) throw new Error('Texts are too long to compare here (limit about 2000 lines each).');
  const n = A.length, m = B.length; const L: Uint32Array[] = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = norm(A[i]) === norm(B[j]) ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const out: string[] = []; let i = 0, j = 0, add = 0, del = 0;
  while (i < n && j < m) {
    if (norm(A[i]) === norm(B[j])) { out.push('  ' + A[i]); i++; j++; }
    else if (L[i + 1][j] >= L[i][j + 1]) { out.push('- ' + A[i++]); del++; } else { out.push('+ ' + B[j++]); add++; }
  }
  while (i < n) { out.push('- ' + A[i++]); del++; }
  while (j < m) { out.push('+ ' + B[j++]); add++; }
  return `${add} added, ${del} removed\n\n` + (add + del ? out.join('\n') : 'The two texts are the same.');
};

const LOREM = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum'.split(' ');
const lorem: Fn = (_t, o) => {
  let seed = 7; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  const n = Math.max(1, Math.min(30, Math.round(Number(o.paragraphs) || 3))); const per = Math.max(5, Math.min(200, Math.round(Number(o.sentences) || 5)));
  const sent = (first: boolean) => { const len = 8 + Math.floor(rnd() * 10); const w = Array.from({ length: len }, () => LOREM[Math.floor(rnd() * LOREM.length)]); if (first) { w[0] = 'lorem'; w[1] = 'ipsum'; } w[0] = w[0][0].toUpperCase() + w.slice(0, 1)[0].slice(1); return w.join(' ') + '.'; };
  return Array.from({ length: n }, (_, p) => Array.from({ length: per }, (_, s) => sent(p === 0 && s === 0)).join(' ')).join('\n\n');
};

const cleanLines: Fn = (t, o) => {
  let l = t.split('\n');
  if (o.trim) l = l.map((x) => x.trim());
  if (o.empty) l = l.filter((x) => x !== '');
  if (o.dedupe) { const seen = new Set<string>(); l = l.filter((x) => { const k = o.ignoreCase ? x.toLowerCase() : x; if (seen.has(k)) return false; seen.add(k); return true; }); }
  if (o.sort !== 'none') { l = [...l].sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })); if (o.sort === 'desc') l.reverse(); }
  return l.join('\n');
};

const json: Fn = (t, o) => {
  if (!t.trim()) return '';
  let v: unknown;
  try { v = JSON.parse(t); } catch (e: any) { throw new Error('Not valid JSON: ' + String(e?.message ?? e).replace(/^JSON\.parse: /, '')); }
  const sortKeys = (x: any): any => Array.isArray(x) ? x.map(sortKeys) : x && typeof x === 'object' ? Object.fromEntries(Object.keys(x).sort().map((k) => [k, sortKeys(x[k])])) : x;
  if (o.sort) v = sortKeys(v);
  return o.mode === 'min' ? JSON.stringify(v) : JSON.stringify(v, null, o.mode === '4' ? 4 : o.mode === 'tab' ? '\t' : 2);
};

const bytesToB64 = (b: Uint8Array) => { let s = ''; b.forEach((x) => { s += String.fromCharCode(x); }); return btoa(s); };
const base64: Fn = (t, o) => {
  if (o.mode === 'decode') {
    try { const bin = atob(t.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/')); return new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(bin, (c) => c.charCodeAt(0))); }
    catch { throw new Error('This is not valid Base64 text.'); }
  }
  let r = bytesToB64(new TextEncoder().encode(t));
  if (o.urlSafe) r = r.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return r;
};

const url: Fn = (t, o) => {
  try { return o.mode === 'decode' ? decodeURIComponent(t.replace(/\+/g, ' ')) : (o.full ? encodeURI(t) : encodeURIComponent(t)); }
  catch { throw new Error('This text has a broken % sequence and cannot be decoded.'); }
};

const parseCsv = (t: string, d: string) => {
  const rows: string[][] = []; let row: string[] = [], cell = '', q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
    else if (c === '"') q = true;
    else if (c === d) { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && t[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((x) => x !== ''));
};
const csvJson: Fn = (t, o) => {
  if (!t.trim()) return '';
  const d = o.delimiter === 'tab' ? '\t' : o.delimiter === ';' ? ';' : ',';
  const rows = parseCsv(t, d); if (!rows.length) return '[]';
  const conv = (x: string) => (o.numbers && x.trim() !== '' && !isNaN(Number(x)) ? Number(x) : x);
  if (!o.header) return JSON.stringify(rows.map((r) => r.map(conv)), null, 2);
  const [h, ...rest] = rows;
  return JSON.stringify(rest.map((r) => Object.fromEntries(h.map((k, i) => [k || `column${i + 1}`, conv(r[i] ?? '')]))), null, 2);
};

const hash: Fn = async (t, o) => {
  if (!t) return '';
  const d = await crypto.subtle.digest(o.algo, new TextEncoder().encode(t));
  const hex = [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return o.upper ? hex.toUpperCase() : hex;
};

const qr: Fn = (t, o) => (t.trim() ? qrSvg(t, { ecl: o.ecl, margin: Number(o.margin), fg: o.fg, bg: o.bg }) : '');
const findReplace: Fn = (t, o) => {
  if (!t || !o.find) return t;
  let re: RegExp;
  try { re = o.regex ? new RegExp(o.find, 'g' + (o.ignoreCase ? 'i' : '') + 'm') : new RegExp(String(o.find).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g' + (o.ignoreCase ? 'i' : '')); }
  catch (e: any) { throw new Error('Not a valid pattern: ' + String(e?.message ?? e)); }
  const out = t.replace(re, o.regex ? String(o.replace ?? '') : () => String(o.replace ?? ''));
  return out;
};

const slug: Fn = (t, o) => {
  const sep = o.sep === 'underscore' ? '_' : '-';
  return t.split('\n').map((l) => l.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, sep).replace(new RegExp(`^${sep}+|${sep}+$`, 'g'), '')).filter((x) => x || !o.skipEmpty).join('\n');
};

export const TEXT_FNS: Record<string, Fn> = { 'find-replace': findReplace, 'text-slug': slug, 'qr-code': qr, 'case-converter': caseConv, 'word-counter': counter, 'text-diff': diff, 'lorem-ipsum': lorem, 'clean-lines': cleanLines, 'json-formatter': json, 'base64-tool': base64, 'url-encode': url, 'csv-to-json': csvJson, 'hash-generator': hash };
