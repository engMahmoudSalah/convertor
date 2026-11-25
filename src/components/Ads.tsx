import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useT } from '../lib/i18n';
import { useAuth } from '../lib/auth';

export type Consent = 'all' | 'essential' | '';
export const getConsent = (): Consent => { try { const v = localStorage.getItem('mc_consent'); return v === 'all' || v === 'essential' ? v : ''; } catch { return ''; } };

/** Consent banner. Choosing "Essential only" keeps ads non-personalised. */
export const ConsentBanner: React.FC = () => {
  const { t } = useT(); const [c, setC] = useState<Consent>(getConsent);
  if (c) return null;
  const set = (v: Consent) => { try { localStorage.setItem('mc_consent', v); } catch { /* ignore */ } setC(v); window.dispatchEvent(new Event('mc-consent')); };
  return (
    <div role="dialog" aria-label={t('Cookies and ads')} className="fixed inset-x-3 bottom-3 z-50 max-w-3xl mx-auto rounded-2xl border p-4 shadow-xl text-sm" style={{ background: 'var(--card)', color: 'var(--ink)', borderColor: 'rgba(120,110,95,.4)' }}>
      <p className="mb-3">{t('We use a session cookie to keep you signed in. The free plan shows ads, which may use cookies. You can allow personalised ads or keep ads non-personalised.')} <Link className="underline" to="/legal/privacy">{t('Privacy')}</Link></p>
      <div className="flex flex-wrap gap-2"><button className="flow-next px-4 py-2 rounded-xl font-semibold" onClick={() => set('all')}>{t('Accept all')}</button><button className="flow-ghost px-4 py-2 rounded-xl font-semibold" onClick={() => set('essential')}>{t('Essential only')}</button></div>
    </div>);
};

let loaded = false;
const loadAds = (client: string) => { if (loaded) return; loaded = true; const s = document.createElement('script'); s.async = true; s.crossOrigin = 'anonymous'; s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`; document.head.appendChild(s); };

/** One labelled ad unit. Real ads load only when the owner has set a publisher ID and switched ads on; otherwise a plain placeholder shows. */
export const AdSlot: React.FC<{ slot?: string }> = ({ slot }) => {
  const { t } = useT(); const { ads } = useAuth(); const ref = useRef<HTMLModElement>(null); const live = !!(ads?.live && ads.client && slot);
  useEffect(() => {
    if (!live || !ref.current) return;
    loadAds(ads!.client!);
    try { const w = window as any; w.adsbygoogle = w.adsbygoogle || []; if (getConsent() !== 'all') w.adsbygoogle.requestNonPersonalizedAds = 1; w.adsbygoogle.push({}); } catch { /* ignore */ }
  }, [live]);
  return (
    <figure className="my-0 mx-auto w-full max-w-[336px]" aria-label={t('Advertisement')}>
      <figcaption className="text-[11px] uppercase tracking-widest opacity-60 mb-1 text-center">{t('Advertisement')}</figcaption>
      {live ? <ins ref={ref as any} className="adsbygoogle" style={{ display: 'block', minHeight: 250 }} data-ad-client={ads!.client} data-ad-slot={slot} data-ad-format="rectangle" />
        : <div className="grid place-items-center rounded-xl border border-dashed text-xs opacity-60" style={{ height: 250, borderColor: 'currentColor' }}>{t('Ad space')}</div>}
    </figure>);
};

/** Plan-aware step gate: n steps, each shows one labelled ad and a short countdown. Always skippable by upgrading; never a dead end. */
export const AdGate: React.FC<{ steps: number; onDone: () => void; onBack: () => void }> = ({ steps, onDone, onBack }) => {
  const { t } = useT(); const [i, setI] = useState(0); const [left, setLeft] = useState(5);
  useEffect(() => { setLeft(5); const id = setInterval(() => setLeft((x) => (x > 0 ? x - 1 : 0)), 1000); return () => clearInterval(id); }, [i]);
  const last = i === steps - 1;
  return (
    <div className="text-center space-y-4" role="region" aria-label={t('Your file is ready')}>
      <p className="font-semibold">{t('Your file is ready')}. {t('Step')} {i + 1} {t('of')} {steps}</p>
      <AdSlot slot={undefined} />
      <p className="text-sm opacity-70" aria-live="polite">{left > 0 ? `${t('You can continue in')} ${left}s` : t('Thanks for supporting the free plan')}</p>
      <div className="flex flex-wrap gap-2 justify-center">
        <button onClick={() => (last ? onDone() : setI(i + 1))} disabled={left > 0} className="flow-next px-6 py-3 rounded-xl font-bold disabled:opacity-50">{last ? t('Show my download') : t('Next')}</button>
        <button onClick={onBack} className="flow-ghost px-4 py-3 rounded-xl font-semibold">{t('Back')}</button>
      </div>
      <p className="text-xs opacity-70"><Link className="underline" to="/pricing">{t('Skip ads: see plans')}</Link></p>
    </div>);
};
