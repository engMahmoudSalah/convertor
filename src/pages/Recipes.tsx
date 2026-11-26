import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ArrowDown, Trash2, Save, Copy, Check, Workflow } from 'lucide-react';
import { useT } from '../lib/i18n';
import { TOOLS } from '../tools/registry';
import { TEXT_FNS } from '../tools/textTools';

const field = 'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400';
type Recipe = { name: string; steps: string[] };
const KEY = 'mc_recipes';
const load = (): Recipe[] => { try { const a = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(a) ? a.filter((r) => r && typeof r.name === 'string' && Array.isArray(r.steps)).slice(0, 20) : []; } catch { return []; } };
const SAMPLES: Recipe[] = [
  { name: 'JSON to YAML, then Base64', steps: ['json-to-yaml', 'base64-tool'] },
  { name: 'Clean lines, then hash', steps: ['clean-lines', 'hash-generator'] },
];
export default function Recipes() {
  const { t: tr } = useT();
  const pool = useMemo(() => TOOLS.filter((x) => x.kind === 'text' && x.input && !x.input.none && !x.input.diff && !x.input.svg && !x.input.second && x.category !== 'privacy' && TEXT_FNS[x.id]), []);
  const [steps, setSteps] = useState<string[]>(['clean-lines']); const [text, setText] = useState(''); const [name, setName] = useState('');
  const [saved, setSaved] = useState<Recipe[]>(load); const [trail, setTrail] = useState<{ id: string; out: string; err?: string }[]>([]); const [copied, setCopied] = useState(false);
  useEffect(() => {
    let live = true; const h = setTimeout(async () => {
      const rows: { id: string; out: string; err?: string }[] = []; let cur = text;
      for (const id of steps) {
        const tool = pool.find((x) => x.id === id); if (!tool || !text) break;
        const o = Object.fromEntries((tool.options ?? []).map((q) => [q.key, q.default]));
        try { cur = await TEXT_FNS[id](cur, o, ''); rows.push({ id, out: cur }); } catch (e: any) { rows.push({ id, out: '', err: e?.message ?? 'Error' }); break; }
      }
      if (live) setTrail(rows);
    }, 150);
    return () => { live = false; clearTimeout(h); };
  }, [steps, text, pool]);
  const persist = (a: Recipe[]) => { setSaved(a); try { localStorage.setItem(KEY, JSON.stringify(a)); } catch { /* ignore */ } };
  const final = trail.length === steps.length && !trail[trail.length - 1]?.err ? trail[trail.length - 1].out : '';
  const copy = async () => { try { await navigator.clipboard.writeText(final); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* ignore */ } };
  const title = (id: string) => tr(TOOLS.find((x) => x.id === id)?.title ?? id);
  return (
    <div className="pt-24 pb-16 max-w-5xl mx-auto px-4">
      <h1 className="text-3xl font-bold mb-2 flex items-center gap-3"><Workflow /> {tr('Recipes')}</h1>
      <p className="opacity-70 mb-2">{tr('Chain text tools: the result of each step feeds the next. Runs in your browser with default options.')}</p>
      <div className="grid lg:grid-cols-2 gap-6 items-start mt-6">
        <div className="space-y-4">
          <div className="flow-panel p-4"><label className="block text-xs uppercase tracking-wider opacity-70 mb-2" htmlFor="rc-in">{tr('Starting text')}</label>
            <textarea id="rc-in" dir="auto" spellCheck={false} value={text} onChange={(e) => setText(e.target.value)} className={`${field} font-mono min-h-[140px]`} /></div>
          <div className="flow-panel p-4"><h2 className="text-xs uppercase tracking-wider opacity-70 mb-3">{tr('Steps')}</h2>
            <ol className="space-y-2">{steps.map((id, i) => <li key={i} className="flex items-center gap-2"><span className="w-6 text-sm opacity-60">{i + 1}</span>
              <select aria-label={`${tr('Step')} ${i + 1}`} className={field} value={id} onChange={(e) => setSteps(steps.map((s, j) => (j === i ? e.target.value : s)))}>{pool.map((x) => <option key={x.id} value={x.id}>{tr(x.title)}</option>)}</select>
              <button type="button" aria-label={tr('Remove step')} disabled={steps.length < 2} onClick={() => setSteps(steps.filter((_, j) => j !== i))} className="flow-ghost p-2 rounded-lg disabled:opacity-30"><Trash2 size={15} /></button></li>)}</ol>
            <button type="button" disabled={steps.length >= 6} onClick={() => setSteps([...steps, pool[0].id])} className="flow-ghost mt-3 px-3 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-1.5 disabled:opacity-40"><Plus size={15} /> {tr('Add step')}</button></div>
          <div className="flow-panel p-4"><h2 className="text-xs uppercase tracking-wider opacity-70 mb-3">{tr('Saved recipes')}</h2>
            <div className="flex gap-2 mb-3"><input aria-label={tr('Recipe name')} maxLength={50} className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder={tr('Recipe name')} />
              <button type="button" disabled={!name.trim()} onClick={() => { persist([{ name: name.trim(), steps }, ...saved.filter((r) => r.name !== name.trim())].slice(0, 20)); setName(''); }} className="flow-next px-3 rounded-lg text-sm font-semibold inline-flex items-center gap-1.5 disabled:opacity-40"><Save size={15} /> {tr('Save')}</button></div>
            <ul className="space-y-2">{[...saved, ...SAMPLES.filter((s) => !saved.some((r) => r.name === s.name))].map((r) => <li key={r.name} className="flex items-center gap-2 text-sm"><button type="button" onClick={() => setSteps(r.steps.filter((id) => pool.some((x) => x.id === id)).length ? r.steps.filter((id) => pool.some((x) => x.id === id)) : steps)} className="flow-ghost flex-1 text-start px-3 py-2 rounded-lg truncate">{tr(r.name)}<span className="opacity-60"> · {r.steps.length}</span></button>
              {saved.some((x) => x.name === r.name) && <button type="button" aria-label={tr('Delete')} onClick={() => persist(saved.filter((x) => x.name !== r.name))} className="flow-ghost p-2 rounded-lg"><Trash2 size={15} /></button>}</li>)}</ul></div>
        </div>
        <section className="flow-panel p-4 lg:sticky lg:top-24" aria-live="polite"><div className="flex items-center justify-between mb-3"><h2 className="text-xs uppercase tracking-widest opacity-70">{tr('Result')}</h2>
          <button type="button" onClick={copy} disabled={!final} className="flow-ghost px-3 py-1.5 rounded-lg text-sm font-semibold inline-flex items-center gap-1.5 disabled:opacity-40">{copied ? <Check size={15} /> : <Copy size={15} />} {copied ? tr('Copied') : tr('Copy')}</button></div>
          {!text && <p className="text-sm opacity-60">{tr('Type some starting text to run the recipe.')}</p>}
          <ol className="space-y-2">{trail.map((r, i) => <li key={i}>{i > 0 && <ArrowDown size={14} className="mx-auto opacity-50 mb-2" />}<p className="text-xs opacity-70 mb-1">{i + 1}. <Link className="underline" to={`/tools/${r.id}`}>{title(r.id)}</Link></p>
            {r.err ? <p role="alert" className="text-red-300 bg-red-500/10 border border-red-400/30 rounded-lg p-2 text-sm">{tr(r.err)}</p> : <pre dir="auto" className={`text-xs font-mono whitespace-pre-wrap break-words overflow-auto rounded-lg p-2 bg-white/5 ${i === trail.length - 1 ? 'max-h-[40vh]' : 'max-h-24'}`}>{r.out}</pre>}</li>)}</ol>
        </section>
      </div>
    </div>);
}
