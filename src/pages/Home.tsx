import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Zap, Languages, ArrowRight, Search, FileText, Image as Img, FileType, UploadCloud, Sparkles, History } from 'lucide-react';
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
    <section className="ed-hero grid lg:grid-cols-[1.15fr_1fr] gap-10 lg:gap-16 items-center mb-16 pt-4">
      <div className="text-center lg:text-start rise">
        <p className="ed-kicker mb-6 justify-center lg:justify-start">{tr('Free · No upload · Arabic OCR')}</p>
        <h1 className="ed-h1 mb-6">{tr('Every file tool in')} <em>{tr('one place')}<svg viewBox="0 0 200 12" preserveAspectRatio="none" aria-hidden="true"><path d="M2 8 C 40 2, 80 11, 120 5 S 180 4, 198 7" fill="none" stroke="#b4391f" strokeWidth="3" strokeLinecap="round" /></svg></em></h1>
        <p className="text-gray-400 text-lg max-w-lg mx-auto lg:mx-0 mb-8 leading-relaxed">{tr('Drop a file and we suggest what you can do with it. Everything runs in your browser.')}</p>
        <div className="flex flex-wrap gap-4 justify-center lg:justify-start mb-8">
          <button onClick={() => dz.open()} className="btn-ink px-7 h-12 font-bold inline-flex items-center gap-2"><UploadCloud size={18} /> {tr('Choose a file')}</button>
          <Link to="/pdf" className="px-2 h-12 font-semibold underline underline-offset-8 decoration-2 inline-flex items-center gap-2 hover:text-[#b4391f]">{tr('Browse all tools')} <ArrowRight size={16} className="rtl:rotate-180" /></Link></div>
        <div className="ed-rule mb-5 max-w-lg mx-auto lg:mx-0" />
        <ul className="flex flex-wrap gap-x-6 gap-y-2 justify-center lg:justify-start text-sm text-gray-400">{[[Lock, 'Files stay on your device'], [Zap, 'Instant, no queue'], [Languages, 'Arabic and English']].map(([I, x]: any) => <li key={x} className="inline-flex items-center gap-1.5"><I size={15} className="text-[#b4391f]" /> {tr(x)}</li>)}</ul>
      </div>
      <div className="relative rise" style={{ animationDelay: '.1s' }}>
        <div {...dz.getRootProps()} className={`ed-card relative p-6 text-center cursor-pointer ${dz.isDragActive ? 'drag' : ''}`}>
          <input {...dz.getInputProps()} />
          <span className="ed-stamp" dir="ltr">{tr('Free')}</span>
          <div dir="ltr" className="text-start -mx-6 -mt-6 mb-6 border-b border-current/20" aria-hidden="true">
            {[['PDF', 'DOCX', 'Word'], ['JPG', 'PNG', 'Image'], ['DOCX', 'PDF', 'Export']].map(([a, b, n], i) => <div key={i} className="ed-row"><span className="ext">{a}</span><ArrowRight size={14} /><span className="ext">{b}</span><span className="opacity-70">{n}</span><span className="bar"><i style={{ animationDelay: `${i * .5}s` }} /></span></div>)}
          </div>
          <UploadCloud size={30} className="mx-auto mb-3 text-[#b4391f]" />
          <p className="font-display text-2xl leading-tight">{dropped.length ? `${dropped.length} file(s): ${dropped.map((f) => f.name).slice(0, 3).join(', ')}${dropped.length > 3 ? '...' : ''}` : tr('Drop any file here, or click to choose')}</p>
          <p className="text-xs opacity-70 mt-2 mb-4">{tr('PDF, images, Word, Excel, PowerPoint, HTML, text')}</p>
          <div className="flex flex-wrap justify-center gap-1.5" dir="ltr">{['PDF', 'JPG', 'PNG', 'DOCX', 'XLSX', 'PPTX', 'HTML', 'TXT'].map((x) => <span key={x} className="px-2 py-0.5 border border-current/40 rounded-sm text-[10px] font-bold tracking-wider opacity-80">{x}</span>)}</div>
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
