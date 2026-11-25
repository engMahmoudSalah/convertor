import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import '@fontsource-variable/fraunces/standard.css';
import '@fontsource-variable/fraunces/standard-italic.css';
import '@fontsource-variable/manrope';
import '@fontsource/ibm-plex-sans-arabic/400.css';
import '@fontsource/ibm-plex-sans-arabic/600.css';
import '@fontsource/amiri/700.css';
import '@fontsource-variable/bricolage-grotesque';
import '@fontsource-variable/dm-sans';
import '@fontsource-variable/cairo';
import './index.css';
import { applyIdentity } from './lib/identity';
applyIdentity();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

import { wandFavicon } from './components/Wand';
const syncFavicon = () => { const cs = getComputedStyle(document.documentElement); let l = document.querySelector<HTMLLinkElement>('link[rel=icon]'); if (!l) { l = document.createElement('link'); l.rel = 'icon'; document.head.appendChild(l); } l.type = 'image/svg+xml'; l.href = wandFavicon(cs.getPropertyValue('--logo').trim(), cs.getPropertyValue('--logo-band').trim()); };
syncFavicon(); new MutationObserver(syncFavicon).observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-id'] });

// Stale-chunk recovery: after a deploy, an old tab may point at a deleted hashed file. Reload once to get the new build.
const staleReload = () => {
  const k = 'mc_chunk_reload', last = Number(sessionStorage.getItem(k) || 0);
  if (Date.now() - last < 30000) return;
  sessionStorage.setItem(k, String(Date.now()));
  const d = document.createElement('div');
  d.setAttribute('role', 'status');
  d.style.cssText = 'position:fixed;inset:auto 0 24px 0;margin:auto;width:max-content;max-width:90vw;padding:12px 18px;border-radius:14px;background:#1b1b1b;color:#fff;z-index:99999;font:600 14px system-ui';
  d.textContent = document.documentElement.lang === 'ar' ? 'يوجد إصدار جديد، جاري التحديث…' : 'A new version is available, refreshing…';
  document.body.appendChild(d);
  setTimeout(() => location.reload(), 900);
};
window.addEventListener('vite:preloadError', (e) => { e.preventDefault(); staleReload(); });
window.addEventListener('unhandledrejection', (e) => { if (/dynamically imported module|Importing a module script failed|error loading dynamically/i.test(String(e.reason?.message || e.reason))) { e.preventDefault(); staleReload(); } });
