import React, { useCallback, useEffect, useState } from 'react';
import { Check, AlertTriangle, RefreshCw } from 'lucide-react';
import { TOOLS } from '../tools/registry';
import { useT } from '../lib/i18n';

type Sec = 'ads' | 'seo' | 'integrations';
type Item = { ok: boolean; label: string; note?: string };
const Row: React.FC<Item> = ({ ok, label, note }) => <li className="flex items-start gap-2 py-2 border-t border-white/10 first:border-0 text-sm">{ok ? <Check size={16} className="text-emerald-600 shrink-0 mt-0.5" aria-label="ok" /> : <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" aria-label="warning" />}<span><span className="font-semibold">{label}</span>{note && <span className="block text-xs opacity-70">{note}</span>}</span></li>;
const AD_LEVEL = ['No ads', 'Reduced ads', 'Full ads'];

export const AdminAdsSeo: React.FC<{ sys: any; plans: any[] }> = ({ sys, plans }) => {
  const { t } = useT();
  const [sec, setSec] = useState<Sec>('ads'); const [aud, setAud] = useState<any>(null); const [busy, setBusy] = useState(false);
  const run = useCallback(async () => {
    setBusy(true);
    try {
      const [sm, rb, ad] = await Promise.all([fetch('/sitemap.xml').then((r) => r.text()), fetch('/robots.txt').then((r) => r.text()), fetch('/ads.txt').then((r) => r.text())]);
      const locs = Array.from(sm.matchAll(/<loc>([^<]+)<\/loc>/g)).map((m) => m[1]); const paths = new Set(locs.map((l) => { try { return new URL(l).pathname; } catch { return l; } }));
      const missing = TOOLS.filter((x) => !paths.has(`/tools/${x.id}`) || !paths.has(`/ar/tools/${x.id}`)).map((x) => x.id);
      const dupTitles = Object.entries(TOOLS.reduce((a: Record<string, number>, x) => ({ ...a, [x.title]: (a[x.title] ?? 0) + 1 }), {})).filter(([, n]) => n > 1).map(([k]) => k);
      const longTitle = TOOLS.filter((x) => x.title.length > 60).map((x) => x.id); const badDesc = TOOLS.filter((x) => x.desc.length < 30 || x.desc.length > 160).map((x) => x.id);
      setAud({ urls: locs.length, missing, dupTitles, longTitle, badDesc, robotsSitemap: /^Sitemap:\s*https?:\/\//im.test(rb), robotsAdmin: /Disallow:\s*\/admin/i.test(rb), robotsApi: /Disallow:\s*\/api\//i.test(rb), adsLine: /^google\.com,\s*pub-\d+/m.test(ad), at: new Date() });
    } catch { setAud({ error: true }); }
    setBusy(false);
  }, []);
  useEffect(() => { if (sec === 'seo' && !aud) run(); }, [sec, aud, run]);
  const chip = (on: boolean) => (on ? { background: 'var(--ink,#111)', color: 'var(--paper,#fff)' } : undefined);
  const live = !!sys.ads.live; const pub = !!sys.ads.publisher;
  return <div>
    <div className="flex flex-wrap gap-2 mb-4" role="group" aria-label={t('Section')}>{(['ads', 'seo', 'integrations'] as Sec[]).map((k) => <button key={k} type="button" aria-pressed={sec === k} style={chip(sec === k)} className="flow-ghost px-4 py-1.5 rounded-full text-sm font-semibold" onClick={() => setSec(k)}>{t(k === 'ads' ? 'Ads' : k === 'seo' ? 'SEO' : 'Integrations')}</button>)}</div>
    {sec === 'ads' && <div className="grid md:grid-cols-2 gap-4">
      <div className="flow-panel p-4"><p className="font-bold mb-1">{t('Go-live checklist')}</p><ul>
        <Row ok={pub} label={t('AdSense publisher ID')} note={pub ? t('set') : t('Needed from the owner: the AdSense publisher ID, added through a secure link.')} />
        <Row ok={live} label={t('Real ads')} note={live ? t('on') : t('off (placeholder shown)')} />
        <Row ok={pub && live} label={t('Ads shown to visitors')} note={pub && live ? t('Ads appear by plan level below.') : t('Visitors see placeholders only until both steps above are done.')} /></ul>
        <p className="text-xs opacity-60 mt-2">{t('AdSense approval itself is decided by Google and cannot be checked from here.')}</p></div>
      <div className="flow-panel p-4"><p className="font-bold mb-1">{t('Ad level per plan')}</p><ul>{plans.map((p) => <li key={p.id} className="flex items-center justify-between py-2 border-t border-white/10 first:border-0 text-sm"><span>{t(p.name)}</span><span className="text-xs px-2 py-0.5 rounded-full border" style={{ opacity: p.ads === 0 ? 0.6 : 1 }}>{t(AD_LEVEL[p.ads] ?? String(p.ads))}</span></li>)}</ul>
        <p className="text-xs opacity-60 mt-2">{t('Change levels in the Plans tab.')}</p></div></div>}
    {sec === 'seo' && <div>
      <div className="flex items-center justify-between mb-3"><p className="text-sm opacity-80">{aud?.at ? `${t('Checked')} ${aud.at.toLocaleTimeString()}` : ''}</p><button type="button" disabled={busy} className="flow-ghost px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-60" onClick={run}><RefreshCw size={14} aria-hidden="true" />{t('Run SEO check')}</button></div>
      {!aud && <p className="text-sm opacity-70" role="status">{t('Loading')}...</p>}
      {aud?.error && <p className="text-sm text-red-600" role="alert">{t('The check failed. Try again.')}</p>}
      {aud && !aud.error && <div className="grid md:grid-cols-2 gap-4">
        <div className="flow-panel p-4"><p className="font-bold mb-1">{t('Crawl files')}</p><ul>
          <Row ok={aud.urls > 0} label={`sitemap.xml: ${aud.urls} URLs`} />
          <Row ok={aud.missing.length === 0} label={t('Every tool is in the sitemap in EN and AR')} note={aud.missing.length ? aud.missing.join(', ') : undefined} />
          <Row ok={aud.robotsSitemap} label={t('robots.txt points to the sitemap')} /><Row ok={aud.robotsAdmin && aud.robotsApi} label={t('robots.txt keeps admin and API out of search')} />
          <Row ok={aud.adsLine} label="ads.txt" note={aud.adsLine ? undefined : t('No publisher line yet. It is added once the publisher ID is set.')} /></ul></div>
        <div className="flow-panel p-4"><p className="font-bold mb-1">{t('Page text quality')}</p><ul>
          <Row ok={aud.dupTitles.length === 0} label={t('No duplicate tool titles')} note={aud.dupTitles.join(', ') || undefined} />
          <Row ok={aud.longTitle.length === 0} label={t('Titles are 60 characters or less')} note={aud.longTitle.join(', ') || undefined} />
          <Row ok={aud.badDesc.length === 0} label={t('Descriptions are 30 to 160 characters')} note={aud.badDesc.join(', ') || undefined} /></ul>
          <p className="text-xs opacity-60 mt-2">{TOOLS.length} {t('tool pages')} x 2 {t('languages')}, hreflang + JSON-LD. {t('Search ranking is not something this page can promise.')}</p></div>
        <p className="text-xs flex flex-wrap gap-3 md:col-span-2"><a className="underline" href="/sitemap.xml" target="_blank" rel="noreferrer">sitemap.xml</a><a className="underline" href="/robots.txt" target="_blank" rel="noreferrer">robots.txt</a><a className="underline" href="/ads.txt" target="_blank" rel="noreferrer">ads.txt</a></p></div>}</div>}
    {sec === 'integrations' && <div className="flow-panel p-4"><ul>
      <Row ok={sys.google} label="Google sign-in" note={sys.google ? t('on') : t('waiting for keys')} /><Row ok={sys.mail} label={t('Email (verification and reset)')} note={sys.mail ? t('on') : t('waiting for key')} /><Row ok={sys.payments} label={t('Payments')} note={sys.payments ? t('on') : t('waiting for keys')} /></ul>
      <p className="text-xs opacity-70 mt-3" dir="ltr">{sys.tables.map((x: any) => `${x.n}: ${x.c}`).join(' · ')} · schema {sys.schema}</p></div>}
  </div>;
};
