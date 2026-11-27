import React from 'react';

type Opts = Record<string, any>;
const host = (u: string) => { try { const x = new URL(u); return { h: x.hostname.replace(/^www\./, ''), path: x.pathname.split('/').filter(Boolean) }; } catch { return null; } };
const Meter: React.FC<{ n: number; lo: number; hi: number; label: string; t: (s: string) => string }> = ({ n, lo, hi, label, t }) => {
  const state = n === 0 ? 'empty' : n < lo ? 'short' : n > hi ? 'long' : 'good';
  const col = state === 'good' ? '#2f8f4e' : state === 'empty' ? '#888' : '#c47a12';
  const msg = state === 'good' ? t('Good length') : state === 'short' ? t('A bit short') : state === 'long' ? t('May be cut off') : t('Empty');
  return (<div className="text-xs"><div className="flex justify-between gap-2"><span className="opacity-80">{label}</span><span style={{ color: col }} className="font-semibold"><span dir="ltr">{n}</span> · {msg}</span></div>
    <div className="h-1.5 rounded-full mt-1" style={{ background: 'rgba(128,128,128,.25)' }}><div className="h-full rounded-full" style={{ width: `${Math.min(100, (n / hi) * 100)}%`, background: col }} /></div></div>);
};
export const hasSeoPreview = (id: string) => id === 'meta-tag-generator';

/** Live search-result and share-card preview for the Meta tag generator. Shows how text will be cut, with length meters. */
export const SeoPreview: React.FC<{ opts: Opts; t: (s: string) => string }> = ({ opts, t }) => {
  const title = String(opts.title ?? '').trim(), desc = String(opts.desc ?? '').trim(), url = String(opts.url ?? '').trim(), img = String(opts.image ?? '').trim(), site = String(opts.site ?? '').trim();
  const u = host(url); const cut = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s);
  const safeImg = /^https:\/\//i.test(img) ? img : '';
  return (<div className="grid md:grid-cols-2 gap-4" aria-label={t('Preview')}>
    <div>
      <p className="text-xs uppercase tracking-widest opacity-70 mb-2">{t('Search result')}</p>
      <div className="rounded-xl p-4" style={{ background: '#fff', color: '#202124', border: '1px solid rgba(0,0,0,.12)' }}>
        <div className="flex items-center gap-2 mb-1" dir="ltr"><span className="grid place-items-center rounded-full text-[11px] font-bold" style={{ width: 24, height: 24, background: '#e8eaed' }}>{(u?.h || '?').slice(0, 1).toUpperCase()}</span>
          <div className="leading-tight min-w-0"><div className="text-[13px] truncate">{site || u?.h || t('Your site')}</div><div className="text-[12px] truncate" style={{ color: '#4d5156' }}>{u ? [u.h, ...u.path].join(' › ') : t('Add a full page URL')}</div></div></div>
        <div dir="auto" className="text-[19px] leading-snug" style={{ color: '#1a0dab' }}>{title ? cut(title, 60) : t('Your page title')}</div>
        <div dir="auto" className="text-[13.5px] mt-1" style={{ color: '#4d5156' }}>{desc ? cut(desc, 160) : t('Your description appears here.')}</div>
      </div>
      <div className="grid gap-2 mt-3"><Meter n={title.length} lo={30} hi={60} label={t('Title')} t={t} /><Meter n={desc.length} lo={70} hi={160} label={t('Description')} t={t} /></div>
    </div>
    <div>
      <p className="text-xs uppercase tracking-widest opacity-70 mb-2">{t('Share card')}</p>
      <div className="rounded-xl overflow-hidden" style={{ background: '#fff', color: '#202124', border: '1px solid rgba(0,0,0,.12)' }}>
        <div className="grid place-items-center text-xs" style={{ aspectRatio: '1.91 / 1', background: '#e9ecef', color: '#6b7280' }}>
          {safeImg ? <img src={safeImg} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <span>{t('Add a share image (1200×630)')}</span>}</div>
        <div className="p-3" dir="auto"><div className="text-[11px] uppercase tracking-wide" style={{ color: '#6b7280' }} dir="ltr">{u?.h || 'example.com'}</div><div className="font-semibold text-[15px] leading-snug">{title ? cut(title, 70) : t('Your page title')}</div><div className="text-[13px]" style={{ color: '#4d5156' }}>{desc ? cut(desc, 110) : ''}</div></div>
      </div>
      <p className="text-xs opacity-70 mt-3">{t('Search engines and social apps may show this differently. It is a close guide, not a promise.')}</p>
    </div>
  </div>);
};
