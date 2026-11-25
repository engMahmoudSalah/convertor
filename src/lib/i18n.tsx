import React, { createContext, useContext, useEffect, useState } from 'react';
import { AR } from './ar';
type Lang = 'en' | 'ar';
const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (s: string) => string }>({ lang: 'en', setLang: () => {}, t: (s) => s });
const initial = (): Lang => { try { return localStorage.getItem('mc_lang') === 'ar' ? 'ar' : 'en'; } catch { return 'en'; } };
export const LangProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Lang>(initial);
  useEffect(() => { document.documentElement.lang = lang; document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'; try { localStorage.setItem('mc_lang', lang); } catch { /* ignore */ } }, [lang]);
  const t = (s: string) => (lang === 'ar' ? AR[s] ?? s : s);
  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
};
export const useT = () => useContext(Ctx);
