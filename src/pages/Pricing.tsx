import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { useAuth } from '../lib/auth';
const feats = (p: any) => [
  `${p.heavy_daily >= 100000 ? 'Unlimited' : p.heavy_daily} advanced jobs per day`, `${p.ai_daily} AI uses per day`, `Files up to ${p.max_mb} MB`,
  p.history_days ? `${p.history_days}-day job history` : 'No job history', 'All basic tools, unlimited', 'Files stay in your browser'];
export const Pricing: React.FC = () => {
  const { plans, user } = useAuth(); const [prov, setProv] = useState<{ id: string; currency: string }[]>([]); const [msg, setMsg] = useState(''); const [busy, setBusy] = useState('');
  useEffect(() => { api('/billing/status').then((r) => setProv(r.providers ?? [])); }, []);
  const buy = async (plan: string) => { if (!user) { window.location.href = '/signup?next=/pricing'; return; } setBusy(plan); setMsg(''); const r = await api('/billing/checkout', { plan, provider: prov[0]?.id }); setBusy(''); if (r.url) window.location.href = r.url; else setMsg(r.error ?? 'Could not start payment'); };
  return (<div className="pt-28 pb-16 max-w-6xl mx-auto px-4">
    <h1 className="text-4xl font-extrabold text-center mb-2 bg-gradient-to-r from-violet-400 to-blue-400 text-transparent bg-clip-text">Plans</h1>
    <p className="text-center text-gray-400 mb-10">Start free. Upgrade when you need more.</p>
    <div className="grid md:grid-cols-3 gap-6">{plans.filter((p) => p.id !== 'guest').map((p) => (
      <div key={p.id} className={`rounded-3xl p-7 border ${p.id === 'pro' ? 'border-violet-400/70 bg-violet-500/10' : 'border-white/10 bg-white/5'}`}>
        <h2 className="text-xl font-bold">{p.name}</h2>
        <p className="text-3xl font-extrabold my-3">{p.price_usd ? `$${p.price_usd}` : 'Free'}<span className="text-sm font-normal text-gray-400">{p.price_usd ? ' / month' : ''}</span></p>
        {p.price_egp > 0 && <p className="text-xs text-gray-400 -mt-2 mb-3">or {p.price_egp} EGP</p>}
        <ul className="space-y-2 text-sm text-gray-300 mb-6">{feats(p).map((f) => <li key={f} className="flex gap-2"><Check size={16} className="text-emerald-300 shrink-0 mt-0.5" />{f}</li>)}</ul>
        {p.id === 'free' ? <Link to={user ? '/account' : '/signup'} className="block text-center py-2.5 rounded-xl border border-white/20">{user ? 'Your account' : 'Get started'}</Link>
          : prov.length ? <button onClick={() => buy(p.id)} disabled={busy === p.id} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-blue-500 font-semibold disabled:opacity-50">{busy === p.id ? '...' : `Pay ${p.price_egp} EGP for 30 days`}</button>
          : <button disabled className="w-full py-2.5 rounded-xl bg-white/10 text-gray-400 cursor-not-allowed">Payments opening soon</button>}
      </div>))}</div>{msg && <p className="text-center text-red-300 text-sm mt-4">{msg}</p>}<p className="text-center text-xs text-gray-500 mt-8">Plans are paid for 30 days at a time and do not renew automatically. See <Link className="text-violet-300" to="/legal/terms">Terms</Link>, <Link className="text-violet-300" to="/legal/privacy">Privacy</Link> and <Link className="text-violet-300" to="/legal/refunds">Refunds</Link>.</p></div>);
};
