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
