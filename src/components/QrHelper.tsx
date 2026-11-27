import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle } from 'lucide-react';

export const hasQrHelper = (id: string) => id === 'qr-code';
const lum = (hex: string) => { const m = /^#?([0-9a-f]{6})$/i.exec(hex || ''); if (!m) return null; const n = parseInt(m[1], 16); const f = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f((n >> 16) & 255) + 0.7152 * f((n >> 8) & 255) + 0.0722 * f(n & 255); };
const esc = (s: string) => s.replace(/([\\;,:"])/g, '\\$1');
type Kind = 'wifi' | 'phone' | 'email' | 'whatsapp' | 'sms';
const KINDS: [Kind, string][] = [['wifi', 'Wi-Fi'], ['phone', 'Phone call'], ['email', 'Email'], ['whatsapp', 'WhatsApp chat'], ['sms', 'SMS']];
const chip = (on: boolean): React.CSSProperties => on ? { background: '#0c2b22', color: '#d4f53c' } : {};
/** Quick-fill templates for common QR contents, plus a scan-safety check for the chosen colors and text length. */
export const QrHelper: React.FC<{ text: string; setText: (s: string) => void; opts: any; t: (s: string) => string }> = ({ text, setText, opts, t }) => {
  const [kind, setKind] = useState<Kind | ''>(''); const [a, setA] = useState(''); const [b, setB] = useState(''); const [sec, setSec] = useState('WPA');
  const build = (k: Kind, x: string, y: string, s: string) => {
    const digits = x.replace(/[^\d+]/g, '');
    if (k === 'wifi') return x ? `WIFI:T:${s === 'nopass' ? 'nopass' : s};S:${esc(x)};${s === 'nopass' ? '' : `P:${esc(y)};`};` : '';
    if (k === 'phone') return digits ? `tel:${digits}` : '';
    if (k === 'email') return x ? `mailto:${x.trim()}${y ? `?subject=${encodeURIComponent(y)}` : ''}` : '';
    if (k === 'whatsapp') return digits ? `https://wa.me/${digits.replace(/^\+/, '')}${y ? `?text=${encodeURIComponent(y)}` : ''}` : '';
    return digits ? `sms:${digits}${y ? `?body=${encodeURIComponent(y)}` : ''}` : '';
  };
  const upd = (k: Kind, x: string, y: string, s: string) => { setA(x); setB(y); setSec(s); const v = build(k, x, y, s); if (v) setText(v); };
  const L1 = lum(opts.fg), L2 = lum(opts.bg); const notes: string[] = []; let ratio = 0;
  if (L1 !== null && L2 !== null) { ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05); if (L1 > L2) notes.push('The code is lighter than the background. Many scanners cannot read inverted codes.'); if (ratio < 4) notes.push('Contrast is low. Use a much darker code on a lighter background.'); }
  const len = [...text].length; if (len > 300) notes.push('This is a lot of text. The code gets dense and is harder to scan. A short link works best.');
  const second = kind === 'wifi' ? (sec === 'nopass' ? null : 'Password') : kind === 'phone' ? null : kind === 'email' ? 'Subject (optional)' : 'Message (optional)';
  const first = kind === 'wifi' ? 'Network name' : kind === 'email' ? 'Email address' : 'Phone number with country code';
  return (<div className="rounded-2xl border border-black/10 p-4 text-sm" style={{ background: 'rgba(255,255,255,.5)' }}>
    <p className="text-xs uppercase tracking-widest opacity-70 mb-2">{t('Fill from a template')}</p>
    <div className="flex flex-wrap gap-2">{KINDS.map(([k, l]) => <button key={k} type="button" aria-pressed={kind === k} onClick={() => { setKind(kind === k ? '' : k); setA(''); setB(''); }} className="px-3 py-1.5 rounded-full border border-black/15 text-xs font-semibold" style={chip(kind === k)}>{t(l)}</button>)}</div>
    {kind && <div className="mt-3 grid gap-2 sm:grid-cols-2">
      <label className="block min-w-0"><span className="block mb-1 text-xs opacity-80">{t(first)}</span><input dir="ltr" className="w-full rounded-xl border border-black/15 bg-transparent px-3 py-2" value={a} onChange={(e) => upd(kind, e.target.value, b, sec)} /></label>
      {second && <label className="block min-w-0"><span className="block mb-1 text-xs opacity-80">{t(second)}</span><input dir={kind === 'wifi' ? 'ltr' : 'auto'} className="w-full rounded-xl border border-black/15 bg-transparent px-3 py-2" value={b} onChange={(e) => upd(kind, a, e.target.value, sec)} /></label>}
      {kind === 'wifi' && <label className="block min-w-0"><span className="block mb-1 text-xs opacity-80">{t('Security')}</span><select className="w-full rounded-xl border border-black/15 bg-transparent px-3 py-2" value={sec} onChange={(e) => upd(kind, a, b, e.target.value)}><option value="WPA">WPA / WPA2 / WPA3</option><option value="WEP">WEP</option><option value="nopass">{t('No password')}</option></select></label>}
    </div>}
    <div className="mt-3 flex items-start gap-2 text-xs" aria-live="polite">{notes.length ? <AlertTriangle size={15} aria-hidden="true" className="shrink-0 mt-0.5" /> : <ShieldCheck size={15} aria-hidden="true" className="shrink-0 mt-0.5" />}<div>{notes.length ? notes.map((n) => <p key={n}>{t(n)}</p>) : <p>{t('Scan check: contrast and length look fine.')} {ratio > 0 && <span dir="ltr" style={{ unicodeBidi: "isolate", display: "inline-block" }}>{ratio.toFixed(1)} : 1</span>}</p>}</div></div>
  </div>);
};
