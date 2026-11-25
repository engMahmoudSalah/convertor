import React, { createContext, useContext, useEffect, useState } from 'react';
import { AR } from './ar';
type Lang = 'en' | 'ar';
const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (s: string) => string }>({ lang: 'en', setLang: () => {}, t: (s) => s });
const pathLang = (): Lang => (location.pathname === '/ar' || location.pathname.startsWith('/ar/') ? 'ar' : 'en');
/** The URL decides the language (so /ar/... pages are crawlable). A saved Arabic choice redirects bare URLs once. */
const initial = (): Lang => pathLang();
export const AR_PREFIX = pathLang() === 'ar' ? '/ar' : '';
(() => { try { if (pathLang() === 'en' && localStorage.getItem('mc_lang') === 'ar' && !location.pathname.startsWith('/api')) location.replace('/ar' + (location.pathname === '/' ? '' : location.pathname) + location.search + location.hash); } catch { /* ignore */ } })();
export const LangProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang] = useState<Lang>(initial);
  const setLang = (l: Lang) => { try { localStorage.setItem('mc_lang', l); } catch { /* ignore */ } const p = location.pathname.replace(/^\/ar(\/|$)/, '/'); location.assign((l === 'ar' ? '/ar' + (p === '/' ? '' : p) : p) + location.search); };
  useEffect(() => { document.documentElement.lang = lang; document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'; try { localStorage.setItem('mc_lang', lang); } catch { /* ignore */ } }, [lang]);
  const t = (s: string) => (lang === 'ar' ? AR[s] ?? s : s);
  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
};
export const useT = () => useContext(Ctx);
