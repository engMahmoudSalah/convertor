import { fitStampSize } from '../lib/fitStamp';
import React, { useEffect, useRef, useState } from 'react';

export const hasStampPreview = (id: string) => id === 'page-numbers' || id === 'watermark-pdf';
/** Page 1 drawn with the page number or watermark exactly where the tool will put it (same positions and sizes as the PDF code). */
export const StampPreview: React.FC<{ id: string; file?: File; opts: Record<string, any>; t: (s: string) => string }> = ({ id, file, opts, t }) => {
  const cv = useRef<HTMLCanvasElement>(null);
  const [base, setBase] = useState<{ img: HTMLCanvasElement; n: number } | null>(null); const [shrunk, setShrunk] = useState(false);
  useEffect(() => {
    setBase(null); if (!file || !(file.type === 'application/pdf' || /\.pdf$/i.test(file.name))) return; let dead = false;
    (async () => { try { const { openPdf, renderPage } = await import('../lib/pdfjs'); const doc = await openPdf(file); const img = await renderPage(doc, 1, 1); if (!dead) setBase({ img, n: doc.numPages }); } catch { /* encrypted or unreadable: no preview */ } })();
    return () => { dead = true; };
  }, [file]);
  useEffect(() => {
    const c = cv.current; if (!c || !base) return; const W = base.img.width, H = base.img.height; c.width = W; c.height = H;
    const g = c.getContext('2d'); if (!g) return; g.drawImage(base.img, 0, 0); g.direction = 'ltr'; g.textAlign = 'left';
    setShrunk(false);
    if (id === 'page-numbers') {
      const start = Number(opts.start ?? 1) || 0; const txt = String(opts.format ?? 'Page {n} of {total}').replace('{n}', String(start)).replace('{total}', String(base.n + start - 1));
      g.font = '11px Helvetica, Arial, sans-serif'; g.fillStyle = '#333'; const w = g.measureText(txt).width; const [v, h] = String(opts.position ?? 'bottom-center').split('-');
      const x = h === 'left' ? 30 : h === 'right' ? W - 30 - w : (W - w) / 2; const y = v === 'top' ? H - (H - 30) : H - 22;
      g.fillStyle = 'rgba(224,100,63,.2)'; g.fillRect(x - 4, y - 12, w + 8, 17); g.fillStyle = '#222'; g.fillText(txt, x, y);
    } else {
      const text = String(opts.text ?? '').replace(/[^\x20-\x7e]/g, '?') || 'WATERMARK'; const want = Number(opts.size) || 60; const ang = ((Number(opts.angle) || 0) * Math.PI) / 180;
      const wAt = (z: number) => { g.font = `bold ${z}px Helvetica, Arial, sans-serif`; return g.measureText(text).width; };
      const size = fitStampSize(wAt, want, Number(opts.angle) || 0, W, H); setShrunk(size < want - 0.5); g.font = `bold ${size}px Helvetica, Arial, sans-serif`; const w = g.measureText(text).width;
      g.save(); g.globalAlpha = Math.max(0.05, Math.min(1, Number(opts.opacity) || 0.25)); g.fillStyle = '#808080';
      g.translate(W / 2 - (w / 2) * Math.cos(ang), H / 2 + (w / 2) * Math.sin(ang)); g.rotate(-ang); g.fillText(text, 0, 0); g.restore();
    }
  }, [base, id, opts.position, opts.format, opts.start, opts.text, opts.size, opts.opacity, opts.angle]);
  if (!base) return null;
  return (<div><p className="text-xs uppercase tracking-widest opacity-70 mb-2">{id === 'page-numbers' ? t('Page 1 with the number') : t('Page 1 with the watermark')}</p>
    <canvas ref={cv} role="img" aria-label={t('Preview of page 1')} className="block rounded-lg shadow-lg mx-auto max-w-full h-auto" style={{ background: '#fff', maxHeight: '28rem', width: 'auto' }} />
    <p className="text-xs opacity-70 mt-2 text-center">{t('Shown on page 1 of')} {base.n}. {t('Position and size match the saved file.')}</p>{shrunk && <p className="text-xs mt-1 text-center" style={{ color: '#d97706' }}>{t('The text is smaller than the size you set so it fits the page.')}</p>}</div>);
};

