import { useEffect, useState } from 'react';
export const useTheme = () => {
  const [light, setLight] = useState(() => document.documentElement.classList.contains('light'));
  useEffect(() => { document.documentElement.classList.toggle('light', light); try { localStorage.setItem('mc_theme', light ? 'light' : 'dark'); } catch { /* ignore */ } document.querySelector('meta[name=theme-color]')?.setAttribute('content', light ? '#f4f6fb' : '#0f1424'); }, [light]);
  return { light, toggle: () => setLight((v) => !v) };
};
