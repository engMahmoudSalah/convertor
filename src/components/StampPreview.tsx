import React, { useEffect, useRef, useState } from 'react';

export const hasStampPreview = (id: string) => id === 'page-numbers' || id === 'watermark-pdf';
/** Page 1 drawn with the page number or watermark exactly where the tool will put it (same positions and sizes as the PDF code). */
export const StampPreview: React.FC<{ id: string; file?: File; opts: Record<string, any>; t: (s: string) => string }> = ({ id, file, opts, t }) => {
  const cv = useRef<HTMLCanvasElement>(null);
  const [base, setBase] = useState<{ img: HTMLCanvasElement; n: number } | null>(null);
  useEffect(() => {
    setBase(null); if (!file || !(file.type === 'application/pdf' || /\.pdf$/i.test(file.name))) return; let dead = false;
    (async () => { try { const { openPdf, renderPage } = await import('../lib/pdfjs'); const doc = await openPdf(file); const img = await renderPage(doc, 1, 1); if (!dead) setBase({ img, n: doc.numPages }); } catch { /* encrypted or unreadable: no preview */ } })();
    return () => { dead = true; };
  }, [file]);
  useEffect(() => {
    const c = cv.current; if (!c || !base) return; const W = base.img.width, H = base.img.height; c.width = W; c.height = H;
    const g = c.getContext('2d'); if (!g) return; g.drawImage(base.img, 0, 0);
    if (id === 'page-numbers') {
      const start = Number(opts.start ?? 1) || 0; const txt = String(opts.format ?? 'Page {n} of {total}').replace('{n}', String(start)).replace('{total}', String(base.n + start - 1));
      g.font = '11px Helvetica, Arial, sans-serif'; g.fillStyle = '#333'; const w = g.measureText(txt).width; const [v, h] = String(opts.position ?? 'bottom-center').split('-');
      const x = h === 'left' ? 30 : h === 'right' ? W - 30 - w : (W - w) / 2; const y = v === 'top' ? H - (H - 30) : H - 22;
      g.fillStyle = 'rgba(224,100,63,.2)'; g.fillRect(x - 4, y - 12, w + 8, 17); g.fillStyle = '#222'; g.fillText(txt, x, y);
    } else {
      const text = String(opts.text ?? '').replace(/[^\x20-\x7e]/g, '?') || 'WATERMARK'; const size = Number(opts.size) || 60; const ang = ((Number(opts.angle) || 0) * Math.PI) / 180;
      g.font = `bold ${size}px Helvetica, Arial, sans-serif`; const w = g.measureText(text).width;
      g.save(); g.globalAlpha = Math.max(0.05, Math.min(1, Number(opts.opacity) || 0.25)); g.fillStyle = '#808080';
      g.translate(W / 2 - (w / 2) * Math.cos(ang), H / 2 + (w / 2) * Math.sin(ang)); g.rotate(-ang); g.fillText(text, 0, 0); g.restore();
    }
  }, [base, id, opts.position, opts.format, opts.start, opts.text, opts.size, opts.opacity, opts.angle]);
  if (!base) return null;
  return (<div><p className="text-xs uppercase tracking-widest opacity-70 mb-2">{id === 'page-numbers' ? t('Page 1 with the number') : t('Page 1 with the watermark')}</p>
    <canvas ref={cv} role="img" aria-label={t('Preview of page 1')} className="block rounded-lg shadow-lg mx-auto max-w-full h-auto" style={{ background: '#fff', maxHeight: '28rem', width: 'auto' }} />
    <p className="text-xs opacity-70 mt-2 text-center">{t('Shown on page 1 of')} {base.n}. {t('Position and size match the saved file.')}</p></div>);
};
