import { isHeavy } from '../lib/heavy';
import { AdvancedMark, AdvancedLegend } from '../components/AdvancedMark';
import { useT } from '../lib/i18n';
import { PageHeader } from '../components/PageArt';
import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { EmptyArt } from '../components/PageArt';
import { PageAd } from '../components/Ads';
import { Link, useParams } from 'react-router-dom';
import { TYPES, toolsOfType, CATS } from '../tools/registry';
const norm = (x: string) => x.toLowerCase().normalize('NFKD').replace(/[\u064B-\u065F\u0670\u0640]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/[^\p{L}\p{N} ]+/gu, ' ').replace(/\s+/g, ' ').trim();
export const TypePage: React.FC = () => {
  const { t: tr } = useT(); const { type = '' } = useParams(); const t = TYPES[type];
  const [q, setQ] = useState(''); const all = t ? toolsOfType(type) : []; const words = norm(q).split(' ').filter(Boolean);
  const list = words.length ? all.filter((x) => { const hay = norm(`${x.title} ${x.desc} ${tr(x.title)} ${tr(x.desc)} ${x.id.replace(/-/g, ' ')}`); return words.every((w) => hay.includes(w)); }) : all;
  if (!t) return <div className="pt-28 text-center">Not found. <Link className="text-violet-300" to="/">Home</Link></div>;
  return (<div className="pt-28 pb-12 max-w-6xl mx-auto px-4">
    <PageHeader kind={(['pdf', 'images', 'documents'].includes(type) ? type : 'documents') as any} title={tr(t.title)} sub={<>{tr(t.desc)}. <span className="text-gray-500">{all.length} {tr('tools')}.</span></>} />
    <div className="mb-6" role="search"><label className="relative block"><span className="sr-only">{tr('Search tools in this section')}</span><Search size={18} className="absolute top-1/2 -translate-y-1/2 start-4 opacity-60 pointer-events-none" aria-hidden="true" />
      <input type="search" dir="auto" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Escape') setQ(''); }} placeholder={tr('Search tools in this section')} className="w-full rounded-2xl border border-white/10 bg-white/5 ps-11 pe-11 py-3 text-base" />
      {q && <button type="button" aria-label={tr('Clear search')} onClick={() => setQ('')} className="absolute top-1/2 -translate-y-1/2 end-3 p-1.5 rounded-lg opacity-70 hover:opacity-100"><X size={16} aria-hidden="true" /></button>}</label>
      {words.length > 0 && <p className="text-sm opacity-70 mt-2" role="status" aria-live="polite">{list.length} {tr('of')} {all.length} {tr('tools')}</p>}</div>
    {words.length > 0 && list.length === 0 && <div className="text-center py-10"><EmptyArt text={tr('No tool matches your search in this section.')} /><button type="button" className="underline text-sm mt-3" onClick={() => setQ('')}>{tr('Clear search')}</button></div>}
    {list.some((x) => isHeavy(x.id)) && <AdvancedLegend />}
    {[...new Set(list.map((x) => x.category))].map((c) => (<section key={c} className="mb-8"><h2 className="text-lg font-semibold text-gray-300 mb-3">{tr(CATS[c])}</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">{list.filter((x) => x.category === c).map((x) => { const I = x.icon; return (
        <Link key={x.id} to={`/tools/${x.id}`} className="group relative p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-violet-400/60 hover:bg-white/10 transition">
          <AdvancedMark id={x.id} /><I className="text-violet-300 mb-3" /><h3 className="font-semibold mb-1">{tr(x.title)}</h3><p className="text-sm text-gray-400">{tr(x.desc)}</p></Link>); })}</div></section>))}
    <PageAd />
  </div>);
};
