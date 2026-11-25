import React, { useEffect, useRef, useState } from 'react';
import { Check, UploadCloud, SlidersHorizontal, Download as Dl } from 'lucide-react';
import { useT } from '../lib/i18n';
import { fmtSize } from '../lib/util';
import { Thumbs } from './Thumbs';
import type { Out } from '../tools/types';

export const Stepper: React.FC<{ stage: 'upload' | 'board' | 'final' }> = ({ stage }) => {
  const { t } = useT(); const steps = [['upload', UploadCloud, 'Upload'], ['board', SlidersHorizontal, 'Work board'], ['final', Dl, 'Download']] as const; const at = steps.findIndex((s) => s[0] === stage);
  return (<ol className="flow-steps flex items-center gap-2 mb-6 text-sm" aria-label="Progress">{steps.map(([k, I, l], i) => (
    <React.Fragment key={k}>{i > 0 && <li aria-hidden="true" className={`flow-line h-px flex-1 max-w-16 ${i <= at ? 'on' : ''}`} />}
      <li aria-current={i === at ? 'step' : undefined} className={`flow-step inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${i === at ? 'now' : i < at ? 'done' : ''}`}>
        <span className="flow-dot grid place-items-center w-5 h-5 rounded-full text-[10px] font-bold">{i < at ? <Check size={12} /> : i + 1}</span><span className={i === at ? '' : 'hidden sm:inline'}>{t(l)}</span></li></React.Fragment>))}</ol>);
};

/** Before/after slider for single image results. */
export const CompareSlider: React.FC<{ before: Blob; after: Blob }> = ({ before, after }) => {
  const { t } = useT(); const [pos, setPos] = useState(50); const [u, setU] = useState<[string, string]>(['', '']); const box = useRef<HTMLDivElement>(null);
  useEffect(() => { const a = URL.createObjectURL(before), b = URL.createObjectURL(after); setU([a, b]); return () => { URL.revokeObjectURL(a); URL.revokeObjectURL(b); }; }, [before, after]);
  const move = (x: number) => { const r = box.current!.getBoundingClientRect(); setPos(Math.max(0, Math.min(100, ((x - r.left) / r.width) * 100))); };
  return (<div><div ref={box} dir="ltr" className="cmp relative select-none overflow-hidden rounded-2xl touch-none" onPointerDown={(e) => { (e.target as HTMLElement).setPointerCapture?.(e.pointerId); move(e.clientX); }} onPointerMove={(e) => { if (e.buttons) move(e.clientX); }}>
    <img src={u[1]} alt={t('After')} className="block w-full max-h-[60vh] object-contain" draggable={false} />
    <img src={u[0]} alt={t('Before')} className="absolute inset-0 w-full h-full object-contain" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }} draggable={false} />
    <span className="cmp-tag absolute top-2 left-2">{t('Before')}</span><span className="cmp-tag absolute top-2 right-2">{t('After')}</span>
    <div className="cmp-bar absolute top-0 bottom-0 w-0.5" style={{ left: `${pos}%` }}><span className="cmp-knob absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full grid place-items-center text-xs font-bold">&lt;&gt;</span></div></div>
    <input type="range" aria-label={t('Compare before and after')} min={0} max={100} value={pos} onChange={(e) => setPos(Number(e.target.value))} className="w-full mt-3 accent-[color:var(--ac)]" /></div>);
};

export const SizeSummary: React.FC<{ inBytes: number; outs: Out[] }> = ({ inBytes, outs }) => {
  const { t } = useT(); const b = outs.reduce((n, o) => n + o.blob.size, 0); const d = inBytes ? Math.round((1 - b / inBytes) * 100) : 0;
  return (<div className="flex items-center gap-3 flex-wrap text-sm"><span dir="ltr">{fmtSize(inBytes)}</span><span aria-hidden="true">→</span><span dir="ltr" className="font-bold text-lg">{fmtSize(b)}</span>
    {Math.abs(d) >= 1 && <span className={`px-2.5 py-0.5 rounded-full font-semibold text-xs ${d > 0 ? 'bg-emerald-500/20 text-emerald-300 sz-good' : 'bg-amber-500/20 text-amber-300 sz-warn'}`}>{d > 0 ? `${t('Saved')} ${d}%` : `+${-d}%`}</span>}</div>);
};

export const AfterView: React.FC<{ files: File[]; outs: Out[] }> = ({ files, outs }) => {
  const { t } = useT(); const img = (b: Blob) => b.type.startsWith('image/') && b.type !== 'image/bmp';
  const single = files.length === 1 && outs.length === 1 && img(files[0]) && img(outs[0].blob);
  return (<div className="space-y-4"><SizeSummary inBytes={files.reduce((n, f) => n + f.size, 0)} outs={outs} />
    {single ? <CompareSlider before={files[0]} after={outs[0].blob} /> : <Thumbs blobs={outs.slice(0, 8).map((o) => o.blob)} label="Result" />}
    <ul className="space-y-1.5 text-sm">{outs.slice(0, 12).map((o, i) => <li key={i} className="flex gap-2 justify-between"><span className="truncate">{o.name}{o.note && <span className="block text-xs opacity-70">{o.note}</span>}</span><span dir="ltr" className="opacity-70 shrink-0">{fmtSize(o.blob.size)}</span></li>)}</ul></div>);
};
