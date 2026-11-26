import { AdvancedMark } from './AdvancedMark';
import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, Zap, Sparkles, ChevronDown, ArrowRight, Check, Laptop, Cloud } from 'lucide-react';
import { TOOLS } from '../tools/registry';
import { useAuth } from '../lib/auth';
import { CountUp } from './PageArt';
import { useT } from '../lib/i18n';

const POPULAR = ['merge-pdf', 'compress-pdf', 'split-pdf', 'images-to-pdf', 'pdf-to-word', 'ocr-pdf', 'edit-pdf', 'sign-pdf', 'convert-image', 'pdf-to-images'];
const FAQ: [string, string][] = [
  ['Are my files uploaded anywhere?', 'No. The core tools run entirely in your browser, so your files never leave your device. Only account data such as your plan and usage counts is stored on the server.'],
  ['Is it really free?', 'Yes. Every basic tool is free and unlimited. Paid plans raise the daily limit on advanced jobs (OCR, heavy edits), the maximum file size and the job history.'],
  ['Does it work with Arabic text?', 'Yes. OCR supports Arabic and English, and Text to PDF renders Arabic and other non-Latin scripts correctly.'],
  ['Do I need an account?', 'No. You can use the tools as a guest. An account adds a history of your jobs and higher limits.'],
  ['How big can my files be?', 'Guests get 50 MB per file. Paid plans go up to 500 MB or more, limited only by your device memory.'],
  ['Can I use it on my phone?', 'Yes. The layout is built for small screens too, and everything runs in the mobile browser.'],
];
const Step: React.FC<{ n: number; title: string; text: string; art: React.ReactNode }> = ({ n, title, text, art }) => { const { t } = useT(); return (
  <div className="ed-card relative p-6 overflow-hidden"><span className="absolute end-4 top-1 font-display italic text-7xl text-[color:var(--ac)] opacity-90 select-none">{n}</span>
    <div className="h-20 mb-4">{art}</div><h3 className="font-display text-2xl mb-1">{t(title)}</h3><p className="text-sm text-gray-400">{t(text)}</p></div>); };
const svg = (c: React.ReactNode) => <svg viewBox="0 0 160 80" className="h-full" aria-hidden="true"><defs><linearGradient id="hs" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="var(--g1)" /><stop offset="1" stopColor="var(--g2)" /></linearGradient></defs>{c}</svg>;

