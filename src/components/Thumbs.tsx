import React, { useEffect, useState } from 'react';
type T = { url: string; kind: 'img' | 'pdf'; name?: string; pages?: number };
export const Thumbs: React.FC<{ blobs: Blob[]; label?: string }> = ({ blobs, label }) => {
  const [items, setItems] = useState<T[]>([]);
  useEffect(() => {
    let dead = false; const urls: string[] = [];
    (async () => {
      const out: T[] = [];
      for (const b of blobs) {
        const isPdf = b.type === 'application/pdf' || /\.pdf$/i.test((b as File).name ?? '');
        if (b.type.startsWith('image/') && b.type !== 'image/bmp') { const u = URL.createObjectURL(b); urls.push(u); out.push({ url: u, kind: 'img', name: (b as File).name }); }
        else if (isPdf) {
          try {
            const { openPdf, renderPage } = await import('../lib/pdfjs'); const doc = await openPdf(b);
            const n = Math.min(doc.numPages, 4 - 0);
            for (let i = 1; i <= n; i++) { const c = await renderPage(doc, i, 0.35); out.push({ url: c.toDataURL('image/jpeg', 0.7), kind: 'pdf', name: `${(b as File).name ?? 'PDF'} p${i}/${doc.numPages}` }); }
          } catch { /* encrypted or unreadable: no preview */ }
        }
      }
      if (!dead) setItems(out.slice(0, 8));
    })();
    return () => { dead = true; urls.forEach(URL.revokeObjectURL); };
  }, [blobs.map((b) => `${(b as File).name}${b.size}`).join('|')]);
  if (!items.length) return null;
  return (<div>{label && <h3 className="text-sm text-gray-400 mb-2">{label}</h3>}
    <div className="flex gap-3 overflow-x-auto pb-2">{items.map((t, i) => (
      <figure key={i} className="shrink-0 w-32"><img src={t.url} alt={t.name} className="w-32 h-40 object-contain rounded-lg bg-white/90 border border-white/10" />
        <figcaption className="text-[10px] text-gray-400 truncate mt-1">{t.name}</figcaption></figure>))}</div></div>);
};
