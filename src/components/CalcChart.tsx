import React from 'react';

const num = (v: any, d = 0) => { const n = Number(String(v ?? '').replace(/,/g, '')); return Number.isFinite(n) ? n : d; };
const C1 = '#2f7f72', C2 = '#e0643f';
const fmt = (n: number) => Math.round(n).toLocaleString('en-US');
export const hasChart = (id: string) => id === 'loan-calculator' || id === 'compound-interest';

type Row = { year: number; principal: number; interest: number; balance: number };
const loanRows = (o: Record<string, any>): Row[] | null => {
  const P = num(o.amount), n = Math.round(num(o.years) * 12), r = num(o.rate) / 1200; if (P <= 0 || n <= 0 || n > 1200) return null;
  const pay = r ? (P * r) / (1 - Math.pow(1 + r, -n)) : P / n; let bal = P, pp = 0, ip = 0; const rows: Row[] = [];
  for (let m = 1; m <= n; m++) { const i = bal * r, p = pay - i; bal = Math.max(0, bal - p); pp += p; ip += i; if (m % 12 === 0 || m === n) rows.push({ year: Math.ceil(m / 12), principal: pp, interest: ip, balance: bal }); }
  return rows;
};
const compoundRows = (o: Record<string, any>): Row[] | null => {
  const P = num(o.principal), r = num(o.rate) / 100, yrs = num(o.years), n = Math.max(1, Math.round(num(o.freq, 12))), pm = num(o.monthly);
  if (yrs <= 0 || yrs > 100) return null; const im = Math.pow(1 + r / n, n / 12) - 1, months = Math.round(yrs * 12); let b = P; const rows: Row[] = [];
  for (let m = 1; m <= months; m++) { b = b * (1 + im) + pm; if (m % 12 === 0 || m === months) { const put = P + pm * m; rows.push({ year: Math.ceil(m / 12), principal: put, interest: b - put, balance: b }); } }
  return rows;
};

export const CalcChart: React.FC<{ id: string; opts: Record<string, any>; t: (s: string) => string }> = ({ id, opts, t }) => {
  const loan = id === 'loan-calculator'; const rows = loan ? loanRows(opts) : compoundRows(opts); if (!rows || !rows.length) return null;
  const W = 520, H = 220, L = 8, B = 24; const bw = (W - L * 2) / rows.length; const last = rows[rows.length - 1];
  const max = loan ? Math.max(...rows.map((r) => r.principal + r.interest), 1) : Math.max(...rows.map((r) => r.balance), 1);
  const total = last.principal + last.interest || 1; const share = Math.round((last.interest / total) * 100);
  const step = Math.max(1, Math.ceil(rows.length / 8));
  return (<div className="space-y-4">
    <div className="flex flex-wrap gap-4 text-sm" dir="auto"><span className="inline-flex items-center gap-2"><i className="inline-block w-3 h-3 rounded" style={{ background: C1 }} />{loan ? t('Principal paid') : t('Your deposits')}</span>
      <span className="inline-flex items-center gap-2"><i className="inline-block w-3 h-3 rounded" style={{ background: C2 }} />{loan ? t('Interest paid') : t('Interest earned')}</span><b dir="ltr" className="ms-auto">{share}% {t('is interest')}</b></div>
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={loan ? t('Loan payments by year') : t('Growth by year')} className="w-full h-auto" dir="ltr">
      {rows.map((r, i) => { const a = loan ? r.principal : r.principal, b2 = loan ? r.interest : r.interest; const hp = ((a) / max) * (H - B - 6), hi = ((b2) / max) * (H - B - 6); const x = L + i * bw + 1.5;
        return (<g key={r.year}><rect x={x} width={Math.max(2, bw - 3)} y={H - B - hp} height={hp} fill={C1} rx="1.5" /><rect x={x} width={Math.max(2, bw - 3)} y={H - B - hp - hi} height={hi} fill={C2} rx="1.5" />
          {i % step === 0 && <text x={x + (bw - 3) / 2} y={H - 8} textAnchor="middle" fontSize="11" fill="currentColor" opacity=".7">{r.year}</text>}<title>{`${t('Year')} ${r.year}: ${fmt(a)} + ${fmt(b2)}`}</title></g>); })}
      <line x1={L} x2={W - L} y1={H - B} y2={H - B} stroke="currentColor" opacity=".25" /></svg>
    <div className="overflow-x-auto"><table dir="ltr" className="w-full text-xs text-end">
      <caption className="sr-only">{t('Year by year')}</caption>
      <thead><tr className="opacity-70"><th className="text-start py-1">{t('Year')}</th><th>{loan ? t('Principal paid') : t('Your deposits')}</th><th>{loan ? t('Interest paid') : t('Interest earned')}</th><th>{loan ? t('Balance left') : t('Balance')}</th></tr></thead>
      <tbody>{rows.filter((_, i) => rows.length <= 12 || i % Math.ceil(rows.length / 12) === 0 || i === rows.length - 1).map((r) => <tr key={r.year} className="border-t border-current/10"><td className="text-start py-1">{r.year}</td><td>{fmt(r.principal)}</td><td>{fmt(r.interest)}</td><td>{fmt(loan ? r.balance : r.balance)}</td></tr>)}</tbody></table></div></div>);
};
