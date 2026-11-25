import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { fmtSize } from '../lib/util';
export const Account: React.FC = () => {
  const { user, plan, usage, loading, logout, refresh } = useAuth(); const [h, setH] = useState<any[]>([]);
  useEffect(() => { if (user) api('/history').then((r) => setH(r.history ?? [])); }, [user]);
  useEffect(() => { if (new URLSearchParams(window.location.search).get('paid')) { const t = setTimeout(() => refresh(), 2500); return () => clearTimeout(t); } }, []);
  if (loading) return null; if (!user) return <Navigate to="/login" />;
  const bar = (used: number, max: number) => <div className="h-2 rounded bg-white/10 mt-1"><div className="h-2 rounded bg-gradient-to-r from-violet-500 to-blue-500" style={{ width: `${Math.min(100, (used / Math.max(1, max)) * 100)}%` }} /></div>;
  return (<div className="pt-28 pb-16 max-w-3xl mx-auto px-4">
    <div className="flex items-center justify-between mb-6"><div><h1 className="text-3xl font-bold">{user.name || user.email}</h1><p className="text-gray-400 text-sm">{user.email} · {plan?.name} plan{user.plan_until ? ` until ${new Date(user.plan_until).toLocaleDateString()}` : ''}{user.role === 'admin' && ' · admin'}</p></div>
      <div className="flex gap-2">{user.role === 'admin' && <Link to="/admin" className="px-3 py-2 rounded-lg bg-violet-500/30 text-sm">Admin</Link>}<button onClick={logout} className="px-3 py-2 rounded-lg border border-white/20 text-sm">Sign out</button></div></div>
    {plan && <div className="grid sm:grid-cols-2 gap-4 mb-8">
      <div className="p-4 rounded-2xl bg-white/5 border border-white/10"><p className="text-sm text-gray-400">Advanced jobs today</p><p className="text-xl font-bold">{usage.heavy ?? 0} / {plan.heavy_daily >= 100000 ? 'unlimited' : plan.heavy_daily}</p>{bar(usage.heavy ?? 0, plan.heavy_daily)}</div>
      <div className="p-4 rounded-2xl bg-white/5 border border-white/10"><p className="text-sm text-gray-400">AI uses today</p><p className="text-xl font-bold">{usage.ai ?? 0} / {plan.ai_daily}</p>{bar(usage.ai ?? 0, plan.ai_daily)}</div></div>}
    {new URLSearchParams(window.location.search).get('paid') && <p className="mb-6 p-3 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-200 text-sm">Thanks. We are confirming your payment, your plan updates within a minute.</p>}
    {plan?.id === 'free' && <Link to="/pricing" className="block mb-8 text-center py-3 rounded-xl bg-gradient-to-r from-violet-500 to-blue-500 font-semibold">See Pro plans</Link>}
    <h2 className="font-semibold mb-3">Recent jobs</h2>
    {!plan?.history_days ? <p className="text-gray-400 text-sm">Job history is part of paid plans.</p> : !h.length ? <p className="text-gray-400 text-sm">No jobs yet.</p> :
      <ul className="space-y-2">{h.map((x, i) => <li key={i} className="flex justify-between bg-white/5 rounded-lg px-3 py-2 text-sm"><span>{x.tool}</span><span className="text-gray-400">{x.files} file(s) · {fmtSize(x.bytes)} · {new Date(x.ts).toLocaleString()}</span></li>)}</ul>}
  </div>);
};
