import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useT } from '../lib/i18n';
const field = 'w-full bg-white/5 border border-white/10 rounded px-3 py-2.5 focus:outline-none focus:border-violet-400';
const Shell: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="pt-28 pb-16 max-w-md mx-auto px-4"><div className="ed-card ed-static p-7"><h1 className="text-4xl mb-6">{title}</h1>{children}</div></div>);
const Err: React.FC<{ m: string }> = ({ m }) => (m ? <p role="alert" className="text-red-300 text-sm bg-red-500/10 border border-red-400/30 rounded-lg p-2">{m}</p> : null);
const tok = () => new URLSearchParams(window.location.search).get('token') ?? '';

export const Forgot: React.FC = () => {
  const { t } = useT(); const [email, setEmail] = useState(''); const [done, setDone] = useState(false); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const go = async (e: React.FormEvent) => { e.preventDefault(); setBusy(true); setErr(''); const r = await api('/auth/forgot', { email }); setBusy(false); r._status >= 400 ? setErr(r.error) : setDone(true); };
  return (<Shell title={t('Forgot your password?')}>{done
    ? <p className="text-gray-400">{t('If that email has an account, we sent a reset link. It works for 1 hour.')}</p>
    : <form onSubmit={go} className="space-y-4"><p className="text-gray-400 text-sm">{t('Enter your email and we will send you a link to choose a new password.')}</p>
      <input className={field} type="email" required placeholder={t('Email')} autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /><Err m={err} />
      <button disabled={busy} className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-violet-500 to-blue-500 disabled:opacity-50">{busy ? '...' : t('Send reset link')}</button></form>}
    <p className="text-sm mt-5 pt-4 border-t border-current/20"><Link className="text-violet-300" to="/login">{t('Back to sign in')}</Link></p></Shell>);
};

export const Reset: React.FC = () => {
  const { t } = useT(); const nav = useNavigate(); const [pw, setPw] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false); const [ok, setOk] = useState(false);
  const go = async (e: React.FormEvent) => { e.preventDefault(); setBusy(true); setErr(''); const r = await api('/auth/reset', { token: tok(), newPassword: pw }); setBusy(false); if (r._status >= 400) return setErr(r.error); setOk(true); setTimeout(() => nav('/login'), 1800); };
  return (<Shell title={t('Choose a new password')}>{ok ? <p className="text-gray-400">{t('Password changed. Taking you to sign in...')}</p>
    : <form onSubmit={go} className="space-y-4"><input className={field} type="password" required minLength={8} placeholder={t('New password (8+ characters)')} autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} /><Err m={err} />
      <button disabled={busy} className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-violet-500 to-blue-500 disabled:opacity-50">{busy ? '...' : t('Save new password')}</button></form>}</Shell>);
};

export const Verify: React.FC = () => {
  const { t } = useT(); const { refresh } = useAuth(); const [st, setSt] = useState<'wait' | 'ok' | 'bad'>('wait');
  useEffect(() => { api('/auth/verify', { token: tok() }).then(async (r) => { setSt(r._status < 400 ? 'ok' : 'bad'); await refresh(); }); }, []);
  return (<Shell title={t('Email confirmation')}>{st === 'wait' ? <p className="text-gray-400">...</p> : st === 'ok' ? <p>{t('Your email is confirmed. Thank you.')}</p> : <p className="text-red-300">{t('This link is invalid or expired')}</p>}
    <p className="text-sm mt-5 pt-4 border-t border-current/20"><Link className="text-violet-300" to="/account">{t('Go to my account')}</Link></p></Shell>);
};
