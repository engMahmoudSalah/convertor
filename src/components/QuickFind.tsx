import React from 'react';
import { Search, CornerDownLeft, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TOOLS } from '../tools/registry';
import { getRecent } from '../lib/handoff';
import { useT } from '../lib/i18n';

/** Tool finder: Ctrl/Cmd+K or "/" opens it. Type to filter, arrows to move, Enter to open. */
export const QuickFind: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { t, lang } = useT(); const nav = useNavigate(); const [q, setQ] = React.useState(''); const [i, setI] = React.useState(0);
  const input = React.useRef<HTMLInputElement>(null); const list = React.useRef<HTMLUListElement>(null);
  const ar = lang === 'ar';
  React.useEffect(() => { if (open) { setQ(''); setI(0); setTimeout(() => input.current?.focus(), 30); } }, [open]);
  React.useEffect(() => { if (!open) return; const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [open]);
  const recent = open ? getRecent() : [];
  const results = React.useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) { const r = recent.map((id) => TOOLS.find((x) => x.id === id)).filter(Boolean) as typeof TOOLS; const rest = TOOLS.filter((x) => !recent.includes(x.id)).slice(0, Math.max(0, 8 - r.length)); return [...r, ...rest]; }
    return TOOLS.map((x) => { const name = (t(x.title) + ' ' + x.title).toLowerCase(); const hay = name + ' ' + (t(x.desc) + ' ' + x.desc + ' ' + x.id).toLowerCase(); const score = name.startsWith(s) ? 3 : name.includes(s) ? 2 : hay.includes(s) ? 1 : 0; return { x, score }; }).filter((r) => r.score).sort((a, b) => b.score - a.score).map((r) => r.x).slice(0, 10);
  }, [q, open, lang]);
  React.useEffect(() => setI(0), [q]);
  React.useEffect(() => { list.current?.children[i]?.scrollIntoView({ block: 'nearest' }); }, [i]);
  if (!open) return null;
  const go = (id: string) => { onClose(); nav('/tools/' + id); };
  const key = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); onClose(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setI((v) => (v + 1) % Math.max(1, results.length)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setI((v) => (v - 1 + results.length) % Math.max(1, results.length)); }
    else if (e.key === 'Enter' && results[i]) { e.preventDefault(); go(results[i].id); }
    else if (e.key === 'Tab') { e.preventDefault(); input.current?.focus(); }
  };
  const showRecent = !q.trim() && recent.length > 0;
  return (<div className="fixed inset-0 z-[70] grid place-items-start justify-items-center pt-[12vh] px-3 qf-back" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <div role="dialog" aria-modal="true" aria-label={ar ? 'ابحث عن أداة' : 'Find a tool'} onKeyDown={key} className="qf-box flow-panel w-full max-w-xl p-2">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-current/10"><Search size={18} aria-hidden="true" className="opacity-60 shrink-0" />
        <input ref={input} role="combobox" aria-expanded="true" aria-controls="qf-list" aria-activedescendant={results[i] ? 'qf-' + results[i].id : undefined} aria-label={ar ? 'ابحث عن أداة' : 'Find a tool'} value={q} onChange={(e) => setQ(e.target.value)} placeholder={ar ? 'ابحث: دمج، ضغط، Word...' : 'Search: merge, compress, Word...'} className="w-full bg-transparent outline-none text-base py-1.5 min-w-0" autoComplete="off" spellCheck={false} />
        <kbd dir="ltr" className="hidden sm:block text-[11px] opacity-60 border border-current/25 rounded px-1.5 py-0.5">Esc</kbd></div>
      {showRecent && <p className="px-3 pt-3 pb-1 text-xs uppercase tracking-wider opacity-60 inline-flex items-center gap-1.5"><Clock size={12} /> {ar ? 'استخدمتها مؤخراً' : 'Recent'}</p>}
      {results.length === 0 ? <p className="px-4 py-8 text-center text-sm opacity-70">{ar ? 'لا توجد أداة بهذا الاسم' : 'No tool matches that'}</p> :
        <ul id="qf-list" role="listbox" ref={list} className="max-h-[50vh] overflow-auto p-1">{results.map((x, n) => { const Icon = x.icon; return (<li key={x.id} id={'qf-' + x.id} role="option" aria-selected={n === i} onMouseMove={() => setI(n)} onClick={() => go(x.id)} className={`qf-row flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer ${n === i ? 'on' : ''}`}><span className="tool-tile p-2 shrink-0"><Icon size={18} /></span><span className="min-w-0 flex-1"><b className="block text-sm truncate">{t(x.title)}</b><span className="block text-xs opacity-70 truncate">{t(x.desc)}</span></span>{n === i && <CornerDownLeft size={15} aria-hidden="true" className="opacity-60 shrink-0 rtl:-scale-x-100" />}</li>); })}</ul>}
    </div></div>);
};
