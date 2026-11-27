import React from 'react';

export const hasPercentVisual = (id: string) => id === 'percentage-calculator';
const f = (v: number) => (Math.round(v * 100) / 100).toLocaleString('en-US');
const Bar: React.FC<{ pct: number; color: string; label: string }> = ({ pct, color, label }) => (
  <div className="flex items-center gap-3" dir="ltr"><span className="w-16 text-xs opacity-75 text-end shrink-0">{label}</span>
    <div className="flex-1 h-4 rounded-full overflow-hidden" style={{ background: 'rgba(128,128,128,.3)' }}><div style={{ width: Math.min(100, Math.max(0, pct)) + '%', height: '100%', background: color, borderRadius: 999 }} /></div></div>);
/** Draws the first line of the calculation as bars. The numbers come from the same input and mode as the tool. */
export const PercentVisual: React.FC<{ text: string; opts: any; t: (s: string) => string }> = ({ text, opts, t }) => {
  const line = text.split('\n').map((l) => l.trim()).filter(Boolean)[0]; if (!line) return null;
  const [a, b] = line.split(/[\s,;]+/).filter(Boolean).map(Number); if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  const mode = opts.mode || 'of'; const rows: React.ReactNode[] = []; let note = '';
  if (mode === 'change') {
    if (a === 0) return null; const m = Math.max(Math.abs(a), Math.abs(b)) || 1; const up = b >= a;
    rows.push(<Bar key="a" pct={(Math.abs(a) / m) * 100} color="#6b7f78" label={f(a)} />, <Bar key="b" pct={(Math.abs(b) / m) * 100} color={up ? '#2f9e6a' : '#e0643f'} label={f(b)} />);
    note = `${f(((b - a) / Math.abs(a)) * 100)}% ${t(up ? 'increase' : 'decrease')}`;
  } else {
    const whole = mode === 'is' ? b : b, part = mode === 'is' ? a : (a * b) / 100; if (whole === 0) return null; const pct = (part / whole) * 100;
    rows.push(<Bar key="w" pct={100} color="#6b7f78" label={f(whole)} />, <Bar key="p" pct={pct} color="#2f7f72" label={f(part)} />);
    note = mode === 'is' ? `${f(pct)}%` : `${f(a)}%`; if (pct > 100) note += ' · ' + t('More than the whole, the bar is cut at 100%.');
  }
  return (<div className="rounded-2xl border border-[rgba(128,128,128,.35)] p-4" style={{ background: 'rgba(128,128,128,.1)' }}>
    <div role="img" aria-label={line + ' ' + note} className="flex flex-col gap-2">{rows}</div>
    <p className="text-sm font-semibold mt-3"><span dir="ltr">{note}</span></p>
    {text.split('\n').filter((l) => l.trim()).length > 1 && <p className="text-xs opacity-70 mt-1">{t('The picture shows the first line.')}</p>}
  </div>);
};