export const hasNupPreview = (id: string) => id === 'nup-pdf';
/** First sheet of "pages per sheet": same grid, margins, gaps and fit as the PDF code. */
export const NupPreview: React.FC<{ file?: File; opts: Record<string, any>; t: (s: string) => string }> = ({ file, opts, t }) => {
  const cv = useRef<HTMLCanvasElement>(null); const K = 0.7;
  const [pages, setPages] = useState<{ imgs: HTMLCanvasElement[]; n: number } | null>(null);
  useEffect(() => {
    setPages(null); if (!file || !(file.type === 'application/pdf' || /\.pdf$/i.test(file.name))) return; let dead = false;
    (async () => { try { const { openPdf, renderPage } = await import('../lib/pdfjs'); const doc = await openPdf(file); const imgs: HTMLCanvasElement[] = [];
      for (let i = 1; i <= Math.min(9, doc.numPages); i++) imgs.push(await renderPage(doc, i, 0.6)); if (!dead) setPages({ imgs, n: doc.numPages }); } catch { /* unreadable */ } })();
    return () => { dead = true; };
  }, [file]);
  useEffect(() => {
    const c = cv.current; if (!c || !pages) return; const per = Number(opts.per) || 2; const grid: Record<number, [number, number]> = { 2: [2, 1], 4: [2, 2], 6: [3, 2], 9: [3, 3] }; const [cols, rows] = grid[per] ?? [2, 1];
    const land = opts.layout === 'landscape' || ((opts.layout ?? 'auto') === 'auto' && cols > rows); const W = land ? 842 : 595, H = land ? 595 : 842; const m = 18, gap = 8;
    const cw = (W - 2 * m - gap * (cols - 1)) / cols, ch = (H - 2 * m - gap * (rows - 1)) / rows;
    c.width = W * K; c.height = H * K; const g = c.getContext('2d'); if (!g) return; g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
    pages.imgs.slice(0, per).forEach((im, k) => {
      const pw = im.width / 0.6, ph = im.height / 0.6; const s = Math.min(cw / pw, ch / ph); const w = pw * s, h = ph * s; const col = k % cols, row = Math.floor(k / cols);
      const x = m + col * (cw + gap) + (cw - w) / 2, y = m + row * (ch + gap) + (ch - h) / 2; g.drawImage(im, x * K, y * K, w * K, h * K);
      if (opts.border !== false) { g.strokeStyle = 'rgb(153,153,153)'; g.lineWidth = 0.5 * K + 0.5; g.strokeRect(x * K, y * K, w * K, h * K); }
    });
  }, [pages, opts.per, opts.layout, opts.border]);
  if (!pages) return null; const per = Number(opts.per) || 2; const sheets = Math.ceil(pages.n / per);
  return (<div><p className="text-xs uppercase tracking-widest opacity-70 mb-2">{t('First sheet')}</p>
    <canvas ref={cv} role="img" aria-label={t('Preview of the first sheet')} className="block rounded-lg shadow-lg mx-auto max-w-full h-auto" style={{ background: '#fff', maxHeight: '28rem', width: 'auto' }} />
    <p className="text-xs opacity-70 mt-2 text-center">{t('Sheets in the result')}: <b dir="ltr">{sheets}</b></p></div>);
};

