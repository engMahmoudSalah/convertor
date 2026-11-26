import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, Search } from 'lucide-react';
import { api } from '../lib/api';
import { useT } from '../lib/i18n';
import { EmptyArt } from './PageArt';

const SIZE = 25;
const KIND: Record<string, string> = { li: 'Login attempts', su: 'Signups', fg: 'Password reset', fgm: 'Password reset', rs: 'Reset link', pw: 'Password change', del: 'Account delete', vf: 'Verify link', rv: 'Resend verify', gs: 'Google start' };
const tone = (a: string) => (a === 'rate_limited' ? 'border-amber-500/50 text-amber-600' : a === 'ban' || a === 'mail_failed' ? 'border-red-500/50 text-red-600' : 'border-sky-500/40 text-sky-600');
const inp = 'w-full rounded-lg border px-3 py-2 text-sm bg-transparent';
const chipStyle = (on: boolean) => (on ? { background: 'var(--ink,#111)', color: 'var(--paper,#fff)' } : undefined);

export const AdminAudit: React.FC<{ mode: 'abuse' | 'audit' }> = ({ mode }) => {
  const { t } = useT();
  const [days, setDays] = useState(mode === 'abuse' ? 7 : 0); const [q, setQ] = useState(''); const [dq, setDq] = useState(''); const [act, setAct] = useState(''); const [page, setPage] = useState(1);
  const [d, setD] = useState<any>({ audit: [], total: 0, actions: [] }); const [ab, setAb] = useState<any>(null); const timer = useRef<any>(null);
  useEffect(() => { clearTimeout(timer.current); timer.current = setTimeout(() => { setDq(q); setPage(1); }, 350); return () => clearTimeout(timer.current); }, [q]);
  const qs = useCallback((extra = '') => { const p = new URLSearchParams({ q: dq }); if (act) p.set('action', act); if (mode === 'abuse') p.set('group', 'abuse'); if (days) p.set('days', String(days)); return p.toString() + extra; }, [dq, act, days, mode]);
  useEffect(() => { let ok = true; api(`/admin/audit?${qs(`&page=${page}&size=${SIZE}`)}`).then((r) => { if (ok && r.audit) setD(r); }); return () => { ok = false; }; }, [qs, page]);
  useEffect(() => { if (mode !== 'abuse') return; let ok = true; api(`/admin/abuse?days=${days || 7}`).then((r) => { if (ok && r.byKind) setAb(r); }); return () => { ok = false; }; }, [mode, days]);
  const pages = Math.max(1, Math.ceil(d.total / SIZE));
  const csv = async () => { const r = await api(`/admin/audit?${qs('&page=1&size=2000')}`); const rows = [['time', 'actor', 'action', 'target', 'detail'], ...(r.audit ?? []).map((a: any) => [new Date(a.ts).toISOString(), a.actor, a.action, a.target, a.detail])]; const b = new Blob(['\ufeff' + rows.map((x) => x.map((c: any) => { let v = String(c ?? ''); if (/^[=+\-@]/.test(v)) v = "'" + v; return '"' + v.replace(/"/g, '""') + '"'; }).join(',')).join('\n')], { type: 'text/csv' }); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `${mode}.csv`; a.click(); URL.revokeObjectURL(a.href); };
  const periods = mode === 'abuse' ? [1, 7, 30] : [0, 1, 7, 30];
  const nDays = ab?.days ?? 7; const day0 = Math.floor(Date.now() / 864e5) - nDays + 1; const pd = new Map<string, number>((ab?.perDay ?? []).map((x: any) => [x.d, x.n])); const vals = Array.from({ length: nDays }, (_, i) => { const k = new Date((day0 + i) * 864e5).toISOString().slice(0, 10); return { k, n: pd.get(k) ?? 0 }; }); const mx = Math.max(1, ...vals.map((v) => v.n));
  const actions = mode === 'abuse' ? ['rate_limited', 'ban', 'mail_failed'] : d.actions.map((x: any) => x.action);
  return <div>
    <div className="flex flex-wrap gap-2 mb-4" role="group" aria-label={t('Period')}>{periods.map((n) => <button key={n} type="button" aria-pressed={days === n} style={chipStyle(days === n)} className="flow-ghost px-3 py-1.5 rounded-full text-xs font-semibold" onClick={() => { setDays(n); setPage(1); }}>{n === 0 ? t('All time') : n === 1 ? t('Last 24 hours') : t(`Last ${n} days`)}</button>)}</div>
    {mode === 'abuse' && ab && <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="flow-panel p-4"><p className="text-xs opacity-70">{t('Blocked by rate limit')}</p><p className="text-xl font-bold">{ab.limited}</p></div>
        <div className="flow-panel p-4"><p className="text-xs opacity-70">{t('Bans')}</p><p className="text-xl font-bold">{ab.bans}</p></div>
        <div className="flow-panel p-4"><p className="text-xs opacity-70">{t('Emails that failed')}</p><p className="text-xl font-bold">{ab.mailFailed}</p></div>
        <div className="flow-panel p-4"><p className="text-xs opacity-70">{t('Busiest target')}</p><p className="text-lg font-bold">{ab.byKind[0] ? t(KIND[ab.byKind[0].k] ?? ab.byKind[0].k) : '-'}</p></div></div>
      <div className="grid md:grid-cols-2 gap-3 mb-4">
        <div className="flow-panel p-4"><p className="text-xs opacity-70 mb-2">{t('Blocked requests per day')}</p><div className="flex items-end gap-px h-16" dir="ltr" role="img" aria-label={t('Blocked requests per day')}>{vals.map((v) => <div key={v.k} title={`${v.k}: ${v.n}`} className="grow rounded-sm" style={{ height: `${Math.max(v.n ? 8 : 2, (v.n / mx) * 100)}%`, background: v.n ? 'var(--accent,#e8603c)' : 'currentColor', opacity: v.n ? 1 : 0.15 }} />)}</div></div>
        <div className="flow-panel p-4"><p className="text-xs opacity-70 mb-2">{t('Blocked by type')}</p>{ab.byKind.length ? <ul className="text-sm space-y-1">{ab.byKind.map((k: any) => <li key={k.k} className="flex justify-between"><span>{t(KIND[k.k] ?? k.k)}</span><span dir="ltr" className="font-semibold">{k.n}</span></li>)}</ul> : <p className="text-sm opacity-70">{t('No abuse events')}</p>}</div></div></>}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
      <label className="relative col-span-2 block"><span className="sr-only">{t('Filter the audit log')}</span><Search size={14} className="absolute top-3 start-3 opacity-60" aria-hidden="true" /><input aria-label={t('Filter the audit log')} className={inp + ' ps-8'} placeholder={t('Filter the audit log')} value={q} onChange={(e) => setQ(e.target.value)} /></label>
      <select aria-label={t('Action')} className={inp + ' col-span-2 md:col-span-1'} value={act} onChange={(e) => { setAct(e.target.value); setPage(1); }}><option value="">{t('All actions')}</option>{actions.map((a: string) => <option key={a} value={a}>{a}</option>)}</select>
      <button type="button" className="flow-ghost px-3 py-2 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 col-span-2 md:col-span-1" onClick={csv}><Download size={14} aria-hidden="true" />{t('Export CSV')}</button></div>
    <p className="text-sm mb-2" aria-live="polite">{d.total} {t('events')}</p>
    {d.audit.length ? <ul className="divide-y divide-white/10">{d.audit.map((a: any) => <li key={a.id} className="py-2 text-sm flex flex-wrap items-start gap-x-3 gap-y-1"><span className="text-xs opacity-70 whitespace-nowrap w-40" dir="ltr">{new Date(a.ts).toLocaleString()}</span><span className={`text-[11px] px-1.5 py-0.5 rounded-full border ${tone(a.action)}`} dir="ltr">{a.action}</span><span className="grow basis-48 break-all" dir="ltr"><span className="opacity-70">{a.actor}</span>{a.target ? ` → ${a.target}` : ''}{a.detail ? <span className="block text-xs opacity-70">{a.detail}</span> : null}</span></li>)}</ul> : <EmptyArt text={mode === 'abuse' ? t('No abuse events') : t('No events match these filters.')} />}
    {pages > 1 && <div className="flex items-center justify-center gap-3 mt-3 text-sm"><button type="button" aria-label={t('Previous')} disabled={page <= 1} className="flow-ghost p-2 rounded-lg disabled:opacity-40" onClick={() => setPage(page - 1)}><ChevronLeft size={16} className="rtl:rotate-180" /></button><span>{page} / {pages}</span><button type="button" aria-label={t('Next')} disabled={page >= pages} className="flow-ghost p-2 rounded-lg disabled:opacity-40" onClick={() => setPage(page + 1)}><ChevronRight size={16} className="rtl:rotate-180" /></button></div>}
  </div>;
};
