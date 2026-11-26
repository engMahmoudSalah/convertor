import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BadgeCheck, ChevronLeft, ChevronRight, Download, LogOut, Search, Shield, ShieldOff, UserX, UserCheck } from 'lucide-react';
import { api } from '../lib/api';
import { useT } from '../lib/i18n';

type Seg = 'all' | 'paid' | 'free' | 'banned' | 'admin';
const SIZE = 20;
const Badge: React.FC<{ tone: string; children: React.ReactNode }> = ({ tone, children }) => <span className={`inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-full border ${tone}`}>{children}</span>;
const ago = (ts: number | null, lang: string) => { if (!ts) return '-'; const d = Math.floor((Date.now() - ts) / 864e5); const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' }); return d < 1 ? rtf.format(0, 'day') : rtf.format(-d, 'day'); };

export const AdminUsers: React.FC<{ plans: { id: string; name: string }[]; toast: (m: string) => void }> = ({ plans, toast }) => {
  const { t, lang } = useT();
  const [q, setQ] = useState(''); const [dq, setDq] = useState(''); const [seg, setSeg] = useState<Seg>('all'); const [plan, setPlan] = useState(''); const [verified, setVerified] = useState(''); const [sort, setSort] = useState('newest'); const [page, setPage] = useState(1);
  const [data, setData] = useState<any>({ users: [], total: 0, counts: { total: 0, paid: 0, banned: 0, verified: 0, admins: 0 } }); const [busy, setBusy] = useState(''); const [sel, setSel] = useState<Set<string>>(new Set()); const [loading, setLoading] = useState(true);
  const timer = useRef<any>(null);
  useEffect(() => { clearTimeout(timer.current); timer.current = setTimeout(() => { setDq(q); setPage(1); }, 350); return () => clearTimeout(timer.current); }, [q]);
  const params = useCallback((extra = '') => {
    const p = new URLSearchParams({ q: dq, sort });
    if (seg === 'paid') p.set('paid', '1'); if (seg === 'free') p.set('paid', '0'); if (seg === 'banned') p.set('status', 'banned'); if (seg === 'admin') p.set('role', 'admin');
    if (plan) p.set('plan', plan); if (verified) p.set('verified', verified);
    return p.toString() + extra;
  }, [dq, sort, seg, plan, verified]);
  const load = useCallback(async () => { setLoading(true); const r = await api(`/admin/users?${params(`&page=${page}&size=${SIZE}`)}`); if (r._status === 200) setData(r); setLoading(false); }, [params, page]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); setSel(new Set()); }, [seg, plan, verified, sort]);
  const act = async (id: string, body: any, key: string) => { setBusy(key + id); const r = await api('/admin/user', { id, ...body }); if (r.error) toast(String(r.error)); await load(); setBusy(''); };
  const bulk = async (body: any) => { setBusy('bulk'); let bad = ''; for (const id of sel) { const r = await api('/admin/user', { id, ...body }); if (r.error) bad = String(r.error); } if (bad) toast(bad); setSel(new Set()); await load(); setBusy(''); };
  const csv = async () => {
    const r = await api(`/admin/users?${params('&page=1&size=2000')}`); const rows = [['email', 'name', 'plan', 'role', 'suspended', 'verified', 'google', 'joined', 'last_login', 'jobs_30d'], ...(r.users ?? []).map((x: any) => [x.email, x.name ?? '', x.plan, x.role, x.banned ? 'yes' : 'no', x.email_verified ? 'yes' : 'no', x.google ? 'yes' : 'no', new Date(x.created_at).toISOString(), x.last_login ? new Date(x.last_login).toISOString() : '', x.jobs30])];
    const b = new Blob(['\ufeff' + rows.map((r2) => r2.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n')], { type: 'text/csv' }); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'users.csv'; a.click(); URL.revokeObjectURL(a.href);
  };
  const c = data.counts; const pages = Math.max(1, Math.ceil(data.total / SIZE)); const from = data.total ? (page - 1) * SIZE + 1 : 0; const to = Math.min(page * SIZE, data.total);
  const segs: [Seg, string, number][] = [['all', t('All'), c.total], ['paid', t('Paid'), c.paid], ['free', t('Free'), c.total - c.paid], ['banned', t('Suspended'), c.banned], ['admin', t('Admins'), c.admins]];
  const field = 'bg-white/5 border border-white/10 rounded-lg px-2.5 py-2 text-sm';
  const selectable = data.users.filter((x: any) => !x.me);
  const allSel = selectable.length > 0 && selectable.every((x: any) => sel.has(x.id));
  return (
    <div>
      <div role="tablist" aria-label={t('Segments')} className="flex flex-wrap gap-2 mb-4">{segs.map(([k, label, n]) => <button key={k} role="tab" type="button" aria-selected={seg === k} onClick={() => setSeg(k)} style={seg === k ? { background: '#16110d', color: '#fffdf8', borderColor: '#16110d' } : undefined} className="px-3 py-1.5 rounded-lg text-sm border border-stone-400/60">{label} <span className="text-xs opacity-75">{n}</span></button>)}</div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative grow min-w-[12rem] max-w-sm"><Search size={15} className="absolute top-1/2 -translate-y-1/2 start-3 opacity-60" aria-hidden="true" /><input aria-label={t('Search email or name')} placeholder={t('Search email or name')} value={q} onChange={(e) => setQ(e.target.value)} className={`${field} w-full ps-9`} /></div>
        <select aria-label={t('Filter by plan')} className={field} value={plan} onChange={(e) => setPlan(e.target.value)}><option value="">{t('All plans')}</option>{plans.filter((p) => p.id !== 'guest').map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <select aria-label={t('Email status')} className={field} value={verified} onChange={(e) => setVerified(e.target.value)}><option value="">{t('Any email status')}</option><option value="1">{t('Verified')}</option><option value="0">{t('Not verified')}</option></select>
        <select aria-label={t('Sort by')} className={field} value={sort} onChange={(e) => setSort(e.target.value)}><option value="newest">{t('Newest first')}</option><option value="oldest">{t('Oldest first')}</option><option value="login">{t('Last active')}</option><option value="email">{t('Email A-Z')}</option></select>
        <button type="button" className="flow-ghost px-3 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-1.5" onClick={csv}><Download size={14} aria-hidden="true" />{t('Export CSV')}</button>
      </div>
      {sel.size > 0 && <div className="flow-panel p-3 mb-3 flex flex-wrap items-center gap-2 text-sm" role="region" aria-label={t('Bulk actions')}><b>{sel.size} {t('selected')}</b>
        <select aria-label={t('Set plan')} className={field} defaultValue="" disabled={busy === 'bulk'} onChange={(e) => { if (e.target.value) { bulk({ plan: e.target.value }); e.target.value = ''; } }}><option value="">{t('Set plan...')}</option>{plans.filter((p) => p.id !== 'guest').map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <button type="button" className="flow-ghost px-2.5 py-1.5 rounded text-xs" disabled={busy === 'bulk'} onClick={() => bulk({ banned: true })}>{t('Suspend')}</button>
        <button type="button" className="flow-ghost px-2.5 py-1.5 rounded text-xs" disabled={busy === 'bulk'} onClick={() => bulk({ banned: false })}>{t('Restore')}</button>
        <button type="button" className="flow-ghost px-2.5 py-1.5 rounded text-xs" onClick={() => setSel(new Set())}>{t('Clear')}</button></div>}
      <div className="flow-panel p-0 overflow-hidden">
        <div className="hidden md:grid grid-cols-[2rem_minmax(0,2.4fr)_8rem_7rem_6rem_auto] gap-3 px-4 py-2 text-xs opacity-70 border-b border-black/10 items-center">
          <input type="checkbox" aria-label={t('Select all on this page')} checked={allSel} onChange={() => setSel(allSel ? new Set() : new Set(selectable.map((x: any) => x.id)))} />
          <span>{t('User')}</span><span>{t('Plan')}</span><span>{t('Last active')}</span><span>{t('Jobs (30d)')}</span><span>{t('Actions')}</span></div>
        {!data.users.length && <p className="py-10 text-center opacity-70 text-sm">{loading ? t('Loading...') : t('No users match.')}</p>}
        <ul>{data.users.map((x: any) => (
          <li key={x.id} className={`grid grid-cols-[2rem_minmax(0,1fr)] md:grid-cols-[2rem_minmax(0,2.4fr)_8rem_7rem_6rem_auto] gap-x-3 gap-y-2 px-4 py-3 border-t border-black/10 items-center ${x.banned ? 'bg-red-500/5' : ''}`}>
            <input type="checkbox" aria-label={`${t('Select')} ${x.email}`} disabled={x.me} checked={sel.has(x.id)} onChange={() => { const n = new Set(sel); n.has(x.id) ? n.delete(x.id) : n.add(x.id); setSel(n); }} />
            <div className="min-w-0"><p className="text-sm font-medium truncate" dir="ltr" style={{ textAlign: 'start' }}>{x.email}</p>
              <p className="flex flex-wrap items-center gap-1.5 mt-0.5"><span className="text-xs opacity-70">{x.name || ''}</span>
                {x.me && <Badge tone="border-stone-400/60">{t('You')}</Badge>}{x.role === 'admin' && <Badge tone="border-amber-600/60 text-amber-700"><Shield size={10} aria-hidden="true" />{t('Administrator')}</Badge>}
                {x.banned ? <Badge tone="border-red-500/60 text-red-600">{t('Suspended')}</Badge> : null}{x.email_verified ? <Badge tone="border-emerald-600/50 text-emerald-700"><BadgeCheck size={10} aria-hidden="true" />{t('Verified')}</Badge> : <Badge tone="border-stone-400/50 opacity-70">{t('Not verified')}</Badge>}
                {x.google ? <Badge tone="border-sky-600/50 text-sky-700">Google</Badge> : null}</p></div>
            <div className="col-start-2 md:col-start-auto flex items-center gap-2"><select aria-label={`${t('Plan')} ${x.email}`} className={`${field} !py-1.5 w-full`} value={x.plan} disabled={busy === 'plan' + x.id} onChange={(e) => act(x.id, { plan: e.target.value }, 'plan')}>{plans.filter((p) => p.id !== 'guest').map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
            <p className="col-start-2 md:col-start-auto text-xs opacity-80"><span className="md:hidden opacity-60">{t('Last active')}: </span>{ago(x.last_login, lang)}<span className="block opacity-60">{t('Joined')} {new Date(x.created_at).toLocaleDateString()}</span></p>
            <p className="col-start-2 md:col-start-auto text-xs"><span className="md:hidden opacity-60">{t('Jobs (30d)')}: </span><b>{x.jobs30}</b>{x.saved ? <span className="opacity-60"> · {x.saved} {t('saved')}</span> : null}</p>
            <div className="col-start-2 md:col-start-auto flex flex-wrap gap-1.5">
              <button type="button" disabled={x.me || busy === 'ban' + x.id} onClick={() => act(x.id, { banned: !x.banned }, 'ban')} className="flow-ghost px-2 py-1 rounded text-xs inline-flex items-center gap-1 disabled:opacity-40">{x.banned ? <UserCheck size={12} aria-hidden="true" /> : <UserX size={12} aria-hidden="true" />}{t(x.banned ? 'Restore' : 'Suspend')}</button>
              <button type="button" disabled={x.me || busy === 'role' + x.id} onClick={() => act(x.id, { role: x.role === 'admin' ? 'user' : 'admin' }, 'role')} className="flow-ghost px-2 py-1 rounded text-xs inline-flex items-center gap-1 disabled:opacity-40">{x.role === 'admin' ? <ShieldOff size={12} aria-hidden="true" /> : <Shield size={12} aria-hidden="true" />}{t(x.role === 'admin' ? 'Remove admin' : 'Make admin')}</button>
              <button type="button" disabled={busy === 'out' + x.id} onClick={() => { act(x.id, { signout: true }, 'out'); toast(t('Signed out everywhere')); }} className="flow-ghost px-2 py-1 rounded text-xs inline-flex items-center gap-1" aria-label={`${t('Sign out everywhere')} ${x.email}`}><LogOut size={12} aria-hidden="true" />{t('Sign out')}</button>
            </div>
          </li>))}</ul>
      </div>
      <div className="flex items-center justify-between gap-3 mt-3 text-sm"><span className="opacity-70" aria-live="polite">{from}-{to} / {data.total}</span>
        <div className="flex items-center gap-2"><button type="button" aria-label={t('Previous page')} className="flow-ghost p-2 rounded-lg disabled:opacity-40" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft size={16} className="rtl:rotate-180" /></button><span>{page} / {pages}</span>
          <button type="button" aria-label={t('Next page')} className="flow-ghost p-2 rounded-lg disabled:opacity-40" disabled={page >= pages} onClick={() => setPage(page + 1)}><ChevronRight size={16} className="rtl:rotate-180" /></button></div></div>
    </div>
  );
};
