import React from 'react';

export const hasBmiGauge = (id: string) => id === 'bmi-calculator';
const num = (v: any) => { const n = Number(String(v ?? '').replace(/,/g, '')); return Number.isFinite(n) ? n : 0; };
const MIN = 12, MAX = 40;
const SEG: [number, number, string, string][] = [[MIN, 18.5, '#5b9bd5', 'Underweight'], [18.5, 25, '#2f9e6a', 'Normal weight'], [25, 30, '#e0b43f', 'Overweight'], [30, MAX, '#e0643f', 'Obesity']];
const pos = (v: number) => Math.min(100, Math.max(0, ((v - MIN) / (MAX - MIN)) * 100));
/** A colored BMI scale with a marker. Uses the same formula and WHO ranges as the tool. */
export const BmiGauge: React.FC<{ opts: any; t: (s: string) => string }> = ({ opts, t }) => {
  const kg = num(opts.kg), cm = num(opts.cm); if (kg <= 0 || cm <= 0) return null;
  const v = kg / Math.pow(cm / 100, 2); const cat = SEG.find((s) => v >= s[0] && v < s[1]) || SEG[3];
  const m = Math.pow(cm / 100, 2); const lo = 18.5 * m, hi = 24.9 * m; const diff = kg < lo ? lo - kg : kg > hi ? kg - hi : 0;
  return (<div className="rounded-2xl border border-[rgba(128,128,128,.35)] p-4" style={{ background: 'rgba(128,128,128,.1)' }}>
    <div role="img" aria-label={`BMI ${v.toFixed(1)}, ${t(cat[3])}`}>
      <div className="relative pt-7">
        <div className="absolute top-0 text-xs font-bold" style={{ left: pos(v) + '%', transform: 'translateX(-50%)' }}><span dir="ltr">{v.toFixed(1)}</span></div>
        <div className="flex h-3 rounded-full overflow-hidden" dir="ltr">{SEG.map((s) => <span key={s[3]} style={{ width: ((s[1] - s[0]) / (MAX - MIN)) * 100 + '%', background: s[2] }} />)}</div>
        <span aria-hidden="true" className="absolute" style={{ left: pos(v) + '%', top: 20, width: 4, height: 20, borderRadius: 2, background: '#0c2b22', boxShadow: '0 0 0 2px #fff', transform: 'translateX(-50%)' }} />
      </div>
      <div className="relative h-4 mt-1 text-[10px] opacity-70" dir="ltr">{[18.5, 25, 30].map((x) => <span key={x} className="absolute" style={{ left: pos(x) + '%', transform: 'translateX(-50%)' }}>{x}</span>)}</div>
    </div>
    <p className="mt-2 text-sm"><span className="inline-block w-3 h-3 rounded-full align-middle me-2" style={{ background: cat[2] }} /><b>{t(cat[3])}</b></p>
    <p className="text-xs opacity-80 mt-1">{diff === 0 ? t('Your weight is inside the healthy range for this height.') : <>{kg < lo ? t('To reach the healthy range: gain about') : t('To reach the healthy range: lose about')} <span dir="ltr">{diff.toFixed(1)} {t('kg')}</span></>}</p>
  </div>);
};
