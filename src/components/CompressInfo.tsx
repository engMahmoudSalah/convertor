import React, { useEffect, useState } from 'react';
import { Gauge } from 'lucide-react';
import { loadImage, drawImage, canvasBlob } from '../lib/util';
type Row = { name: string; from: number; to: number | null };
const size = (n: number) => (n >= 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB');
/** Estimates the compressed size of up to 3 files with the same encoder settings the tool uses. */
export const CompressInfo: React.FC<{ files: File[]; opts: any; ar: boolean }> = ({ files, opts, ar }) => {
  const [rows, setRows] = useState<Row[]>([]); const [busy, setBusy] = useState(false);
  useEffect(() => {
    let dead = false; setBusy(true);
    const t = setTimeout(async () => {
      const out: Row[] = [];
      for (const f of files.slice(0, 3)) {
        try {
          if (opts.format === 'keep' && f.type === 'image/png') { out.push({ name: f.name, from: f.size, to: null }); continue; }
          const img = await loadImage(f); const cv = drawImage(img, img.naturalWidth, img.naturalHeight, '#fff');
          const mime = opts.format === 'webp' ? 'image/webp' : 'image/jpeg';
          const b = await canvasBlob(cv, mime, Number(opts.quality) / 100); out.push({ name: f.name, from: f.size, to: b.size });
        } catch { out.push({ name: f.name, from: f.size, to: null }); }
      }
      if (!dead) { setRows(out); setBusy(false); }
    }, 350);
    return () => { dead = true; clearTimeout(t); };
  }, [files, opts.format, opts.quality]);
  if (!rows.length) return null;
  return (<div className="mt-3 text-sm flex flex-col gap-1" aria-live="polite" aria-busy={busy}><p className="text-xs uppercase tracking-widest opacity-70 flex items-center gap-2"><Gauge size={13} aria-hidden="true" /> {ar ? 'الحجم المتوقع' : 'Estimated size'}</p>
    {rows.map((r) => { const ok = r.to !== null && r.to < r.from; return <p key={r.name} className={`flex flex-wrap gap-x-2 ${busy ? 'opacity-60' : ''}`}><span className="opacity-70 truncate max-w-[10rem]">{r.name}</span><span dir="ltr">{size(r.from)}</span><span aria-hidden="true">→</span>{ok ? <span className="font-semibold"><span dir="ltr">{size(r.to!)}</span> ({ar ? <>أصغر بنسبة <span dir="ltr">{Math.round((1 - r.to! / r.from) * 100)}%</span></> : <span dir="ltr">{Math.round((1 - r.to! / r.from) * 100)}% smaller</span>})</span> : <span className="font-semibold">{ar ? 'يبقى كما هو (لا يوجد توفير)' : 'kept as is (no gain)'}</span>}<span aria-hidden="true" className="basis-full h-1.5 rounded-full overflow-hidden mt-1" style={{ background: 'rgba(128,128,128,.25)' }}><span className="block h-full rounded-full" style={{ width: (ok ? Math.max(4, Math.round((r.to! / r.from) * 100)) : 100) + '%', background: ok ? '#9bbf1a' : '#888', transition: 'width .3s' }} /></span></p>; })}
    {files.length > 3 && <p className="text-xs opacity-70">{ar ? `و${files.length - 3} ملفات أخرى` : `and ${files.length - 3} more`}</p>}</div>);
};
