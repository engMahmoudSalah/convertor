// Developer format converters: pure functions that run in the browser.
type Fn = (text: string, o: any, second?: string) => string | Promise<string>;
const parseJson = (t: string): any => { try { return JSON.parse(t); } catch (e: any) { throw new Error('Invalid JSON: ' + String(e.message || e).slice(0, 120)); } };
const wrap = (f: Fn): Fn => (t, o, s) => { if (!t.trim()) return ''; try { return f(t, o, s); } catch (e: any) { return String(e.message || e); } };

// ---------- HTML to text ----------
const BLOCK = new Set(['P', 'DIV', 'SECTION', 'ARTICLE', 'HEADER', 'FOOTER', 'MAIN', 'NAV', 'ASIDE', 'UL', 'OL', 'TABLE', 'TR', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'PRE', 'FORM', 'FIELDSET', 'HR']);
const htmlToText: Fn = wrap((t, o) => {
  const doc = new DOMParser().parseFromString(t, 'text/html');
  doc.querySelectorAll('script,style,noscript,template,head').forEach((n) => n.remove());
  let out = '';
  const walk = (n: Node, pre: boolean) => {
    if (n.nodeType === 3) { const v = n.nodeValue || ''; out += pre ? v : v.replace(/\s+/g, ' '); return; }
    if (n.nodeType !== 1) return;
    const e = n as Element, tag = e.tagName;
    if (tag === 'BR') { out += '\n'; return; }
    if (tag === 'IMG') { if (o.alt && e.getAttribute('alt')) out += `[${e.getAttribute('alt')}]`; return; }
    const block = BLOCK.has(tag) || tag === 'LI';
    if (block) out += '\n';
    if (tag === 'LI') out += e.parentElement?.tagName === 'OL' ? `${Array.prototype.indexOf.call(e.parentElement.children, e) + 1}. ` : '- ';
    if (/^H[1-6]$/.test(tag) && o.headings) out += '#'.repeat(Number(tag[1])) + ' ';
    const p2 = pre || tag === 'PRE';
    e.childNodes.forEach((c) => walk(c, p2));
    if (tag === 'TD' || tag === 'TH') out += '\t';
    if (tag === 'A' && o.links && e.getAttribute('href') && !/^(#|javascript:)/i.test(e.getAttribute('href') || '')) out += ` (${e.getAttribute('href')})`;
    if (block) out += '\n';
  };
  walk(doc.body, false);
  return out.split('\n').map((l) => l.replace(/[ \t]+$/g, '').replace(/^[ \t]+/g, '')).join('\n').replace(/\n{3,}/g, '\n\n').trim();
});

// ---------- text to HTML / entities ----------
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const textToHtml: Fn = wrap((t) => t.replace(/\r/g, '').trim().split(/\n{2,}/).map((p) => `<p>${esc(p).replace(/\n/g, '<br>\n')}</p>`).join('\n'));
const htmlEntities: Fn = wrap((t, o) => {
  if (o.mode === 'decode') return new DOMParser().parseFromString(t, 'text/html').documentElement.textContent || '';
  let r = esc(t); if (o.ascii) r = r.replace(/[^\x00-\x7f]/gu, (c) => `&#x${(c.codePointAt(0) as number).toString(16).toUpperCase()};`);
  return r;
});

// ---------- JSON helpers ----------
const flat = (v: any, pre: string, out: Record<string, any>) => {
  if (v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length) { for (const k of Object.keys(v)) flat(v[k], pre ? `${pre}.${k}` : k, out); }
  else out[pre || 'value'] = Array.isArray(v) || (v && typeof v === 'object') ? JSON.stringify(v) : v;
};
const jsonToCsv: Fn = wrap((t, o) => {
  let d = parseJson(t); if (!Array.isArray(d)) d = [d];
  const d0 = o.delim === 'tab' ? '\t' : o.delim === 'semi' ? ';' : ',';
  const rows = d.map((r: any) => { const out: Record<string, any> = {}; flat(r, '', out); return out; });
  const keys: string[] = []; rows.forEach((r: any) => Object.keys(r).forEach((k) => { if (!keys.includes(k)) keys.push(k); }));
  const cell = (v: any) => { if (v === null || v === undefined) return ''; const s = String(v); return new RegExp(`[${d0}"\\n\\r]`).test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  return [keys.map(cell).join(d0), ...rows.map((r: any) => keys.map((k) => cell(r[k])).join(d0))].join('\n');
});

const yScalar = (s: string) => {
  if (s === '' || /^\s|\s$|^[-?:,[\]{}#&*!|>'"%@`]|: |\s#|\n/.test(s) || /^(true|false|null|yes|no|on|off|~)$/i.test(s) || /^[-+]?(\d|\.\d)/.test(s)) return JSON.stringify(s);
  return s;
};
const toYaml = (v: any, ind: number): string => {
  const pad = '  '.repeat(ind);
  if (v === null) return 'null';
  if (typeof v !== 'object') return typeof v === 'string' ? yScalar(v) : String(v);
  if (Array.isArray(v)) {
    if (!v.length) return '[]';
    return v.map((x) => { if (x && typeof x === 'object' && (Array.isArray(x) ? x.length : Object.keys(x).length)) { const inner = toYaml(x, ind + 1).split('\n'); return `${pad}- ${inner[0].trimStart()}` + (inner.length > 1 ? '\n' + inner.slice(1).join('\n') : ''); } return `${pad}- ${toYaml(x, ind + 1)}`; }).join('\n');
  }
  const ks = Object.keys(v); if (!ks.length) return '{}';
  return ks.map((k) => { const x = v[k], key = yScalar(k); if (x && typeof x === 'object' && (Array.isArray(x) ? x.length : Object.keys(x).length)) return `${pad}${key}:\n${toYaml(x, ind + 1)}`; return `${pad}${key}: ${toYaml(x, ind + 1)}`; }).join('\n');
};
const jsonToYaml: Fn = wrap((t) => toYaml(parseJson(t), 0));

// ---------- YAML to JSON (common subset) ----------
const yamlScalar = (r: string): any => {
  const s = r.trim();
  if (s === '' || s === '~' || /^null$/i.test(s)) return null;
  if (/^(true|false)$/i.test(s)) return s.toLowerCase() === 'true';
  if (/^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(s)) return Number(s);
  if (s[0] === '"') { try { return JSON.parse(s); } catch { return s.slice(1, -1); } }
  if (s[0] === "'" && s.endsWith("'")) return s.slice(1, -1).replace(/''/g, "'");
  if (s[0] === '[' || s[0] === '{') { try { return JSON.parse(s); } catch { /* loose parse below */ } if (s[0] === '[' && s.endsWith(']')) { const inner = s.slice(1, -1).trim(); return inner ? inner.split(',').map(yamlScalar) : []; } }
  return s;
};
const stripComment = (l: string) => { let q = ''; for (let i = 0; i < l.length; i++) { const c = l[i]; if (q) { if (c === q) q = ''; } else if (c === '"' || c === "'") q = c; else if (c === '#' && (i === 0 || /\s/.test(l[i - 1]))) return l.slice(0, i); } return l; };
const yamlToJson: Fn = wrap((t) => {
  const lines = t.replace(/\r/g, '').split('\n').map(stripComment).filter((l) => l.trim() && l.trim() !== '---' && l.trim() !== '...').map((l) => ({ ind: l.length - l.trimStart().length, txt: l.trim() }));
  if (lines.some((l) => /:\s*[|>][-+]?$/.test(l.txt))) throw new Error('Multi-line block scalars (| and >) are not supported yet.');
  if (!lines.length) return '';
  const isList = (s: string) => s === '-' || s.startsWith('- ');
  const block = (i: number, ind: number): [any, number] => {
    if (isList(lines[i].txt)) {
      const arr: any[] = [];
      while (i < lines.length && lines[i].ind === ind && isList(lines[i].txt)) {
        const rest = lines[i].txt.slice(1).trim();
        if (!rest) { if (i + 1 < lines.length && lines[i + 1].ind > ind) { const [v, ni] = block(i + 1, lines[i + 1].ind); arr.push(v); i = ni; } else { arr.push(null); i++; } }
        else if (/^("[^"]*"|'[^']*'|[^"'[{][^:]*):(\s|$)/.test(rest)) { lines[i] = { ind: ind + 2, txt: rest }; const [v, ni] = block(i, ind + 2); arr.push(v); i = ni; }
        else { arr.push(yamlScalar(rest)); i++; }
      }
      return [arr, i];
    }
    const obj: any = {};
    while (i < lines.length && lines[i].ind === ind && !isList(lines[i].txt)) {
      const m = /^("[^"]*"|'[^']*'|[^:]+?):(?:\s+(.*))?$/.exec(lines[i].txt);
      if (!m) throw new Error(`Cannot read line: ${lines[i].txt.slice(0, 60)}`);
      const key = String(yamlScalar(m[1])), rest = (m[2] ?? '').trim();
      if (!rest) {
        const nx = lines[i + 1];
        if (nx && (nx.ind > ind || (nx.ind === ind && isList(nx.txt)))) { const [v, ni] = block(i + 1, nx.ind); obj[key] = v; i = ni; } else { obj[key] = null; i++; }
      } else { obj[key] = yamlScalar(rest); i++; }
    }
    return [obj, i];
  };
  const [v] = block(0, lines[0].ind);
  return JSON.stringify(v, null, 2);
});

// ---------- JSON <-> XML ----------
const xname = (k: string) => { let n = k.replace(/[^\p{L}\p{N}_.-]/gu, '_'); if (!/^[\p{L}_]/u.test(n)) n = '_' + n; return n; };
const xesc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const toXml = (name: string, v: any, ind: number): string => {
  const pad = '  '.repeat(ind), n = xname(name);
  if (Array.isArray(v)) return v.map((x) => toXml(name, x, ind)).join('\n');
  if (v === null || v === undefined) return `${pad}<${n}/>`;
  if (typeof v !== 'object') return `${pad}<${n}>${xesc(String(v))}</${n}>`;
  const ks = Object.keys(v); if (!ks.length) return `${pad}<${n}/>`;
  return `${pad}<${n}>\n${ks.map((k) => toXml(k, v[k], ind + 1)).join('\n')}\n${pad}</${n}>`;
};
const jsonToXml: Fn = wrap((t, o) => {
  const d = parseJson(t), root = String(o.root || 'root').trim() || 'root';
  const body = Array.isArray(d) ? `<${xname(root)}>\n${d.map((x) => toXml('item', x, 1)).join('\n')}\n</${xname(root)}>` : toXml(root, d, 0);
  return '<?xml version="1.0" encoding="UTF-8"?>\n' + body;
});
const xmlNode = (e: Element): any => {
  const out: any = {}; let has = false;
  for (const a of Array.from(e.attributes)) { out['@' + a.name] = a.value; has = true; }
  for (const k of Array.from(e.children)) { const v = xmlNode(k); has = true; if (k.tagName in out) { if (!Array.isArray(out[k.tagName])) out[k.tagName] = [out[k.tagName]]; out[k.tagName].push(v); } else out[k.tagName] = v; }
  const txt = Array.from(e.childNodes).filter((n) => n.nodeType === 3 || n.nodeType === 4).map((n) => n.nodeValue || '').join('').trim();
  if (!has) return txt;
  if (txt) out['#text'] = txt;
  return out;
};
const xmlToJson: Fn = wrap((t) => {
  const doc = new DOMParser().parseFromString(t.trim(), 'application/xml');
  if (doc.querySelector('parsererror')) throw new Error('Invalid XML. Check that every tag is closed.');
  return JSON.stringify({ [doc.documentElement.tagName]: xmlNode(doc.documentElement) }, null, 2);
});

// ---------- text to JSON ----------
const textToJson: Fn = wrap((t, o) => {
  const ty = (s: string): any => (o.types ? (/^(true|false)$/i.test(s) ? s.toLowerCase() === 'true' : /^null$/i.test(s) ? null : /^-?\d+(\.\d+)?$/.test(s) ? Number(s) : s) : s);
  const ls = t.replace(/\r/g, '').split('\n').map((l) => l.trim()).filter(Boolean);
  if (o.mode === 'pairs') { const r: any = {}; for (const l of ls) { const m = /^([^:=]+?)\s*[:=]\s*(.*)$/.exec(l); if (!m) throw new Error(`Line has no key and value: ${l.slice(0, 50)}`); r[m[1]] = ty(m[2]); } return JSON.stringify(r, null, 2); }
  return JSON.stringify(ls.map(ty), null, 2);
});

// ---------- Markdown to HTML ----------
const inline = (s: string) => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>').replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img src="$2" alt="$1">').replace(/\[([^\]]+)\]\(((?:[^()\s]|\([^()\s]*\))+)\)/g, (_m, a, u) => (/^\s*javascript:/i.test(u) ? a : `<a href="${u}">${a}</a>`));
const markdownToHtml: Fn = wrap((t) => {
  const ls = t.replace(/\r/g, '').split('\n'); const out: string[] = []; let i = 0;
  const li = /^\s*[-*+]\s+/, ol = /^\s*\d+[.)]\s+/;
  while (i < ls.length) {
    const l = ls[i];
    if (/^```/.test(l)) { const buf: string[] = []; i++; while (i < ls.length && !/^```/.test(ls[i])) buf.push(ls[i++]); i++; out.push(`<pre><code>${esc(buf.join('\n'))}</code></pre>`); continue; }
    const h = /^(#{1,6})\s+(.*)$/.exec(l); if (h) { out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`); i++; continue; }
    if (/^(-{3,}|\*{3,})\s*$/.test(l)) { out.push('<hr>'); i++; continue; }
    if (/^>\s?/.test(l)) { const buf: string[] = []; while (i < ls.length && /^>\s?/.test(ls[i])) buf.push(ls[i++].replace(/^>\s?/, '')); out.push(`<blockquote>${inline(buf.join(' '))}</blockquote>`); continue; }
    if (li.test(l)) { const buf: string[] = []; while (i < ls.length && li.test(ls[i])) buf.push(`<li>${inline(ls[i++].replace(li, ''))}</li>`); out.push(`<ul>\n${buf.join('\n')}\n</ul>`); continue; }
    if (ol.test(l)) { const buf: string[] = []; while (i < ls.length && ol.test(ls[i])) buf.push(`<li>${inline(ls[i++].replace(ol, ''))}</li>`); out.push(`<ol>\n${buf.join('\n')}\n</ol>`); continue; }
    if (!l.trim()) { i++; continue; }
    const buf: string[] = []; while (i < ls.length && ls[i].trim() && !/^(#{1,6}\s|```|>)/.test(ls[i]) && !li.test(ls[i]) && !ol.test(ls[i])) buf.push(ls[i++]);
    if (!buf.length) buf.push(ls[i++]);
    out.push(`<p>${inline(buf.join(' '))}</p>`);
  }
  return out.join('\n');
});

// ---------- HTML format / minify ----------
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
const htmlFormat: Fn = wrap((t, o) => {
  const toks = t.match(/<!--[\s\S]*?-->|<[^>]+>|[^<]+/g) || [];
  if (o.mode === 'minify') return toks.filter((x) => !x.startsWith('<!--')).map((x) => (x[0] === '<' ? x.replace(/\s+/g, ' ') : x.replace(/^\s*\n\s*/, '').replace(/\s*\n\s*$/, '').replace(/\s+/g, ' '))).join('').replace(/>\s+</g, '><').trim();
  let d = 0; const out: string[] = [];
  for (const tk of toks) {
    if (tk[0] !== '<') { const s = tk.replace(/\s+/g, ' ').trim(); if (s) out.push('  '.repeat(d) + s); continue; }
    const m = /^<\/?([a-zA-Z][\w:-]*)/.exec(tk); const name = m ? m[1].toLowerCase() : '';
    const closing = tk.startsWith('</'), selfc = tk.endsWith('/>') || VOID.has(name) || tk.startsWith('<!');
    if (closing) d = Math.max(0, d - 1);
    out.push('  '.repeat(d) + tk.replace(/\s+/g, ' '));
    if (!closing && !selfc) d++;
  }
  return out.join('\n');
});


// ---------- batch 2 ----------
const jsonEscape: Fn = wrap((t, o) => {
  if (o.mode === 'unescape') { try { return JSON.parse('"' + t.trim().replace(/^"|"$/g, '').replace(/(^|[^\\])"/g, '$1\\"') + '"'); } catch { throw new Error('Could not unescape. Check the backslashes.'); } }
  return JSON.stringify(t).slice(1, -1);
});
const pascal = (k: string) => { const n = k.replace(/[^\p{L}\p{N}]+/gu, ' ').trim().split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(''); return /^[A-Za-z_]/.test(n) ? n : 'T' + n; };
const jsonToTs: Fn = wrap((t, o) => {
  const d = parseJson(t), ifaces: string[] = [], used = new Set<string>();
  const uniq = (n: string) => { let m = n, i = 2; while (used.has(m)) m = n + i++; used.add(m); return m; };
  const infer = (samples: any[], name: string): string => {
    const parts: string[] = []; const objs = samples.filter((x) => x && typeof x === 'object' && !Array.isArray(x)); const arrs = samples.filter(Array.isArray);
    for (const ty of ['string', 'number', 'boolean']) if (samples.some((x) => typeof x === ty)) parts.push(ty);
    if (samples.some((x) => x === null)) parts.push('null');
    if (arrs.length) { const items = arrs.flat(); const it = items.length ? infer(items, name) : 'unknown'; parts.push(it.includes(' | ') ? `(${it})[]` : `${it}[]`); }
    if (objs.length) {
      const nm = uniq(name), keys: string[] = []; objs.forEach((x) => Object.keys(x).forEach((k) => { if (!keys.includes(k)) keys.push(k); }));
      const body = keys.map((k) => { const vals = objs.filter((x) => k in x).map((x) => x[k]); const key = /^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k); return `  ${key}${vals.length < objs.length ? '?' : ''}: ${infer(vals, pascal(k))};`; }).join('\n');
      ifaces.push(`interface ${nm} {\n${body}\n}`); parts.push(nm);
    }
    return parts.join(' | ') || 'unknown';
  };
  const root = pascal(String(o.root || 'Root')) || 'Root';
  const top = infer([d], root);
  const res = ifaces.reverse();
  if (!/^[A-Za-z0-9_]+$/.test(top) || !used.has(top)) res.push(`type ${root} = ${top};`);
  return res.join('\n\n');
});
const parseCsv = (t: string, delim: string): string[][] => {
  const rows: string[][] = []; let row: string[] = [], cur = '', q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
    else if (c === '"') q = true;
    else if (c === delim) { row.push(cur); cur = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && t[i + 1] === '\n') i++; row.push(cur); cur = ''; if (row.some((x) => x !== '') || row.length > 1) rows.push(row); row = []; }
    else cur += c;
  }
  row.push(cur); if (row.some((x) => x !== '') || row.length > 1) rows.push(row);
  return rows;
};
const detectDelim = (t: string, d: string) => (d === 'tab' ? '\t' : d === 'semi' ? ';' : d === 'comma' ? ',' : (() => { const l = t.split('\n')[0] || ''; const c = [',', ';', '\t'].map((x) => [x, l.split(x).length] as const).sort((a, b) => b[1] - a[1])[0]; return c[1] > 1 ? c[0] : ','; })());
const csvToHtml: Fn = wrap((t, o) => {
  const r = parseCsv(t, detectDelim(t, o.delim)); if (!r.length) return '';
  const row = (c: string[], tag: string) => `    <tr>${c.map((x) => `<${tag}>${esc(x)}</${tag}>`).join('')}</tr>`;
  return `<table>\n  <thead>\n${row(r[0], 'th')}\n  </thead>\n  <tbody>\n${r.slice(1).map((x) => row(x, 'td')).join('\n')}\n  </tbody>\n</table>`;
});
const csvToMd: Fn = wrap((t, o) => {
  const r = parseCsv(t, detectDelim(t, o.delim)); if (!r.length) return '';
  const w = Math.max(...r.map((x) => x.length)); const f = (c: string[]) => '| ' + Array.from({ length: w }, (_, i) => (c[i] ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ')).join(' | ') + ' |';
  return [f(r[0]), '| ' + Array(w).fill('---').join(' | ') + ' |', ...r.slice(1).map(f)].join('\n');
});
const csvCell = (v: string, d = ',') => (new RegExp(`[${d}"\\n\\r]`).test(v) ? `"${v.replace(/"/g, '""')}"` : v);
const htmlTableToCsv: Fn = wrap((t) => {
  const doc = new DOMParser().parseFromString(t, 'text/html'); const tables = Array.from(doc.querySelectorAll('table'));
  if (!tables.length) throw new Error('No <table> found in this HTML.');
  return tables.map((tb) => Array.from(tb.querySelectorAll('tr')).map((tr) => Array.from(tr.querySelectorAll('th,td')).map((c) => csvCell((c.textContent || '').replace(/\s+/g, ' ').trim())).join(',')).join('\n')).join('\n\n');
});
const queryToJson: Fn = wrap((t) => {
  let q = t.trim(); const h = q.indexOf('#'); if (h >= 0) q = q.slice(0, h); const i = q.indexOf('?'); if (i >= 0) q = q.slice(i + 1);
  const out: any = {}; new URLSearchParams(q).forEach((v, k) => { if (k in out) { if (!Array.isArray(out[k])) out[k] = [out[k]]; out[k].push(v); } else out[k] = v; });
  return JSON.stringify(out, null, 2);
});
const jsonToQuery: Fn = wrap((t) => {
  const d = parseJson(t); if (!d || typeof d !== 'object' || Array.isArray(d)) throw new Error('Use a JSON object like {"a":1,"b":"x"}.');
  const p: string[] = []; for (const k of Object.keys(d)) for (const v of Array.isArray(d[k]) ? d[k] : [d[k]]) p.push(`${encodeURIComponent(k)}=${encodeURIComponent(v !== null && typeof v === 'object' ? JSON.stringify(v) : String(v ?? ''))}`);
  return p.join('&');
});
const xmlFormat: Fn = wrap((t, o) => {
  const doc = new DOMParser().parseFromString(t.trim(), 'application/xml'); if (doc.querySelector('parsererror')) throw new Error('Invalid XML. Check that every tag is closed.');
  const toks = (t.match(/<\?[\s\S]*?\?>|<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<[^>]+>|[^<]+/g) || []).filter((x) => x.trim() || x[0] === '<');
  if (o.mode === 'minify') return toks.filter((x) => !x.startsWith('<!--')).map((x) => (x[0] === '<' ? x : x.trim())).join('');
  let d = 0; const out: string[] = [];
  for (let i = 0; i < toks.length; i++) {
    const tk = toks[i].trim(), pad = '  '.repeat(d);
    if (tk[0] !== '<') { out.push(pad + tk); continue; }
    if (tk.startsWith('</')) { d = Math.max(0, d - 1); out.push('  '.repeat(d) + tk); continue; }
    if (/^<(\?|!)/.test(tk) || tk.endsWith('/>')) { out.push(pad + tk); continue; }
    if (toks[i + 1] && toks[i + 1][0] !== '<' && toks[i + 2] && toks[i + 2].startsWith('</')) { out.push(pad + tk + toks[i + 1].trim() + toks[i + 2].trim()); i += 2; continue; }
    out.push(pad + tk); d++;
  }
  return out.join('\n');
});
const cssFormat: Fn = wrap((t, o) => {
  const c = t.replace(/\/\*[\s\S]*?\*\//g, '');
  if (o.mode === 'minify') return c.replace(/\s+/g, ' ').replace(/\s*([{};,>])\s*/g, '$1').replace(/:\s+/g, ':').replace(/;}/g, '}').trim();
  const m = c.replace(/\s+/g, ' ').replace(/\s*\{\s*/g, ' {\n').replace(/;\s*/g, ';\n').replace(/\s*\}\s*/g, '\n}\n');
  let d = 0; return m.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => { if (l.startsWith('}')) d = Math.max(0, d - 1); const r = '  '.repeat(d) + l; if (l.endsWith('{')) d++; return r; }).join('\n').replace(/\}\n(?=[^}\s])/g, '}\n\n');
});
const sortKeys = (v: any): any => (Array.isArray(v) ? v.map(sortKeys) : v && typeof v === 'object' ? Object.keys(v).sort((a, b) => a.localeCompare(b)).reduce((r: any, k) => { r[k] = sortKeys(v[k]); return r; }, {}) : v);
const jsonSort: Fn = wrap((t) => JSON.stringify(sortKeys(parseJson(t)), null, 2));

export const DEV_FNS: Record<string, Fn> = { 'json-escape': jsonEscape, 'json-to-typescript': jsonToTs, 'csv-to-html-table': csvToHtml, 'csv-to-markdown': csvToMd, 'html-table-to-csv': htmlTableToCsv, 'query-to-json': queryToJson, 'json-to-query': jsonToQuery, 'xml-formatter': xmlFormat, 'css-formatter': cssFormat, 'json-sort-keys': jsonSort, 'html-to-text': htmlToText, 'text-to-html': textToHtml, 'html-entities': htmlEntities, 'json-to-csv': jsonToCsv, 'json-to-yaml': jsonToYaml, 'yaml-to-json': yamlToJson, 'json-to-xml': jsonToXml, 'xml-to-json': xmlToJson, 'text-to-json': textToJson, 'markdown-to-html': markdownToHtml, 'html-formatter': htmlFormat };
