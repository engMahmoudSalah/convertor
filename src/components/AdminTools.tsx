import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Gauge, Search } from 'lucide-react';
import { TOOLS, CATS } from '../tools/registry';
import { api } from '../lib/api';
import { useT } from '../lib/i18n';

type Filter = 'all' | 'on' | 'off' | 'adv';
const Switch: React.FC<{ on: boolean; label: string; onClick: () => void; busy?: boolean }> = ({ on, label, onClick, busy }) => (
  <button type="button" role="switch" aria-checked={on} aria-label={label} disabled={busy} onClick={onClick}
    className={`relative shrink-0 w-11 h-6 rounded-full border transition-colors disabled:opacity-60 ${on ? 'bg-emerald-600 border-emerald-700' : 'bg-stone-300 border-stone-400'}`}>
    <span className={`absolute top-0.5 h-4.5 w-[18px] h-[18px] rounded-full bg-white shadow transition-all ${on ? 'start-[22px]' : 'start-0.5'}`} />
  </button>
);

export const AdminTools: React.FC<{ disabled: string[]; heavy: string[]; reload: () => Promise<void>; toast: (m: string) => void }> = ({ disabled, heavy, reload, toast }) => {
  const { t } = useT();
  const [q, setQ] = useState(''); const [f, setF] = useState<Filter>('all'); const [busy, setBusy] = useState(''); const [cat, setCat] = useState<string>(Object.keys(CATS)[0]);
  const off = useMemo(() => new Set(disabled), [disabled]); const adv = useMemo(() => new Set(heavy), [heavy]);
  const total = TOOLS.length; const nOff = TOOLS.filter((x) => off.has(x.id)).length; const nAdv = TOOLS.filter((x) => adv.has(x.id)).length;
  const needle = q.trim().toLowerCase();
  const match = (x: (typeof TOOLS)[number]) => {
    if (f === 'on' && off.has(x.id)) return false; if (f === 'off' && !off.has(x.id)) return false; if (f === 'adv' && !adv.has(x.id)) return false;
    if (!needle) return true; return (x.title + ' ' + t(x.title) + ' ' + x.id).toLowerCase().includes(needle);
  };
  const groups = Object.keys(CATS).map((c) => ({ id: c, name: CATS[c], all: TOOLS.filter((x) => x.category === c) })).filter((g) => g.all.length).map((g) => ({ ...g, shown: g.all.filter(match) })).filter((g) => g.shown.length);
  const searching = !!needle || f !== 'all';
  const tabs = Object.keys(CATS).map((c) => { const all = TOOLS.filter((x) => x.category === c); return { id: c, name: CATS[c], all, hits: all.filter(match).length, on: all.filter((x) => !off.has(x.id)).length }; }).filter((g) => g.all.length);
  const view = searching ? groups : groups.filter((g) => g.id === cat);
  const shownCount = view.reduce((n, g) => n + g.shown.length, 0);
  const setMany = async (ids: string[], enabled: boolean, key: string) => {
    setBusy(key); const r = ids.length === 1 ? await api('/admin/flag', { tool: ids[0], enabled }) : await api('/admin/flags', { tools: ids, enabled });
    if (r.error) toast(String(r.error)); await reload(); setBusy('');
  };
  const chip = (k: Filter, label: string, n: number) => <button key={k} type="button" aria-pressed={f === k} onClick={() => setF(k)} style={f === k && k !== 'all' ? { background: '#b3391d', color: '#fff', borderColor: '#b3391d' } : undefined} className="px-3 py-1.5 rounded-full text-sm border border-stone-400/60">{label} <span className="opacity-80">{n}</span></button>;
  return (
    <div>
      <p className="text-sm opacity-70 mb-4">{t('Switch tools off or on for everyone. Changes apply within seconds.')}</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[[t('Tools'), total], [t('Live'), total - nOff], [t('Switched off'), nOff], [t('Advanced (daily limit)'), nAdv]].map(([l, n]) => <div key={String(l)} className="flow-panel p-3"><p className="text-xs opacity-70">{l}</p><p className="text-2xl font-bold">{n}</p></div>)}
      </div>
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <div className="relative grow min-w-[12rem] max-w-sm"><Search size={15} className="absolute top-1/2 -translate-y-1/2 start-3 opacity-60" aria-hidden="true" />
          <input aria-label={t('Search tools')} placeholder={t('Search tools')} value={q} onChange={(e) => setQ(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg ps-9 pe-3 py-2 text-sm" /></div>
        <div className="flex flex-wrap gap-2" role="group" aria-label={t('Filter')}>{chip('all', t('Any status'), total)}{chip('on', t('Live'), total - nOff)}{chip('off', t('Switched off'), nOff)}{chip('adv', t('Advanced'), nAdv)}</div>
        {nOff > 0 && <button type="button" className="flow-ghost px-3 py-1.5 rounded-lg text-sm" disabled={!!busy} onClick={() => setMany([...off], true, 'all-on')}>{t('Switch everything back on')}</button>}
      </div>
      <div className="mb-4">
        <label className="sm:hidden block"><span className="sr-only">{t('Section')}</span>
          <select value={cat} onChange={(e) => setCat(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm font-semibold">{tabs.map((g) => <option key={g.id} value={g.id}>{t(g.name)} ({g.on}/{g.all.length})</option>)}</select></label>
        <div role="tablist" aria-label={t('Sections')} className="hidden sm:flex flex-wrap gap-2">{tabs.map((g) => { const act = !searching && cat === g.id; const dim = searching && g.hits === 0;
          return <button key={g.id} role="tab" type="button" aria-selected={act} onClick={() => { setQ(''); setF('all'); setCat(g.id); }} style={act ? { background: '#16110d', color: '#fffdf8', borderColor: '#16110d' } : undefined} className={`px-3 py-1.5 rounded-lg text-sm border border-stone-400/60 ${dim ? 'opacity-40' : ''}`}>{t(g.name)} <span className={`text-xs ${g.on < g.all.length ? 'text-red-500 font-bold' : 'opacity-70'}`} style={act && g.on < g.all.length ? { color: '#ff9b86' } : undefined}>{searching ? g.hits : `${g.on}/${g.all.length}`}</span></button>; })}</div>
        {searching && <p className="text-xs opacity-70 mt-2">{t('Showing matches from all sections.')}</p>}
      </div>
      {!shownCount && <p className="opacity-70 text-sm py-8 text-center">{t('No tools match.')}</p>}
      <div className="space-y-4">
        {view.map((g) => { const idsAll = g.all.map((x) => x.id); const onCount = g.all.filter((x) => !off.has(x.id)).length; const open = true;
          return (
            <section key={g.id} className="flow-panel p-0 overflow-hidden" aria-label={t(g.name)}>
              <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-black/10">
                <h3 className="font-bold text-start grow">{t(g.name)} <span className="font-normal text-xs opacity-70">· {onCount}/{g.all.length} {t('live')}</span></h3>
                <button type="button" className="flow-ghost px-2.5 py-1 rounded text-xs" disabled={!!busy || onCount === 0} onClick={() => setMany(idsAll, false, g.id)}>{t('Switch all off')}</button>
                <button type="button" className="flow-ghost px-2.5 py-1 rounded text-xs" disabled={!!busy || onCount === g.all.length} onClick={() => setMany(idsAll, true, g.id)}>{t('Switch all on')}</button>
              </div>
              {open && <ul className="grid sm:grid-cols-2 xl:grid-cols-3 gap-px bg-black/5">{g.shown.map((x) => { const isOff = off.has(x.id); const Icon = x.icon;
                return (
                  <li key={x.id} className={`flex items-center gap-3 px-4 py-2.5 bg-[var(--surface,#fffdf8)] ${isOff ? 'opacity-70' : ''}`}>
                    <Icon size={16} aria-hidden="true" className="shrink-0 opacity-70" />
                    <div className="grow min-w-0"><p className={`text-sm font-medium truncate ${isOff ? 'line-through' : ''}`}>{t(x.title)}</p>
                      <p className="text-[11px] opacity-60 flex items-center gap-1.5" dir="ltr">{x.id}{adv.has(x.id) && <span className="inline-flex items-center gap-0.5 text-amber-700"><Gauge size={11} aria-hidden="true" />{t('advanced')}</span>}</p></div>
                    <Link to={`/tools/${x.id}`} aria-label={`${t('Open')} ${t(x.title)}`} className="opacity-50 hover:opacity-100"><ExternalLink size={14} /></Link>
                    <Switch on={!isOff} label={t(x.title)} busy={busy === x.id} onClick={() => setMany([x.id], isOff, x.id)} />
                  </li>); })}</ul>}
            </section>); })}
      </div>
    </div>
  );
};
