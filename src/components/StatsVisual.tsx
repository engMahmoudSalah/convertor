import React from 'react';

export const hasStatsVisual = (id: string) => id === 'stats-calculator';
/** A histogram of the list with the mean and median marked. Uses the same number parsing as the tool. */
export const StatsVisual: React.FC<{ text: string; t: (s: string) => string }> = ({ text, t }) => {
  const a = text.split(/[\s,;]+/).filter(Boolean).map(Number); if (a.length < 3 || a.some((x) => !Number.isFinite(x))) return null;
  const s = [...a].sort((x, y) => x - y), n = a.length, lo = s[0], hi = s[n - 1]; if (hi === lo) return null;
  const mean = a.reduce((x, y) => x + y, 0) / n, med = n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
  const k = Math.min(12, Math.max(4, Math.ceil(Math.sqrt(n)))), w = (hi - lo) / k; const bins = Array(k).fill(0); a.forEach((x) => { bins[Math.min(k - 1, Math.floor((x - lo) / w))]++; });
  const top = Math.max(...bins); const P = (v: number) => ((v - lo) / (hi - lo)) * 100; const f = (v: number) => (Math.round(v * 100) / 100).toLocaleString('en-US');
  return (<div className="rounded-2xl border border-[rgba(128,128,128,.35)] p-4" style={{ background: 'rgba(128,128,128,.1)' }}>
    <p className="text-xs uppercase tracking-widest opacity-70 mb-2">{t('How the values spread')}</p>
    <div role="img" aria-label={`${n} values from ${f(lo)} to ${f(hi)}, mean ${f(mean)}, median ${f(med)}`} dir="ltr">
      <div className="relative h-24">
        <div className="absolute inset-0 flex items-end gap-[3px]">{bins.map((c, i) => <span key={i} title={String(c)} style={{ flex: 1, height: (c / top) * 100 + '%', minHeight: c ? 4 : 1, background: c ? '#2f7f72' : 'rgba(128,128,128,.4)', borderRadius: '4px 4px 0 0' }} />)}</div>
        <span aria-hidden="true" className="absolute top-0 bottom-0" style={{ left: P(mean) + '%', width: 2, background: '#e0643f' }} />
        <span aria-hidden="true" className="absolute top-0 bottom-0" style={{ left: P(med) + '%', width: 2, background: '#0c2b22', boxShadow: '0 0 0 1px #fff' }} />
      </div>
      <div className="flex justify-between text-[10px] opacity-70 mt-1"><span>{f(lo)}</span><span>{f(hi)}</span></div>
    </div>
    <p className="text-xs mt-2 flex flex-wrap gap-x-4 gap-y-1"><span><i className="inline-block w-3 h-[3px] align-middle me-1" style={{ background: '#e0643f' }} />{t('Mean')} <span dir="ltr">{f(mean)}</span></span><span><i className="inline-block w-3 h-[3px] align-middle me-1" style={{ background: '#0c2b22', boxShadow: '0 0 0 1px #fff' }} />{t('Median')} <span dir="ltr">{f(med)}</span></span></p>
  </div>);
};
