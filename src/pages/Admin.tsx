import { PageHeader, CountUp, EmptyArt } from '../components/PageArt';
import React, { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { TOOLS } from '../tools/registry';
const card = 'p-4 rounded-2xl bg-white/5 border border-white/10';
const inp = 'bg-white/5 border border-white/10 rounded px-2 py-1 text-sm w-24';
export const Admin: React.FC = () => {
  const { user, loading, plans, disabled, refresh, adminExists } = useAuth();
  const [st, setSt] = useState<any>(null); const [users, setUsers] = useState<any[]>([]); const [q, setQ] = useState(''); const [audit, setAudit] = useState<any[]>([]); const [key, setKey] = useState(''); const [msg, setMsg] = useState(''); const [pl, setPl] = useState<any[]>([]);
  const load = useCallback(async () => {
    const [s, u, a] = await Promise.all([api('/admin/stats'), api('/admin/users?q=' + encodeURIComponent(q)), api('/admin/audit')]);
    if (s._status === 200) { setSt(s); setUsers(u.users ?? []); setAudit(a.audit ?? []); }
  }, [q]);
  useEffect(() => { if (user?.role === 'admin') load(); }, [user, load]); useEffect(() => setPl(plans.map((p) => ({ ...p }))), [plans]);
  if (loading) return null; if (!user) return <Navigate to="/login?next=/admin" />;
  if (user.role !== 'admin') return (<div className="pt-28 max-w-md mx-auto px-4"><h1 className="text-2xl font-bold mb-3">Admin setup</h1><p className="text-xs text-gray-500 mb-3">Signed in as {user.email}</p>{adminExists && <p className="text-amber-300 text-sm mb-4">An administrator already exists, so this account cannot claim admin.</p>}<p className="text-gray-400 text-sm mb-4">Enter the one-time setup key to make this account the administrator. Only works while no admin exists.</p>
    <input className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 mb-3" type="password" placeholder="Setup key" value={key} onChange={(e) => setKey(e.target.value)} />
    <button className="w-full py-2.5 rounded-xl bg-violet-500/40" onClick={async () => { const r = await api('/admin/claim', { key }); setMsg(r.error ?? 'Done'); if (r.ok) { await refresh(); } }}>Claim admin</button>{msg && <p className="text-sm mt-3 text-gray-300">{msg}</p>}</div>);
  const act = async (path: string, body: any) => { const r = await api(path, body); if (r.error) alert(r.error); await load(); await refresh(); };
  return (<div className="pt-24 pb-16 max-w-6xl mx-auto px-4">
    <PageHeader kind="admin" title="Admin dashboard" sub="Users, plans, orders and audit trail" />
    {st && <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {[['Users', st.users], ['Paid users', st.pro], ['Signups (7d)', st.signups7], ['Jobs (24h)', st.jobs24], ['Jobs (7d)', st.jobs7], ['Suspended', st.banned], ['MRR (list price)', `$${st.mrrUsd}`]].map(([l, v]) => <div key={l as string} className={card}><p className="text-xs text-gray-400">{l}</p><p className="text-2xl font-bold"><CountUp value={v} /></p></div>)}
      <div className={card}><p className="text-xs text-gray-400 mb-1">Top tools (7d)</p>{st.topTools.length ? st.topTools.map((t: any) => <p key={t.tool} className="text-xs">{t.tool}: {t.n}</p>) : <EmptyArt text="No jobs yet" />}</div></div>}
    <h2 className="font-semibold mb-3">Plans and quotas</h2>
    <div className="overflow-x-auto mb-8"><table className="text-sm w-full"><thead className="text-gray-400 text-left"><tr>{['Plan', 'USD/mo', 'EGP/mo', 'Advanced/day', 'Max MB', 'Files/batch', 'Saved ops', 'Saved MB', 'History days', 'Ads (0-2)', ''].map((h) => <th key={h} className="pr-2 py-1">{h}</th>)}</tr></thead><tbody>
      {pl.map((p, i) => <tr key={p.id}><td className="pr-2">{p.name}</td>{['price_usd', 'price_egp', 'heavy_daily', 'max_mb', 'max_files', 'saved_max', 'saved_mb', 'history_days', 'ads'].map((k) => <td key={k} className="pr-2 py-1"><input className={inp} type="number" value={p[k]} onChange={(e) => setPl(pl.map((x, j) => (j === i ? { ...x, [k]: e.target.value } : x)))} /></td>)}<td><button className="px-2 py-1 rounded bg-violet-500/30 text-xs" onClick={() => act('/admin/plan', p)}>Save</button></td></tr>)}</tbody></table></div>
    <h2 className="font-semibold mb-3">Users</h2>
    <input className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm mb-3 w-72" placeholder="Search email or name" value={q} onChange={(e) => setQ(e.target.value)} />
    <div className="overflow-x-auto mb-8"><table className="text-sm w-full"><thead className="text-gray-400 text-left"><tr><th>Email</th><th>Plan</th><th>Role</th><th>Joined</th><th></th></tr></thead><tbody>
      {users.map((x) => <tr key={x.id} className="border-t border-white/5"><td className="py-1.5">{x.email}{x.banned ? ' (suspended)' : ''}</td>
        <td><select className="bg-gray-900 rounded px-1" value={x.plan} onChange={(e) => act('/admin/user', { id: x.id, plan: e.target.value })}>{plans.filter((p) => p.id !== 'guest').map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></td>
        <td><select className="bg-gray-900 rounded px-1" value={x.role} onChange={(e) => act('/admin/user', { id: x.id, role: e.target.value })}><option>user</option><option>admin</option></select></td>
        <td className="text-gray-400">{new Date(x.created_at).toLocaleDateString()}</td><td><button className="text-xs px-2 py-1 rounded border border-white/20" onClick={() => act('/admin/user', { id: x.id, banned: !x.banned })}>{x.banned ? 'Restore' : 'Suspend'}</button></td></tr>)}</tbody></table></div>
    <h2 className="font-semibold mb-3">Tool switches</h2>
    <div className="flex flex-wrap gap-2 mb-8">{TOOLS.map((t) => { const off = disabled.includes(t.id); return <button key={t.id} onClick={() => act('/admin/flag', { tool: t.id, enabled: off })} className={`text-xs px-2.5 py-1 rounded-full border ${off ? 'border-red-400/50 text-red-300 line-through' : 'border-emerald-400/40 text-emerald-200'}`}>{t.title}</button>; })}</div>
    <h2 className="font-semibold mb-3">Backup</h2>
    <p className="text-sm text-gray-400 mb-3">Download all users (no password data), plans, flags, orders, saved-operation records, history and audit log as one JSON file. Saved file contents are not included.</p>
    <a href="/api/admin/export" download className="flow-ghost inline-block px-4 py-2 rounded-xl font-semibold mb-8">Download backup (JSON)</a>
    <h2 className="font-semibold mb-3">Audit log</h2>
    <ul className="text-xs space-y-1 text-gray-300">{audit.map((a) => <li key={a.id}>{new Date(a.ts).toLocaleString()} · {a.actor} · {a.action} · {a.target} {a.detail}</li>)}</ul>
  </div>);
};
