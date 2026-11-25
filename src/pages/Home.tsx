import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Zap, Languages, Check, ArrowRight, Search, FileText, Image as Img, FileType, UploadCloud, Sparkles, History } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { TOOLS, TYPES, toolsOfType } from '../tools/registry';
import { useT } from '../lib/i18n';
import { HomeSections } from '../components/HomeSections';
import { setPending, guessType, getRecent } from '../lib/handoff';
const ICONS: Record<string, any> = { pdf: FileText, images: Img, documents: FileType };
const card = 'p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-violet-400/60 hover:bg-white/10 transition block';
const ToolCard: React.FC<{ t: (typeof TOOLS)[number]; onClick?: () => void }> = ({ t, onClick }) => { const I = t.icon; const { t: tr } = useT(); return <Link to={`/tools/${t.id}`} onClick={onClick} className={card}><I className="text-violet-300 mb-2" size={22} /><h3 className="font-semibold text-sm">{tr(t.title)}</h3><p className="text-xs text-gray-400 mt-1">{tr(t.desc)}</p></Link>; };
export const Home: React.FC = () => {
  const { t: tr } = useT();
  const [q, setQ] = useState(''); const [dropped, setDropped] = useState<File[]>([]); const nav = useNavigate();
  const dz = useDropzone({ onDrop: (f) => setDropped(f), noClick: false, noKeyboard: false });
  const list = q ? TOOLS.filter((t) => (t.title + t.desc).toLowerCase().includes(q.toLowerCase())) : [];
  const suggestions = useMemo(() => { if (!dropped.length) return []; const types = new Set(dropped.map(guessType)); return TOOLS.filter((t) => [...types].some((ty) => t.accept.includes(ty)) && (dropped.length === 1 || t.multiple) && dropped.length >= (t.minFiles ?? 1)); }, [dropped]);
  const recent = getRecent().map((id) => TOOLS.find((t) => t.id === id)).filter(Boolean) as typeof TOOLS;
  return (<div className="pt-24 pb-12 max-w-6xl mx-auto px-4">
    <section className="relative grid lg:grid-cols-2 gap-8 lg:gap-12 items-center mb-14">
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true"><div className="aurora a1" /><div className="aurora a2" /><div className="paper-grid" style={{ opacity: .35 }} /></div>
      <div className="text-center lg:text-start rise">
        <p className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/20 bg-white/5 text-xs font-semibold text-violet-300 mb-5"><Sparkles size={14} /> {tr('Free · No upload · Arabic OCR')}</p>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.15] mb-4">{tr('Every file tool in')} <span className="bg-gradient-to-r from-violet-400 to-blue-400 text-transparent bg-clip-text">{tr('one place')}</span></h1>
        <p className="text-gray-400 text-lg max-w-xl mx-auto lg:mx-0 mb-6">{tr('Drop a file and we suggest what you can do with it. Everything runs in your browser.')}</p>
        <div className="flex flex-wrap gap-3 justify-center lg:justify-start mb-6">
          <button onClick={() => dz.open()} className="px-6 h-12 rounded-xl font-bold bg-gradient-to-r from-violet-500 to-blue-500 text-white inline-flex items-center gap-2 hover:opacity-90"><UploadCloud size={18} /> {tr('Choose a file')}</button>
          <Link to="/pdf" className="px-6 h-12 rounded-xl font-semibold border border-white/20 inline-flex items-center gap-2 hover:bg-white/10">{tr('Browse all tools')}</Link></div>
        <ul className="flex flex-wrap gap-x-5 gap-y-2 justify-center lg:justify-start text-sm text-gray-400">{[[Lock, 'Files stay on your device'], [Zap, 'Instant, no queue'], [Languages, 'Arabic and English']].map(([I, x]: any) => <li key={x} className="inline-flex items-center gap-1.5"><I size={15} className="text-emerald-400" /> {tr(x)}</li>)}</ul>
      </div>
      <div className="relative rise" style={{ animationDelay: '.1s' }}>
        <div className="hidden sm:block absolute -top-6 end-2 z-10 chip-float"><span dir="ltr" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-gray-900 text-xs font-bold border border-gray-200">PDF <ArrowRight size={12} className="rtl:rotate-180" /> DOCX <Check size={12} className="text-emerald-600" /></span></div>
        <div className="hidden sm:block absolute -bottom-5 start-0 z-10 chip-float" style={{ animationDelay: '-2s' }}><span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500 text-white text-xs font-bold">{tr('Size')} -62%</span></div>
        <div {...dz.getRootProps()} className={`relative overflow-hidden rounded-3xl border-2 border-dashed p-6 text-center cursor-pointer transition ${dz.isDragActive ? 'border-violet-400 bg-violet-500/10' : 'border-white/30 bg-white/5 hover:border-violet-400/70'}`}>
          <input {...dz.getInputProps()} />
          <div dir="ltr" className="relative h-40 -mt-2 mb-1 pointer-events-none" aria-hidden="true"><div className="aurora a3" style={{ left: '30%' }} /><div className="scene3d"><div className="stack3d"><div className="sheet3d" style={{ ['--i' as any]: 0 }}><div className="w-full h-full rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 p-3 text-xs font-extrabold text-white/90 border border-white/30">PDF</div></div><div className="sheet3d" style={{ ['--i' as any]: 1 }}><div className="w-full h-full rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 p-3 text-xs font-extrabold text-white/90 border border-white/30">IMG</div></div><div className="sheet3d" style={{ ['--i' as any]: 2 }}><div className="w-full h-full rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 p-3 text-xs font-extrabold text-white/90 border border-white/30">DOC</div></div><div className="sheet3d" style={{ ['--i' as any]: 3 }}><div className="w-full h-full rounded-xl bg-gradient-to-br from-amber-500 to-orange-400 p-3 text-xs font-extrabold text-white/90 border border-white/30">XLS</div></div></div></div></div>
          <p className="font-bold text-lg">{dropped.length ? `${dropped.length} file(s): ${dropped.map((f) => f.name).slice(0, 3).join(', ')}${dropped.length > 3 ? '...' : ''}` : tr('Drop any file here, or click to choose')}</p>
          <p className="text-xs text-gray-400 mt-1 mb-3">{tr('PDF, images, Word, Excel, PowerPoint, HTML, text')}</p>
          <div className="flex flex-wrap justify-center gap-1.5" dir="ltr">{['PDF', 'JPG', 'PNG', 'DOCX', 'XLSX', 'PPTX', 'HTML', 'TXT'].map((x) => <span key={x} className="px-2 py-0.5 rounded-md bg-white/10 text-[10px] font-bold tracking-wider text-gray-300">{x}</span>)}</div>
        </div>
      </div>
    </section>
    {dropped.length > 0 && <section className="mb-10"><h2 className="font-semibold mb-3 flex items-center gap-2"><Sparkles size={16} className="text-violet-300" /> {tr('What do you want to do?')}</h2>
      {suggestions.length ? <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">{suggestions.map((t) => <ToolCard key={t.id} t={t} onClick={() => setPending(dropped)} />)}</div> : <p className="text-gray-400 text-sm">{tr('No tool takes this file type yet.')}</p>}</section>}
    <div className="max-w-xl mx-auto mb-8 relative"><Search className="absolute start-3 top-3 text-gray-500" size={18} />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tr('Search all tools')} onKeyDown={(e) => { if (e.key === 'Enter' && list[0]) nav(`/tools/${list[0].id}`); }} className="w-full ps-10 pe-3 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:border-violet-400" /></div>
    {q ? <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">{list.map((t) => <ToolCard key={t.id} t={t} />)}{!list.length && <p className="text-gray-400">{tr('No tool matches.')}</p>}</div>
    : <>
      {recent.length > 0 && <section className="mb-10"><h2 className="font-semibold mb-3 flex items-center gap-2"><History size={16} className="text-violet-300" /> {tr('Recently used')}</h2><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{recent.map((t) => <ToolCard key={t.id} t={t} />)}</div></section>}
      <div className="grid md:grid-cols-3 gap-6 mb-12">{Object.entries(TYPES).map(([k, t]) => { const I = ICONS[k]; const n = toolsOfType(k);
        return <Link key={k} to={`/${k}`} className="group p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-violet-400/60 hover:bg-white/10 transition">
          <I className="text-violet-300 mb-4 group-hover:scale-110 transition" size={40} /><h2 className="text-2xl font-bold mb-1">{tr(t.title)}</h2><p className="text-xs text-violet-300 mb-2">{n.length} {tr('tools')}</p><p className="text-gray-400 mb-4">{tr(t.desc)}</p>
          <p className="text-xs text-gray-500">{n.slice(0, 6).map((x) => tr(x.title)).join(' · ')}{n.length > 6 ? ' · ...' : ''}</p></Link>; })}</div>
      <HomeSections />
    </>}
  </div>);
};
