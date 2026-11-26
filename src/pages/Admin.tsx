import { AdminOverview } from '../components/AdminOverview';
import { AdminBackup } from '../components/AdminBackup';
import { AdminAudit } from '../components/AdminAudit';
import { AdminAdsSeo } from '../components/AdminAdsSeo';
import { AdminUsage } from '../components/AdminUsage';
import { AdminPayments } from '../components/AdminPayments';
import { PageHeader, CountUp, EmptyArt } from '../components/PageArt';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useT } from '../lib/i18n';
import { TOOLS } from '../tools/registry';
import { AdminTools } from '../components/AdminTools';
import { AdminUsers } from '../components/AdminUsers';
import { AdminPlans } from '../components/AdminPlans';
const card = 'flow-panel p-4';
const inp = 'bg-white/5 border border-white/10 rounded px-2 py-1 text-sm w-24';
const fmtB = (n: number) => (n > 1e9 ? (n / 1e9).toFixed(1) + ' GB' : n > 1e6 ? (n / 1e6).toFixed(1) + ' MB' : n > 1e3 ? Math.round(n / 1e3) + ' KB' : (n || 0) + ' B');
const days = (n = 14) => Array.from({ length: n }, (_, i) => new Date(Date.now() - (n - 1 - i) * 864e5).toISOString().slice(0, 10));
const Bars: React.FC<{ title: string; data: { d: string; n: number }[]; fmt?: (n: number) => string }> = ({ title, data, fmt }) => {
  const ds = days(); const m = new Map(data.map((x) => [x.d, x.n])); const vals = ds.map((d) => m.get(d) ?? 0); const max = Math.max(1, ...vals); const total = vals.reduce((a, b) => a + b, 0);
  return (<figure className={card + ' m-0'} aria-label={title}><figcaption className="text-xs opacity-70 mb-2 flex justify-between"><span>{title}</span><b>{fmt ? fmt(total) : total}</b></figcaption>
    <svg viewBox="0 0 280 80" className="w-full h-24" role="img" aria-label={`${title}: ${vals.join(', ')}`}>{vals.map((v, i) => <rect key={i} x={i * 20 + 2} width="16" y={78 - (v / max) * 74} height={Math.max(v ? 2 : 1, (v / max) * 74)} rx="2" style={{ fill: 'var(--ac)' }} opacity={v ? 1 : 0.25}><title>{ds[i]}: {fmt ? fmt(v) : v}</title></rect>)}</svg>
    <div className="flex justify-between text-[10px] opacity-60" dir="ltr"><span>{ds[0].slice(5)}</span><span>{ds[13].slice(5)}</span></div></figure>);
};
const TABS = ['Overview', 'Users', 'Plans', 'Payments', 'Tools', 'Usage', 'Ads and SEO', 'Abuse', 'Audit', 'Backup'] as const;
export const Admin: React.FC = () => {
  const { t } = useT(); const { user, loading, plans, disabled, heavy, refresh, adminExists } = useAuth();
  const [toast, setToast] = useState(''); const [tab, setTab] = useState<(typeof TABS)[number]>('Overview'); const [ov, setOv] = useState<any>(null); const [sys, setSys] = useState<any>(null); const [orders, setOrders] = useState<any[]>([]); const [abuse, setAbuse] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]); const [q, setQ] = useState(''); const [pf, setPf] = useState(''); const [audit, setAudit] = useState<any[]>([]); const [aq, setAq] = useState(''); const [key, setKey] = useState(''); const [msg, setMsg] = useState(''); const [st, setSt] = useState<any>(null);
  const load = useCallback(async () => {
    const [s, o, u, a, y, ord, ab] = await Promise.all([api('/admin/stats'), api('/admin/overview'), api('/admin/users?size=1'), api('/admin/audit?q=' + encodeURIComponent(aq)), api('/admin/system'), api('/admin/orders'), api('/admin/abuse')]);
    if (s._status === 200) { setSt(s); setOv(o); setUsers(u.users ?? []); setAudit(a.audit ?? []); setSys(y); setOrders(ord.orders ?? []); setAbuse(ab); }
  }, [q, aq]);
  useEffect(() => { if (user?.role === 'admin') load(); }, [user, load]);
  if (loading) return null; if (!user) return <Navigate to="/login?next=/admin" />;
  if (user.role !== 'admin') return (<div className="pt-28 max-w-md mx-auto px-4"><h1 className="text-2xl font-bold mb-3">Admin setup</h1><p className="text-xs text-gray-500 mb-3">Signed in as {user.email}</p>{adminExists && <p className="text-amber-300 text-sm mb-4">An administrator already exists. If this is your account, enter the setup key to take over admin access.</p>}<p className="text-gray-400 text-sm mb-4">Enter the setup key to make this account an administrator.</p>
    <input className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 mb-3" type="password" placeholder="Setup key" value={key} onChange={(e) => setKey(e.target.value)} />
    <button className="w-full py-2.5 rounded-xl bg-violet-500/40" onClick={async () => { const r = await api('/admin/claim', { key }); setMsg(r.error ?? 'Done'); if (r.ok) { await refresh(); } }}>Claim admin</button>{msg && <p className="text-sm mt-3 text-gray-300">{msg}</p>}</div>);
  const act = async (path: string, body: any) => { const r = await api(path, body); if (r.error) setToast(String(r.error)); await load(); await refresh(); };
  const shownUsers = users.filter((x) => !pf || x.plan === pf);
  const csv = () => { const rows = [['email', 'name', 'plan', 'role', 'suspended', 'joined'], ...shownUsers.map((x) => [x.email, x.name ?? '', x.plan, x.role, x.banned ? 'yes' : 'no', new Date(x.created_at).toISOString()])]; const b = new Blob(['\ufeff' + rows.map((r) => r.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n')], { type: 'text/csv' }); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'users.csv'; a.click(); };
  const dot = (ok: boolean) => <span aria-hidden="true" className={`inline-block w-2.5 h-2.5 rounded-full me-2 ${ok ? 'bg-emerald-500' : 'bg-amber-500'}`} />;
  const th = 'text-start pe-3 py-2 font-semibold opacity-70 whitespace-nowrap';
  return (<div className="pt-24 pb-16 max-w-6xl mx-auto px-4">
    <PageHeader kind="admin" title={t('Admin dashboard')} sub={t('Users, plans, payments, usage, abuse and audit trail')} />
    {toast && <p role="alert" className="mb-4 rounded-xl border border-red-400/40 bg-red-500/10 p-3 text-sm flex justify-between gap-3"><span>{toast}</span><button className="underline" onClick={() => setToast('')}>{t('Close')}</button></p>}
    <div className="grid lg:grid-cols-[12rem_1fr] gap-6 items-start"><div role="tablist" aria-orientation="vertical" aria-label={t('Admin sections')} className="flex lg:flex-col gap-1 overflow-x-auto lg:sticky lg:top-24 pb-1">{TABS.map((x) => <button key={x} role="tab" aria-selected={tab === x} onClick={() => setTab(x)} className={`whitespace-nowrap text-start px-4 py-2.5 rounded-xl text-sm font-semibold ${tab === x ? 'flow-next' : 'flow-ghost'}`}>{t(x)}</button>)}</div><section className="min-w-0">
    {tab === 'Overview' && st && ov && <AdminOverview st={st} ov={ov} sys={sys} plans={plans} go={(x) => setTab(x as (typeof TABS)[number])} charts={<><Bars title={t('Signups per day')} data={ov.signupsPerDay} /><Bars title={t('Jobs per day')} data={ov.jobsPerDay} /><Bars title={t('Data processed per day')} data={ov.bytesPerDay} fmt={fmtB} /></>} />}
    {tab === 'Users' && <AdminUsers plans={plans} toast={setToast} />}
    {tab === 'Plans' && <AdminPlans plans={plans} usersByPlan={Object.fromEntries((ov?.plans ?? []).map((x: any) => [x.id, x.n]))} advancedCount={(heavy ?? []).length} toast={setToast} refresh={refresh} />}
    {tab === 'Payments' && <AdminPayments sysPayments={!!sys?.payments} plans={plans} />}
    {tab === 'Tools' && <AdminTools disabled={disabled} heavy={heavy ?? []} reload={async () => { await load(); await refresh(); }} toast={setToast} />}
    {tab === 'Usage' && <><AdminUsage />{ov && <p className="text-sm mt-4 opacity-80">{t('Saved operations')}: {ov.saved} · <bdi dir="ltr">{fmtB(ov.savedBytes)}</bdi></p>}</>}
    {tab === 'Ads and SEO' && sys && <AdminAdsSeo sys={sys} plans={plans} />}
    {tab === 'Abuse' && <AdminAudit mode="abuse" />}
    {tab === 'Audit' && <AdminAudit mode="audit" />}
    {tab === 'Backup' && <AdminBackup counts={{ ...Object.fromEntries((sys?.tables ?? []).map((x: any) => [x.n, x.c])), plans: plans.length, flags: (st?.flags ?? []).length }} />}
    </section></div>
  </div>);
};
