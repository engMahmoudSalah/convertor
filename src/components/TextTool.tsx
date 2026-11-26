import React, { useEffect, useState } from 'react';
import { ArrowLeft, ShieldCheck, Copy, Check, Download, SlidersHorizontal, Eraser } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { TOOLS } from '../tools/registry';
import { useT } from '../lib/i18n';
import { PageArt } from './PageArt';
import { ToolInfo } from './ToolInfo';
import { AdGate, PageAd } from './Ads';
import { useAuth } from '../lib/auth';
import { TEXT_FNS } from '../tools/textTools';
import { fmtSize } from '../lib/util';
import type { Tool } from '../tools/types';

const field = 'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400';

const SHELF = 'mc_shelf';
const readShelf = (): { from: string; text: string }[] => { try { const a = JSON.parse(localStorage.getItem(SHELF) || '[]'); return Array.isArray(a) ? a.filter((x) => x && typeof x.text === 'string').slice(0, 5) : []; } catch { return []; } };
const pushShelf = (from: string, text: string, cat = '') => { if (cat === 'privacy' || !text || text.length > 20000) return; try { localStorage.setItem(SHELF, JSON.stringify([{ from, text }, ...readShelf().filter((x) => x.text !== text)].slice(0, 5))); } catch { /* ignore */ } };
export const TextTool: React.FC<{ tool: Tool }> = ({ tool }) => {
  const nav = useNavigate(); const { t: tr, lang } = useT(); const Icon = tool.icon; const inp = tool.input!; const ar = lang === 'ar';
  const [text, setText] = useState(''); const [second, setSecond] = useState('');
  const [opts, setOpts] = useState<Record<string, any>>(() => Object.fromEntries((tool.options ?? []).map((o) => [o.key, o.default])));
  const { plan } = useAuth(); const adSteps = plan ? plan.ads : 2; const [gate, setGate] = useState(false); const [kindPng, setKindPng] = useState(false);
  const [shelf, setShelf] = useState<{ from: string; text: string }[]>(() => readShelf()); const [piped, setPiped] = useState(''); const [out, setOut] = useState(''); const [err, setErr] = useState(''); const [copied, setCopied] = useState(false);
  useEffect(() => { setText(''); setSecond(''); setOut(''); setErr(''); setOpts(Object.fromEntries((tool.options ?? []).map((o) => [o.key, o.default]))); }, [tool.id]);
  useEffect(() => { try { const r = JSON.parse(sessionStorage.getItem('mc_pipe') || 'null'); if (r && r.to === tool.id) { sessionStorage.removeItem('mc_pipe'); setText(String(r.text || '')); setPiped(r.from || ''); } else setPiped(''); } catch { /* ignore */ } }, [tool.id]);
  useEffect(() => {
    let live = true; const h = setTimeout(async () => {
      try { const r = await TEXT_FNS[tool.id](text, { ...opts, _ar: ar }, second); if (live) { setOut(r); setErr(''); } }
      catch (e: any) { if (live) { setOut(''); setErr(e?.message ?? 'Something went wrong'); } }
    }, 120);
    return () => { live = false; clearTimeout(h); };
  }, [tool.id, text, second, opts, ar]);
  const copy = async () => { pushShelf(tool.title, out, tool.category); setShelf(readShelf()); try { await navigator.clipboard.writeText(out); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch { /* ignore */ } };
  const download = () => { pushShelf(tool.title, out, tool.category); setShelf(readShelf()); setGate(false); const ext = inp.ext ?? 'txt'; const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([out], { type: 'text/plain;charset=utf-8' })); a.download = `${tool.id}.${ext}`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 3000); };
  const downloadPng = () => {
    const px = Math.max(128, Math.min(2048, Number(opts.size) || 512)); const img = new Image();
    img.onload = () => { const cv = document.createElement('canvas'); cv.width = cv.height = px; const g = cv.getContext('2d')!; g.imageSmoothingEnabled = false; g.drawImage(img, 0, 0, px, px); cv.toBlob((b) => { if (!b) return; const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `${tool.id}.png`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 3000); }, 'image/png'); };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(out);
  };
  const targets = TOOLS.filter((x) => x.kind === 'text' && x.id !== tool.id && x.input && !x.input.none && !x.input.diff && !x.input.second);
  const sendTo = (id: string) => { if (!id || !out) return; pushShelf(tool.title, out, tool.category); try { sessionStorage.setItem('mc_pipe', JSON.stringify({ to: id, from: tool.title, text: out })); } catch { return; } nav(`/tools/${id}`); };
  const lines = inp.diff ? out.split('\n') : [];
  return (
    <div className="pt-24 pb-16 max-w-7xl mx-auto px-4">
      <Link to="/" className="text-sm text-gray-400 hover:text-white inline-flex items-center gap-1 mb-4"><ArrowLeft size={14} className="rtl:rotate-180" /> {tr('All tools')}</Link>
      <div className="flex items-center gap-3 mb-2"><div className="p-3 tool-tile"><Icon /></div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-blue-400 text-transparent bg-clip-text">{tr(tool.title)}</h1><PageArt kind={tool.category === 'dev' ? 'documents' : 'documents'} className="ms-auto hidden sm:block w-28 h-20 opacity-90" /></div>
      <p className="text-gray-400 mb-2">{tr(tool.desc)}</p>
      {piped && <p className="text-xs mb-2 opacity-80">{tr('Input came from')}: {tr(piped)}</p>}
      <p className="text-xs text-emerald-300/80 flex items-center gap-1 mb-6"><ShieldCheck size={13} /> {tr('Runs in your browser. Your text is not uploaded.')}</p>
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <div className="space-y-4">
          {!inp.none && <div className="flow-panel p-4">
            <label className="flex items-center justify-between text-xs uppercase tracking-wider opacity-70 mb-2" htmlFor="tt-in"><span>{tr(inp.label)}</span>
              <span className="flex items-center gap-3 normal-case tracking-normal"><span dir="ltr">{[...text].length} {tr('characters')}</span>{text && <button type="button" onClick={() => { setText(''); setSecond(''); }} className="inline-flex items-center gap-1 underline"><Eraser size={12} /> {tr('Clear')}</button>}</span></label>
            {shelf.length > 0 && !inp.none && <div className="mb-2 flex flex-wrap items-center gap-1.5 text-xs"><span className="opacity-60">{tr('Recent results')}:</span>{shelf.map((x, i) => <button key={i} type="button" onClick={() => setText(x.text)} title={x.text.slice(0, 200)} className="flow-ghost px-2 py-1 rounded-lg max-w-[11rem] truncate">{tr(x.from)}: {x.text.replace(/\s+/g, ' ').slice(0, 18)}</button>)}<button type="button" onClick={() => { try { localStorage.removeItem(SHELF); } catch { /* ignore */ } setShelf([]); }} className="underline opacity-70 px-1">{tr('Clear')}</button></div>}
            <textarea id="tt-in" dir="auto" spellCheck={false} value={text} onChange={(e) => setText(e.target.value)} placeholder={inp.placeholder ? tr(inp.placeholder) : ''} className={`${field} font-mono min-h-[240px] resize-y`} />
            {inp.second && <><label className="block text-xs uppercase tracking-wider opacity-70 mt-4 mb-2" htmlFor="tt-in2">{tr(inp.second)}</label>
              <textarea id="tt-in2" dir="auto" spellCheck={false} value={second} onChange={(e) => setSecond(e.target.value)} className={`${field} font-mono min-h-[240px] resize-y`} /></>}
          </div>}
          {tool.options && <div className="flow-panel p-4"><p className="text-xs uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2"><SlidersHorizontal size={13} /> {tr('Options')}</p>
            <div className="grid sm:grid-cols-2 gap-4">{tool.options.map((o) => (
              <label key={o.key} className="text-sm text-gray-300 block">{o.type !== 'check' && <span className="block mb-1">{tr(o.label)}</span>}
                {o.type === 'select' ? <select className={field} value={opts[o.key]} onChange={(e) => setOpts({ ...opts, [o.key]: e.target.value })}>{o.options.map((x) => <option className="bg-gray-900" key={x.v} value={x.v}>{tr(x.l)}</option>)}</select>
                  : o.type === 'color' ? <input type="color" className="h-10 w-20 bg-transparent" value={opts[o.key]} onChange={(e) => setOpts({ ...opts, [o.key]: e.target.value })} />
                  : o.type === 'check' ? <span className="flex gap-2 items-center"><input type="checkbox" className="accent-violet-500 w-4 h-4" checked={!!opts[o.key]} onChange={(e) => setOpts({ ...opts, [o.key]: e.target.checked })} />{tr(o.label)}</span>
                  : <input dir="ltr" type={o.type === 'number' ? 'number' : 'text'} className={field} min={(o as any).min} max={(o as any).max} value={opts[o.key]} onChange={(e) => setOpts({ ...opts, [o.key]: o.type === 'number' ? e.target.value : e.target.value })} />}
              </label>))}</div></div>}
        </div>
        <section className="flow-panel p-4 lg:sticky lg:top-24" aria-live="polite">
          <div className="flex items-center justify-between gap-2 mb-3"><h2 className="text-xs uppercase tracking-widest opacity-70">{tr('Result')}</h2>
            <div className="flex gap-2"><button type="button" onClick={copy} disabled={!out} className="flow-ghost px-3 py-1.5 rounded-lg text-sm font-semibold inline-flex items-center gap-1.5 disabled:opacity-40">{copied ? <Check size={15} /> : <Copy size={15} />} {copied ? tr('Copied') : tr('Copy')}</button>
              <button type="button" onClick={() => { setKindPng(false); if (adSteps > 0) setGate(true); else download(); }} disabled={!out} className="flow-next px-3 py-1.5 rounded-lg text-sm font-semibold inline-flex items-center gap-1.5 disabled:opacity-40"><Download size={15} /> {tr('Download')}</button></div></div>
          {gate && <div className="mb-4 rounded-xl border border-white/10 p-4"><AdGate steps={adSteps} onDone={() => { setGate(false); kindPng ? downloadPng() : download(); }} onBack={() => setGate(false)} /></div>}
          {err && <p role="alert" className="text-red-300 bg-red-500/10 border border-red-400/30 rounded-lg p-3 text-sm mb-3">{tr(err)}</p>}
          {inp.svg && out && <div className="grid place-items-center mb-4"><div className="rounded-xl p-3 bg-white border border-black/10"><img alt={tr('QR code preview')} width={240} height={240} className="block" style={{ imageRendering: 'pixelated' }} src={'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(out)} /></div>
            <button type="button" onClick={() => { setKindPng(true); if (adSteps > 0) setGate(true); else downloadPng(); }} className="flow-ghost mt-3 px-3 py-1.5 rounded-lg text-sm font-semibold inline-flex items-center gap-1.5"><Download size={15} /> PNG</button></div>}
          {inp.svg ? null : inp.diff
            ? <pre dir="auto" className="text-sm font-mono whitespace-pre-wrap break-words min-h-[240px] max-h-[70vh] overflow-auto">{lines.map((l, i) => <span key={i} className={`block px-1 ${l.startsWith('+ ') ? 'bg-emerald-500/15 text-emerald-300' : l.startsWith('- ') ? 'bg-red-500/15 text-red-300' : i === 0 ? 'font-bold' : 'opacity-70'}`}>{l || ' '}</span>)}</pre>
            : <pre dir="auto" className="text-sm font-mono whitespace-pre-wrap break-words min-h-[240px] max-h-[70vh] overflow-auto">{out || (err ? '' : <span className="opacity-50">{inp.none ? '' : tr('Your result appears here as you type.')}</span>)}</pre>}
          {out && !inp.svg && !inp.diff && <label className="flex items-center gap-2 mt-3 text-sm"><span className="opacity-70 shrink-0">{tr('Use this result in')}</span><select className={field} value="" onChange={(e) => sendTo(e.target.value)}><option value="">{tr('Choose a tool')}</option>{targets.map((x) => <option key={x.id} value={x.id}>{tr(x.title)}</option>)}</select></label>}
          {out && <p dir="ltr" className="text-xs opacity-60 mt-2 text-start">{fmtSize(new Blob([out]).size)}</p>}
        </section>
      </div>
      <PageAd />
      <ToolInfo id={tool.id} />
      <span hidden>{ar ? '' : ''}</span>
    </div>);
};
