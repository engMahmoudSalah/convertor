import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useT } from '../lib/i18n';
const field = 'w-full bg-white/5 border border-white/10 rounded px-3 py-2.5 focus:outline-none focus:border-violet-400';
export const AuthPage: React.FC<{ mode: 'login' | 'signup' }> = ({ mode }) => {
  const [f, setF] = useState({ name: '', email: '', password: '' }); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const { t } = useT(); const nav = useNavigate(); const { refresh, google } = useAuth(); const qerr = new URLSearchParams(window.location.search).get('error'); const nxq = new URLSearchParams(window.location.search).get('next') ?? '';
  const submit = async (e: React.FormEvent) => { e.preventDefault(); setBusy(true); setErr('');
    const r = await api(`/auth/${mode}`, f); setBusy(false);
    if (r._status >= 400) return setErr(r.error ?? 'Something went wrong');
    await refresh(); const nx = new URLSearchParams(window.location.search).get('next'); nav(nx && nx.startsWith('/') && !nx.startsWith('//') ? nx : '/account'); };
  return (<div className="pt-28 pb-16 max-w-5xl mx-auto px-4 grid md:grid-cols-2 gap-10 md:gap-16 items-center">
    <div className="hidden md:block"><p className="ed-kicker mb-5">{t('Magic Convertor')}</p><p className="font-display text-5xl leading-[1.08] mb-6">{t('Your files stay yours.')}</p>
      <ul className="space-y-3 text-gray-400">{['History of your jobs', 'Higher limits on advanced tools', 'Works in Arabic and English'].map((x, i) => <li key={x} className="flex gap-3 items-baseline"><span className="font-display italic text-2xl text-[color:var(--ac)]">{i + 1}.</span>{t(x)}</li>)}</ul></div>
    <div className="ed-card ed-static p-7 relative"><span className="ed-stamp" dir="ltr">{t(mode === 'login' ? 'Sign in' : 'Free')}</span>
    <h1 className="text-4xl mb-6">{t(mode === 'login' ? 'Welcome back' : 'Create your account')}</h1>
    {google && <><a href={'/api/auth/google/start' + (nxq ? '?next=' + encodeURIComponent(nxq) : '')} className="flow-ghost w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-3 mb-4"><svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.2 5.4-4.7 7.1l7.6 5.9c4.4-4.1 6.9-10.1 6.9-17.5z"/><path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 0 1 0-9.4l-7.9-6.1a24 24 0 0 0 0 21.6l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg>{t('Continue with Google')}</a><p className="text-center text-xs opacity-60 mb-4">{t('or use your email')}</p></>}
    {qerr && <p role="alert" className="text-red-300 text-sm bg-red-500/10 border border-red-400/30 rounded-lg p-2 mb-4">{t(qerr === 'banned' ? 'This account is suspended' : 'Google sign-in did not work. Please try again or use your email.')}</p>}
    <form onSubmit={submit} className="space-y-4">
      {mode === 'signup' && <input className={field} placeholder={t('Name')} autoComplete="name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />}
      <input className={field} type="email" required placeholder={t('Email')} autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
      <input className={field} type="password" required minLength={8} placeholder={t('Password (8+ characters)')} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
      {mode === 'login' && <p className="text-sm -mt-2"><Link className="text-violet-300" to="/forgot">{t('Forgot password?')}</Link></p>}
      {err && <p className="text-red-300 text-sm bg-red-500/10 border border-red-400/30 rounded-lg p-2">{err}</p>}
      <button disabled={busy} className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-violet-500 to-blue-500 disabled:opacity-50">{busy ? '...' : t(mode === 'login' ? 'Sign in' : 'Sign up free')}</button>
    </form>
    <p className="text-sm text-gray-400 mt-5 pt-4 border-t border-current/20">{mode === 'login' ? <>{t('New here?')} <Link className="text-violet-300" to={"/signup" + window.location.search}>{t('Create an account')}</Link></> : <>{t('Already have one?')} <Link className="text-violet-300" to={"/login" + window.location.search}>{t('Sign in')}</Link></>}</p>
  </div></div>);
};
