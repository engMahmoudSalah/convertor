import React, { useEffect, useMemo, useState } from 'react';
import { Download, TrendingDown, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useT } from '../lib/i18n';
import { TOOLS, TYPES, toolsOfType } from '../tools/registry';

const fmtB = (n: number) => (n > 1e9 ? (n / 1e9).toFixed(1) + ' GB' : n > 1e6 ? (n / 1e6).toFixed(1) + ' MB' : n > 1e3 ? Math.round(n / 1e3) + ' KB' : Math.round(n || 0) + ' B');
type Sort = 'n' | 'bytes' | 'ms' | 'visitors';
const Delta: React.FC<{ a: number; b: number }> = ({ a, b }) => { const { t } = useT(); if (!b) return <span className="text-xs opacity-60">{a ? t('new') : '-'}</span>; const p = Math.round(((a - b) / b) * 100); const up = p >= 0; const I = up ? TrendingUp : TrendingDown; return <span dir="ltr" className={`text-xs inline-flex items-center gap-1 ${up ? 'text-emerald-600' : 'text-red-600'}`}><I size={12} aria-hidden="true" />{up ? '+' : ''}{p}%</span>; };
const Chart: React.FC<{ title: string; vals: { k: string; n: number; tip: string }[] }> = ({ title, vals }) => { const mx = Math.max(1, ...vals.map((v) => v.n)); return <div className="flow-panel p-4"><p className="text-xs opacity-70 mb-2">{title}</p><div className="flex items-end gap-px h-20" dir="ltr" role="img" aria-label={title}>{vals.map((v) => <div key={v.k} title={v.tip} className="grow rounded-sm" style={{ height: `${Math.max(v.n ? 8 : 2, (v.n / mx) * 100)}%`, background: v.n ? 'var(--accent,#e8603c)' : 'currentColor', opacity: v.n ? 1 : 0.15 }} />)}</div></div>; };

