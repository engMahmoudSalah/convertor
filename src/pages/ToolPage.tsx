import { SlidersHorizontal } from 'lucide-react';
import { useT } from '../lib/i18n';
import { Confetti } from '../components/Confetti';
import { PageArt } from '../components/PageArt';
import { addRecent, takePending, guessType } from '../lib/handoff';
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Link, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowUp, ArrowDown, Download, Loader2, X, UploadCloud, ShieldCheck } from 'lucide-react';
import { getTool } from '../tools/registry';
import { fmtSize } from '../lib/util';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { Thumbs } from '../components/Thumbs';
import { ToolInfo } from '../components/ToolInfo';
import { SplitPreview, CompressPreview, FileCards, PageGrid, BackgroundPreview, PageFrame, usePreviewMode, compressPages } from '../components/PreviewDock';
import type { Out } from '../tools/types';
import { saveOperation } from '../lib/saved';
import { Stepper, AfterView, SizeSummary } from '../components/FlowParts';
import { ArrowRight, Home, Pencil, BookmarkPlus, CheckCircle2, Eye } from 'lucide-react';

const save = (b: Blob, name: string) => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); };
const field = 'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400';

export const ToolPage: React.FC = () => {
  const { t: tr } = useT(); const { id } = useParams(); const tool = getTool(id); const { disabled, refresh } = useAuth(); const [upgrade, setUpgrade] = useState(false); const [stage, setStage] = useState<'upload' | 'board' | 'final'>('upload'); const [tab, setTab] = useState<'before' | 'after'>('before'); const [saved, setSaved] = useState<'' | 'ok' | 'login' | 'busy'>(''); const loc = useLocation(); const { user } = useAuth();
  const [files, setFiles] = useState<File[]>([]); const [outs, setOuts] = useState<Out[]>([]);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [prog, setProg] = useState('');
  const [opts, setOpts] = useState<Record<string, any>>({}); const [sel, setSel] = useState<Set<number>>(new Set()); const mode = tool ? usePreviewMode(tool) : 'first';
  React.useEffect(() => { setFiles([]); setOuts([]); setErr(''); setSel(new Set()); setOpts({ ...Object.fromEntries((tool?.options ?? []).map((o) => [o.key, o.default])), ...((loc.state as any)?.opts ?? {}) }); setStage('upload'); setTab('before'); setSaved(''); }, [id]);
  const onDrop = useCallback((acc: File[]) => {
    if (!tool) return;
    const ok = acc.filter((f) => tool.accept.includes(guessType(f)) || (f.type === '' && tool.accept[0] === 'application/pdf' && /\.pdf$/i.test(f.name)));
    if (ok.length < acc.length) setErr('Some files were skipped: wrong type for this tool.'); else setErr('');
    setOuts([]); setFiles((p) => (tool.multiple ? [...p, ...ok] : ok.slice(0, 1)));
  }, [tool]);
  React.useEffect(() => { if (tool) { addRecent(tool.id); const p = takePending(); if (p.length) { onDrop(p); if ((loc.state as any)?.stage === 'board' && tool.accept.includes(guessType(p[0]))) setStage('board'); } } }, [id]);
  const dz = useDropzone({ onDrop, multiple: tool?.multiple });
  if (!tool) return <div className="pt-28 text-center">Tool not found. <Link className="text-violet-300" to="/">Back home</Link></div>;
  const Icon = tool.icon; const off = disabled.includes(tool.id);
  const move = (i: number, d: number) => setFiles((f) => { const n = [...f]; [n[i], n[i + d]] = [n[i + d], n[i]]; return n; });
  const run = async () => {
    setBusy(true); setErr(''); setOuts([]); setUpgrade(false);
    const bytes = files.reduce((a, f) => a + f.size, 0); const t0 = Date.now();
    const q = await api('/usage/consume', { tool: tool.id, bytes, files: files.length });
    if (q._status >= 400 && q._status !== 404) { setErr(q.error ?? 'Not allowed'); setUpgrade(!!q.upgrade); setBusy(false); return; }
    try { setOuts(await tool.run(files, opts, { progress: (d, t, m) => setProg(m ?? `${d + 1} / ${t}`) })); setTab('after'); api('/history', { tool: tool.id, files: files.length, bytes, ms: Date.now() - t0 }).then(refresh); }
    catch (e: any) { if (/dynamically imported module|Importing a module script failed/i.test(String(e?.message))) { window.dispatchEvent(new PromiseRejectionEvent('unhandledrejection', { promise: Promise.resolve(), reason: e })); } setErr(e?.message ?? 'Something went wrong'); }
    setBusy(false); setProg('');
  };
  const need = tool.minFiles ?? 1;
  const stripOpts = () => Object.fromEntries(Object.entries(opts).filter(([, v]) => !(v instanceof File)));
  const outBlob = async () => outs.length === 1 ? outs[0].blob : (await import('../tools/pdfTools')).zipOuts(outs);
  const payload = () => ({ tool: tool.id, name: `${tool.title} ${new Date().toLocaleDateString()}`, opts: stripOpts(), files: files.slice(0, 20).map((f) => ({ name: f.name, size: f.size })), summary: { inBytes: files.reduce((n, f) => n + f.size, 0), outBytes: outs.reduce((n, o) => n + o.blob.size, 0), fileCount: files.length, outCount: outs.length, status: 'done' }, out_name: outs.length === 1 ? outs[0].name : 'magic-convertor.zip', out_size: outs.reduce((n, o) => n + o.blob.size, 0), out_mime: outs.length === 1 ? (outs[0].blob.type || 'application/octet-stream') : 'application/zip' });
  const saveProfile = async () => {
    if (!user) { try { localStorage.setItem('mc_pending_save', JSON.stringify(payload())); } catch { /* ignore */ } setSaved('login'); return; }
    setSaved('busy'); const r = await saveOperation(payload(), await outBlob()); if (!r.ok) { setErr(r.error ?? 'Could not save'); setSaved(''); } else { if (r.error) setErr(r.error); setSaved('ok'); }
  };
  const inBytes = files.reduce((n, f) => n + f.size, 0);
  const nextOk = files.length >= need && !off;
  return (
    <div className="pt-24 pb-16 max-w-7xl mx-auto px-4">
      <Link to="/" className="text-sm text-gray-400 hover:text-white inline-flex items-center gap-1 mb-4"><ArrowLeft size={14} className="rtl:rotate-180" /> {tr('All tools')}</Link>
      <div className="flex items-center gap-3 mb-2"><div className="p-3 tool-tile"><Icon /></div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-blue-400 text-transparent bg-clip-text">{tr(tool.title)}</h1><PageArt kind={tool.accept.some((a) => a.startsWith('image/')) ? 'images' : tool.accept.every((a) => a !== 'application/pdf') ? 'documents' : 'pdf'} className="ml-auto w-28 hidden md:block -my-3" /></div>
      <p className="text-gray-400 mb-2">{tr(tool.desc)}</p>
      <p className="text-xs text-emerald-300/80 flex items-center gap-1 mb-6"><ShieldCheck size={13} /> {tr('Runs in your browser. Your files are not uploaded.')}</p>
      <Stepper stage={stage} />
      {stage === 'upload' && <div className="max-w-2xl mx-auto">
      <div {...dz.getRootProps()} className={`mc-drop border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition ${dz.isDragActive ? 'drag border-violet-400 bg-violet-500/10' : 'border-white/20 hover:border-violet-400/60 bg-white/5'}`}>
        <input {...dz.getInputProps()} /><UploadCloud className="mx-auto mb-2 text-violet-300" size={36} />
        <p>{tr(tool.multiple ? 'Drop files here or click to choose' : 'Drop a file here or click to choose')}</p>
      </div>
      {files.length > 0 && <ul className="mt-4 space-y-2">{files.map((f, i) => (
        <li key={i} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm"><span className="file-badge shrink-0 w-9 text-center text-[10px] font-extrabold tracking-wider rounded-md bg-gradient-to-br from-violet-500/40 to-blue-500/40 py-1">{(f.name.split('.').pop() || 'FILE').slice(0, 4).toUpperCase()}</span>
          <span className="flex-1 truncate">{f.name}</span><span dir="ltr" className="text-gray-400">{fmtSize(f.size)}</span>
          {tool.multiple && <><button disabled={i === 0} onClick={() => move(i, -1)} className="p-1 disabled:opacity-30"><ArrowUp size={14} /></button>
            <button disabled={i === files.length - 1} onClick={() => move(i, 1)} className="p-1 disabled:opacity-30"><ArrowDown size={14} /></button></>}
          <button onClick={() => setFiles(files.filter((_, j) => j !== i))} className="p-1 text-red-300"><X size={14} /></button></li>))}</ul>}
      {off && <p className="mt-4 text-amber-300 text-sm">{tr('This tool is temporarily switched off.')}</p>}
      {files.length > 0 && <button disabled={!nextOk} onClick={() => { setStage('board'); setTab('before'); }} className="flow-next mt-6 w-full py-3.5 rounded-xl font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50">{files.length < need ? `${tr('Add at least')} ${need}` : tr('Next')} <ArrowRight size={18} className="rtl:rotate-180" /></button>}
      </div>}
      {stage === 'board' && <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-6 items-start"><div className="space-y-4">
      <div className="flow-panel p-4 text-sm"><p className="font-semibold mb-1">{files.length === 1 ? files[0].name : `${files.length} ${tr('files')}`}</p><p dir="ltr" className="opacity-70 text-start">{fmtSize(inBytes)}</p>{tool.multiple && <p className="mt-2 text-xs opacity-70">{tr('Drag the cards on the right to change the order.')}</p>}</div>
      {tool.options && <div className="mt-5 rounded-2xl bg-white/5 border border-white/10 p-4"><p className="text-xs uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2"><SlidersHorizontal size={13} /> {tr('Options')}</p><div className="grid sm:grid-cols-2 gap-4">{tool.options.filter((o) => !(tool.id === 'image-background' && ((o.key === 'tol' && !(opts.mode === 'remove' || opts.removeOld)) || (o.key === 'removeOld' && opts.mode === 'remove') || (o.key === 'color' && opts.mode !== 'color') || (o.key === 'bgfile' && opts.mode !== 'image') || (o.key === 'format' && opts.mode === 'remove'))) && !(tool.id === 'split-pdf' && ((o.key === 'ranges' && opts.mode !== 'ranges') || (o.key === 'every' && opts.mode !== 'every'))) && !(tool.id === 'resize-image' && ((o.key === 'percent' && opts.mode !== 'percent') || (['width', 'height', 'keep'].includes(o.key) && opts.mode !== 'pixels')))).map((o) => (
        <label key={o.key} className="text-sm text-gray-300 block">{o.type !== 'check' && <span className="block mb-1">{tr(o.label)}</span>}
          {o.type === 'select' ? <><select className={o.options.length <= 4 ? 'sr-only' : field} value={opts[o.key]} onChange={(e) => setOpts({ ...opts, [o.key]: e.target.value })}>{o.options.map((x) => <option className="bg-gray-900" key={x.v} value={x.v}>{tr(x.l)}</option>)}</select>{o.options.length <= 4 && <div className="seg flex rounded-xl border border-white/10 bg-black/10 p-1 gap-1" role="radiogroup">{o.options.map((x) => <button type="button" role="radio" aria-checked={opts[o.key] === x.v} key={x.v} onClick={(e) => { e.preventDefault(); setOpts({ ...opts, [o.key]: x.v }); }} className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium ${opts[o.key] === x.v ? 'bg-violet-500 text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}>{tr(x.l)}</button>)}</div>}</>
            : o.type === 'color' ? <input type="color" className="h-10 w-20 bg-transparent" value={opts[o.key]} onChange={(e) => setOpts({ ...opts, [o.key]: e.target.value })} />
            : o.type === 'file' ? <input type="file" accept="image/*" className="text-xs" onChange={(e) => setOpts({ ...opts, [o.key]: e.target.files?.[0] ?? null })} />
            : o.type === 'check' ? <span className="flex gap-2 items-center"><input type="checkbox" className="accent-violet-500 w-4 h-4" checked={!!opts[o.key]} onChange={(e) => setOpts({ ...opts, [o.key]: e.target.checked })} />{tr(o.label)}</span>
            : <div className="flex items-center gap-3">{o.type === 'number' && (o as any).min !== undefined && (o as any).max !== undefined && (o as any).max - (o as any).min >= 20 && <input type="range" aria-hidden="true" tabIndex={-1} className="flex-1 accent-violet-500" min={(o as any).min} max={(o as any).max} value={opts[o.key] ?? (o as any).min} onChange={(e) => setOpts({ ...opts, [o.key]: Number(e.target.value) })} />}<input className={o.type === 'number' ? field + ' !w-24 shrink-0' : field} type={o.type} min={(o as any).min} max={(o as any).max} value={opts[o.key] ?? ''} onChange={(e) => setOpts({ ...opts, [o.key]: o.type === 'number' ? Number(e.target.value) : e.target.value })} /></div>}
        </label>))}</div></div>}
      {upgrade && <div role="status" className="mt-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm"><p className="font-bold text-base">{tr("You've used today's free runs for this tool")}</p><p className="mt-1 opacity-80">{tr('Nothing is wrong. Free visitors get a few advanced runs per day. Your file is untouched and still here.')}</p><div className="mt-3 flex flex-wrap gap-2"><Link className="flow-next px-4 py-2 rounded-xl font-semibold" to="/signup">{tr('Create a free account')}</Link><Link className="px-4 py-2 rounded-xl font-semibold border border-current/30" to="/pricing">{tr('See plans')}</Link></div></div>}
      {err && !upgrade && <p className="mt-4 text-red-300 bg-red-500/10 border border-red-400/30 rounded-lg p-3 text-sm">{err}</p>}
      {off && <p className="mt-4 text-amber-300 text-sm">{tr('This tool is temporarily switched off.')}</p>}
      {files.length > 0 && <button disabled={off || busy || files.length < need} onClick={run} className={`w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-violet-500 to-blue-500 disabled:opacity-50 flex items-center justify-center gap-2 relative overflow-hidden ${busy ? 'shimmer' : ''}`}>
        {busy ? <><Loader2 className="animate-spin" size={18} /> {prog || tr('Working...')}</> : files.length < need ? `Add at least ${need} files` : tr(tool.title)}</button>}
      </div>
      <aside className="flow-panel lg:sticky lg:top-24 p-4 min-h-[320px] lg:max-h-[calc(100vh-7rem)] overflow-auto">
        <div role="tablist" className="flow-tabs inline-flex p-1 rounded-full mb-4">{(['before', 'after'] as const).map((k) => <button key={k} role="tab" aria-selected={tab === k} disabled={k === 'after' && !outs.length} onClick={() => setTab(k)} className={`px-4 py-1.5 rounded-full text-sm font-semibold disabled:opacity-40 ${tab === k ? 'on' : ''}`}>{tr(k === 'before' ? 'Before' : 'After')}</button>)}</div>
        {tab === 'after' && outs.length > 0 ? <AfterView files={files} outs={outs} /> : <>
          {mode === 'compress' && <CompressPreview file={files[0]} level={opts.level ?? 'med'} setLevel={(k) => setOpts((o) => ({ ...o, level: k }))} />}
          {mode === 'split' && <SplitPreview file={files[0]} opts={opts} setOpts={setOpts as any} />}
          {mode === 'files' && <FileCards files={files} setFiles={setFiles} addMore={tool.multiple} accept={tool.accept.join(',')} />}
          {mode === 'frame' && <div className="space-y-4"><PageFrame file={files[0]} opts={opts} /><FileCards files={files} setFiles={setFiles} /></div>}
          {mode === 'background' && <div className="space-y-4"><BackgroundPreview file={files[0]} opts={opts} />{files.length > 1 && <FileCards files={files} setFiles={setFiles} />}</div>}
          {(mode === 'select' || mode === 'sort') && <PageGrid file={files[0]} mode={mode} selected={sel} onSelect={(x) => { setSel(x); setOpts((o) => ({ ...o, pages: compressPages(x) })); }} onOrder={(o) => setOpts((p) => ({ ...p, order: o.join(',') }))} />}
          {mode === 'first' && <Thumbs blobs={files.slice(0, 4)} />}
        </>}
      </aside></div>}
      {stage === 'board' && <div className="flow-bar mt-6 flex items-center justify-between gap-3"><button onClick={() => setStage('upload')} className="flow-ghost px-4 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2"><ArrowLeft size={16} className="rtl:rotate-180" /> {tr('Back')}</button>{outs.length === 0 && !busy && <span className="text-xs opacity-70 hidden sm:inline">{tr('Apply the tool, then press Next. You can keep editing until then.')}</span>}<button disabled={!outs.length || busy} onClick={() => setStage('final')} className="flow-next px-6 py-2.5 rounded-xl font-semibold inline-flex items-center gap-2 disabled:opacity-40">{tr('Next')} <ArrowRight size={18} className="rtl:rotate-180" /></button></div>}
      {stage === 'final' && <div className="max-w-2xl mx-auto relative"><Confetti /><div className="flow-panel p-6 sm:p-8 text-center"><CheckCircle2 className="mx-auto mb-3 text-[color:var(--ac)]" size={40} /><h2 className="text-2xl font-bold mb-1">{tr('Done')}</h2><p className="text-sm opacity-70 mb-4">{tr(tool.title)} · {outs.length} {tr(outs.length === 1 ? 'file' : 'files')}</p><div className="flex justify-center mb-6"><SizeSummary inBytes={inBytes} outs={outs} /></div>
        {outs.length === 1 ? <button onClick={() => save(outs[0].blob, outs[0].name)} className="flow-next w-full py-4 rounded-2xl text-lg font-bold inline-flex items-center justify-center gap-2"><Download size={22} /> {tr('Download')}</button>
          : <><button onClick={async () => save(await (await import('../tools/pdfTools')).zipOuts(outs), 'magic-convertor.zip')} className="flow-next w-full py-4 rounded-2xl text-lg font-bold inline-flex items-center justify-center gap-2"><Download size={22} /> {tr('Download all as ZIP')}</button>
            <ul className="mt-3 space-y-1.5 text-sm text-start">{outs.map((o, i) => <li key={i} className="flex items-center gap-2"><span className="flex-1 truncate">{o.name}</span><span dir="ltr" className="opacity-70">{fmtSize(o.blob.size)}</span><button aria-label={`${tr('Download')} ${o.name}`} onClick={() => save(o.blob, o.name)} className="p-2 rounded-lg flow-ghost"><Download size={15} /></button></li>)}</ul></>}
        <div className="grid sm:grid-cols-3 gap-3 mt-4">
          <Link to="/" className="flow-ghost py-3 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2"><Home size={16} /> {tr('Back to Home')}</Link>
          <button onClick={() => { setStage('board'); setTab('after'); }} className="flow-ghost py-3 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2"><Pencil size={16} /> {tr('Edit again')}</button>
          <button onClick={saveProfile} disabled={saved === 'ok' || saved === 'busy'} className="flow-ghost py-3 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-70">{saved === 'ok' ? <CheckCircle2 size={16} /> : <BookmarkPlus size={16} />} {tr(saved === 'ok' ? 'Saved to profile' : 'Save to my profile')}</button></div>
        {saved === 'ok' && <p className="mt-3 text-sm">{tr('Saved. Find it in')} <Link className="underline" to="/account">{tr('Account')}</Link>. {tr('Open it later to edit; you will add your files again, settings come back.')}</p>}
        {saved === 'login' && <div className="mt-4 p-4 rounded-xl text-sm flow-note text-start"><p className="mb-2">{tr('Sign in to keep this operation in your profile. Your settings are held on this device until then.')}</p><div className="flex gap-2"><Link to="/login" className="flow-next px-4 py-2 rounded-lg font-semibold">{tr('Sign in')}</Link><Link to="/signup" className="flow-ghost px-4 py-2 rounded-lg font-semibold">{tr('Create account')}</Link></div></div>}
        {err && <p className="mt-3 text-red-300 text-sm">{err}</p>}
      </div></div>}
      {stage === 'upload' && <ToolInfo id={tool.id} />}
    </div>);
};
