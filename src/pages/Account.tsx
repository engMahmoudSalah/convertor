import { PageArt } from '../components/PageArt';
import React, { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { TOOLS } from '../tools/registry';
import { fmtSize } from '../lib/util';
import { useT } from '../lib/i18n';
export const Account: React.FC = () => {
  const { t, lang } = useT();
  const { user, plan, usage, loading, logout, refresh } = useAuth(); const [h, setH] = useState<any[]>([]); const [sv, setSv] = useState<any[]>([]); const nav = useNavigate(); const loadSv = () => api('/saved').then((r) => setSv(r.saved ?? []));
  useEffect(() => { if (!user) return; (async () => { try { const p = localStorage.getItem('mc_pending_save'); if (p) { localStorage.removeItem('mc_pending_save'); await api('/saved', JSON.parse(p)); } } catch { /* ignore */ } loadSv(); })(); }, [user]);
  useEffect(() => { if (user) api('/history').then((r) => setH(r.history ?? [])); }, [user]);
  useEffect(() => { if (new URLSearchParams(window.location.search).get('paid')) { const t = setTimeout(() => refresh(), 2500); return () => clearTimeout(t); } }, []);
  if (loading) return null; if (!user) return <Navigate to="/login" />;
  const bar = (used: number, max: number) => <div className="h-2 rounded bg-white/10 mt-1"><div className="h-2 rounded bg-gradient-to-r from-violet-500 to-blue-500" style={{ width: `${Math.min(100, (used / Math.max(1, max)) * 100)}%` }} /></div>;
  return (<div className="pt-28 pb-16 max-w-3xl mx-auto px-4">
    <div className="flex items-center justify-between mb-6"><PageArt kind="account" className="w-28 hidden sm:block order-first me-4" /><div className="me-auto"><h1 className="text-3xl font-bold">{user.name || user.email}</h1><p className="text-gray-400 text-sm">{user.email} · {lang === 'ar' ? `خطة ${t(plan?.name ?? '')}` : `${plan?.name} plan`}{user.plan_until ? (lang === 'ar' ? ` حتى ${new Date(user.plan_until).toLocaleDateString('ar-EG')}` : ` until ${new Date(user.plan_until).toLocaleDateString()}`) : ''}{user.role === 'admin' && ` · ${t('admin')}`}</p></div>
      <div className="flex gap-2">{user.role === 'admin' && <Link to="/admin" className="px-3 py-2 rounded-lg bg-violet-500/30 text-sm">{t('Admin')}</Link>}<button onClick={logout} className="px-3 py-2 rounded-lg border border-white/20 text-sm">{t('Sign out')}</button></div></div>
    {plan && <div className="grid sm:grid-cols-2 gap-4 mb-8">
      <div className="p-4 rounded-2xl bg-white/5 border border-white/10"><p className="text-sm text-gray-400">{t('Advanced jobs today')}</p><p className="text-xl font-bold">{usage.heavy ?? 0} / {plan.heavy_daily >= 100000 ? t('unlimited') : plan.heavy_daily}</p>{bar(usage.heavy ?? 0, plan.heavy_daily)}</div>
      <div className="p-4 rounded-2xl bg-white/5 border border-white/10"><p className="text-sm text-gray-400">{t('AI uses today')}</p><p className="text-xl font-bold">{usage.ai ?? 0} / {plan.ai_daily}</p>{bar(usage.ai ?? 0, plan.ai_daily)}</div></div>}
    {new URLSearchParams(window.location.search).get('paid') && <p className="mb-6 p-3 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-200 text-sm">{t('Thanks. We are confirming your payment, your plan updates within a minute.')}</p>}
    {plan?.id === 'free' && <Link to="/pricing" className="block mb-8 text-center py-3 rounded-xl bg-gradient-to-r from-violet-500 to-blue-500 font-semibold">{t('See Pro plans')}</Link>}
    <h2 className="font-semibold mb-3">{t('Saved operations')}</h2>
    {!sv.length ? <p className="text-gray-400 text-sm mb-8">{t('No saved operations yet.')}</p> : <ul className="space-y-2 mb-8">{sv.map((x) => <li key={x.id} className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 text-sm"><span className="flex-1 truncate">{x.name || t(TOOLS.find((z) => z.id === x.tool)?.title ?? x.tool)}</span><button onClick={() => nav('/tools/' + x.tool, { state: { opts: JSON.parse(x.opts || '{}') } })} className="px-3 py-1 rounded-lg border border-white/20">{t('Open')}</button><button onClick={async () => { await api('/saved/delete', { id: x.id }); loadSv(); }} className="px-3 py-1 rounded-lg border border-white/20 text-red-300">{t('Delete')}</button></li>)}</ul>}
    <h2 className="font-semibold mb-3">{t('Recent jobs')}</h2>
    {!plan?.history_days ? <p className="text-gray-400 text-sm">{t('Job history is part of paid plans.')}</p> : !h.length ? <p className="text-gray-400 text-sm">{t('No jobs yet.')}</p> :
      <ul className="space-y-2">{h.map((x, i) => <li key={i} className="flex justify-between bg-white/5 rounded-lg px-3 py-2 text-sm"><span>{t(TOOLS.find((z) => z.id === x.tool)?.title ?? x.tool)}</span><span className="text-gray-400">{x.files} {t('file(s)')} · {fmtSize(x.bytes)} · {new Date(x.ts).toLocaleString()}</span></li>)}</ul>}
  </div>);
};
