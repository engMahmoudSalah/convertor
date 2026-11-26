import React, { useState } from 'react';
import { Download, ShieldCheck } from 'lucide-react';
import { useT } from '../lib/i18n';

const PARTS: { k: string; label: string; note: string; cap?: number }[] = [
  { k: 'users', label: 'Users', note: 'No passwords or tokens' }, { k: 'plans', label: 'Plans', note: 'Prices and limits' }, { k: 'flags', label: 'Tools switches', note: 'Which tools are off' },
  { k: 'orders', label: 'Orders', note: 'Payment records' }, { k: 'saved', label: 'Saved operations', note: 'Records only, not file contents' },
  { k: 'history', label: 'Usage history', note: 'Latest 5000 rows only', cap: 5000 }, { k: 'audit', label: 'Audit log', note: 'Latest 5000 rows only', cap: 5000 },
];
const fmtB = (n: number) => (n > 1e6 ? (n / 1e6).toFixed(1) + ' MB' : n > 1e3 ? Math.round(n / 1e3) + ' KB' : n + ' B');

export const AdminBackup: React.FC<{ counts: Record<string, number> }> = ({ counts }) => {
  const { t } = useT();
  const [sel, setSel] = useState<Set<string>>(new Set(PARTS.map((p) => p.k))); const [busy, setBusy] = useState(false); const [res, setRes] = useState<any>(null);
  const [last, setLast] = useState<string>(() => { try { return localStorage.getItem('mc_last_backup') ?? ''; } catch { return ''; } });
  const toggle = (k: string) => setSel((s) => { const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n; });
  const all = sel.size === PARTS.length;
  const run = async () => {
    setBusy(true); setRes(null);
    try {
      const only = all ? '' : `?only=${Array.from(sel).join(',')}`; const r = await fetch('/api/admin/export' + only, { credentials: 'include' });
      if (!r.ok) { setRes({ error: r.status === 429 ? t('Too many exports, try again later') : t('Download failed. Try again.') }); setBusy(false); return; }
      const text = await r.text(); const data = JSON.parse(text); const got = Array.from(sel).map((k) => ({ k, n: Array.isArray(data[k]) ? data[k].length : -1 }));
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' })); a.download = `magic-convertor-backup-${new Date().toISOString().slice(0, 10)}.json`; a.click(); URL.revokeObjectURL(a.href);
      const now = new Date().toISOString(); try { localStorage.setItem('mc_last_backup', now); } catch { /* private mode */ } setLast(now); setRes({ size: text.length, got });
    } catch { setRes({ error: t('Download failed. Try again.') }); }
    setBusy(false);
  };
  return <div>
    <div className="flow-panel p-4 mb-4 flex flex-wrap items-center gap-3 justify-between"><div><p className="font-bold">{t('Backup')}</p><p className="text-xs opacity-70">{last ? `${t('Last backup from this browser')}: ${new Date(last).toLocaleString()}` : t('No backup was downloaded from this browser yet.')}</p></div>
      <div className="flex gap-2"><button type="button" className="flow-ghost px-3 py-1.5 rounded-lg text-xs font-semibold" onClick={() => setSel(new Set(all ? [] : PARTS.map((p) => p.k)))}>{all ? t('Clear all') : t('Select all')}</button>
        <button type="button" disabled={busy || sel.size === 0} className="px-4 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-1.5 disabled:opacity-50" style={{ background: 'var(--ink,#111)', color: 'var(--paper,#fff)' }} onClick={run}><Download size={14} aria-hidden="true" />{busy ? t('Preparing') + '...' : t('Download backup (JSON)')}</button></div></div>
    <ul className="grid md:grid-cols-2 gap-3 mb-4">{PARTS.map((p) => { const c = counts[p.k]; const cut = p.cap && c > p.cap; return <li key={p.k}><label className="flow-panel p-4 flex items-start gap-3 cursor-pointer"><input type="checkbox" className="mt-1" checked={sel.has(p.k)} onChange={() => toggle(p.k)} aria-label={t(p.label)} /><span className="grow"><span className="font-semibold block">{t(p.label)}</span><span className="text-xs opacity-70 block">{t(p.note)}</span>{cut && <span className="text-xs text-amber-600 block">{t('More rows exist than the backup holds.')}</span>}</span><span className="text-lg font-bold" dir="ltr">{c ?? '-'}</span></label></li>; })}</ul>
    {res?.error && <p className="text-sm text-red-600" role="alert">{res.error}</p>}
    {res?.got && <div className="flow-panel p-4 text-sm" role="status"><p className="font-semibold inline-flex items-center gap-1.5"><ShieldCheck size={16} className="text-emerald-600" aria-hidden="true" />{t('Backup checked after download')} · {fmtB(res.size)}</p><p className="text-xs opacity-80 mt-1" dir="ltr">{res.got.map((g: any) => `${g.k}: ${g.n}`).join(' · ')}</p></div>}
    <p className="text-xs opacity-60 mt-3">{t('Backups hold no passwords, session tokens or file contents. Keep the file private. There is no restore button here on purpose.')}</p>
  </div>;
};
