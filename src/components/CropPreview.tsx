import React, { useEffect, useRef, useState } from 'react';

/** Live preview for Crop image: the kept area is bright, the rest is dimmed. Uses the same maths as cropImages. */
export const CropPreview: React.FC<{ files: File[]; opts: any; setOpts?: (o: any) => void; t: (s: string) => string }> = ({ files, opts, setOpts, t }) => {
  const box = useRef<HTMLDivElement>(null); const drag = useRef<any>(null);
  const [url, setUrl] = useState(''); const [dim, setDim] = useState<{ w: number; h: number } | null>(null);
  useEffect(() => {
    const f = files[0]; if (!f) { setUrl(''); setDim(null); return; }
    const u = URL.createObjectURL(f); setUrl(u); const im = new Image(); im.onload = () => setDim({ w: im.naturalWidth, h: im.naturalHeight }); im.src = u;
    return () => URL.revokeObjectURL(u);
  }, [files]);
  if (!url || !dim) return null;
  const { w: W, h: H } = dim; let x = 0, y = 0, w = W, h = H;
  if (opts.ratio === 'custom') {
    const c = (v: any) => Math.max(0, Math.min(45, Number(v) || 0)); const l = c(opts.left), r = c(opts.right), tp = c(opts.top), b = c(opts.bottom);
    x = Math.round((W * l) / 100); y = Math.round((H * tp) / 100); w = Math.round(W * (1 - (l + r) / 100)); h = Math.round(H * (1 - (tp + b) / 100));
  } else {
    const [a, bb] = String(opts.ratio).split(':').map(Number); if (a && bb) { const tg = a / bb; if (W / H > tg) w = Math.round(H * tg); else h = Math.round(W / tg);
      const ax = opts.anchor === 'start' ? 0 : opts.anchor === 'end' ? 1 : 0.5; x = Math.round((W - w) * ax); y = Math.round((H - h) * ax); }
  }
  const pct = { l: (x / W) * 100, t: (y / H) * 100, r: ((W - x - w) / W) * 100, b: ((H - y - h) / H) * 100 };
  const commit = (n: { l: number; t: number; r: number; b: number }) => setOpts?.({ ...opts, ratio: 'custom', left: +n.l.toFixed(1), top: +n.t.toFixed(1), right: +n.r.toFixed(1), bottom: +n.b.toFixed(1) });
  const down = (mode: string) => (e: React.PointerEvent) => { if (!setOpts) return; e.preventDefault(); e.stopPropagation(); (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); drag.current = { mode, sx: e.clientX, sy: e.clientY, p: { ...pct } }; };
  const move = (e: React.PointerEvent) => {
    const d = drag.current; const r = box.current?.getBoundingClientRect(); if (!d || !r) return;
    const dx = ((e.clientX - d.sx) / r.width) * 100, dy = ((e.clientY - d.sy) / r.height) * 100; const o = { ...d.p }; const cl = (v: number) => Math.max(0, Math.min(45, v));
    if (d.mode === 'move') { const mx = Math.max(-o.l, Math.min(o.r, dx)), my = Math.max(-o.t, Math.min(o.b, dy)); o.l += mx; o.r -= mx; o.t += my; o.b -= my; }
    else { if (d.mode.includes('w')) o.l = cl(o.l + dx); if (d.mode.includes('e')) o.r = cl(o.r - dx); if (d.mode.includes('n')) o.t = cl(o.t + dy); if (d.mode.includes('s')) o.b = cl(o.b - dy); }
    commit({ l: cl(o.l), t: cl(o.t), r: cl(o.r), b: cl(o.b) });
  };
  const up = () => { drag.current = null; };
  const key = (e: React.KeyboardEvent) => {
    if (!setOpts || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return; e.preventDefault();
    const st = e.altKey ? 0.2 : 1, dx = e.key === 'ArrowRight' ? st : e.key === 'ArrowLeft' ? -st : 0, dy = e.key === 'ArrowDown' ? st : e.key === 'ArrowUp' ? -st : 0; const cl = (v: number) => Math.max(0, Math.min(45, v)); const o = { l: pct.l, t: pct.t, r: pct.r, b: pct.b };
    if (e.shiftKey) { o.r = cl(o.r - dx); o.b = cl(o.b - dy); } else { const mx = Math.max(-o.l, Math.min(o.r, dx)), my = Math.max(-o.t, Math.min(o.b, dy)); o.l += mx; o.r -= mx; o.t += my; o.b -= my; }
    commit({ l: cl(o.l), t: cl(o.t), r: cl(o.r), b: cl(o.b) });
  };
  const p = (n: number, d: number) => `${(n / d) * 100}%`;
  return (<div className="mt-4" aria-live="polite">
    <p className="text-xs uppercase tracking-widest opacity-70 mb-2">{t('Crop preview')}</p>
    <div ref={box} className="relative rounded-xl overflow-hidden border touch-none select-none" onPointerMove={move} onPointerUp={up} onPointerCancel={up} style={{ width: `min(100%, ${Math.min(22, (20 * W) / H).toFixed(2)}rem)`, borderColor: 'rgba(128,128,128,.4)' }}>
      <img src={url} alt={t('Crop preview')} className="block" style={{ width: '100%', aspectRatio: `${W} / ${H}`, height: 'auto' }} />
      <div className="absolute" onPointerDown={down('move')} data-crop-frame="1" tabIndex={setOpts ? 0 : undefined} role={setOpts ? 'group' : undefined} aria-label={setOpts ? t('Crop frame. Arrow keys move it, Shift plus arrows resize it.') : undefined} onKeyDown={key} style={{ cursor: setOpts ? 'move' : undefined, left: p(x, W), top: p(y, H), width: p(w, W), height: p(h, H), outline: '2px solid #fff', boxShadow: '0 0 0 9999px rgba(0,0,0,.55)' }}>
        <span className="absolute inset-0 pointer-events-none" style={{ outline: '1px dashed #e0643f' }} />
        {setOpts && (['nw', 'ne', 'sw', 'se'] as const).map((k) => <span key={k} data-crop-handle={k} onPointerDown={down(k)} className="absolute" style={{ width: 22, height: 22, [k.includes('n') ? 'top' : 'bottom']: 2, [k.includes('w') ? 'left' : 'right']: 2, cursor: k === 'nw' || k === 'se' ? 'nwse-resize' : 'nesw-resize', background: '#fff', border: '2px solid #e0643f', borderRadius: 6, boxShadow: '0 1px 4px rgba(0,0,0,.4)' }} />)}</div></div>
    <p dir="ltr" className="text-sm mt-2">{W}×{H} → <b>{w}×{h}</b></p>
    {setOpts && <p className="text-xs opacity-70 mt-1">{t('Drag the frame to move it, drag a corner to resize. This switches to custom trim.')} {t('Keyboard: click the frame, then arrow keys move it and Shift plus arrows resize it.')}</p>}
    {files.length > 1 && <p className="text-xs opacity-70 mt-1">{t('Showing the first image. The same crop is applied to every image.')}</p>}</div>);
};
