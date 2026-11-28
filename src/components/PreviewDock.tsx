import React, { useEffect, useRef, useState } from 'react';
import { GripVertical, Check, X, Plus, Scissors } from 'lucide-react';
import { fmtSize, parseRanges, flatPages } from '../lib/util';
import { useT } from '../lib/i18n';
import type { Tool } from '../tools/types';
import { loadImage } from '../lib/util';
import { processBackground } from '../tools/imageTools';

export const compressPages = (set: Set<number>) => {
  const a = [...set].sort((x, y) => x - y); const out: string[] = []; let i = 0;
  while (i < a.length) { let j = i; while (j + 1 < a.length && a[j + 1] === a[j] + 1) j++; out.push(j > i ? `${a[i]}-${a[j]}` : `${a[i]}`); i = j + 1; }
  return out.join(',');
};
export const PAGE_SELECT = new Set(['remove-pages', 'extract-pages', 'rotate-pdf', 'crop-pdf', 'sign-pdf']);
type Th = { url: string; label: string; page?: number };

async function thumbsFor(file: Blob, name: string, maxPages: number, scale: number, onItem: (t: Th) => void, dead: () => boolean) {
  if (file.type.startsWith('image/') && file.type !== 'image/bmp') { onItem({ url: URL.createObjectURL(file), label: name }); return; }
  if (file.type === 'application/pdf' || /\.pdf$/i.test(name)) {
    try { const { openPdf, renderPage } = await import('../lib/pdfjs'); const doc = await openPdf(file);
      for (let i = 1; i <= Math.min(doc.numPages, maxPages) && !dead(); i++) onItem({ url: (await renderPage(doc, i, scale)).toDataURL('image/jpeg', 0.7), label: `${name} p${i}`, page: i });
    } catch { /* unreadable or encrypted */ }
  }
}
/** Reorderable list: native drag and drop. */
function useDnd(order: number[], setOrder: (o: number[]) => void) {
  const from = useRef<number | null>(null);
  return (i: number) => ({
    draggable: true,
    onDragStart: (e: React.DragEvent) => { from.current = i; e.dataTransfer.effectAllowed = 'move'; },
    onDragOver: (e: React.DragEvent) => e.preventDefault(),
    onDrop: (e: React.DragEvent) => { e.preventDefault(); const f = from.current; if (f === null || f === i) return; const n = [...order]; const [m] = n.splice(f, 1); n.splice(i, 0, m); setOrder(n); from.current = null; },
  });
}
export const FileCards: React.FC<{ files: File[]; setFiles: (f: File[]) => void; addMore?: boolean; accept?: string }> = ({ files, setFiles, addMore, accept }) => { const { t: tr } = useT();
  const [th, setTh] = useState<Record<string, string>>({}); const [pg, setPg] = useState<Record<string, number>>({}); const add = useRef<HTMLInputElement>(null);
  useEffect(() => { let dead = false; files.forEach(async (f) => { const k = f.name + f.size; if (pg[k] !== undefined || !(f.type === 'application/pdf' || /\.pdf$/i.test(f.name))) return; try { const { openPdf } = await import('../lib/pdfjs'); const d = await openPdf(f); if (!dead) setPg((p) => ({ ...p, [k]: d.numPages })); } catch { /* unreadable */ } }); return () => { dead = true; }; }, [files]);
  const totalPages = files.reduce((n, f) => n + (pg[f.name + f.size] ?? 0), 0);
  useEffect(() => { let dead = false; files.forEach((f) => { const k = f.name + f.size; if (th[k]) return; thumbsFor(f, f.name, 1, 0.3, (t) => !dead && setTh((p) => ({ ...p, [k]: t.url })), () => dead); }); return () => { dead = true; }; }, [files]);
  const dnd = useDnd(files.map((_, i) => i), (o) => setFiles(o.map((i) => files[i])));
  return (<div>{files.length > 1 && <p className="text-xs opacity-70 mb-2">{files.length} {tr('files')}{totalPages > 0 ? ` · ${totalPages} ${tr('pages in total')}` : ''} · <bdi dir="ltr">{fmtSize(files.reduce((n, f) => n + f.size, 0))}</bdi></p>}<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{files.map((f, i) => (
    <div key={f.name + f.size + i} {...dnd(i)} className="relative group cursor-grab active:cursor-grabbing bg-white/5 border border-white/10 rounded-xl p-2 hover:border-violet-400/60">
      <span className="absolute top-1 left-1 text-[10px] bg-black/60 rounded px-1.5">{i + 1}</span><GripVertical size={14} className="absolute top-1.5 right-1.5 text-gray-400" />
      <div className="h-32 flex items-center justify-center bg-white/90 rounded-lg overflow-hidden">{th[f.name + f.size] ? <img src={th[f.name + f.size]} className="max-h-32 object-contain" draggable={false} /> : (() => { const ext = (f.name.includes('.') ? f.name.split('.').pop()! : 'file').slice(0, 5).toUpperCase(); const hue = ([...ext].reduce((a, c) => a + c.charCodeAt(0), 0) * 47) % 360; return <span className="relative grid place-items-center w-20 h-[6.5rem] rounded-md border border-black/15 bg-white shadow-sm" aria-hidden="true"><span className="absolute top-0 right-0 w-5 h-5 bg-black/10" style={{ clipPath: 'polygon(0 0, 100% 100%, 0 100%)' }} /><span dir="ltr" className="text-[13px] font-bold tracking-wider px-1.5 py-0.5 rounded" style={{ background: `hsl(${hue} 55% 38%)`, color: '#fff' }}>{ext}</span></span>; })()}</div>
      <button type="button" aria-label={`Remove ${f.name}`} onClick={(e) => { e.stopPropagation(); setFiles(files.filter((_, j) => j !== i)); }} className="absolute bottom-7 right-1.5 p-1 rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100 focus-visible:opacity-100"><X size={12} /></button>
      <p className="text-[11px] mt-1.5 truncate">{f.name}</p><p dir="ltr" className="text-[10px] opacity-60 text-start">{fmtSize(f.size)}{pg[f.name + f.size] ? ` · ${pg[f.name + f.size]}p` : ''}</p></div>))}
    {addMore && <button type="button" onClick={() => add.current?.click()} className="mc-drop grid place-items-center min-h-[11rem] text-sm font-semibold"><span className="grid place-items-center gap-1"><Plus size={20} />{tr('Add files')}</span><input ref={add} type="file" multiple accept={accept} hidden onChange={(e) => { const n = Array.from(e.target.files ?? []); if (n.length) setFiles([...files, ...n]); e.target.value = ''; }} /></button>}</div></div>);
};
export const PageGrid: React.FC<{ file: File; mode: 'select' | 'sort'; selected: Set<number>; onSelect: (s: Set<number>) => void; onOrder: (o: number[]) => void; rotate?: { angle: number; pages: string }; intent?: 'remove' | 'extract' }> = ({ file, mode, selected, onSelect, onOrder, rotate, intent }) => { const { t: tr } = useT(); const [dims, setDims] = useState<Record<number, [number, number]>>({});
  const [items, setItems] = useState<Th[]>([]); const [order, setOrder] = useState<number[]>([]);
  useEffect(() => { let dead = false; setItems([]); setDims({}); const acc: Th[] = []; thumbsFor(file, file.name, 80, 0.28, (t) => { acc.push(t); if (!dead) setItems([...acc]); }, () => dead).then(() => { if (!dead) { const o = acc.map((_, i) => i); setOrder(o); } }); return () => { dead = true; }; }, [file]);
  useEffect(() => { if (mode === 'sort' && order.length) onOrder(order.map((i) => i + 1)); }, [order, mode]);
  const dnd = useDnd(order, setOrder); const list = mode === 'sort' && order.length === items.length ? order : items.map((_, i) => i);
  let turned = new Set<number>(); if (rotate) { try { turned = new Set(flatPages(parseRanges(rotate.pages || 'all', items.length))); } catch { /* bad range: no preview turn */ } }
  return (<div><p className="text-xs text-gray-400 mb-2">{mode === 'select' ? tr('Click pages to select them') : tr('Drag pages to reorder')} · {items.length} {tr('pages')}{selected.size > 0 && mode === 'select' ? ` · ${selected.size} ${tr('selected')}` : ''}{selected.size > 0 && intent ? <span className="block mt-0.5">{intent === 'remove' ? tr('Marked pages will be removed') : tr('Only the marked pages are kept')}</span> : null}</p>
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 items-start">{list.map((idx, pos) => { const t = items[idx]; if (!t) return null; const n = idx + 1; const sel = selected.has(n);
      const gone = mode === 'select' && ((intent === 'remove' && sel) || (intent === 'extract' && selected.size > 0 && !sel)); const deg = rotate && turned.has(idx) ? ((rotate.angle % 360) + 360) % 360 : 0; const d = dims[idx]; const swap = deg === 90 || deg === 270;
      return (<div key={idx} {...(mode === 'sort' ? dnd(pos) : {})} onClick={() => { if (mode !== 'select') return; const s = new Set(selected); sel ? s.delete(n) : s.add(n); onSelect(s); }}
        className={`relative rounded-lg overflow-hidden border-2 ${mode === 'sort' ? 'cursor-grab' : 'cursor-pointer'} ${sel ? (intent === 'remove' ? 'border-red-400' : 'border-violet-400') : 'border-transparent hover:border-white/30'}`} style={gone ? { opacity: 0.45 } : undefined}>
        {deg && d ? <div className="relative bg-white" style={{ aspectRatio: swap ? `${d[1]} / ${d[0]}` : `${d[0]} / ${d[1]}` }}><img src={t.url} alt="" draggable={false} style={{ position: 'absolute', left: '50%', top: '50%', width: swap ? `${(100 * d[0]) / d[1]}%` : '100%', transform: `translate(-50%,-50%) rotate(${deg}deg)`, transition: 'transform .25s' }} /></div>
          : <img src={t.url} alt="" className="w-full bg-white" draggable={false} onLoad={(e) => { const im = e.currentTarget; setDims((x) => (x[idx] ? x : { ...x, [idx]: [im.naturalWidth, im.naturalHeight] })); }} />}
        <span className="absolute bottom-1 left-1 text-[10px] bg-black/70 rounded px-1">{mode === 'sort' ? pos + 1 : n}{mode === 'sort' && n !== pos + 1 ? ` (${tr('was')} ${n})` : ''}</span>
        {sel && <span className={`absolute top-1 right-1 rounded-full p-0.5 ${intent === 'remove' ? 'bg-red-500' : 'bg-violet-500'}`}>{intent === 'remove' ? <X size={12} /> : <Check size={12} />}</span>}</div>); })}</div></div>);
};
export const BackgroundPreview: React.FC<{ file: File; opts: Record<string, any> }> = ({ file, opts }) => {
  const ref = useRef<HTMLCanvasElement>(null); const key = JSON.stringify({ ...opts, bgfile: (opts.bgfile as File | null)?.name });
  useEffect(() => { let dead = false; const t = setTimeout(async () => { try {
    const img = await loadImage(file); const bg = opts.mode === 'image' && opts.bgfile ? await loadImage(opts.bgfile) : null; const s = Math.min(1, 520 / Math.max(img.naturalWidth, img.naturalHeight));
    const out = processBackground(img, Math.round(img.naturalWidth * s), Math.round(img.naturalHeight * s), opts, bg); if (dead || !ref.current) return;
    ref.current.width = out.width; ref.current.height = out.height; ref.current.getContext('2d')!.drawImage(out, 0, 0); } catch { /* ignore */ } }, 150); return () => { dead = true; clearTimeout(t); }; }, [file, key]);
  return (<div><p className="text-xs text-gray-400 mb-2">Live result (checkerboard = transparent)</p>
    <div className="rounded-xl overflow-hidden border border-white/10 inline-block max-w-full" style={{ backgroundImage: 'conic-gradient(#9ca3af 25%, #e5e7eb 0 50%, #9ca3af 0 75%, #e5e7eb 0)', backgroundSize: '16px 16px' }}><canvas ref={ref} className="max-w-full h-auto block" /></div></div>);
};
export const PageFrame: React.FC<{ file?: File; opts: Record<string, any> }> = ({ file, opts }) => {
  const [url, setUrl] = useState(''); useEffect(() => { if (!file) return; const u = URL.createObjectURL(file); setUrl(u); return () => URL.revokeObjectURL(u); }, [file]);
  const land = opts.size === 'a4-landscape'; const m = Number(opts.margin) / (land ? 842 : 595) * 100;
  return (<div><p className="text-xs text-gray-400 mb-2">Page layout ({opts.size === 'fit' ? 'matches image' : land ? 'A4 landscape' : 'A4 portrait'}, margin {opts.margin} pt)</p>
    <div className="bg-white rounded shadow-lg mx-auto" style={{ aspectRatio: opts.size === 'fit' ? undefined : land ? '842/595' : '595/842', width: land ? '100%' : '60%', padding: `${m}%` }}>{url && <img src={url} className="w-full h-full object-contain" style={{ background: '#e5e7eb' }} />}</div></div>);
};
export function usePreviewMode(tool: Tool) {
  if (tool.id === 'image-background') return 'background';
  if (tool.id === 'compress-pdf') return 'compress';
  if (tool.id === 'split-pdf') return 'split';
  if (tool.id === 'images-to-pdf') return 'frame';
  if (PAGE_SELECT.has(tool.id)) return 'select';
  if (tool.id === 'reorder-pdf') return 'sort';
  if (tool.multiple) return 'files';
  return 'first';
}

