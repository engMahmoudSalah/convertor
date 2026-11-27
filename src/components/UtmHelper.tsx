import React from 'react';

type Opts = Record<string, any>;
export const hasUtm = (id: string) => id === 'utm-builder';
const SOURCES = ['google', 'facebook', 'instagram', 'linkedin', 'x', 'newsletter', 'youtube', 'tiktok'];
const MEDIUMS = ['cpc', 'email', 'social', 'organic', 'referral', 'display', 'video'];
const FIELDS: [string, string][] = [['source', 'Source'], ['medium', 'Medium'], ['campaign', 'Campaign'], ['term', 'Term'], ['content', 'Content']];

/** Quick picks and checks for the UTM builder. Warns about the mistakes that split reports in analytics. */
export const UtmHelper: React.FC<{ opts: Opts; setOpts: (o: Opts) => void; t: (s: string) => string }> = ({ opts, setOpts, t }) => {
  const v = (k: string) => String(opts[k] ?? '').trim();
  const warn: string[] = [];
  let urlOk = true; try { const u = new URL(v('url')); if (!/^https?:$/.test(u.protocol)) urlOk = false; else if (u.protocol === 'http:') warn.push('The link uses http. Use https if the page supports it.'); if ([...u.searchParams.keys()].some((k) => k.startsWith('utm_'))) warn.push('The link already has utm_ values. They will be replaced.'); } catch { urlOk = false; }
  if (!urlOk) warn.push('Enter a full link that starts with https://');
  for (const k of ['source', 'medium', 'campaign']) if (!v(k)) warn.push(`${k === 'source' ? 'Source' : k === 'medium' ? 'Medium' : 'Campaign'} is required by most analytics tools.`);
  for (const [k] of FIELDS) { const x = v(k); if (x && x !== x.toLowerCase()) warn.push(`${k[0].toUpperCase() + k.slice(1)} has capital letters. "Email" and "email" are counted as two sources.`); if (/\s/.test(x)) warn.push(`${k[0].toUpperCase() + k.slice(1)} has spaces. Use an underscore or a dash.`); }
  const pick = (k: string, val: string) => setOpts({ ...opts, [k]: val });
  const row = (k: string, list: string[]) => (<div className="mb-2"><p className="text-xs opacity-70 mb-1">{t(k === 'source' ? 'Common sources' : 'Common mediums')}</p><div className="flex flex-wrap gap-2">{list.map((x) => {
    const on = v(k) === x; return <button key={x} type="button" aria-pressed={on} onClick={() => pick(k, x)} className="flow-ghost px-3 py-1 rounded-lg text-xs font-semibold" style={on ? { background: '#0c2b22', color: '#d4f53c', borderColor: '#0c2b22' } : undefined} dir="ltr">{x}</button>; })}</div></div>);
  return (<div className="rounded-xl border p-4" style={{ borderColor: 'rgba(128,128,128,.3)' }}>
    {row('source', SOURCES)}{row('medium', MEDIUMS)}
    <p className="text-xs uppercase tracking-widest opacity-70 mt-3 mb-2">{t('What analytics will see')}</p>
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm" dir="ltr">{FIELDS.map(([k, l]) => (<React.Fragment key={k}><dt className="opacity-70">utm_{k}</dt><dd className={v(k) ? 'font-semibold' : 'opacity-50'}>{v(k) || '-'}</dd></React.Fragment>))}</dl>
    {warn.length ? <ul role="status" className="mt-3 text-sm space-y-1" style={{ color: '#a35f00' }}>{warn.map((w) => <li key={w}>⚠ {t(w)}</li>)}</ul>
      : <p role="status" className="mt-3 text-sm font-semibold" style={{ color: '#2f8f4e' }}>✓ {t('This link looks good.')}</p>}
  </div>);
};
