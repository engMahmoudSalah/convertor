import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { TOOLS, CATS } from '../tools/registry';

export const Home: React.FC = () => {
  const [q, setQ] = useState('');
  const list = TOOLS.filter((t) => (t.title + t.desc).toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="pt-28 pb-12 max-w-6xl mx-auto px-4">
      <h1 className="text-4xl md:text-5xl font-extrabold text-center mb-3 bg-gradient-to-r from-violet-400 to-blue-400 text-transparent bg-clip-text">Every file tool in one place</h1>
      <p className="text-center text-gray-400 mb-8">Merge, split, compress and convert. Files are processed in your browser.</p>
      <div className="max-w-md mx-auto mb-10 relative"><Search className="absolute left-3 top-3 text-gray-500" size={18} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tools" className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:border-violet-400" /></div>
      {Object.entries(CATS).map(([c, label]) => { const items = list.filter((t) => t.category === c); if (!items.length) return null;
        return <section key={c} className="mb-10"><h2 className="text-lg font-semibold text-gray-300 mb-3">{label}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">{items.map((t) => { const I = t.icon; return (
            <Link key={t.id} to={`/tools/${t.id}`} className="group p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-violet-400/60 hover:bg-white/10 transition">
              <I className="text-violet-300 mb-3 group-hover:scale-110 transition" /><h3 className="font-semibold mb-1">{t.title}</h3><p className="text-sm text-gray-400">{t.desc}</p></Link>); })}</div></section>; })}
    </div>);
};
