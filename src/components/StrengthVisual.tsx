import React from 'react';

export const hasStrengthVisual = (id: string) => id === 'password-strength';
const COMMON = ['password', '123456', '12345678', 'qwerty', 'abc123', 'letmein', 'welcome', 'admin', 'iloveyou', 'monkey', 'dragon', 'football', 'password1', '111111', '123123', 'qwerty123'];
const LEVELS: [string, string][] = [['Very weak', '#d9442f'], ['Weak', '#e0803f'], ['Fair', '#e0b43f'], ['Strong', '#6aa84f'], ['Very strong', '#2f7f72']];
/** Same scoring as the tool, drawn as a 5-step meter, a checklist and a rough crack time. Nothing leaves the browser. */
export const StrengthVisual: React.FC<{ text: string; t: (s: string) => string }> = ({ text, t }) => {
  const p = text.split('\n')[0]; if (!p) return null;
  const has = [/[a-z]/.test(p), /[A-Z]/.test(p), /\d/.test(p), /[^A-Za-z0-9]/.test(p)];
  const pool = (has[0] ? 26 : 0) + (has[1] ? 26 : 0) + (has[2] ? 10 : 0) + (has[3] ? 32 : 0);
  let bits = p.length * Math.log2(pool || 1);
  if (/(.)\1{2,}/.test(p)) bits *= 0.8; if (/(?:abc|bcd|cde|123|234|345|456|567|678|789|qwe|wer)/i.test(p)) bits *= 0.85;
  if (COMMON.some((c) => p.toLowerCase().includes(c))) bits = Math.min(bits, 20);
  const lvl = bits < 28 ? 0 : bits < 36 ? 1 : bits < 60 ? 2 : bits < 80 ? 3 : 4;
  const secs = Math.pow(2, bits) / 2 / 1e10; // average, 10 billion guesses a second
  const when = secs < 1 ? t('Instantly') : secs < 60 ? t('Seconds') : secs < 3600 ? t('Minutes') : secs < 86400 ? t('Hours') : secs < 86400 * 30 ? t('Days') : secs < 86400 * 365 ? t('Months') : secs < 86400 * 365 * 100 ? t('Years') : secs < 86400 * 365 * 1e6 ? t('Centuries') : t('Beyond any attack');
  const checks: [string, boolean][] = [[t('12+ characters'), p.length >= 12], ['a-z', has[0]], ['A-Z', has[1]], ['0-9', has[2]], ['#$!', has[3]]];
  return (<div className="rounded-2xl border border-[rgba(128,128,128,.35)] p-4" style={{ background: 'rgba(128,128,128,.1)' }}>
    <div role="img" aria-label={t(LEVELS[lvl][0])} dir="ltr" className="grid grid-cols-5 gap-1.5">{LEVELS.map((l, i) => <span key={l[0]} className="h-3 rounded-full" style={{ background: i <= lvl ? LEVELS[lvl][1] : 'rgba(128,128,128,.3)' }} />)}</div>
    <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2"><b style={{ color: LEVELS[lvl][1] }}>{t(LEVELS[lvl][0])}</b><span className="text-xs opacity-80">{t('Rough time to crack offline')}: <b>{when}</b></span></div>
    <div className="mt-3 flex flex-wrap gap-2 text-xs" dir="ltr">{checks.map((c) => <span key={c[0]} className="rounded-full px-2 py-1" style={{ border: '1px solid rgba(128,128,128,.35)', background: c[1] ? 'rgba(47,127,114,.35)' : 'transparent', opacity: c[1] ? 1 : 0.6 }}>{c[1] ? '✓' : '·'} {c[0]}</span>)}</div>
    <p className="text-xs opacity-70 mt-2">{t('Guess: 10 billion tries a second against a fast hash. Real sites are slower.')}</p>
  </div>);
};
