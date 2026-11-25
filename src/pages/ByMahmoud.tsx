import React from 'react';
import { SITES } from '../lib/sites';
export const ByMahmoud: React.FC = () => { const here = window.location.host; return (<div className="pt-28 pb-12 max-w-6xl mx-auto px-4">
  <h1 className="text-4xl font-extrabold text-center mb-2 bg-gradient-to-r from-violet-400 to-blue-400 text-transparent bg-clip-text">By Mahmoud</h1>
  <p className="text-center text-gray-400 mb-10">All projects built by Mahmoud Salah ({SITES.length} live sites).</p>
  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{SITES.map((s) => { const cur = new URL(s.url).host === here; const I = s.icon;
    return <a key={s.url} href={s.url} className={`p-5 rounded-2xl border transition ${cur ? 'border-violet-400 bg-violet-500/15' : 'border-white/10 bg-white/5 hover:border-violet-400/60 hover:bg-white/10'}`}>
      <div className="flex items-center gap-3 mb-2"><span className="w-10 h-10 rounded-xl bg-white/10 grid place-items-center text-violet-300"><I size={20} /></span><h2 className="font-semibold">{s.name}</h2>{cur && <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-violet-500/40">You are here</span>}</div>
      <p className="text-sm text-gray-400">{s.desc}</p><p className="text-xs text-violet-300 mt-3 truncate">{s.url.replace('https://', '')}</p></a>; })}</div></div>); };
