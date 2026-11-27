import React, { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import { loadImage, drawImage, canvasBlob } from '../lib/util';
/** Live preview for Watermark image: runs the real tool on a small copy of the first picture. */
export const WatermarkPreview: React.FC<{ files: File[]; opts: any; ar: boolean }> = ({ files, opts, ar }) => {
  const [url, setUrl] = useState(''); const [err, setErr] = useState(false);
  useEffect(() => {
    let dead = false; let made = '';
    const t = setTimeout(async () => {
      try {
        const img = await loadImage(files[0]); const k = Math.min(1, 720 / Math.max(img.naturalWidth, img.naturalHeight));
        const cv = drawImage(img, Math.round(img.naturalWidth * k), Math.round(img.naturalHeight * k), '#fff');
        const small = new File([await canvasBlob(cv, 'image/png', 1)], 'preview.png', { type: 'image/png' });
        const { watermarkImages } = await import('../tools/imageTools'); const out = await watermarkImages([small], opts, { progress: () => {} } as any);
        if (dead) return; made = URL.createObjectURL(out[0].blob); setUrl(made); setErr(false);
      } catch { if (!dead) { setErr(true); setUrl(''); } }
    }, 300);
    return () => { dead = true; clearTimeout(t); if (made) setTimeout(() => URL.revokeObjectURL(made), 2000); };
  }, [files, opts.text, opts.size, opts.opacity, opts.position, opts.color]);
  return (<div className="mt-3 text-sm" aria-live="polite">
    <p className="text-xs uppercase tracking-widest opacity-70 flex items-center gap-2 mb-2"><Eye size={13} aria-hidden="true" /> {ar ? 'معاينة العلامة' : 'Live preview'}</p>
    {url ? <img src={url} alt={ar ? 'معاينة الصورة مع العلامة المائية' : 'Preview of the picture with the watermark'} className="w-full max-h-72 object-contain rounded-xl border border-[rgba(128,128,128,.35)]" />
      : <p className="text-xs opacity-70">{err ? (ar ? 'اكتب نص العلامة لتظهر المعاينة.' : 'Type the watermark text to see the preview.') : '...'}</p>}
    <p className="text-xs opacity-60 mt-1">{ar ? 'المعاينة بحجم صغير. الملف النهائي بالجودة الكاملة.' : 'Small preview. The final file keeps the full quality.'}</p></div>);
};
