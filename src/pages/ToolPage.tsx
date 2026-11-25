import { SlidersHorizontal } from 'lucide-react';
import { useT } from '../lib/i18n';
import { Confetti } from '../components/Confetti';
import { PageArt } from '../components/PageArt';
import { addRecent, takePending, guessType } from '../lib/handoff';
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUp, ArrowDown, Download, Loader2, X, UploadCloud, ShieldCheck } from 'lucide-react';
import { getTool } from '../tools/registry';
import { fmtSize } from '../lib/util';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { Thumbs } from '../components/Thumbs';
import { FileCards, PageGrid, BackgroundPreview, PageFrame, usePreviewMode, compressPages } from '../components/PreviewDock';
import type { Out } from '../tools/types';

const save = (b: Blob, name: string) => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); };
const field = 'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400';

export const ToolPage: React.FC = () => {
  const { t: tr } = useT(); const { id } = useParams(); const tool = getTool(id); const { disabled, refresh } = useAuth(); const [upgrade, setUpgrade] = useState(false);
  const [files, setFiles] = useState<File[]>([]); const [outs, setOuts] = useState<Out[]>([]);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [prog, setProg] = useState('');
  const [opts, setOpts] = useState<Record<string, any>>({}); const [sel, setSel] = useState<Set<number>>(new Set()); const mode = tool ? usePreviewMode(tool) : 'first';
  React.useEffect(() => { setFiles([]); setOuts([]); setErr(''); setSel(new Set()); setOpts(Object.fromEntries((tool?.options ?? []).map((o) => [o.key, o.default]))); }, [id]);
  const onDrop = useCallback((acc: File[]) => {
    if (!tool) return;
    const ok = acc.filter((f) => tool.accept.includes(guessType(f)) || (f.type === '' && tool.accept[0] === 'application/pdf' && /\.pdf$/i.test(f.name)));
    if (ok.length < acc.length) setErr('Some files were skipped: wrong type for this tool.'); else setErr('');
    setOuts([]); setFiles((p) => (tool.multiple ? [...p, ...ok] : ok.slice(0, 1)));
  }, [tool]);
  React.useEffect(() => { if (tool) { addRecent(tool.id); const p = takePending(); if (p.length) onDrop(p); } }, [id]);
  const dz = useDropzone({ onDrop, multiple: tool?.multiple });
  if (!tool) return <div className="pt-28 text-center">Tool not found. <Link className="text-violet-300" to="/">Back home</Link></div>;
  const Icon = tool.icon; const off = disabled.includes(tool.id);
  const move = (i: number, d: number) => setFiles((f) => { const n = [...f]; [n[i], n[i + d]] = [n[i + d], n[i]]; return n; });
  const run = async () => {
    setBusy(true); setErr(''); setOuts([]); setUpgrade(false);
    const bytes = files.reduce((a, f) => a + f.size, 0); const t0 = Date.now();
    const q = await api('/usage/consume', { tool: tool.id, bytes });
    if (q._status >= 400 && q._status !== 404) { setErr(q.error ?? 'Not allowed'); setUpgrade(!!q.upgrade); setBusy(false); return; }
    try { setOuts(await tool.run(files, opts, { progress: (d, t, m) => setProg(m ?? `${d + 1} / ${t}`) })); api('/history', { tool: tool.id, files: files.length, bytes, ms: Date.now() - t0 }).then(refresh); }
    catch (e: any) { setErr(e?.message ?? 'Something went wrong'); }
    setBusy(false); setProg('');
  };
  const need = tool.minFiles ?? 1;
  return (
    <div className="pt-24 pb-16 max-w-7xl mx-auto px-4">
      <Link to="/" className="text-sm text-gray-400 hover:text-white inline-flex items-center gap-1 mb-4"><ArrowLeft size={14} className="rtl:rotate-180" /> {tr('All tools')}</Link>
      <div className="flex items-center gap-3 mb-2"><div className="p-3 rounded-md border-[1.5px] border-current text-[#b4391f] dark:text-[#f08a6b]"><Icon /></div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-blue-400 text-transparent bg-clip-text">{tr(tool.title)}</h1><PageArt kind={tool.accept.some((a) => a.startsWith('image/')) ? 'images' : tool.accept.every((a) => a !== 'application/pdf') ? 'documents' : 'pdf'} className="ml-auto w-28 hidden md:block -my-3" /></div>
      <p className="text-gray-400 mb-2">{tr(tool.desc)}</p>
      <p className="text-xs text-emerald-300/80 flex items-center gap-1 mb-6"><ShieldCheck size={13} /> {tr('Runs in your browser. Your files are not uploaded.')}</p>
      <div className="grid lg:grid-cols-2 gap-8 items-start"><div>
      <div {...dz.getRootProps()} className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition ${dz.isDragActive ? 'border-violet-400 bg-violet-500/10' : 'border-white/20 hover:border-violet-400/60 bg-white/5'}`}>
        <input {...dz.getInputProps()} /><UploadCloud className="mx-auto mb-2 text-violet-300" size={36} />
        <p>{tr(tool.multiple ? 'Drop files here or click to choose' : 'Drop a file here or click to choose')}</p>
      </div>
      {files.length > 0 && <ul className="mt-4 space-y-2">{files.map((f, i) => (
        <li key={i} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm"><span className="file-badge shrink-0 w-9 text-center text-[10px] font-extrabold tracking-wider rounded-md bg-gradient-to-br from-violet-500/40 to-blue-500/40 py-1">{(f.name.split('.').pop() || 'FILE').slice(0, 4).toUpperCase()}</span>
          <span className="flex-1 truncate">{f.name}</span><span dir="ltr" className="text-gray-400">{fmtSize(f.size)}</span>
          {tool.multiple && <><button disabled={i === 0} onClick={() => move(i, -1)} className="p-1 disabled:opacity-30"><ArrowUp size={14} /></button>
            <button disabled={i === files.length - 1} onClick={() => move(i, 1)} className="p-1 disabled:opacity-30"><ArrowDown size={14} /></button></>}
          <button onClick={() => setFiles(files.filter((_, j) => j !== i))} className="p-1 text-red-300"><X size={14} /></button></li>))}</ul>}
      {files.length > 0 && tool.options && <div className="mt-5 rounded-2xl bg-white/5 border border-white/10 p-4"><p className="text-xs uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2"><SlidersHorizontal size={13} /> {tr('Options')}</p><div className="grid sm:grid-cols-2 gap-4">{tool.options.filter((o) => !(tool.id === 'image-background' && ((o.key === 'tol' && !(opts.mode === 'remove' || opts.removeOld)) || (o.key === 'removeOld' && opts.mode === 'remove') || (o.key === 'color' && opts.mode !== 'color') || (o.key === 'bgfile' && opts.mode !== 'image') || (o.key === 'format' && opts.mode === 'remove'))) && !(tool.id === 'split-pdf' && ((o.key === 'ranges' && opts.mode !== 'ranges') || (o.key === 'every' && opts.mode !== 'every'))) && !(tool.id === 'resize-image' && ((o.key === 'percent' && opts.mode !== 'percent') || (['width', 'height', 'keep'].includes(o.key) && opts.mode !== 'pixels')))).map((o) => (
        <label key={o.key} className="text-sm text-gray-300 block">{o.type !== 'check' && <span className="block mb-1">{tr(o.label)}</span>}
          {o.type === 'select' ? <><select className={o.options.length <= 4 ? 'sr-only' : field} value={opts[o.key]} onChange={(e) => setOpts({ ...opts, [o.key]: e.target.value })}>{o.options.map((x) => <option className="bg-gray-900" key={x.v} value={x.v}>{tr(x.l)}</option>)}</select>{o.options.length <= 4 && <div className="seg flex rounded-xl border border-white/10 bg-black/10 p-1 gap-1" role="radiogroup">{o.options.map((x) => <button type="button" role="radio" aria-checked={opts[o.key] === x.v} key={x.v} onClick={(e) => { e.preventDefault(); setOpts({ ...opts, [o.key]: x.v }); }} className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium ${opts[o.key] === x.v ? 'bg-violet-500 text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}>{tr(x.l)}</button>)}</div>}</>
            : o.type === 'color' ? <input type="color" className="h-10 w-20 bg-transparent" value={opts[o.key]} onChange={(e) => setOpts({ ...opts, [o.key]: e.target.value })} />
            : o.type === 'file' ? <input type="file" accept="image/*" className="text-xs" onChange={(e) => setOpts({ ...opts, [o.key]: e.target.files?.[0] ?? null })} />
            : o.type === 'check' ? <span className="flex gap-2 items-center"><input type="checkbox" className="accent-violet-500 w-4 h-4" checked={!!opts[o.key]} onChange={(e) => setOpts({ ...opts, [o.key]: e.target.checked })} />{tr(o.label)}</span>
            : <div className="flex items-center gap-3">{o.type === 'number' && (o as any).min !== undefined && (o as any).max !== undefined && (o as any).max - (o as any).min >= 20 && <input type="range" aria-hidden="true" tabIndex={-1} className="flex-1 accent-violet-500" min={(o as any).min} max={(o as any).max} value={opts[o.key] ?? (o as any).min} onChange={(e) => setOpts({ ...opts, [o.key]: Number(e.target.value) })} />}<input className={o.type === 'number' ? field + ' !w-24 shrink-0' : field} type={o.type} min={(o as any).min} max={(o as any).max} value={opts[o.key] ?? ''} onChange={(e) => setOpts({ ...opts, [o.key]: o.type === 'number' ? Number(e.target.value) : e.target.value })} /></div>}
        </label>))}</div></div>}
      {upgrade && <p className="mt-2 text-sm"><Link className="text-violet-300 underline" to="/pricing">See plans</Link> or <Link className="text-violet-300 underline" to="/signup">create a free account</Link> for higher limits.</p>}
      {err && <p className="mt-4 text-red-300 bg-red-500/10 border border-red-400/30 rounded-lg p-3 text-sm">{err}</p>}
      {off && <p className="mt-4 text-amber-300 text-sm">{tr('This tool is temporarily switched off.')}</p>}
      {files.length > 0 && <button disabled={off || busy || files.length < need} onClick={run} className={`mt-6 w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-violet-500 to-blue-500 disabled:opacity-50 flex items-center justify-center gap-2 relative overflow-hidden ${busy ? 'shimmer' : ''}`}>
        {busy ? <><Loader2 className="animate-spin" size={18} /> {prog || tr('Working...')}</> : files.length < need ? `Add at least ${need} files` : tr(tool.title)}</button>}
      {outs.length > 0 && <div className="mt-6 space-y-2 relative"><Confetti /><h2 className="font-semibold">{tr('Done')}</h2>{(() => { const a = files.reduce((n, f) => n + f.size, 0), b = outs.reduce((n, o) => n + o.blob.size, 0); const d = a ? Math.round((1 - b / a) * 100) : 0; return <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap"><span>{fmtSize(a)}</span><span aria-hidden="true">→</span><span className="text-white font-semibold">{fmtSize(b)}</span>{Math.abs(d) >= 1 && <span className={`px-2 py-0.5 rounded-full font-semibold ${d > 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>{d > 0 ? `-${d}%` : `+${-d}%`}</span>}<span className="basis-full order-last h-2 rounded-full bg-white/10 overflow-hidden flex" role="img" aria-label="Output size compared with input"><i className={`block h-full rounded-full ${d > 0 ? 'bg-emerald-400' : 'bg-amber-400'}`} style={{ width: `${Math.max(4, Math.min(100, a ? (b / a) * 100 : 100))}%`, transition: 'width .8s ease' }} /></span><button onClick={() => { setOuts([]); setFiles([]); }} className="ml-auto px-3 py-1 rounded-lg border border-white/20 hover:bg-white/10 text-gray-300">{tr('Start over')}</button></div>; })()}
        {outs.map((o, i) => <div key={i} className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-400/30 rounded-lg px-3 py-2 text-sm">
          <span className="flex-1 truncate">{o.name}{o.note && <span className="block text-xs text-gray-400">{o.note}</span>}</span><span dir="ltr" className="text-gray-400">{fmtSize(o.blob.size)}</span>
          <button onClick={() => save(o.blob, o.name)} className="p-2 rounded-lg bg-emerald-500/30"><Download size={16} /></button></div>)}
        {outs.length > 1 && <button onClick={async () => save(await (await import('../tools/pdfTools')).zipOuts(outs), 'magic-convertor.zip')} className="w-full py-2 rounded-lg border border-white/20 text-sm">Download all as ZIP</button>}</div>}
    </div>
      <aside className="lg:sticky lg:top-24 rounded-2xl bg-white/5 border border-white/10 p-4 min-h-[320px] lg:max-h-[calc(100vh-7rem)] overflow-auto">
        <h2 className="text-sm font-semibold text-gray-300 mb-3">{tr('Live preview')}</h2>
        {files.length === 0 ? <p className="text-sm text-gray-500">{tr('Add a file to see it here. Your options update this view as you change them.')}</p> : <>
          {mode === 'files' && <FileCards files={files} setFiles={setFiles} />}
          {mode === 'frame' && <div className="space-y-4"><PageFrame file={files[0]} opts={opts} /><FileCards files={files} setFiles={setFiles} /></div>}
          {mode === 'background' && <div className="space-y-4"><BackgroundPreview file={files[0]} opts={opts} />{files.length > 1 && <FileCards files={files} setFiles={setFiles} />}</div>}
          {(mode === 'select' || mode === 'sort') && <PageGrid file={files[0]} mode={mode} selected={sel} onSelect={(x) => { setSel(x); setOpts((o) => ({ ...o, pages: compressPages(x) })); }} onOrder={(o) => setOpts((p) => ({ ...p, order: o.join(',') }))} />}
          {mode === 'first' && <Thumbs blobs={files.slice(0, 4)} />}
          {outs.length > 0 && <div className="mt-5 pt-4 border-t border-white/10"><Thumbs blobs={outs.slice(0, 4).map((o) => o.blob)} label="Result" /></div>}</>}
      </aside></div>
    </div>);
};
