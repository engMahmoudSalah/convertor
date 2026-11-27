import React, { useEffect, useState } from 'react';

/** Live preview for Crop image: the kept area is bright, the rest is dimmed. Uses the same maths as cropImages. */
export const CropPreview: React.FC<{ files: File[]; opts: any; t: (s: string) => string }> = ({ files, opts, t }) => {
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
  const p = (n: number, d: number) => `${(n / d) * 100}%`;
  return (<div className="mt-4" aria-live="polite">
    <p className="text-xs uppercase tracking-widest opacity-70 mb-2">{t('Crop preview')}</p>
    <div className="relative rounded-xl overflow-hidden border" style={{ width: `min(100%, ${Math.min(22, (20 * W) / H).toFixed(2)}rem)`, borderColor: 'rgba(128,128,128,.4)' }}>
      <img src={url} alt={t('Crop preview')} className="block" style={{ width: '100%', aspectRatio: `${W} / ${H}`, height: 'auto' }} />
      <div className="absolute pointer-events-none" style={{ left: p(x, W), top: p(y, H), width: p(w, W), height: p(h, H), outline: '2px solid #fff', boxShadow: '0 0 0 9999px rgba(0,0,0,.55)' }}>
        <span className="absolute inset-0" style={{ outline: '1px dashed #e0643f' }} /></div></div>
    <p dir="ltr" className="text-sm mt-2">{W}×{H} → <b>{w}×{h}</b></p>
    {files.length > 1 && <p className="text-xs opacity-70 mt-1">{t('Showing the first image. The same crop is applied to every image.')}</p>}</div>);
};
