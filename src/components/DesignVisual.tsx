import React, { useState } from 'react';
import { ArrowLeftRight, Check } from 'lucide-react';

const HEX = /^#[0-9a-f]{6}$/i;
const norm = (v: any) => { const s = String(v ?? '').trim(); const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(s); if (!m) return ''; let h = m[1]; if (h.length === 3) h = h.split('').map((c) => c + c).join(''); return '#' + h.toLowerCase(); };
const lumOf = (h: string) => { const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const inkOn = (h: string) => (lumOf(h) > 0.4 ? '#14110f' : '#ffffff');

type Opts = Record<string, any>;
export const hasVisual = (id: string) => ['contrast-checker', 'gradient-generator', 'color-shades'].includes(id);

const Chip: React.FC<{ ok: boolean; label: string; pass: string; fail: string }> = ({ ok, label, pass, fail }) => (
  <li className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm border" style={{ borderColor: ok ? '#2f7f72' : '#dc2626' }}>
    <span>{label}</span><b style={{ color: ok ? '#34a392' : '#ef4444' }}>{ok ? pass : fail}</b></li>);

export const ContrastVisual: React.FC<{ opts: Opts; setOpts: (o: Opts) => void; t: (s: string) => string }> = ({ opts, setOpts, t }) => {
  const fg = norm(opts.fg) || '#000000'; const bg = norm(opts.bg) || '#ffffff';
  const a = lumOf(fg), b = lumOf(bg); const r = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05); const rr = Math.floor(r * 100) / 100;
  const set = (k: string, v: string) => setOpts({ ...opts, [k]: v });
  return (<div className="space-y-4">
    <div className="rounded-2xl p-5 border" style={{ background: bg, color: fg, borderColor: 'rgba(128,128,128,.4)' }} dir="auto">
      <p className="text-3xl font-bold leading-tight">{t('Large heading sample')}</p><p className="mt-2 text-sm">{t('Normal text sample: the quick brown fox jumps over the lazy dog.')}</p></div>
    <div className="flex flex-wrap items-center gap-3">
      <label className="flex items-center gap-2 text-sm"><span>{t('Text color')}</span><input type="color" aria-label={t('Text color')} value={fg} onChange={(e) => set('fg', e.target.value)} className="h-9 w-12 bg-transparent" /></label>
      <button type="button" className="flow-ghost px-3 py-1.5 rounded-lg text-sm font-semibold inline-flex items-center gap-1.5" onClick={() => setOpts({ ...opts, fg: bg, bg: fg })}><ArrowLeftRight size={14} aria-hidden="true" />{t('Swap colors')}</button>
      <label className="flex items-center gap-2 text-sm"><span>{t('Background color')}</span><input type="color" aria-label={t('Background color')} value={bg} onChange={(e) => set('bg', e.target.value)} className="h-9 w-12 bg-transparent" /></label></div>
    <p dir="ltr" className="text-4xl font-bold" aria-live="polite">{rr}:1</p>
    <ul className="grid sm:grid-cols-2 gap-2">
      <Chip ok={r >= 4.5} label={t('Normal text, AA')} pass={t('Pass')} fail={t('Fail')} /><Chip ok={r >= 3} label={t('Large text, AA')} pass={t('Pass')} fail={t('Fail')} />
      <Chip ok={r >= 7} label={t('Normal text, AAA')} pass={t('Pass')} fail={t('Fail')} /><Chip ok={r >= 4.5} label={t('Large text, AAA')} pass={t('Pass')} fail={t('Fail')} />
      <Chip ok={r >= 3} label={t('UI parts and icons')} pass={t('Pass')} fail={t('Fail')} /></ul></div>);
};

export const GradientVisual: React.FC<{ out: string; t: (s: string) => string }> = ({ out, t }) => {
  const m = /background:\s*((?:linear|radial)-gradient\([^;]+\));/.exec(out); if (!m) return null;
  return (<div className="space-y-2"><div role="img" aria-label={t('Gradient preview')} className="h-40 rounded-2xl border" style={{ background: m[1], borderColor: 'rgba(128,128,128,.4)' }} />
    <p dir="ltr" className="text-xs opacity-70 break-all">{m[1]}</p></div>);
};

export const ShadesVisual: React.FC<{ out: string; t: (s: string) => string }> = ({ out, t }) => {
  const [done, setDone] = useState('');
  const cols = out.split('\n').map((l) => { const m = /(.*?)\s+(#[0-9a-f]{6})\s*$/i.exec(l); return m && HEX.test(m[2]) ? { label: m[1].trim(), hex: m[2].toLowerCase() } : null; }).filter(Boolean) as { label: string; hex: string }[];
  if (!cols.length) return null;
  const copy = async (h: string) => { try { await navigator.clipboard.writeText(h); setDone(h); setTimeout(() => setDone(''), 1200); } catch { /* ignore */ } };
  return (<div className="grid grid-cols-3 sm:grid-cols-5 gap-2" role="list">{cols.map((c) => (
    <button key={c.hex + c.label} role="listitem" type="button" onClick={() => copy(c.hex)} aria-label={`${t('Copy')} ${c.hex}`} className="rounded-xl p-2 h-24 flex flex-col justify-end text-start border-2" style={{ background: c.hex, color: inkOn(c.hex), borderColor: 'rgba(128,128,128,.35)' }}>
      <span dir="ltr" className="font-mono text-xs font-bold inline-flex items-center gap-1">{done === c.hex && <Check size={12} aria-hidden="true" />}{c.hex}</span></button>))}</div>);
};