export const hasPdfImgPreview = (id: string) => id === 'pdf-to-images';
const kb = (n: number) => (n >= 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB');
/** Renders page 1 with the same DPI, format and quality (0.9) as the tool and shows pixel size, file size and a total estimate. */
export const PdfImgPreview: React.FC<{ file?: File; opts: Record<string, any>; t: (s: string) => string }> = ({ file, opts, t }) => {
  const [r, setR] = useState<{ url: string; w: number; h: number; size: number; n: number } | null>(null); const [busy, setBusy] = useState(false);
  const fmt = opts.format === 'png' ? 'image/png' : opts.format === 'webp' ? 'image/webp' : 'image/jpeg'; const dpi = Math.max(72, Math.min(300, Number(opts.dpi) || 150));
  useEffect(() => {
    if (!file || !(file.type === 'application/pdf' || /\.pdf$/i.test(file.name))) { setR(null); return; } let dead = false; let url = '';
    const id = setTimeout(async () => { setBusy(true); try { const { openPdf, renderPage } = await import('../lib/pdfjs'); const doc = await openPdf(file); const cv = await renderPage(doc, 1, dpi / 72);
      const blob: Blob = await new Promise((res) => cv.toBlob((x) => res(x!), fmt, 0.9)); if (dead) return; url = URL.createObjectURL(blob); setR({ url, w: cv.width, h: cv.height, size: blob.size, n: doc.numPages }); } catch { /* unreadable */ } if (!dead) setBusy(false); }, 350);
    return () => { dead = true; clearTimeout(id); if (url) URL.revokeObjectURL(url); };
  }, [file, fmt, dpi]);
  if (!r) return null;
  return (<div aria-live="polite"><p className="text-xs uppercase tracking-widest opacity-70 mb-2">{t('Page 1 as an image')}</p>
    <div className="flex gap-4 items-start flex-wrap"><img src={r.url} alt={t('Preview of page 1')} className="rounded-lg shadow-lg max-w-full" style={{ maxHeight: '18rem', background: '#fff', opacity: busy ? 0.6 : 1 }} />
      <dl className="text-sm space-y-1" dir="auto"><div><dt className="text-xs opacity-70">{t('Pixels')}</dt><dd dir="ltr"><b>{r.w} × {r.h}</b></dd></div>
        <div><dt className="text-xs opacity-70">{t('This page')}</dt><dd dir="ltr"><b>{kb(r.size)}</b></dd></div>
        <div><dt className="text-xs opacity-70">{t('Estimate for all pages')}</dt><dd dir="ltr"><b>~{kb(r.size * r.n)}</b> · {r.n} {t('pages')}</dd></div></dl></div></div>);
};

export const hasSizePreview = (id: string) => id === 'page-size';
/** Page 1 fitted onto the chosen sheet: same sizes, orientation, margin and centring as the PDF code. */
export const SizePreview: React.FC<{ file?: File; opts: Record<string, any>; t: (s: string) => string }> = ({ file, opts, t }) => {
  const cv = useRef<HTMLCanvasElement>(null); const K = 0.7;
  const [pg, setPg] = useState<{ im: HTMLCanvasElement; n: number } | null>(null);
  useEffect(() => {
    setPg(null); if (!file || !(file.type === 'application/pdf' || /\.pdf$/i.test(file.name))) return; let dead = false;
    (async () => { try { const { openPdf, renderPage } = await import('../lib/pdfjs'); const doc = await openPdf(file); const im = await renderPage(doc, 1, 1); if (!dead) setPg({ im, n: doc.numPages }); } catch { /* unreadable */ } })();
    return () => { dead = true; };
  }, [file]);
  const sizes: Record<string, [number, number]> = { a4: [595.28, 841.89], a3: [841.89, 1190.55], a5: [419.53, 595.28], letter: [612, 792], legal: [612, 1008] };
  const key = sizes[opts.size] ? String(opts.size) : 'a4'; const margin = Math.max(0, Math.min(100, Number(opts.margin) || 0));
  let [W, H] = sizes[key]; const pw = pg ? pg.im.width : 1, ph = pg ? pg.im.height : 1; const orient = opts.orient ?? 'auto';
  if (orient === 'landscape' || (orient === 'auto' && pw > ph)) [W, H] = [H, W];
  const sc = Math.min((W - 2 * margin) / pw, (H - 2 * margin) / ph);
  useEffect(() => {
    const c = cv.current; if (!c || !pg) return; c.width = W * K; c.height = H * K; const g = c.getContext('2d'); if (!g) return;
    g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); const dw = pw * sc, dh = ph * sc; const x = (W - dw) / 2, y = (H - dh) / 2;
    g.drawImage(pg.im, x * K, y * K, dw * K, dh * K); g.strokeStyle = 'rgb(153,153,153)'; g.lineWidth = 0.5; g.strokeRect(x * K, y * K, dw * K, dh * K);
    if (margin > 0) { g.setLineDash([4, 3]); g.strokeStyle = 'rgb(200,80,60)'; g.strokeRect(margin * K, margin * K, (W - 2 * margin) * K, (H - 2 * margin) * K); }
  }, [pg, W, H, margin, sc, pw, ph]);
  if (!pg) return null;
  return (<div><p className="text-xs uppercase tracking-widest opacity-70 mb-2">{t('First page on the new size')}</p>
    <canvas ref={cv} role="img" aria-label={t('First page on the new size')} className="block rounded-lg shadow-lg mx-auto max-w-full h-auto" style={{ background: '#fff', maxHeight: '28rem', width: 'auto' }} />
    <p className="text-xs opacity-70 mt-2 text-center" dir="ltr">{key.toUpperCase()} · {Math.round(W)}×{Math.round(H)} pt · {Math.round(sc * 100)}%</p></div>);
};