const LVLS: { k: string; s: number; q: number; name: string }[] = [
  { k: 'low', s: 1.0, q: 0.5, name: 'Strong' }, { k: 'med', s: 1.4, q: 0.7, name: 'Balanced' }, { k: 'high', s: 2.0, q: 0.85, name: 'Light' },
];
export const CompressPreview: React.FC<{ file: File; level: string; setLevel: (k: string) => void }> = ({ file, level, setLevel }) => {
  const { t: tr } = useT();
  const [est, setEst] = useState<Record<string, { size: number; url: string }>>({}); const [pages, setPages] = useState(0); const [busy, setBusy] = useState(true);
  useEffect(() => {
    let dead = false; setEst({}); setBusy(true);
    (async () => {
      try {
        const { openPdf, renderPage } = await import('../lib/pdfjs'); const doc = await openPdf(file); setPages(doc.numPages);
        for (const L of LVLS) {
          const cv = await renderPage(doc, 1, L.s);
          const b: Blob = await new Promise((r) => cv.toBlob((x) => r(x!), 'image/jpeg', L.q));
          if (dead) return; setEst((e) => ({ ...e, [L.k]: { size: b.size * doc.numPages, url: URL.createObjectURL(b) } }));
        }
      } catch { /* unreadable */ } if (!dead) setBusy(false);
    })();
    return () => { dead = true; };
  }, [file]);
  const cur = est[level];
  return (
    <div className="space-y-4">
      <div role="radiogroup" aria-label="Compression level" className="grid grid-cols-3 gap-2">
        {LVLS.map((L) => { const e = est[L.k]; const gain = !!e && e.size < file.size * 0.97; const pct = e ? Math.round((1 - e.size / file.size) * 100) : 0; return (
          <button key={L.k} role="radio" aria-checked={level === L.k} onClick={() => setLevel(L.k)} className={`rounded-2xl border p-3 text-start transition ${level === L.k ? 'border-current ring-2 ring-current/40' : 'border-current/20 opacity-80 hover:opacity-100'}`}>
            <div className="text-xs uppercase tracking-wide opacity-70">{tr(L.name)}</div>
            <div className="font-display text-lg font-bold">{e ? (gain ? `~${fmtSize(e.size)}` : tr('No gain')) : '...'}</div>
            <div className="text-xs opacity-70">{e ? (gain ? `${tr('about')} ${pct}% ${tr('smaller')}` : tr('Original is already small')) : tr('estimating')}</div>
          </button>); })}
      </div>
      <p className="text-xs opacity-70">{tr('Original')} {fmtSize(file.size)}{pages ? `, ${pages} ${tr('pages')}` : ''}. {tr('Estimates come from page 1 at each level.')}{busy ? ' ' + tr('Calculating...') : ''}</p>
      {cur && <figure><img src={cur.url} alt={tr('Page 1 at this level.')} className="w-full max-h-[420px] object-contain rounded-xl border border-current/20 bg-white" /><figcaption className="text-xs opacity-70 mt-1">{tr('Page 1 at this level.')}</figcaption></figure>}
    </div>
  );
};

