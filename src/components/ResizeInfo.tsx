import React, { useEffect, useState } from 'react';
import { MoveDiagonal } from 'lucide-react';
type Dim = { name: string; w: number; h: number };
/** Shows the exact output size for Resize image, using the same maths as the tool. */
export const ResizeInfo: React.FC<{ files: File[]; opts: any; ar: boolean; part?: 'text' | 'boxes'; className?: string }> = ({ files, opts, ar, part, className }) => {
  const [dims, setDims] = useState<Dim[]>([]);
  useEffect(() => {
    let dead = false;
    Promise.all(files.slice(0, 3).map((f) => new Promise<Dim | null>((res) => {
      const u = URL.createObjectURL(f); const im = new Image();
      im.onload = () => { res({ name: f.name, w: im.naturalWidth, h: im.naturalHeight }); URL.revokeObjectURL(u); };
      im.onerror = () => { res(null); URL.revokeObjectURL(u); }; im.src = u;
    }))).then((r) => { if (!dead) setDims(r.filter(Boolean) as Dim[]); });
    return () => { dead = true; };
  }, [files]);
  if (!dims.length) return null;
  const out = (d: Dim): [number, number] | null => {
    if (opts.mode === 'percent') return [Math.max(1, Math.round(d.w * opts.percent / 100)), Math.max(1, Math.round(d.h * opts.percent / 100))];
    let w = Number(opts.width) || 0, h = Number(opts.height) || 0;
    if (w && !h) h = Math.round(d.h * w / d.w); else if (h && !w) w = Math.round(d.w * h / d.h);
    else if (w && h && (opts.fit === 'fill' || opts.fit === 'pad')) { /* exact box */ }
    else if (w && h && opts.keep) { const s = Math.min(w / d.w, h / d.h); w = Math.round(d.w * s); h = Math.round(d.h * s); }
    return w && h ? [w, h] : null;
  };
  const boxEl = (() => { const d = dims[0], o = out(d); if (!o) return null; const m = Math.max(d.w, d.h, o[0], o[1]); const big = part === 'boxes'; const k = (big ? 150 : 72) / m; const bx = (w: number, h: number, solid: boolean) => <span aria-hidden="true" style={{ width: Math.max(3, w * k), height: Math.max(3, h * k), border: solid ? '2px solid #84cc16' : '2px dashed rgba(128,128,128,.6)', background: solid ? 'rgba(132,204,22,.18)' : 'transparent' }} className="block rounded-sm" />; return <div dir="ltr" aria-hidden="true" className="mt-2 flex items-end gap-4 px-3 py-2 rounded-xl" style={{ height: big ? 168 : 84, background: 'rgba(128,128,128,.1)', border: '1px solid rgba(128,128,128,.35)' }}>{bx(d.w, d.h, false)}<span className="opacity-60 text-xs pb-1">→</span>{bx(o[0], o[1], true)}<span className="text-[10px] opacity-60 ms-auto self-end">{Math.round((o[0] * o[1]) / (d.w * d.h) * 100)}%</span></div>; })();
  if (part === 'boxes') return <div className={className}>{boxEl}</div>;
  return (<div className="mt-3 text-sm flex flex-col gap-1" aria-live="polite"><p className="text-xs uppercase tracking-widest opacity-70 flex items-center gap-2"><MoveDiagonal size={13} aria-hidden="true" /> {ar ? 'الحجم الناتج' : 'Result size'}</p>
    {dims.map((d) => { const o = out(d); return <p key={d.name} className="flex flex-wrap gap-x-2"><span className="opacity-70 truncate max-w-[10rem]">{d.name}</span><span dir="ltr">{d.w}×{d.h}</span><span aria-hidden="true">→</span><span dir="ltr" className="font-semibold">{o ? `${o[0]}×${o[1]}` : (ar ? 'أدخل العرض أو الارتفاع' : 'Enter a width or height')}</span></p>; })}
    {part !== 'boxes' && <div className="lg:hidden">{boxEl}</div>}
    {files.length > 3 && <p className="text-xs opacity-70">{ar ? `و${files.length - 3} ملفات أخرى بنفس الإعدادات` : `and ${files.length - 3} more with the same settings`}</p>}</div>);
};
