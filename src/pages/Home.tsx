import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, FileText, Image as Img, FileType, UploadCloud, Sparkles, ShieldCheck, Zap, History } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { TOOLS, TYPES, toolsOfType } from '../tools/registry';
import { setPending, guessType, getRecent } from '../lib/handoff';
const ICONS: Record<string, any> = { pdf: FileText, images: Img, documents: FileType };
const card = 'p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-violet-400/60 hover:bg-white/10 transition block';
const ToolCard: React.FC<{ t: (typeof TOOLS)[number]; onClick?: () => void }> = ({ t, onClick }) => { const I = t.icon; return <Link to={`/tools/${t.id}`} onClick={onClick} className={card}><I className="text-violet-300 mb-2" size={22} /><h3 className="font-semibold text-sm">{t.title}</h3><p className="text-xs text-gray-400 mt-1">{t.desc}</p></Link>; };
export const Home: React.FC = () => {
  const [q, setQ] = useState(''); const [dropped, setDropped] = useState<File[]>([]); const nav = useNavigate();
  const dz = useDropzone({ onDrop: (f) => setDropped(f), noClick: false });
  const list = q ? TOOLS.filter((t) => (t.title + t.desc).toLowerCase().includes(q.toLowerCase())) : [];
  const suggestions = useMemo(() => { if (!dropped.length) return []; const types = new Set(dropped.map(guessType)); return TOOLS.filter((t) => [...types].some((ty) => t.accept.includes(ty)) && (dropped.length === 1 || t.multiple) && dropped.length >= (t.minFiles ?? 1)); }, [dropped]);
  const recent = getRecent().map((id) => TOOLS.find((t) => t.id === id)).filter(Boolean) as typeof TOOLS;
  return (<div className="pt-28 pb-12 max-w-6xl mx-auto px-4">
    <h1 className="text-4xl md:text-5xl font-extrabold text-center mb-3 bg-gradient-to-r from-violet-400 to-blue-400 text-transparent bg-clip-text">Every file tool in one place</h1>
    <p className="text-center text-gray-400 mb-8">Drop a file and we suggest what you can do with it. Everything runs in your browser.</p>
    <div {...dz.getRootProps()} className={`max-w-2xl mx-auto mb-4 rounded-3xl border-2 border-dashed p-8 text-center cursor-pointer transition ${dz.isDragActive ? 'border-violet-400 bg-violet-500/10' : 'border-white/20 bg-white/5 hover:border-white/40'}`}>
      <input {...dz.getInputProps()} /><UploadCloud className="mx-auto text-violet-300 mb-2" size={36} />
      <p className="font-semibold">{dropped.length ? `${dropped.length} file(s): ${dropped.map((f) => f.name).slice(0, 3).join(', ')}${dropped.length > 3 ? '...' : ''}` : 'Drop any file here, or click to choose'}</p>
      <p className="text-xs text-gray-400 mt-1">PDF, images, Word, Excel, PowerPoint, HTML, text</p></div>
    {dropped.length > 0 && <section className="mb-10"><h2 className="font-semibold mb-3 flex items-center gap-2"><Sparkles size={16} className="text-violet-300" /> What do you want to do?</h2>
      {suggestions.length ? <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">{suggestions.map((t) => <ToolCard key={t.id} t={t} onClick={() => setPending(dropped)} />)}</div> : <p className="text-gray-400 text-sm">No tool takes this file type yet.</p>}</section>}
    <div className="max-w-md mx-auto mb-8 relative"><Search className="absolute left-3 top-3 text-gray-500" size={18} />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search all tools" onKeyDown={(e) => { if (e.key === 'Enter' && list[0]) nav(`/tools/${list[0].id}`); }} className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:border-violet-400" /></div>
    {q ? <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">{list.map((t) => <ToolCard key={t.id} t={t} />)}{!list.length && <p className="text-gray-400">No tool matches.</p>}</div>
    : <>
      {recent.length > 0 && <section className="mb-10"><h2 className="font-semibold mb-3 flex items-center gap-2"><History size={16} className="text-violet-300" /> Recently used</h2><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{recent.map((t) => <ToolCard key={t.id} t={t} />)}</div></section>}
      <div className="grid md:grid-cols-3 gap-6 mb-12">{Object.entries(TYPES).map(([k, t]) => { const I = ICONS[k]; const n = toolsOfType(k);
        return <Link key={k} to={`/${k}`} className="group p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-violet-400/60 hover:bg-white/10 transition">
          <I className="text-violet-300 mb-4 group-hover:scale-110 transition" size={40} /><h2 className="text-2xl font-bold mb-1">{t.title}</h2><p className="text-xs text-violet-300 mb-2">{n.length} tools</p><p className="text-gray-400 mb-4">{t.desc}</p>
          <p className="text-xs text-gray-500">{n.slice(0, 6).map((x) => x.title).join(' · ')}{n.length > 6 ? ' · ...' : ''}</p></Link>; })}</div>
      <div className="grid sm:grid-cols-3 gap-4 text-sm">{[[ShieldCheck, 'Private by design', 'Files never leave your device for the core tools.'], [Zap, 'Fast', 'No upload wait, no queue. Works offline-friendly.'], [Sparkles, 'More than convert', 'OCR, redact, sign, edit, compare, forms and more.']].map(([I, h, d]: any) => <div key={h} className="p-5 rounded-2xl border border-white/10"><I className="text-violet-300 mb-2" size={20} /><p className="font-semibold">{h}</p><p className="text-gray-400 text-xs mt-1">{d}</p></div>)}</div></>}
  </div>);
};
