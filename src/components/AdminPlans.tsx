import React, { useEffect, useRef, useState } from 'react';
import { Gauge, HardDrive, Megaphone, Wallet } from 'lucide-react';
import { api } from '../lib/api';
import { useT } from '../lib/i18n';

type Row = Record<string, any>;
const UNLIMITED = 100000;
const inp = 'w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-sm disabled:opacity-50';

export const AdminPlans: React.FC<{ plans: Row[]; usersByPlan: Record<string, number>; advancedCount: number; toast: (m: string) => void; refresh: () => Promise<void> }> = ({ plans, usersByPlan, advancedCount, toast, refresh }) => {
  const { t } = useT();
  const [pl, setPl] = useState<Row[]>([]); const [rate, setRate] = useState('54.8'); const [rateSet, setRateSet] = useState(true); const [state, setState] = useState<Record<string, string>>({}); const timers = useRef<Record<string, any>>({});
  useEffect(() => setPl(plans.map((p) => ({ ...p }))), [plans]);
  useEffect(() => { api('/admin/rate').then((r) => { if (r.rate) { setRate(String(r.rate)); setRateSet(!!r.set); } }); }, []);
  const saveRate = async () => { const r = await api('/admin/rate', { rate: Number(rate) }); toast(r.error ? String(r.error) : t('Exchange rate saved')); if (!r.error) setRateSet(true); };
  const [fxNote, setFxNote] = useState('');
  const liveRate = async () => { const r = await api('/admin/rate', { fetch: true }); if (r.error) return toast(String(r.error)); setRate(String(r.live)); setFxNote(`${r.live} · ${r.source}`); };
  const autosave = (row: Row) => {
    clearTimeout(timers.current[row.id]); setState((m) => ({ ...m, [row.id]: 'pending' }));
    timers.current[row.id] = setTimeout(async () => { const r = await api('/admin/plan', row); setState((m) => ({ ...m, [row.id]: r.error ? 'error' : 'saved' })); if (r.error) { toast(String(r.error)); await refresh(); } }, 1200);
  };
  const edit = (id: string, patch: Row) => { const row = { ...pl.find((x) => x.id === id), ...patch }; setPl(pl.map((x) => (x.id === id ? row : x))); if (Object.values(patch).every((v) => v !== '')) autosave(row); };
  const setPrice = (id: string, k: 'price_usd' | 'price_egp', v: string) => { const r = Number(rate) || 54.8; const n = Number(v); if (v === '' || !Number.isFinite(n)) return edit(id, { [k]: v }); edit(id, k === 'price_usd' ? { price_usd: v, price_egp: Math.round(n * r) } : { price_egp: v, price_usd: Math.round((n / r) * 100) / 100 }); };
  const repriceAll = async () => { const r = Number(rate) || 54.8; let bad = ''; for (const p of pl.filter((x) => x.price_usd > 0)) { const res = await api('/admin/plan', { id: p.id, price_egp: Math.round(p.price_usd * r) }); if (res.error) bad = String(res.error); } toast(bad || t('Prices updated at this rate')); await refresh(); };
  const num = (p: Row, k: string, label: string, unit?: string) => <label className="block text-xs"><span className="opacity-70 block mb-1">{label}{unit ? <span className="opacity-60"> · {unit}</span> : null}</span><input aria-label={`${p.name} ${k}`} className={inp} type="number" min={0} value={p[k]} onChange={(e) => (k === 'price_usd' || k === 'price_egp' ? setPrice(p.id, k, e.target.value) : edit(p.id, { [k]: e.target.value }))} /></label>;
  const Sec: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => <div className="border-t border-black/10 pt-3 mt-3"><p className="text-[11px] uppercase tracking-wider opacity-60 flex items-center gap-1.5 mb-2">{icon}{title}</p><div className="grid grid-cols-2 gap-2.5">{children}</div></div>;
  const adsLabel = (n: number) => (n === 0 ? t('No ads') : n === 1 ? t('1 ad step') : t('2 ad steps'));
  return (
    <div>
      <div className="flow-panel p-4 mb-4 flex flex-wrap items-center gap-3 text-sm">
        <label htmlFor="fx-rate" className="font-semibold">{t('Exchange rate: EGP per 1 USD')}</label>
        <input id="fx-rate" className={`${inp} !w-24`} type="number" min="1" step="0.01" value={rate} onChange={(e) => setRate(e.target.value)} />
        <button type="button" className="flow-ghost px-3 py-1.5 rounded-lg text-xs font-semibold" onClick={liveRate}>{t("Get today's market rate")}</button>
        {fxNote && <span className="text-xs opacity-80" dir="ltr">{fxNote}</span>}
        <button type="button" className="flow-ghost px-3 py-1.5 rounded-lg text-xs font-semibold" onClick={saveRate}>{t('Save rate')}</button>
        <button type="button" className="flow-ghost px-3 py-1.5 rounded-lg text-xs font-semibold" onClick={repriceAll} title={t('Set every paid plan EGP price from its USD price')}>{t('Apply rate to all paid plans')}</button>
        <span className="opacity-70 text-xs grow basis-64">{rateSet ? t('Editing USD updates EGP, and EGP updates USD, at this rate.') : t("Default rate, please set today's rate.")}</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {pl.map((p) => { const free = p.id === 'guest' || p.id === 'free'; const unl = Number(p.heavy_daily) >= UNLIMITED; const st = state[p.id];
          return (
            <section key={p.id} className="flow-panel p-4" aria-label={p.name}>
              <div className="flex items-start justify-between gap-2"><div><h3 className="text-lg font-bold">{t(p.name)}</h3><p className="text-[11px] opacity-60" dir="ltr">{p.id} · {usersByPlan[p.id] ?? 0} {t('users')}</p></div>
                <span className="text-xs min-h-[1rem]" aria-live="polite">{st === 'pending' ? t('Saving...') : st === 'saved' ? <span className="text-emerald-600">{t('Saved')}</span> : st === 'error' ? <span className="text-red-500">{t('Not saved')}</span> : ''}</span></div>
              <Sec icon={<Wallet size={12} aria-hidden="true" />} title={t('Price per month')}>
                {free ? <p className="col-span-2 text-sm opacity-70">{t('Free plan, always 0')}</p> : <>{num({ ...p, price_usd: p.price_usd }, 'price_usd', 'USD')}{num(p, 'price_egp', 'EGP')}</>}
              </Sec>
              {!free && <span className="hidden" />}
              <Sec icon={<Gauge size={12} aria-hidden="true" />} title={t('Limits')}>
                <div className="col-span-2 text-xs"><span className="opacity-70 block mb-1">{t('Advanced jobs per day')} <span className="opacity-60">· {advancedCount} {t('tools')}</span></span>
                  <div className="flex items-center gap-2"><input aria-label={`${p.name} heavy_daily`} className={inp} type="number" min={0} disabled={unl} value={unl ? '' : p.heavy_daily} placeholder={unl ? t('Unlimited') : ''} onChange={(e) => edit(p.id, { heavy_daily: e.target.value })} />
                    <label className="flex items-center gap-1.5 whitespace-nowrap"><input type="checkbox" checked={unl} onChange={(e) => edit(p.id, { heavy_daily: e.target.checked ? UNLIMITED : 10 })} />{t('Unlimited')}</label></div></div>
                {num(p, 'max_mb', t('Max file size'), 'MB')}{num(p, 'max_files', t('Files per batch'))}
              </Sec>
              <Sec icon={<HardDrive size={12} aria-hidden="true" />} title={t('Saved work')}>
                {num(p, 'saved_max', t('Saved operations'))}{num(p, 'saved_mb', t('Saved storage'), 'MB')}{num(p, 'history_days', t('History'), t('days'))}
              </Sec>
              <Sec icon={<Megaphone size={12} aria-hidden="true" />} title={t('Ads before download')}>
                <div className="col-span-2 flex gap-1.5" role="radiogroup" aria-label={`${p.name} ads`}>{[0, 1, 2].map((n) => <button key={n} type="button" role="radio" aria-checked={Number(p.ads) === n} aria-label={`${p.name} ads ${n}`} onClick={() => edit(p.id, { ads: n })} style={Number(p.ads) === n ? { background: '#16110d', color: '#fffdf8', borderColor: '#16110d' } : undefined} className="grow px-2 py-1.5 rounded-lg border border-stone-400/60 text-xs">{adsLabel(n)}</button>)}</div>
              </Sec>
            </section>); })}
      </div>
      <p className="text-xs opacity-70 mt-4 max-w-3xl">{t('Only the advanced tools count toward the daily limit. Every other tool runs in the browser and is free and unlimited on every plan. Each plan must be at least as generous as the one before it, and the server refuses anything else.')}</p>
    </div>
  );
};
