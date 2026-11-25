import React, { useState } from 'react';
import { Download, FolderOpen, Pencil, Trash2, CheckCircle2, FileText, Clock, SlidersHorizontal, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TOOLS } from '../tools/registry';
import { useT } from '../lib/i18n';
import { fmtSize } from '../lib/util';
import { api } from '../lib/api';
import { fetchSavedFile } from '../lib/saved';
import { setPending } from '../lib/handoff';

const parse = (s: string, d: any) => { try { return JSON.parse(s) ?? d; } catch { return d; } };
export const SavedCard: React.FC<{ x: any; onGone: () => void }> = ({ x, onGone }) => {
  const { t, lang } = useT(); const nav = useNavigate(); const tool = TOOLS.find((z) => z.id === x.tool);
  const [ask, setAsk] = useState(false); const [busy, setBusy] = useState(''); const [miss, setMiss] = useState('');
  const files: { name: string; size: number }[] = parse(x.files, []); const sum = parse(x.summary, {}); const opts = parse(x.opts, {});
  const inB = sum.inBytes ?? files.reduce((n, f) => n + f.size, 0); const outB = x.out_size || sum.outBytes || 0; const d = inB ? Math.round((1 - outB / inB) * 100) : 0;
  const count = sum.fileCount ?? files.length; const when = new Date(x.ts).toLocaleString(lang === 'ar' ? 'ar-EG' : undefined, { dateStyle: 'medium', timeStyle: 'short' });
  const chips = (tool?.options ?? []).flatMap((o) => { const v = opts[o.key]; if (v === undefined || v === null || v === '' || o.type === 'file') return []; const val = o.type === 'check' ? t(v ? 'Yes' : 'No') : o.type === 'select' ? t(o.options.find((q) => q.v === v)?.l ?? String(v)) : String(v); return [[t(o.label), val]]; });
  const Icon = tool?.icon ?? FileText;
  const dl = async () => { setBusy('dl'); setMiss(''); const b = await fetchSavedFile(x.id); setBusy(''); if (!b) { setMiss(t('The stored file is no longer available.')); return; } const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = x.out_name || 'result'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); };
  const open = () => nav('/tools/' + x.tool, { state: { opts } });
  const edit = async () => { setBusy('ed'); const b = await fetchSavedFile(x.id); setBusy(''); if (!b) { setMiss(t('The stored file is no longer available.')); return; } setPending([new File([b], x.out_name || 'result', { type: x.out_mime || b.type })]); nav('/tools/' + x.tool, { state: { opts } }); };
  const del = async () => { await api('/saved/delete', { id: x.id }); onGone(); };
  const btn = 'flow-ghost px-3 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-1.5 disabled:opacity-40';
  return (<li className="flow-panel p-4 sm:p-5 list-none">
    <div className="flex items-start gap-3"><div className="tool-tile p-2.5 shrink-0"><Icon size={22} /></div>
      <div className="min-w-0 flex-1"><h3 className="font-bold text-lg leading-tight truncate">{t(tool?.title ?? x.tool)}</h3><p className="text-xs opacity-70 mt-0.5 inline-flex items-center gap-1"><Clock size={12} /> {when}</p></div>
      <span className="sv-badge inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold shrink-0"><CheckCircle2 size={13} /> {t('Completed')}</span></div>
    <div className="grid sm:grid-cols-2 gap-3 mt-4 text-sm">
      <div className="sv-box rounded-xl p-3"><p className="text-xs uppercase tracking-wider opacity-60 mb-1.5">{t('Input')} · {count} {t(count === 1 ? 'file' : 'files')}</p>
        <ul className="space-y-1">{files.slice(0, 4).map((f, i) => <li key={i} className="flex gap-2 justify-between"><span className="truncate">{f.name}</span><span dir="ltr" className="opacity-70 shrink-0">{fmtSize(f.size)}</span></li>)}{count > 4 && <li className="opacity-70">+{count - 4} {t('more')}</li>}</ul></div>
      <div className="sv-box rounded-xl p-3"><p className="text-xs uppercase tracking-wider opacity-60 mb-1.5">{t('Output')}</p>
        <p className="flex gap-2 justify-between"><span className="truncate">{x.out_name || '-'}</span><span dir="ltr" className="opacity-70 shrink-0">{fmtSize(outB)}</span></p>
        <p className="mt-1.5 flex items-center gap-2 flex-wrap" dir="ltr"><span>{fmtSize(inB)}</span><ArrowRight size={13} /><b>{fmtSize(outB)}</b>{Math.abs(d) >= 1 && <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${d > 0 ? 'sz-good bg-emerald-500/20 text-emerald-300' : 'sz-warn bg-amber-500/20 text-amber-300'}`}>{d > 0 ? `-${d}%` : `+${-d}%`}</span>}</p>
        <p className="text-xs opacity-70 mt-1.5">{t(x.has_file ? 'Result stored in your profile' : 'Settings saved, result file not stored (over 3 MB)')}</p></div></div>
    {chips.length > 0 && <div className="mt-3"><p className="text-xs uppercase tracking-wider opacity-60 mb-1.5 inline-flex items-center gap-1"><SlidersHorizontal size={12} /> {t('Options used')}</p><div className="flex flex-wrap gap-1.5">{chips.map(([k, v]) => <span key={k} className="sv-chip px-2.5 py-1 rounded-full text-xs"><span className="opacity-70">{k}:</span> <b>{v}</b></span>)}</div></div>}
    {miss && <p className="mt-3 text-sm text-red-300">{miss}</p>}
    <div className="flex flex-wrap gap-2 mt-4">
      <button className={btn} disabled={!x.has_file || busy === 'dl'} onClick={dl}><Download size={15} /> {t('Download')}</button>
      <button className={btn} onClick={open}><FolderOpen size={15} /> {t('Open')}</button>
      <button className={btn} disabled={!x.has_file || busy === 'ed'} onClick={edit}><Pencil size={15} /> {t('Edit again')}</button>
      <span className="flex-1" />
      {ask ? <><button className={btn + ' sv-danger'} onClick={del}><Trash2 size={15} /> {t('Confirm delete')}</button><button className={btn} onClick={() => setAsk(false)}>{t('Cancel')}</button></> : <button className={btn} onClick={() => setAsk(true)} aria-label={t('Delete')}><Trash2 size={15} /> {t('Delete')}</button>}
    </div></li>);
};
