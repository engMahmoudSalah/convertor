import React, { useEffect, useState } from 'react';
import { ArrowLeft, ShieldCheck, Copy, Check, Download, SlidersHorizontal, Eraser } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useT } from '../lib/i18n';
import { PageArt } from './PageArt';
import { ToolInfo } from './ToolInfo';
import { AdGate, PageAd } from './Ads';
import { useAuth } from '../lib/auth';
import { TEXT_FNS } from '../tools/textTools';
import { fmtSize } from '../lib/util';
import type { Tool } from '../tools/types';

const field = 'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400';

export const TextTool: React.FC<{ tool: Tool }> = ({ tool }) => {
  const { t: tr, lang } = useT(); const Icon = tool.icon; const inp = tool.input!; const ar = lang === 'ar';
  const [text, setText] = useState(''); const [second, setSecond] = useState('');
  const [opts, setOpts] = useState<Record<string, any>>(() => Object.fromEntries((tool.options ?? []).map((o) => [o.key, o.default])));
  const { plan } = useAuth(); const adSteps = plan ? plan.ads : 2; const [gate, setGate] = useState(false);
  const [out, setOut] = useState(''); const [err, setErr] = useState(''); const [copied, setCopied] = useState(false);
  useEffect(() => { setText(''); setSecond(''); setOut(''); setErr(''); setOpts(Object.fromEntries((tool.options ?? []).map((o) => [o.key, o.default]))); }, [tool.id]);
  useEffect(() => {
    let live = true; const h = setTimeout(async () => {
      try { const r = await TEXT_FNS[tool.id](text, opts, second); if (live) { setOut(r); setErr(''); } }
      catch (e: any) { if (live) { setOut(''); setErr(e?.message ?? 'Something went wrong'); } }
    }, 120);
    return () => { live = false; clearTimeout(h); };
  }, [tool.id, text, second, opts]);
  const copy = async () => { try { await navigator.clipboard.writeText(out); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch { /* ignore */ } };
  const download = () => { setGate(false); const ext = inp.ext ?? 'txt'; const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([out], { type: 'text/plain;charset=utf-8' })); a.download = `${tool.id}.${ext}`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 3000); };
  const lines = inp.diff ? out.split('\n') : [];
  return (
    <div className="pt-24 pb-16 max-w-7xl mx-auto px-4">
      <Link to="/" className="text-sm text-gray-400 hover:text-white inline-flex items-center gap-1 mb-4"><ArrowLeft size={14} className="rtl:rotate-180" /> {tr('All tools')}</Link>
      <div className="flex items-center gap-3 mb-2"><div className="p-3 tool-tile"><Icon /></div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-blue-400 text-transparent bg-clip-text">{tr(tool.title)}</h1><PageArt kind={tool.category === 'dev' ? 'documents' : 'documents'} className="ms-auto hidden sm:block w-28 h-20 opacity-90" /></div>
      <p className="text-gray-400 mb-2">{tr(tool.desc)}</p>
      <p className="text-xs text-emerald-300/80 flex items-center gap-1 mb-6"><ShieldCheck size={13} /> {tr('Runs in your browser. Your text is not uploaded.')}</p>
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <div className="space-y-4">
          {!inp.none && <div className="flow-panel p-4">
            <label className="flex items-center justify-between text-xs uppercase tracking-wider opacity-70 mb-2" htmlFor="tt-in"><span>{tr(inp.label)}</span>
              <span className="flex items-center gap-3 normal-case tracking-normal"><span dir="ltr">{[...text].length} {tr('characters')}</span>{text && <button type="button" onClick={() => { setText(''); setSecond(''); }} className="inline-flex items-center gap-1 underline"><Eraser size={12} /> {tr('Clear')}</button>}</span></label>
            <textarea id="tt-in" dir="auto" spellCheck={false} value={text} onChange={(e) => setText(e.target.value)} placeholder={inp.placeholder ? tr(inp.placeholder) : ''} className={`${field} font-mono min-h-[240px] resize-y`} />
            {inp.second && <><label className="block text-xs uppercase tracking-wider opacity-70 mt-4 mb-2" htmlFor="tt-in2">{tr(inp.second)}</label>
              <textarea id="tt-in2" dir="auto" spellCheck={false} value={second} onChange={(e) => setSecond(e.target.value)} className={`${field} font-mono min-h-[240px] resize-y`} /></>}
          </div>}
          {tool.options && <div className="flow-panel p-4"><p className="text-xs uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2"><SlidersHorizontal size={13} /> {tr('Options')}</p>
            <div className="grid sm:grid-cols-2 gap-4">{tool.options.map((o) => (
              <label key={o.key} className="text-sm text-gray-300 block">{o.type !== 'check' && <span className="block mb-1">{tr(o.label)}</span>}
                {o.type === 'select' ? <select className={field} value={opts[o.key]} onChange={(e) => setOpts({ ...opts, [o.key]: e.target.value })}>{o.options.map((x) => <option className="bg-gray-900" key={x.v} value={x.v}>{tr(x.l)}</option>)}</select>
                  : o.type === 'check' ? <span className="flex gap-2 items-center"><input type="checkbox" className="accent-violet-500 w-4 h-4" checked={!!opts[o.key]} onChange={(e) => setOpts({ ...opts, [o.key]: e.target.checked })} />{tr(o.label)}</span>
                  : <input dir="ltr" type={o.type === 'number' ? 'number' : 'text'} className={field} min={(o as any).min} max={(o as any).max} value={opts[o.key]} onChange={(e) => setOpts({ ...opts, [o.key]: o.type === 'number' ? e.target.value : e.target.value })} />}
              </label>))}</div></div>}
        </div>
        <section className="flow-panel p-4 lg:sticky lg:top-24" aria-live="polite">
          <div className="flex items-center justify-between gap-2 mb-3"><h2 className="text-xs uppercase tracking-widest opacity-70">{tr('Result')}</h2>
            <div className="flex gap-2"><button type="button" onClick={copy} disabled={!out} className="flow-ghost px-3 py-1.5 rounded-lg text-sm font-semibold inline-flex items-center gap-1.5 disabled:opacity-40">{copied ? <Check size={15} /> : <Copy size={15} />} {copied ? tr('Copied') : tr('Copy')}</button>
              <button type="button" onClick={() => (adSteps > 0 ? setGate(true) : download())} disabled={!out} className="flow-next px-3 py-1.5 rounded-lg text-sm font-semibold inline-flex items-center gap-1.5 disabled:opacity-40"><Download size={15} /> {tr('Download')}</button></div></div>
          {gate && <div className="mb-4 rounded-xl border border-white/10 p-4"><AdGate steps={adSteps} onDone={download} onBack={() => setGate(false)} /></div>}
          {err && <p role="alert" className="text-red-300 bg-red-500/10 border border-red-400/30 rounded-lg p-3 text-sm mb-3">{tr(err)}</p>}
          {inp.diff
            ? <pre dir="auto" className="text-sm font-mono whitespace-pre-wrap break-words min-h-[240px] max-h-[70vh] overflow-auto">{lines.map((l, i) => <span key={i} className={`block px-1 ${l.startsWith('+ ') ? 'bg-emerald-500/15 text-emerald-300' : l.startsWith('- ') ? 'bg-red-500/15 text-red-300' : i === 0 ? 'font-bold' : 'opacity-70'}`}>{l || ' '}</span>)}</pre>
            : <pre dir="auto" className="text-sm font-mono whitespace-pre-wrap break-words min-h-[240px] max-h-[70vh] overflow-auto">{out || (err ? '' : <span className="opacity-50">{inp.none ? '' : tr('Your result appears here as you type.')}</span>)}</pre>}
          {out && <p dir="ltr" className="text-xs opacity-60 mt-2 text-start">{fmtSize(new Blob([out]).size)}</p>}
        </section>
      </div>
      <PageAd />
      <ToolInfo id={tool.id} />
      <span hidden>{ar ? '' : ''}</span>
    </div>);
};
