import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, FileText, Image as Img, FileType } from 'lucide-react';
import { TOOLS, TYPES, toolsOfType } from '../tools/registry';
const ICONS: Record<string, any> = { pdf: FileText, images: Img, documents: FileType };
export const Home: React.FC = () => {
  const [q, setQ] = useState(''); const list = q ? TOOLS.filter((t) => (t.title + t.desc).toLowerCase().includes(q.toLowerCase())) : [];
  return (<div className="pt-28 pb-12 max-w-6xl mx-auto px-4">
    <h1 className="text-4xl md:text-5xl font-extrabold text-center mb-3 bg-gradient-to-r from-violet-400 to-blue-400 text-transparent bg-clip-text">Every file tool in one place</h1>
    <p className="text-center text-gray-400 mb-8">Pick a file type. Files are processed in your browser.</p>
    <div className="max-w-md mx-auto mb-10 relative"><Search className="absolute left-3 top-3 text-gray-500" size={18} />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search all tools" className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:border-violet-400" /></div>
    {q ? <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">{list.map((t) => { const I = t.icon; return <Link key={t.id} to={`/tools/${t.id}`} className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-violet-400/60"><I className="text-violet-300 mb-3" /><h3 className="font-semibold">{t.title}</h3><p className="text-sm text-gray-400">{t.desc}</p></Link>; })}{!list.length && <p className="text-gray-400">No tool matches.</p>}</div>
    : <div className="grid md:grid-cols-3 gap-6">{Object.entries(TYPES).map(([k, t]) => { const I = ICONS[k]; const n = toolsOfType(k);
      return <Link key={k} to={`/${k}`} className="group p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-violet-400/60 hover:bg-white/10 transition">
        <I className="text-violet-300 mb-4 group-hover:scale-110 transition" size={40} /><h2 className="text-2xl font-bold mb-2">{t.title}</h2><p className="text-gray-400 mb-4">{t.desc}</p>
        <p className="text-xs text-gray-500">{n.slice(0, 6).map((x) => x.title).join(' · ')}{n.length > 6 ? ' · ...' : ''}</p></Link>; })}</div>}
  </div>);
};
