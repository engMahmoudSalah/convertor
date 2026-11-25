import React from 'react';
import { SITES } from '../lib/sites';
export const SiteFooter: React.FC = () => {
  const here = window.location.host;
  return (<footer className="border-t border-white/10 mt-12 py-6 px-4" aria-label="All sites by Mahmoud"><p className="text-center text-xs text-gray-400 mb-3">All sites by Mahmoud</p>
    <ul className="flex flex-wrap justify-center gap-2 max-w-3xl mx-auto">{SITES.map((s) => { const cur = new URL(s.url).host === here; const I = s.icon; return (<li key={s.url}>
      <a href={s.url} title={s.name} aria-label={s.name} aria-current={cur ? 'page' : undefined} className={`w-10 h-10 grid place-items-center rounded-lg border ${cur ? 'border-violet-400 bg-violet-500/25 text-white' : 'border-white/20 text-gray-300 hover:text-white hover:border-white/60 hover:bg-white/10'}`}><I size={18} /></a></li>); })}</ul></footer>);
};
