import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useT } from '../lib/i18n';
const field = 'w-full bg-white/5 border border-white/10 rounded px-3 py-2.5 focus:outline-none focus:border-violet-400';
export const AuthPage: React.FC<{ mode: 'login' | 'signup' }> = ({ mode }) => {
  const [f, setF] = useState({ name: '', email: '', password: '' }); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const { t } = useT(); const nav = useNavigate(); const { refresh } = useAuth();
  const submit = async (e: React.FormEvent) => { e.preventDefault(); setBusy(true); setErr('');
    const r = await api(`/auth/${mode}`, f); setBusy(false);
    if (r._status >= 400) return setErr(r.error ?? 'Something went wrong');
    await refresh(); const nx = new URLSearchParams(window.location.search).get('next'); nav(nx && nx.startsWith('/') && !nx.startsWith('//') ? nx : '/account'); };
  return (<div className="pt-28 pb-16 max-w-5xl mx-auto px-4 grid md:grid-cols-2 gap-10 md:gap-16 items-center">
    <div className="hidden md:block"><p className="ed-kicker mb-5">{t('Magic Convertor')}</p><p className="font-display text-5xl leading-[1.08] mb-6">{t('Your files stay yours.')}</p>
      <ul className="space-y-3 text-gray-400">{['History of your jobs', 'Higher limits on advanced tools', 'Works in Arabic and English'].map((x, i) => <li key={x} className="flex gap-3 items-baseline"><span className="font-display italic text-2xl text-[color:var(--ac)]">{i + 1}.</span>{t(x)}</li>)}</ul></div>
    <div className="ed-card ed-static p-7 relative"><span className="ed-stamp" dir="ltr">{t(mode === 'login' ? 'Sign in' : 'Free')}</span>
    <h1 className="text-4xl mb-6">{t(mode === 'login' ? 'Welcome back' : 'Create your account')}</h1>
    <form onSubmit={submit} className="space-y-4">
      {mode === 'signup' && <input className={field} placeholder={t('Name')} autoComplete="name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />}
      <input className={field} type="email" required placeholder={t('Email')} autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
      <input className={field} type="password" required minLength={8} placeholder={t('Password (8+ characters)')} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
      {err && <p className="text-red-300 text-sm bg-red-500/10 border border-red-400/30 rounded-lg p-2">{err}</p>}
      <button disabled={busy} className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-violet-500 to-blue-500 disabled:opacity-50">{busy ? '...' : t(mode === 'login' ? 'Sign in' : 'Sign up free')}</button>
    </form>
    <p className="text-sm text-gray-400 mt-5 pt-4 border-t border-current/20">{mode === 'login' ? <>{t('New here?')} <Link className="text-violet-300" to={"/signup" + window.location.search}>{t('Create an account')}</Link></> : <>{t('Already have one?')} <Link className="text-violet-300" to={"/login" + window.location.search}>{t('Sign in')}</Link></>}</p>
  </div></div>);
};
