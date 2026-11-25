import React, { useEffect, useRef, useState } from 'react';
export type ArtKind = 'pdf' | 'images' | 'documents' | 'pricing' | 'account' | 'admin';
const G = () => (<defs>
  <linearGradient id="ga" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#8b5cf6" /><stop offset="1" stopColor="#3b82f6" /></linearGradient>
  <linearGradient id="gb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#14b8a6" /><stop offset="1" stopColor="#3b82f6" /></linearGradient>
  <linearGradient id="gc" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f59e0b" /><stop offset="1" stopColor="#ec4899" /></linearGradient></defs>);
const art: Record<ArtKind, React.ReactNode> = {
  pdf: (<g><rect className="pa-float pa-d1" x="70" y="30" width="80" height="104" rx="10" fill="url(#gb)" opacity=".5" /><rect className="pa-float" x="100" y="22" width="86" height="112" rx="10" fill="url(#ga)" /><path d="M164 22l22 22h-22z" fill="#fff" opacity=".6" /><g fill="#fff"><rect x="114" y="62" width="54" height="6" rx="3" opacity=".9" /><rect x="114" y="76" width="40" height="6" rx="3" opacity=".6" /><rect x="114" y="90" width="48" height="6" rx="3" opacity=".6" /></g><text x="114" y="118" fontSize="14" fontWeight="800" fill="#fff">PDF</text><path className="pa-dash" d="M30 80h50M200 80h50" stroke="#a78bfa" strokeWidth="3" strokeDasharray="6 6" strokeLinecap="round" /></g>),
  images: (<g><rect className="pa-float" x="60" y="26" width="160" height="108" rx="14" fill="url(#gb)" /><circle className="pa-pulse" cx="182" cy="58" r="12" fill="#fde68a" /><path d="M60 134l50-52 34 34 22-22 54 40z" fill="#0f766e" opacity=".85" /><path d="M110 134l34-34 30 34z" fill="#134e4a" opacity=".6" /></g>),
  documents: (<g><rect className="pa-float" x="70" y="22" width="140" height="116" rx="12" fill="url(#ga)" /><g fill="#fff"><rect className="pa-type" x="88" y="46" width="104" height="7" rx="3.5" /><rect className="pa-type pa-d1" x="88" y="64" width="84" height="7" rx="3.5" opacity=".8" /><rect className="pa-type pa-d2" x="88" y="82" width="96" height="7" rx="3.5" opacity=".8" /><rect className="pa-type pa-d3" x="88" y="100" width="60" height="7" rx="3.5" opacity=".7" /></g><rect className="pa-blink" x="152" y="98" width="3" height="12" fill="#fde68a" /></g>),
  pricing: (<g><rect className="pa-bar" x="68" y="90" width="36" height="44" rx="8" fill="#64748b" opacity=".6" /><rect className="pa-bar pa-d1" x="116" y="64" width="36" height="70" rx="8" fill="url(#ga)" /><rect className="pa-bar pa-d2" x="164" y="34" width="36" height="100" rx="8" fill="url(#gc)" /><circle className="pa-float" cx="182" cy="22" r="13" fill="#fbbf24" /><text x="182" y="27" textAnchor="middle" fontSize="14" fontWeight="800" fill="#78350f">$</text></g>),
  account: (<g><circle className="pa-spin" cx="140" cy="80" r="56" fill="none" stroke="url(#ga)" strokeWidth="3" strokeDasharray="8 10" /><circle className="pa-float" cx="140" cy="68" r="22" fill="url(#ga)" /><path className="pa-float" d="M96 128a44 36 0 0188 0z" fill="url(#gb)" /><circle className="pa-pulse" cx="196" cy="40" r="7" fill="#34d399" /></g>),
  admin: (<g><rect x="50" y="26" width="180" height="110" rx="12" fill="#1e293b" opacity=".55" /><g fill="url(#ga)"><rect className="pa-bar" x="70" y="96" width="20" height="30" rx="4" /><rect className="pa-bar pa-d1" x="100" y="76" width="20" height="50" rx="4" /><rect className="pa-bar pa-d2" x="130" y="86" width="20" height="40" rx="4" /><rect className="pa-bar pa-d3" x="160" y="58" width="20" height="68" rx="4" /><rect className="pa-bar pa-d4" x="190" y="44" width="20" height="82" rx="4" /></g><path className="pa-dash" d="M70 70l32-22 30 12 30-26 48 8" fill="none" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" strokeDasharray="8 6" /></g>),
};
export const PageArt: React.FC<{ kind: ArtKind; className?: string }> = ({ kind, className = '' }) => (
  <svg viewBox="0 0 280 160" className={`pageart ${className}`} aria-hidden="true" role="presentation"><G />{art[kind]}</svg>);

export const PageHeader: React.FC<{ kind: ArtKind; title: React.ReactNode; sub?: React.ReactNode; center?: boolean }> = ({ kind, title, sub, center }) => (
  <header className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 px-6 py-6 mb-8 flex items-center justify-between gap-4 rise">
    <div className="aurora a1" style={{ opacity: .25, left: '-40px', top: '-90px' }} /><div className="aurora a2" style={{ opacity: .2, right: '-30px', top: '-70px' }} />
    <div className={`relative ${center ? 'text-center mx-auto' : ''}`}><h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-violet-400 to-blue-400 text-transparent bg-clip-text">{title}</h1>{sub && <div className="text-gray-400 mt-1">{sub}</div>}</div>
    {!center && <PageArt kind={kind} className="relative w-40 md:w-56 shrink-0 hidden sm:block" />}
  </header>);

export const CountUp: React.FC<{ value: any }> = ({ value }) => {
  const n = typeof value === 'number' ? value : NaN; const [v, setV] = useState(Number.isNaN(n) ? 0 : 0); const ref = useRef(0);
  useEffect(() => { if (Number.isNaN(n)) return; if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setV(n); return; } const t0 = performance.now(); const tick = (t: number) => { const p = Math.min(1, (t - t0) / 700); setV(Math.round(n * (1 - Math.pow(1 - p, 3)))); if (p < 1) ref.current = requestAnimationFrame(tick); }; ref.current = requestAnimationFrame(tick); return () => cancelAnimationFrame(ref.current); }, [n]);
  return <>{Number.isNaN(n) ? value : v}</>;
};

export const EmptyArt: React.FC<{ text: string }> = ({ text }) => (
  <div className="text-center py-6"><svg viewBox="0 0 120 80" className="w-28 mx-auto mb-2" aria-hidden="true"><G /><rect className="pa-float" x="30" y="14" width="60" height="52" rx="8" fill="none" stroke="url(#ga)" strokeWidth="3" strokeDasharray="6 5" /><circle className="pa-pulse" cx="60" cy="40" r="7" fill="url(#ga)" /></svg><p className="text-xs text-gray-400">{text}</p></div>);
