import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUp, ArrowDown, Download, Loader2, X, UploadCloud, ShieldCheck } from 'lucide-react';
import { getTool } from '../tools/registry';
import { fmtSize } from '../lib/util';
import { Thumbs } from '../components/Thumbs';
import type { Out } from '../tools/types';

const save = (b: Blob, name: string) => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); };
const field = 'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400';

export const ToolPage: React.FC = () => {
  const { id } = useParams(); const tool = getTool(id);
  const [files, setFiles] = useState<File[]>([]); const [outs, setOuts] = useState<Out[]>([]);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [prog, setProg] = useState('');
  const [opts, setOpts] = useState<Record<string, any>>({});
  React.useEffect(() => { setFiles([]); setOuts([]); setErr(''); setOpts(Object.fromEntries((tool?.options ?? []).map((o) => [o.key, o.default]))); }, [id]);
  const onDrop = useCallback((acc: File[]) => {
    if (!tool) return;
    const ok = acc.filter((f) => tool.accept.includes(f.type) || (f.type === '' && tool.accept[0] === 'application/pdf' && /\.pdf$/i.test(f.name)));
    if (ok.length < acc.length) setErr('Some files were skipped: wrong type for this tool.'); else setErr('');
    setOuts([]); setFiles((p) => (tool.multiple ? [...p, ...ok] : ok.slice(0, 1)));
  }, [tool]);
  const dz = useDropzone({ onDrop, multiple: tool?.multiple });
  if (!tool) return <div className="pt-28 text-center">Tool not found. <Link className="text-violet-300" to="/">Back home</Link></div>;
  const Icon = tool.icon;
  const move = (i: number, d: number) => setFiles((f) => { const n = [...f]; [n[i], n[i + d]] = [n[i + d], n[i]]; return n; });
  const run = async () => {
    setBusy(true); setErr(''); setOuts([]);
    try { setOuts(await tool.run(files, opts, { progress: (d, t, m) => setProg(m ?? `${d + 1} / ${t}`) })); }
    catch (e: any) { setErr(e?.message ?? 'Something went wrong'); }
    setBusy(false); setProg('');
  };
  const need = tool.minFiles ?? 1;
  return (
    <div className="pt-24 pb-16 max-w-3xl mx-auto px-4">
      <Link to="/" className="text-sm text-gray-400 hover:text-white inline-flex items-center gap-1 mb-4"><ArrowLeft size={14} /> All tools</Link>
      <div className="flex items-center gap-3 mb-2"><div className="p-3 rounded-xl bg-gradient-to-br from-violet-500/30 to-blue-500/30"><Icon /></div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-blue-400 text-transparent bg-clip-text">{tool.title}</h1></div>
      <p className="text-gray-400 mb-2">{tool.desc}</p>
      <p className="text-xs text-emerald-300/80 flex items-center gap-1 mb-6"><ShieldCheck size={13} /> Runs in your browser. Your files are not uploaded.</p>
      <div {...dz.getRootProps()} className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition ${dz.isDragActive ? 'border-violet-400 bg-violet-500/10' : 'border-white/20 hover:border-violet-400/60 bg-white/5'}`}>
        <input {...dz.getInputProps()} /><UploadCloud className="mx-auto mb-2 text-violet-300" size={36} />
        <p>{tool.multiple ? 'Drop files here or click to choose' : 'Drop a file here or click to choose'}</p>
      </div>
      {files.length > 0 && <ul className="mt-4 space-y-2">{files.map((f, i) => (
        <li key={i} className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 text-sm">
          <span className="flex-1 truncate">{f.name}</span><span className="text-gray-400">{fmtSize(f.size)}</span>
          {tool.multiple && <><button disabled={i === 0} onClick={() => move(i, -1)} className="p-1 disabled:opacity-30"><ArrowUp size={14} /></button>
            <button disabled={i === files.length - 1} onClick={() => move(i, 1)} className="p-1 disabled:opacity-30"><ArrowDown size={14} /></button></>}
          <button onClick={() => setFiles(files.filter((_, j) => j !== i))} className="p-1 text-red-300"><X size={14} /></button></li>))}</ul>}
      {files.length > 0 && <div className="mt-4"><h2 className="text-sm text-gray-400 mb-2">Preview</h2><Thumbs blobs={files.slice(0, 4)} /></div>}
      {files.length > 0 && tool.options && <div className="mt-5 grid sm:grid-cols-2 gap-4">{tool.options.filter((o) => !(tool.id === 'split-pdf' && ((o.key === 'ranges' && opts.mode !== 'ranges') || (o.key === 'every' && opts.mode !== 'every'))) && !(tool.id === 'resize-image' && ((o.key === 'percent' && opts.mode !== 'percent') || (['width', 'height', 'keep'].includes(o.key) && opts.mode !== 'pixels')))).map((o) => (
        <label key={o.key} className="text-sm text-gray-300 block">{o.type !== 'check' && <span className="block mb-1">{o.label}</span>}
          {o.type === 'select' ? <select className={field} value={opts[o.key]} onChange={(e) => setOpts({ ...opts, [o.key]: e.target.value })}>{o.options.map((x) => <option className="bg-gray-900" key={x.v} value={x.v}>{x.l}</option>)}</select>
            : o.type === 'check' ? <span className="flex gap-2 items-center"><input type="checkbox" checked={!!opts[o.key]} onChange={(e) => setOpts({ ...opts, [o.key]: e.target.checked })} />{o.label}</span>
            : <input className={field} type={o.type} min={(o as any).min} max={(o as any).max} value={opts[o.key] ?? ''} onChange={(e) => setOpts({ ...opts, [o.key]: o.type === 'number' ? Number(e.target.value) : e.target.value })} />}
        </label>))}</div>}
      {err && <p className="mt-4 text-red-300 bg-red-500/10 border border-red-400/30 rounded-lg p-3 text-sm">{err}</p>}
      {files.length > 0 && <button disabled={busy || files.length < need} onClick={run} className="mt-6 w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-violet-500 to-blue-500 disabled:opacity-50 flex items-center justify-center gap-2">
        {busy ? <><Loader2 className="animate-spin" size={18} /> {prog || 'Working...'}</> : files.length < need ? `Add at least ${need} files` : `${tool.title}`}</button>}
      {outs.length > 0 && <div className="mt-6 space-y-2"><h2 className="font-semibold">Done</h2>
        {outs.map((o, i) => <div key={i} className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-400/30 rounded-lg px-3 py-2 text-sm">
          <span className="flex-1 truncate">{o.name}{o.note && <span className="block text-xs text-gray-400">{o.note}</span>}</span><span className="text-gray-400">{fmtSize(o.blob.size)}</span>
          <button onClick={() => save(o.blob, o.name)} className="p-2 rounded-lg bg-emerald-500/30"><Download size={16} /></button></div>)}
        <Thumbs blobs={outs.slice(0, 4).map((o) => o.blob)} label="Result preview" />
        {outs.length > 1 && <button onClick={async () => save(await (await import('../tools/pdfTools')).zipOuts(outs), 'magic-convertor.zip')} className="w-full py-2 rounded-lg border border-white/20 text-sm">Download all as ZIP</button>}</div>}
    </div>);
};
