import React, { useEffect, useRef, useState } from 'react';
import { GripVertical, Check, X, Plus } from 'lucide-react';
import { fmtSize } from '../lib/util';
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
export const FileCards: React.FC<{ files: File[]; setFiles: (f: File[]) => void; addMore?: boolean; accept?: string }> = ({ files, setFiles, addMore, accept }) => {
  const [th, setTh] = useState<Record<string, string>>({}); const [pg, setPg] = useState<Record<string, number>>({}); const add = useRef<HTMLInputElement>(null);
  useEffect(() => { let dead = false; files.forEach(async (f) => { const k = f.name + f.size; if (pg[k] !== undefined || !(f.type === 'application/pdf' || /\.pdf$/i.test(f.name))) return; try { const { openPdf } = await import('../lib/pdfjs'); const d = await openPdf(f); if (!dead) setPg((p) => ({ ...p, [k]: d.numPages })); } catch { /* unreadable */ } }); return () => { dead = true; }; }, [files]);
  const totalPages = files.reduce((n, f) => n + (pg[f.name + f.size] ?? 0), 0);
  useEffect(() => { let dead = false; files.forEach((f) => { const k = f.name + f.size; if (th[k]) return; thumbsFor(f, f.name, 1, 0.3, (t) => !dead && setTh((p) => ({ ...p, [k]: t.url })), () => dead); }); return () => { dead = true; }; }, [files]);
  const dnd = useDnd(files.map((_, i) => i), (o) => setFiles(o.map((i) => files[i])));
  return (<div>{files.length > 1 && <p className="text-xs opacity-70 mb-2">{files.length} files{totalPages > 0 ? ` · ${totalPages} pages in total` : ''} · {fmtSize(files.reduce((n, f) => n + f.size, 0))}</p>}<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{files.map((f, i) => (
    <div key={f.name + f.size + i} {...dnd(i)} className="relative group cursor-grab active:cursor-grabbing bg-white/5 border border-white/10 rounded-xl p-2 hover:border-violet-400/60">
      <span className="absolute top-1 left-1 text-[10px] bg-black/60 rounded px-1.5">{i + 1}</span><GripVertical size={14} className="absolute top-1.5 right-1.5 text-gray-400" />
      <div className="h-32 flex items-center justify-center bg-white/90 rounded-lg overflow-hidden">{th[f.name + f.size] ? <img src={th[f.name + f.size]} className="max-h-32 object-contain" draggable={false} /> : <span className="text-gray-500 text-xs">{f.name.split('.').pop()}</span>}</div>
      <button type="button" aria-label={`Remove ${f.name}`} onClick={(e) => { e.stopPropagation(); setFiles(files.filter((_, j) => j !== i)); }} className="absolute bottom-7 right-1.5 p-1 rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100 focus-visible:opacity-100"><X size={12} /></button>
      <p className="text-[11px] mt-1.5 truncate">{f.name}</p><p dir="ltr" className="text-[10px] opacity-60 text-start">{fmtSize(f.size)}{pg[f.name + f.size] ? ` · ${pg[f.name + f.size]}p` : ''}</p></div>))}
    {addMore && <button type="button" onClick={() => add.current?.click()} className="mc-drop grid place-items-center min-h-[11rem] text-sm font-semibold"><span className="grid place-items-center gap-1"><Plus size={20} />Add files</span><input ref={add} type="file" multiple accept={accept} hidden onChange={(e) => { const n = Array.from(e.target.files ?? []); if (n.length) setFiles([...files, ...n]); e.target.value = ''; }} /></button>}</div></div>);
};
export const PageGrid: React.FC<{ file: File; mode: 'select' | 'sort'; selected: Set<number>; onSelect: (s: Set<number>) => void; onOrder: (o: number[]) => void }> = ({ file, mode, selected, onSelect, onOrder }) => {
  const [items, setItems] = useState<Th[]>([]); const [order, setOrder] = useState<number[]>([]);
  useEffect(() => { let dead = false; setItems([]); const acc: Th[] = []; thumbsFor(file, file.name, 80, 0.28, (t) => { acc.push(t); if (!dead) setItems([...acc]); }, () => dead).then(() => { if (!dead) { const o = acc.map((_, i) => i); setOrder(o); } }); return () => { dead = true; }; }, [file]);
  useEffect(() => { if (mode === 'sort' && order.length) onOrder(order.map((i) => i + 1)); }, [order, mode]);
  const dnd = useDnd(order, setOrder); const list = mode === 'sort' && order.length === items.length ? order : items.map((_, i) => i);
  return (<div><p className="text-xs text-gray-400 mb-2">{mode === 'select' ? 'Click pages to select them' : 'Drag pages to reorder'} · {items.length} pages{selected.size > 0 && mode === 'select' ? ` · ${selected.size} selected` : ''}</p>
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">{list.map((idx, pos) => { const t = items[idx]; if (!t) return null; const n = idx + 1; const sel = selected.has(n);
      return (<div key={idx} {...(mode === 'sort' ? dnd(pos) : {})} onClick={() => { if (mode !== 'select') return; const s = new Set(selected); sel ? s.delete(n) : s.add(n); onSelect(s); }}
        className={`relative rounded-lg overflow-hidden border-2 ${mode === 'sort' ? 'cursor-grab' : 'cursor-pointer'} ${sel ? 'border-violet-400' : 'border-transparent hover:border-white/30'}`}>
        <img src={t.url} className="w-full bg-white" draggable={false} /><span className="absolute bottom-1 left-1 text-[10px] bg-black/70 rounded px-1">{mode === 'sort' ? pos + 1 : n}{mode === 'sort' && n !== pos + 1 ? ` (was ${n})` : ''}</span>
        {sel && <span className="absolute top-1 right-1 bg-violet-500 rounded-full p-0.5"><Check size={12} /></span>}</div>); })}</div></div>);
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
        {LVLS.map((L) => { const e = est[L.k]; const pct = e ? Math.round((1 - e.size / file.size) * 100) : 0; return (
          <button key={L.k} role="radio" aria-checked={level === L.k} onClick={() => setLevel(L.k)} className={`rounded-2xl border p-3 text-start transition ${level === L.k ? 'border-current ring-2 ring-current/40' : 'border-current/20 opacity-80 hover:opacity-100'}`}>
            <div className="text-xs uppercase tracking-wide opacity-70">{L.name}</div>
            <div className="font-display text-lg font-bold">{e ? `~${fmtSize(e.size)}` : '...'}</div>
            <div className="text-xs opacity-70">{e ? (pct > 0 ? `about ${pct}% smaller` : 'may not shrink') : 'estimating'}</div>
          </button>); })}
      </div>
      <p className="text-xs opacity-70">Original {fmtSize(file.size)}{pages ? `, ${pages} pages` : ''}. Estimates come from page 1 at each level.{busy ? ' Calculating...' : ''}</p>
      {cur && <figure><img src={cur.url} alt="Page 1 at the selected level" className="w-full max-h-[420px] object-contain rounded-xl border border-current/20 bg-white" /><figcaption className="text-xs opacity-70 mt-1">Page 1 at this level. Zoom the browser to inspect quality.</figcaption></figure>}
    </div>
  );
};
