import React from 'react';
import { ShieldAlert, Info } from 'lucide-react';

export const hasRobotsHelper = (id: string) => id === 'robots-txt-generator';
const PRESETS: [string, Record<string, string>][] = [
  ['Allow everything', { agent: '*', disallow: '', allow: '' }],
  ['Keep admin out', { agent: '*', disallow: '/admin, /private', allow: '' }],
  ['Online shop', { agent: '*', disallow: '/cart, /checkout, /account', allow: '' }],
  ['WordPress', { agent: '*', disallow: '/wp-admin/', allow: '/wp-admin/admin-ajax.php' }],
  ['Block everything', { agent: '*', disallow: '/', allow: '' }],
];
const list = (s: any) => String(s || '').split(',').map((x) => x.trim()).filter(Boolean);
/** One-click starting points for robots.txt, plus plain warnings about common mistakes. */
export const RobotsHelper: React.FC<{ opts: any; setOpts: (o: any) => void; t: (s: string) => string }> = ({ opts, setOpts, t }) => {
  const dis = list(opts.disallow), al = list(opts.allow); const warn: string[] = [];
  if (dis.includes('/') && !al.length) warn.push('This blocks the whole site from search engines.');
  if ([...dis, ...al].some((p) => !p.startsWith('/') && !p.startsWith('*'))) warn.push('Every path should start with a slash, like /admin.');
  if (String(opts.sitemap || '').trim() && !/^https?:\/\/\S+$/i.test(String(opts.sitemap).trim())) warn.push('The sitemap line needs a full link that starts with https://');
  const on = (p: Record<string, string>) => Object.entries(p).every(([k, v]) => String(opts[k] ?? '') === v);
  return (<div className="rounded-2xl border border-[rgba(128,128,128,.35)] p-4 text-sm" style={{ background: 'rgba(128,128,128,.1)' }}>
    <p className="text-xs uppercase tracking-widest opacity-70 mb-2">{t('Start from a preset')}</p>
    <div className="flex flex-wrap gap-2">{PRESETS.map(([l, p]) => <button key={l} type="button" aria-pressed={on(p)} onClick={() => setOpts({ ...opts, ...p })} className="px-3 py-1.5 rounded-full border border-[rgba(128,128,128,.45)] text-xs font-semibold" style={on(p) ? { background: '#0c2b22', color: '#d4f53c' } : {}}>{t(l)}</button>)}</div>
    <div className="mt-3 text-xs flex flex-col gap-1" aria-live="polite">
      {warn.map((w) => <p key={w} className="flex gap-2 items-start"><ShieldAlert size={14} aria-hidden="true" className="shrink-0 mt-0.5" /> {t(w)}</p>)}
      <p className="flex gap-2 items-start opacity-80"><Info size={14} aria-hidden="true" className="shrink-0 mt-0.5" /> {t('robots.txt asks crawlers to stay away. It does not hide a page or protect it. Use a login for private pages.')}</p>
    </div></div>);
};
