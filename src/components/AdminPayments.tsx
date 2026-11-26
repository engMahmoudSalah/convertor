import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, Search } from 'lucide-react';
import { api } from '../lib/api';
import { useT } from '../lib/i18n';
import { EmptyArt } from './PageArt';

const SIZE = 20;
const STATUSES = ['all', 'paid', 'pending', 'failed', 'refunded'] as const;
const TONE: Record<string, string> = { paid: 'border-emerald-500/50 text-emerald-600', pending: 'border-amber-500/50 text-amber-600', failed: 'border-red-500/50 text-red-600', refunded: 'border-sky-500/50 text-sky-600' };
const inp = 'w-full rounded-lg border px-3 py-2 text-sm bg-transparent';
const fmt = (n: number, c: string) => `${Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${c}`;

export const AdminPayments: React.FC<{ sysPayments: boolean; plans: { id: string; name: string }[] }> = ({ sysPayments, plans }) => {
  const { t } = useT();
  const [q, setQ] = useState(''); const [dq, setDq] = useState(''); const [status, setStatus] = useState<(typeof STATUSES)[number]>('all'); const [cur, setCur] = useState(''); const [prov, setProv] = useState(''); const [plan, setPlan] = useState(''); const [days, setDays] = useState('0'); const [page, setPage] = useState(1);
  const [d, setD] = useState<any>({ orders: [], total: 0, totals: [], byDay: [], providers: [] }); const [open, setOpen] = useState(''); const timer = useRef<any>(null);
  useEffect(() => { clearTimeout(timer.current); timer.current = setTimeout(() => { setDq(q); setPage(1); }, 350); return () => clearTimeout(timer.current); }, [q]);
  const qs = useCallback((extra = '') => {
    const p = new URLSearchParams({ q: dq }); if (status !== 'all') p.set('status', status); if (cur) p.set('currency', cur); if (prov) p.set('provider', prov); if (plan) p.set('plan', plan);
    if (days !== '0') p.set('from', String(Date.now() - Number(days) * 864e5)); return p.toString() + extra;
  }, [dq, status, cur, prov, plan, days]);
  useEffect(() => { let ok = true; api(`/admin/orders?${qs(`&page=${page}&size=${SIZE}`)}`).then((r) => { if (ok && r.orders) setD(r); }); return () => { ok = false; }; }, [qs, page]);
  const pages = Math.max(1, Math.ceil(d.total / SIZE));
  const paid = (c: string) => d.totals.filter((x: any) => x.status === 'paid' && x.currency === c).reduce((a: number, x: any) => a + x.amt, 0);
  const cnt = (s: string) => d.totals.filter((x: any) => x.status === s).reduce((a: number, x: any) => a + x.n, 0);
  const currencies = Array.from(new Set<string>(d.totals.map((x: any) => x.currency)));
  const days30 = Array.from({ length: 30 }, (_, i) => Math.floor((Date.now() - (29 - i) * 864e5) / 864e5));
  const max = Math.max(1, ...days30.map((k) => d.byDay.filter((x: any) => x.d === k).reduce((a: number, x: any) => a + x.n, 0)));
  const csv = async () => {
    const r = await api(`/admin/orders?${qs('&page=1&size=2000')}`); const rows = [['id', 'date', 'email', 'plan', 'provider', 'amount', 'currency', 'status', 'ref', 'tx_id', 'paid_at'], ...(r.orders ?? []).map((o: any) => [o.id, new Date(o.created_at).toISOString(), o.email ?? '', o.plan, o.provider, o.amount, o.currency, o.status, o.ref, o.tx_id, o.paid_at ? new Date(o.paid_at).toISOString() : ''])];
    const b = new Blob(['\ufeff' + rows.map((x) => x.map((c: any) => { let v = String(c); if (/^[=+\-@]/.test(v)) v = "'" + v; return '"' + v.replace(/"/g, '""') + '"'; }).join(',')).join('\n')], { type: 'text/csv' }); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'orders.csv'; a.click(); URL.revokeObjectURL(a.href);
  };
  const chip = (on: boolean) => (on ? { background: 'var(--ink,#111)', color: 'var(--paper,#fff)' } : undefined);
  return <div>
    {!sysPayments && <p className="text-sm mb-4 px-3 py-2 rounded-lg border border-amber-500/50" role="status">{t('Payment keys are not added yet. Orders will appear here once checkout is on.')}</p>}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
      {(currencies.length ? currencies : ['EGP', 'USD']).map((c) => <div key={c} className="flow-panel p-4"><p className="text-xs opacity-70">{t('Revenue')} · {c}</p><p className="text-xl font-bold" dir="ltr">{fmt(paid(c), c)}</p></div>)}
      <div className="flow-panel p-4"><p className="text-xs opacity-70">{t('Paid orders')}</p><p className="text-xl font-bold">{cnt('paid')}</p></div>
      <div className="flow-panel p-4"><p className="text-xs opacity-70">{t('Pending / failed')}</p><p className="text-xl font-bold">{cnt('pending')} / {cnt('failed')}</p></div>
    </div>
    <div className="flow-panel p-4 mb-4"><p className="text-xs opacity-70 mb-2">{t('Paid orders, last 30 days')}</p>
      <div className="flex items-end gap-0.5 h-16" dir="ltr" role="img" aria-label={t('Paid orders, last 30 days')}>{days30.map((k) => { const n = d.byDay.filter((x: any) => x.d === k).reduce((a: number, x: any) => a + x.n, 0); return <div key={k} title={`${new Date(k * 864e5).toLocaleDateString()}: ${n}`} className="grow rounded-sm" style={{ height: `${Math.max(n ? 8 : 2, (n / max) * 100)}%`, background: n ? 'var(--accent,#e8603c)' : 'currentColor', opacity: n ? 1 : 0.15 }} />; })}</div></div>
    <div className="flex flex-wrap gap-2 mb-3" role="group" aria-label={t('Status')}>{STATUSES.map((s) => <button key={s} type="button" aria-pressed={status === s} style={chip(status === s)} className="flow-ghost px-3 py-1.5 rounded-full text-xs font-semibold" onClick={() => { setStatus(s); setPage(1); }}>{t(s === 'all' ? 'All' : s)}{s !== 'all' && ` (${cnt(s)})`}</button>)}</div>
    <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-3">
      <label className="relative col-span-2 block"><span className="sr-only">{t('Search orders')}</span><Search size={14} className="absolute top-3 start-3 opacity-60" aria-hidden="true" /><input className={inp + ' ps-8'} placeholder={t('Email, order id or reference')} value={q} onChange={(e) => setQ(e.target.value)} /></label>
      <select aria-label={t('Currency')} className={inp} value={cur} onChange={(e) => { setCur(e.target.value); setPage(1); }}><option value="">{t('All currencies')}</option><option>EGP</option><option>USD</option></select>
      <select aria-label={t('Provider')} className={inp} value={prov} onChange={(e) => { setProv(e.target.value); setPage(1); }}><option value="">{t('All providers')}</option>{d.providers.map((p: string) => <option key={p}>{p}</option>)}</select>
      <select aria-label={t('Plan')} className={inp} value={plan} onChange={(e) => { setPlan(e.target.value); setPage(1); }}><option value="">{t('All plans')}</option>{plans.filter((p) => p.id !== 'guest' && p.id !== 'free').map((p) => <option key={p.id} value={p.id}>{t(p.name)}</option>)}</select>
      <select aria-label={t('Period')} className={inp} value={days} onChange={(e) => { setDays(e.target.value); setPage(1); }}><option value="0">{t('All time')}</option><option value="7">{t('Last 7 days')}</option><option value="30">{t('Last 30 days')}</option></select>
    </div>
    <div className="flex items-center justify-between mb-2 text-sm"><span aria-live="polite">{d.total} {t('orders')}</span><button type="button" className="flow-ghost px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5" onClick={csv}><Download size={14} aria-hidden="true" />{t('Export CSV')}</button></div>
    {d.orders.length ? <div className="overflow-x-auto"><table className="text-sm w-full"><thead><tr>{['Date', 'Email', 'Plan', 'Amount', 'Status'].map((h) => <th key={h} className={(h === 'Email' || h === 'Plan' ? 'hidden md:table-cell ' : '') + "text-start pe-3 py-2 font-semibold opacity-70 whitespace-nowrap"}>{t(h)}</th>)}</tr></thead><tbody>{d.orders.map((o: any) => <React.Fragment key={o.id}>
      <tr className="border-t border-white/10 cursor-pointer" onClick={() => setOpen(open === o.id ? '' : o.id)}><td className="py-2 pe-3" dir="ltr">{new Date(o.created_at).toLocaleDateString()}<span className="md:hidden block text-xs opacity-70 break-all">{o.email ?? '-'} · {o.plan}</span><span className="hidden md:inline"> {new Date(o.created_at).toLocaleTimeString()}</span></td><td className="pe-3 hidden md:table-cell" dir="ltr">{o.email ?? '-'}</td><td className="pe-3 hidden md:table-cell">{o.plan}</td><td className="pe-3 whitespace-nowrap" dir="ltr">{fmt(o.amount, o.currency)}</td><td><span className={`text-[11px] px-1.5 py-0.5 rounded-full border ${TONE[o.status] ?? ''}`}>{t(o.status)}</span> <button type="button" className="text-xs underline ms-2" aria-expanded={open === o.id}>{t('Details')}</button></td></tr>
      {open === o.id && <tr><td colSpan={5} className="pb-3 text-xs opacity-80" dir="ltr">id: {o.id} · provider: {o.provider} · ref: {o.ref || '-'} · tx: {o.tx_id || '-'} · paid: {o.paid_at ? new Date(o.paid_at).toLocaleString() : '-'}</td></tr>}</React.Fragment>)}</tbody></table></div> : <EmptyArt text={d.total === 0 && !dq && status === 'all' && !cur && !prov && !plan && days === '0' ? t('No orders yet. Payments open when the payment keys are added.') : t('No orders match these filters.')} />}
    {pages > 1 && <div className="flex items-center justify-center gap-3 mt-3 text-sm"><button type="button" aria-label={t('Previous')} disabled={page <= 1} className="flow-ghost p-2 rounded-lg disabled:opacity-40" onClick={() => setPage(page - 1)}><ChevronLeft size={16} className="rtl:rotate-180" /></button><span>{page} / {pages}</span><button type="button" aria-label={t('Next')} disabled={page >= pages} className="flow-ghost p-2 rounded-lg disabled:opacity-40" onClick={() => setPage(page + 1)}><ChevronRight size={16} className="rtl:rotate-180" /></button></div>}
  </div>;
};