export const AdminUsage: React.FC = () => {
  const { t } = useT();
  const [days, setDays] = useState(30); const [d, setD] = useState<any>(null); const [sec, setSec] = useState('all'); const [sort, setSort] = useState<Sort>('n'); const [unused, setUnused] = useState(false);
  useEffect(() => { let ok = true; setD(null); api(`/admin/usage?days=${days}`).then((r) => { if (ok && r.cur) setD(r); }); return () => { ok = false; }; }, [days]);
  const rows = useMemo(() => {
    if (!d) return [] as any[];
    const m = new Map<string, any>(d.tools.map((x: any) => [x.tool, x])); const ids = sec === 'all' ? TOOLS.map((x) => x.id) : toolsOfType(sec).map((x) => x.id);
    const base = ids.map((id) => ({ tool: id, title: TOOLS.find((x) => x.id === id)?.title ?? id, n: 0, bytes: 0, ms: 0, visitors: 0, files: 0, ...(m.get(id) ?? {}) }));
    if (sec === 'all') d.tools.filter((x: any) => !ids.includes(x.tool)).forEach((x: any) => base.push({ ...x, title: x.tool, unknown: true }));
    return base.filter((r) => (unused ? r.n === 0 : true)).sort((a, b) => (unused ? a.title.localeCompare(b.title) : b[sort] - a[sort]));
  }, [d, sec, sort, unused]);
  const csv = () => { const r2 = [['tool', 'jobs', 'files', 'bytes', 'avg_ms', 'visitors'], ...rows.map((r) => [r.tool, r.n, r.files, r.bytes, Math.round(r.ms), r.visitors])]; const b = new Blob(['\ufeff' + r2.map((x) => x.join(',')).join('\n')], { type: 'text/csv' }); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `usage-${days}d.csv`; a.click(); URL.revokeObjectURL(a.href); };
  const chip = (on: boolean) => (on ? { background: 'var(--ink,#111)', color: 'var(--paper,#fff)' } : undefined);
  if (!d) return <p className="text-sm opacity-70" role="status">{t('Loading')}...</p>;
  const day0 = Math.floor(Date.now() / 864e5) - days + 1; const pd = new Map<string, any>(d.perDay.map((x: any) => [x.d, x]));
  const dayVals = Array.from({ length: days }, (_, i) => { const k = new Date((day0 + i) * 864e5).toISOString().slice(0, 10); const x = pd.get(k); return { k, n: x?.n ?? 0, tip: `${k}: ${x?.n ?? 0}` }; });
  const hourVals = Array.from({ length: 24 }, (_, h) => { const x = d.perHour.find((r: any) => r.h === h); return { k: String(h), n: x?.n ?? 0, tip: `${h}:00 UTC: ${x?.n ?? 0}` }; });
  const used = d.tools.length; const maxN = Math.max(1, ...rows.map((r) => r.n));
  const kpi = (label: string, v: string, a: number, b: number) => <div className="flow-panel p-4"><p className="text-xs opacity-70">{label}</p><p className="text-xl font-bold" dir="ltr">{v}</p><Delta a={a} b={b} /></div>;
  return <div>
    <div className="flex flex-wrap gap-2 mb-4" role="group" aria-label={t('Period')}>{[7, 30, 90].map((n) => <button key={n} type="button" aria-pressed={days === n} style={chip(days === n)} className="flow-ghost px-3 py-1.5 rounded-full text-xs font-semibold" onClick={() => setDays(n)}>{t(`Last ${n} days`)}</button>)}</div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
      {kpi(t('Jobs'), String(d.cur.jobs), d.cur.jobs, d.prev.jobs)}{kpi(t('Data'), fmtB(d.cur.bytes), d.cur.bytes, d.prev.bytes)}{kpi(t('Avg time'), `${Math.round(d.cur.ms)} ms`, d.cur.ms, d.prev.ms)}{kpi(t('Visitors'), String(d.cur.visitors), d.cur.visitors, d.prev.visitors)}
    </div>
    <p className="text-xs opacity-60 mb-3">{t('Change is against the previous period of the same length.')} · {used}/{TOOLS.length} {t('tools used')}</p>
    <div className="grid md:grid-cols-2 gap-3 mb-5"><Chart title={t('Jobs per day')} vals={dayVals} /><Chart title={t('Jobs by hour (UTC)')} vals={hourVals} /></div>
    <div className="flex flex-wrap gap-2 mb-3" role="group" aria-label={t('Section')}>
      <button type="button" aria-pressed={sec === 'all'} style={chip(sec === 'all')} className="flow-ghost px-3 py-1.5 rounded-full text-xs font-semibold" onClick={() => setSec('all')}>{t('All')}</button>
      {Object.keys(TYPES).map((k) => <button key={k} type="button" aria-pressed={sec === k} style={chip(sec === k)} className="flow-ghost px-3 py-1.5 rounded-full text-xs font-semibold" onClick={() => setSec(k)}>{t(TYPES[k].title)}</button>)}</div>
    <div className="flex flex-wrap items-center gap-2 mb-2 text-sm">
      <label className="inline-flex items-center gap-1.5"><span className="opacity-70">{t('Sort by')}</span><select aria-label={t('Sort by')} className="rounded-lg border px-2 py-1 bg-transparent" value={sort} onChange={(e) => setSort(e.target.value as Sort)}><option value="n">{t('Jobs')}</option><option value="bytes">{t('Data')}</option><option value="ms">{t('Avg time')}</option><option value="visitors">{t('Visitors')}</option></select></label>
      <label className="inline-flex items-center gap-1.5"><input type="checkbox" checked={unused} onChange={(e) => setUnused(e.target.checked)} />{t('Only tools with no use')}</label>
      <button type="button" className="ms-auto flow-ghost px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5" onClick={csv}><Download size={14} aria-hidden="true" />{t('Export CSV')}</button></div>
    <div className="overflow-x-auto"><table className="text-sm w-full"><caption className="sr-only">{t('Per tool')}</caption><thead><tr>{['Tool', 'Jobs', 'Data', 'Avg time', 'Visitors'].map((h) => <th key={h} className={(h === 'Avg time' || h === 'Visitors' ? 'hidden md:table-cell ' : '') + 'text-start pe-3 py-2 font-semibold opacity-70 whitespace-nowrap'}>{t(h)}</th>)}</tr></thead>
      <tbody>{rows.map((r) => <tr key={r.tool} className="border-t border-white/10"><td className="py-2 pe-3"><Link to={`/tools/${r.tool}`} className="underline-offset-2 hover:underline">{t(r.title)}</Link><div className="h-1 rounded mt-1" style={{ width: `${(r.n / maxN) * 100}%`, background: 'var(--accent,#e8603c)', minWidth: r.n ? 4 : 0 }} /></td><td className="pe-3" dir="ltr">{r.n}</td><td className="pe-3 whitespace-nowrap" dir="ltr">{fmtB(r.bytes)}</td><td className="pe-3 hidden md:table-cell" dir="ltr">{Math.round(r.ms)} ms</td><td className="hidden md:table-cell" dir="ltr">{r.visitors}</td></tr>)}</tbody></table>
      {!rows.length && <p className="text-sm opacity-70 py-4">{t('No tools match.')}</p>}</div>
  </div>;
};
