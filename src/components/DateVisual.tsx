import React from 'react';

export const hasDateVisual = (id: string) => ['age-calculator', 'countdown-days', 'date-difference'].includes(id);
const num = (s: string | undefined) => (s ? Number(s.replace(/,/g, '')) : NaN);

const Ring: React.FC<{ frac: number; big: string; small: string }> = ({ frac, big, small }) => {
  const r = 46, c = 2 * Math.PI * r, f = Math.max(0, Math.min(1, frac));
  return (<svg viewBox="0 0 120 120" width="132" height="132" role="img" aria-label={`${big} ${small}`}>
    <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(128,128,128,.28)" strokeWidth="10" />
    <circle cx="60" cy="60" r={r} fill="none" stroke="#2f8f4e" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${c * f} ${c}`} transform="rotate(-90 60 60)" />
    <text x="60" y="58" textAnchor="middle" fontSize="26" fontWeight="700" fill="currentColor">{big}</text>
    <text x="60" y="76" textAnchor="middle" fontSize="10" fill="currentColor" opacity=".7">{small}</text></svg>);
};

/** Small pictures for the date tools. They read the tool's own result lines, so they cannot disagree with the text. */
export const DateVisual: React.FC<{ id: string; out: string; t: (s: string) => string }> = ({ id, out, t }) => {
  const box = 'rounded-xl border p-4'; const st = { borderColor: 'rgba(128,128,128,.3)' };
  if (id === 'age-calculator') {
    const L = out.split('\n'); const yrs = /(\d+)/.exec(L[0] ?? '')?.[1]; const dt = /(\d{4}-\d{2}-\d{2})/.exec(L[4] ?? '')?.[1]; const lf = /\(\D*(\d+)/.exec(L[4] ?? '')?.[1]; if (!yrs || !dt || !lf) return null;
    const nb = [0, dt]; const left = Number(lf);
    return (<div className={`${box} flex flex-wrap items-center gap-5`} style={st}><Ring frac={1 - left / 365} big={String(left)} small={t('days to go')} />
      <div><p className="text-xs uppercase tracking-widest opacity-70">{t('Age')}</p><p className="text-3xl font-bold" dir="ltr">{yrs} <span className="text-base font-semibold opacity-70">{t('years')}</span></p>
        <p className="text-sm mt-1">{t('Next birthday')}: <b dir="ltr">{nb[1]}</b></p></div></div>);
  }
  if (id === 'countdown-days') {
    const d = num(/^(\d[\d,]*)(?![\d,-])/.exec(out.split('\n')[0] ?? '')?.[1]); if (!Number.isFinite(d) || d <= 0) return null;
    const cap = 364, shown = Math.min(d, cap);
    return (<div className={box} style={st}><p className="text-xs uppercase tracking-widest opacity-70 mb-2">{t('Each dot is one day')}</p>
      <div className="flex flex-wrap gap-1" dir="ltr" role="img" aria-label={`${d} ${t('days')}`}>{Array.from({ length: shown }, (_, i) => <span key={i} style={{ width: 8, height: 8, borderRadius: 2, background: i % 7 === 6 ? '#e3b34a' : '#2f8f4e', opacity: 0.9, marginInlineEnd: i % 7 === 6 ? 4 : 0 }} />)}</div>
      <p className="text-xs opacity-70 mt-2">{d > cap ? t('Showing the first 364 days.') : ''} {t('Yellow dots are the end of each week.')}</p></div>);
  }
  if (id === 'date-difference') {
    const L = out.split('\n'); const days = num(/(\d[\d,]*)/.exec(L[0] ?? '')?.[1]); const wk = num(/(\d[\d,]*)\s*$/.exec(L[3] ?? '')?.[1] ?? /(\d[\d,]*)/.exec(L[3] ?? '')?.[1]); if (!Number.isFinite(days) || !Number.isFinite(wk)) return null;
    const total = days + 1, weekend = Math.max(0, total - wk), pw = total ? (wk / total) * 100 : 0;
    return (<div className={box} style={st}><p className="text-xs uppercase tracking-widest opacity-70 mb-2">{t('Weekdays and weekends in the span')}</p>
      <div className="flex h-5 rounded-md overflow-hidden" dir="ltr" role="img" aria-label={`${wk} ${t('weekdays')}, ${weekend} ${t('weekend days')}`}><span style={{ width: `${pw}%`, background: '#2f8f4e' }} /><span style={{ flex: 1, background: '#e3b34a' }} /></div>
      <p className="flex flex-wrap gap-x-4 text-sm mt-2"><span><b dir="ltr">{wk}</b> {t('weekdays')} {t('(Mon to Fri)')}</span><span><b dir="ltr">{weekend}</b> {t('weekend days')} {t('(Sat, Sun)')}</span></p></div>);
  }
  return null;
};