export const HomeSections: React.FC = () => {
  const { t } = useT();
  const { plans } = useAuth();
  const popular = POPULAR.map((id) => TOOLS.find((t) => t.id === id)).filter(Boolean) as typeof TOOLS;
  const shown = plans.filter((p) => p.id !== 'guest');
  return (<div className="space-y-20 mt-4">
    <section aria-label="Numbers" className="ed-stats">
      {[[TOOLS.length, 'tools'], [0, 'files uploaded'], [3, 'file types'], [2, 'OCR languages']].map(([n, l], i) => (
        <div key={l as string} className="ed-stat"><span className="ed-no">No. 0{i + 1}</span><p className="font-display text-6xl leading-none my-2"><CountUp value={n} /></p><p className="text-xs text-gray-400 uppercase tracking-widest">{t(l as string)}</p></div>))}
    </section>

    <section><div className="flex items-end justify-between mb-5"><div><h2 className="ed-h2">{t('Popular tools')}</h2><p className="text-gray-400 text-sm">{t('What most people reach for first.')}</p></div><Link to="/pdf" className="text-sm text-violet-300 flex items-center gap-1">{t('All tools')} <ArrowRight size={14} className="rtl:rotate-180" /></Link></div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">{popular.map((tl) => { const I = tl.icon; return (
        <Link key={tl.id} to={`/tools/${tl.id}`} className="group relative rounded-2xl border border-white/10 bg-white/5 p-4 hover:border-violet-400/60 hover:bg-white/10 transition overflow-hidden">
          
          <AdvancedMark id={tl.id} /><I className="relative text-violet-300 mb-3 group-hover:-rotate-6 transition" size={26} /><h3 className="relative font-semibold text-sm">{t(tl.title)}</h3></Link>); })}</div></section>

    <section><h2 className="ed-h2 text-center">{t('How it works')}</h2>
      <div className="grid md:grid-cols-3 gap-5">
        <Step n={1} title="Drop your file" text="Drag it in or pick it from your device. We suggest the tools that fit its type." art={svg(<g><rect className="pa-float" x="60" y="10" width="40" height="52" rx="6" fill="url(#hs)" /><path className="pa-dash" d="M80 74V66" stroke="#a78bfa" strokeWidth="3" strokeLinecap="round" /><rect x="40" y="68" width="80" height="6" rx="3" fill="#475569" opacity=".5" /></g>)} />
        <Step n={2} title="Tune the options" text="Pick the mode, quality or pages. The live preview updates as you change them." art={svg(<g><rect x="20" y="20" width="120" height="6" rx="3" fill="#475569" opacity=".5" /><circle className="pa-float" cx="90" cy="23" r="9" fill="url(#hs)" /><rect x="20" y="50" width="120" height="6" rx="3" fill="#475569" opacity=".5" /><circle className="pa-float pa-d2" cx="50" cy="53" r="9" fill="#14b8a6" /></g>)} />
        <Step n={3} title="Download the result" text="Your new file is ready in seconds, with a size summary. Nothing was uploaded." art={svg(<g><rect className="pa-float" x="58" y="8" width="44" height="54" rx="6" fill="url(#hs)" /><path className="pa-twinkle" d="M118 16l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" fill="#fde68a" /><path d="M72 40l6 6 12-14" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" /></g>)} />
      </div></section>

    <section className="ed-card relative p-8 md:p-12 overflow-hidden">
      <div className="paper-grid" />
      <div className="relative grid md:grid-cols-2 gap-8 items-center">
        <div><p className="text-xs uppercase tracking-widest text-emerald-300 flex items-center gap-2 mb-2"><Lock size={14} /> {t('Private by design')}</p>
          <h2 className="ed-h2 mb-3">{t('Your files never leave your device.')}</h2>
          <p className="text-gray-400 mb-4">{t('The work happens inside your browser tab. There is no upload, no queue and no copy kept on a server. Close the tab and it is gone.')}</p>
          <ul className="space-y-2 text-sm">{['Core tools run 100% locally', 'No watermarks, no sign-up wall', 'Works with Arabic and English'].map((x) => <li key={x} className="flex items-center gap-2"><Check size={16} className="text-emerald-300" />{t(x)}</li>)}</ul></div>
        <div className="flex items-center justify-center gap-4 md:gap-6" aria-hidden="true">
          <div className="grid place-items-center w-28 h-28 rounded-md border-2 border-current"><Laptop size={44} className="text-[color:var(--ac)]" /><span className="text-[10px] font-bold tracking-widest -mt-3">{t('YOUR DEVICE')}</span></div>
          <div className="relative h-1 w-14 md:w-20 rounded-full bg-white/10"><i className="absolute inset-y-0 w-1/3 rounded-full bg-emerald-400" style={{ animation: 'feed2 1.6s linear infinite' }} /></div>
          <div className="relative grid place-items-center w-24 h-24 rounded-3xl border-2 border-dashed border-white/20 opacity-70"><Cloud size={38} className="text-gray-400" /><span className="absolute inset-0 grid place-items-center text-5xl text-red-400 font-light">/</span></div>
        </div></div></section>

    <section><h2 className="ed-h2 text-center">{t('Do more than convert')}</h2>
      <div className="grid sm:grid-cols-3 gap-4 text-sm">{[[Zap, 'Instant', 'No upload wait. Results appear as fast as your device can work.'], [Sparkles, 'Smart suggestions', 'Drop a file and the right tools appear for its type.'], [Lock, 'OCR, redact, sign', 'Edit, compare, fill forms and scan to searchable PDF.']].map(([I, h, d]: any) => <div key={h} className="p-5 rounded-2xl border border-white/10 bg-white/5"><I className="text-violet-300 mb-2" size={22} /><h3 className="font-semibold mb-1">{t(h)}</h3><p className="text-gray-400">{t(d)}</p></div>)}</div></section>

    <section><h2 className="ed-h2 text-center">{t('Simple plans')}</h2><p className="text-center text-gray-400 text-sm mb-8">{t('Start free. Upgrade only for higher limits.')}</p>
      <div className="grid md:grid-cols-3 gap-4">{(shown.length ? shown : [{ id: 'free', name: 'Free', price_usd: 0, max_mb: 50 }, { id: 'pro', name: 'Pro', price_usd: 5, max_mb: 500 }, { id: 'biz', name: 'Business', price_usd: 15, max_mb: 2000 }] as any[]).map((p: any, i: number) => (
        <div key={p.id} className={`ed-card relative p-6 ${i === 1 ? 'ed-hot' : ''}`}>{i === 1 && <span className="ed-stamp" dir="ltr">Popular</span>}<h3 className="font-display text-2xl">{p.name}</h3><p className="font-display text-5xl my-2">{p.price_usd ? `$${p.price_usd}` : t('Free')}{p.price_usd ? <span className="text-sm font-normal text-gray-400">{t(' / month')}</span> : null}</p><p className="text-sm text-gray-400">{t('Files up to')} {p.max_mb} MB{p.id === 'free' ? t(' with a free account') : ''}</p></div>))}</div>
      <p className="text-center mt-5"><Link to="/pricing" className="inline-flex items-center gap-1 text-violet-300 text-sm">{t('Compare plans')} <ArrowRight size={14} className="rtl:rotate-180" /></Link></p></section>

    <section className="max-w-3xl mx-auto w-full"><h2 className="ed-h2 text-center">{t('Questions, answered')}</h2>
      <div>{FAQ.map(([q, a]) => <details key={q} className="group ed-faq px-1 py-4"><summary className="flex items-center justify-between gap-3 font-display text-xl cursor-pointer list-none">{t(q)}<ChevronDown size={18} className="shrink-0 transition group-open:rotate-180" /></summary><p className="text-sm text-gray-400 mt-2">{t(a)}</p></details>)}</div></section>

    <section className="ed-cta relative overflow-hidden text-center p-10 md:p-14"><h2 className="ed-h2 mb-2">{t('Ready when you are.')}</h2><p className="opacity-90 mb-5">{t('Drop a file and see the magic.')}</p>
      <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="btn-cream px-7 h-12 font-bold">{t('Choose a file')}</button></section>
  </div>);
};