const HUES = [18, 160, 265, 40, 200, 330, 90, 0];
export const SplitPreview: React.FC<{ file: File; opts: Record<string, any>; setOpts: (f: (o: Record<string, any>) => Record<string, any>) => void }> = ({ file, opts, setOpts }) => {
  const { t: tr } = useT();
  const [items, setItems] = useState<Th[]>([]); const [cuts, setCuts] = useState<Set<number>>(new Set());
  useEffect(() => { let dead = false; setItems([]); setCuts(new Set()); const acc: Th[] = []; thumbsFor(file, file.name, 80, 0.28, (t) => { acc.push(t); if (!dead) setItems([...acc]); }, () => dead); return () => { dead = true; }; }, [file]);
  const n = items.length; const mode = opts.mode ?? 'ranges';
  const effCuts = (): Set<number> => {
    if (mode === 'each') return new Set(Array.from({ length: n - 1 }, (_, i) => i + 1));
    if (mode === 'every') { const k = Math.max(1, Math.floor(Number(opts.every) || 1)); const s = new Set<number>(); for (let i = k; i < n; i += k) s.add(i); return s; }
    return cuts;
  };
  const ec = effCuts(); const groupOf: number[] = []; let g = 0; for (let i = 1; i <= n; i++) { groupOf[i] = g; if (ec.has(i)) g++; }
  const groups = n ? g + 1 : 0;
  const toggle = (after: number) => {
    if (mode !== 'ranges') return;
    const s = new Set(cuts); s.has(after) ? s.delete(after) : s.add(after); setCuts(s);
    const pts = [0, ...[...s].sort((a, b) => a - b), n]; const parts: string[] = [];
    for (let i = 0; i < pts.length - 1; i++) parts.push(pts[i + 1] - pts[i] === 1 ? `${pts[i] + 1}` : `${pts[i] + 1}-${pts[i + 1]}`);
    setOpts((o) => ({ ...o, ranges: parts.join(',') }));
  };
  return (
    <div>
      <p className="text-xs opacity-70 mb-3">{mode === 'ranges' ? tr('Click the scissors between pages to cut there.') : tr('Cuts follow your split mode.')} {n ? `${n} ${tr('pages')} → ${groups} ${tr('files')}` : ''}</p>
      <div className="flex flex-wrap gap-y-3">
        {items.map((t, i) => { const p = i + 1; const hue = HUES[groupOf[p] % HUES.length]; return (
          <React.Fragment key={p}>
            <div className="w-[84px] shrink-0 rounded-lg overflow-hidden border-2 bg-white" style={{ borderColor: `hsl(${hue} 55% 45%)` }}>
              <img src={t.url} alt="" className="w-full" draggable={false} />
              <div className="text-[10px] text-center py-0.5" style={{ background: `hsl(${hue} 55% 32%)`, color: '#fff' }}>{p} · {tr('file')} {groupOf[p] + 1}</div>
            </div>
            {p < n && <button type="button" disabled={mode !== 'ranges'} aria-label={`${tr('Cut after page')} ${p}`} aria-pressed={ec.has(p)} onClick={() => toggle(p)} className={`relative w-6 shrink-0 flex items-center justify-center self-stretch ${mode === 'ranges' ? 'cursor-pointer' : 'cursor-default'}`}>
              <span className="block h-full" style={{ width: 0, borderLeft: ec.has(p) ? '2px dashed #b4391f' : '2px solid rgba(120,110,95,.18)' }} />
              {mode === 'ranges' && <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full grid place-items-center shadow" style={{ background: ec.has(p) ? '#b4391f' : '#fff', color: ec.has(p) ? '#fff' : '#8a7f70', border: '1px solid rgba(120,110,95,.4)' }}><Scissors size={12} /></span>}
            </button>}
          </React.Fragment>); })}
      </div>
    </div>
  );
};
