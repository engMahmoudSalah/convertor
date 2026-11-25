import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
const field = 'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 focus:outline-none focus:border-violet-400';
export const AuthPage: React.FC<{ mode: 'login' | 'signup' }> = ({ mode }) => {
  const [f, setF] = useState({ name: '', email: '', password: '' }); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const nav = useNavigate(); const { refresh } = useAuth();
  const submit = async (e: React.FormEvent) => { e.preventDefault(); setBusy(true); setErr('');
    const r = await api(`/auth/${mode}`, f); setBusy(false);
    if (r._status >= 400) return setErr(r.error ?? 'Something went wrong');
    await refresh(); nav('/account'); };
  return (<div className="pt-28 pb-16 max-w-md mx-auto px-4">
    <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-violet-400 to-blue-400 text-transparent bg-clip-text">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
    <form onSubmit={submit} className="space-y-4">
      {mode === 'signup' && <input className={field} placeholder="Name" autoComplete="name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />}
      <input className={field} type="email" required placeholder="Email" autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
      <input className={field} type="password" required minLength={8} placeholder="Password (8+ characters)" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
      {err && <p className="text-red-300 text-sm bg-red-500/10 border border-red-400/30 rounded-lg p-2">{err}</p>}
      <button disabled={busy} className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-violet-500 to-blue-500 disabled:opacity-50">{busy ? '...' : mode === 'login' ? 'Sign in' : 'Sign up free'}</button>
    </form>
    <p className="text-sm text-gray-400 mt-4">{mode === 'login' ? <>New here? <Link className="text-violet-300" to="/signup">Create an account</Link></> : <>Already have one? <Link className="text-violet-300" to="/login">Sign in</Link></>}</p>
  </div>);
};
