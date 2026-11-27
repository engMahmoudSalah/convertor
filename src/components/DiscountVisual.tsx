import React from 'react';

export const hasDiscountVisual = (id: string) => id === 'discount-calculator';
const num = (v: any) => { const n = Number(String(v ?? '').replace(/,/g, '')); return Number.isFinite(n) ? n : 0; };
const f = (v: number) => (Math.round(v * 100) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
/** One bar for the original price: what you pay, the first saving and the extra saving. Same maths as the tool. */
export const DiscountVisual: React.FC<{ opts: any; t: (s: string) => string }> = ({ opts, t }) => {
  const p = num(opts.price), d1 = Math.min(100, Math.max(0, num(opts.off))), d2 = Math.min(100, Math.max(0, num(opts.off2))); if (p <= 0) return null;
  const a = p * (1 - d1 / 100), fin = a * (1 - d2 / 100); const s1 = p - a, s2 = a - fin;
  const parts: [string, number, string][] = [[t('You pay'), fin, '#2f7f72'], [t('First discount'), s1, '#e0b43f'], [t('Extra discount'), s2, '#e0643f']];
  return (<div className="rounded-2xl border border-[rgba(128,128,128,.35)] p-4" style={{ background: 'rgba(128,128,128,.1)' }}>
    <div role="img" aria-label={`${f(fin)} / ${f(p)}`} dir="ltr" className="flex h-6 rounded-full overflow-hidden" style={{ background: 'rgba(128,128,128,.3)' }}>{parts.map((x) => x[1] > 0 && <span key={x[0]} style={{ width: (x[1] / p) * 100 + '%', background: x[2] }} />)}</div>
    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs">{parts.filter((x) => x[1] > 0 || x[0] === parts[0][0]).map((x) => <span key={x[0]} className="flex items-center gap-1"><i className="inline-block w-3 h-3 rounded-full" style={{ background: x[2] }} />{x[0]} <b dir="ltr">{f(x[1])}</b></span>)}</div>
    <p className="text-xs opacity-70 mt-2">{t('The bar is the original price.')}</p>
  </div>);
};
