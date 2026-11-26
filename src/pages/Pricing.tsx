import { useT } from '../lib/i18n';
import { PageHeader } from '../components/PageArt';
import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { HEAVY_TOOLS } from '../lib/heavy';
import { TOOLS } from '../tools/registry';
import { Gauge } from 'lucide-react';
import { PlanBadge, unlockPlan, Feat } from '../components/PlanBadge';
const feats = (p: any, ar: boolean) => ar ? [
  `${p.heavy_daily >= 100000 ? 'غير محدودة' : p.heavy_daily} مهمة متقدمة يومياً`, `ملفات حتى ${p.max_mb} ميجابايت`, `حتى ${p.max_files} ملف في الدفعة`,
  p.saved_max ? `حفظ حتى ${p.saved_max} عملية (${p.saved_mb} ميجابايت)` : 'بدون حفظ العمليات', p.history_days ? `سجل المهام ${p.history_days} يوم` : 'بدون سجل مهام',
  p.ads === 0 ? 'بدون إعلانات قبل التحميل' : `${p.ads} ${p.ads === 1 ? 'إعلان' : 'إعلانات'} قبل التحميل`, 'كل الأدوات الأساسية بلا حد', 'ملفاتك تبقى في متصفحك'] : [
  `${p.heavy_daily >= 100000 ? 'Unlimited' : p.heavy_daily} advanced jobs per day`, `Files up to ${p.max_mb} MB`, `Up to ${p.max_files} files per batch`,
  p.saved_max ? `Save up to ${p.saved_max} operations (${p.saved_mb} MB)` : 'No saved operations', p.history_days ? `${p.history_days}-day job history` : 'No job history',
  p.ads === 0 ? 'No ads before download' : `${p.ads} ${p.ads === 1 ? 'ad' : 'ads'} before download`, 'All basic tools, unlimited', 'Files stay in your browser'];
export const Pricing: React.FC = () => {
  const { t, lang } = useT();
  const { plans, user } = useAuth(); const KEYS: Feat[] = ['heavy', 'size', 'files', 'saved', 'history', 'ads'];
  const badgeFor = (p: any, i: number) => { const k = KEYS[i]; if (!k) return null; const v = k === 'ads' ? -p.ads : k === 'heavy' ? p.heavy_daily : k === 'size' ? p.max_mb : k === 'files' ? p.max_files : k === 'saved' ? p.saved_max : p.history_days; return <PlanBadge plan={unlockPlan(plans, k, v)} />; }; const [prov, setProv] = useState<{ id: string; currency: string }[]>([]); const [msg, setMsg] = useState(''); const [busy, setBusy] = useState('');
  useEffect(() => { api('/billing/status').then((r) => setProv(r.providers ?? [])); }, []);
  const buy = async (plan: string) => { if (!user) { window.location.href = '/signup?next=/pricing'; return; } setBusy(plan); setMsg(''); const r = await api('/billing/checkout', { plan, provider: prov[0]?.id }); setBusy(''); if (r.url) window.location.href = r.url; else setMsg(r.error ?? 'Could not start payment'); };
  const shown = plans.filter((p) => p.id !== 'guest'); const unl = (n: number) => (n >= 100000 ? t('Unlimited') : String(n));
  const rows: { label: string; get: (p: any) => string; sfx?: string }[] = [{ label: 'Advanced jobs per day', get: (p: any) => unl(p.heavy_daily) }, { label: 'Max file size', get: (p: any) => p.max_mb + ' MB' }, { label: 'Files per batch', get: (p: any) => String(p.max_files) }, { label: 'Saved operations', get: (p: any) => (p.saved_max ? `${p.saved_max} (${p.saved_mb} MB)` : '-') }, { label: 'Job history', get: (p: any) => (p.history_days ? String(p.history_days) : '-'), sfx: 'days' }, { label: 'Ads before download', get: (p: any) => String(p.ads) }];
  return (<div className="pt-28 pb-16 max-w-6xl mx-auto px-4">
    <PageHeader kind="pricing" title={t('Plans')} sub={t('Start free. Upgrade when you need more.')} />
    <div className="grid md:grid-cols-3 gap-6">{plans.filter((p) => p.id !== 'guest').map((p) => (
      <div key={p.id} className={`rounded-3xl p-7 border ${p.id === 'pro' ? 'plan-pro border-violet-400/70 bg-violet-500/10' : 'border-white/10 bg-white/5'}`}>
        <h2 className="text-xl font-bold flex items-center gap-2">{t(p.name)}{p.price_usd > 0 && <span className="plan-tag">{t('Paid plan')}</span>}</h2>
        <p className="text-3xl font-extrabold my-3">{p.price_usd ? `$${p.price_usd}` : '$0'}<span className="text-sm font-normal text-gray-400">{p.price_usd ? t(' / month') : ''}</span></p>
        {p.price_egp > 0 && <p className="text-xs text-gray-400 -mt-2 mb-3">{lang === 'ar' ? `أو ${p.price_egp} جنيه` : `or ${p.price_egp} EGP`}</p>}
        <ul className="space-y-2 text-sm text-gray-300 mb-6">{feats(p, lang === 'ar').map((f, i) => <li key={f} className="flex gap-2"><Check size={16} className="text-emerald-300 shrink-0 mt-0.5" /><span>{f}</span></li>)}</ul>
        {p.id === 'free' ? <Link to={user ? '/account' : '/signup'} className="block text-center py-2.5 rounded-xl border border-white/20">{t(user ? 'Your account' : 'Get started')}</Link>
          : prov.length ? <button onClick={() => buy(p.id)} disabled={busy === p.id} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-blue-500 font-semibold disabled:opacity-50">{busy === p.id ? '...' : (lang === 'ar' ? `ادفع ${p.price_egp} جنيه لمدة 30 يوماً` : `Pay ${p.price_egp} EGP for 30 days`)}</button>
          : <button disabled className="w-full py-2.5 rounded-xl bg-white/10 text-gray-400 cursor-not-allowed">{t('Payments opening soon')}</button>}
      </div>))}</div>

      <section id="advanced" className="mt-12" aria-labelledby="adv-h"><h2 id="adv-h" className="font-bold text-lg mb-1">{t('Which tools count as advanced')}</h2>
        <p className="text-sm opacity-80 max-w-3xl">{t('Advanced tools do heavy work in your browser. They count toward the daily limit: 3 a day for guests and 10 a day on Free, unlimited on Pro and Business. All other tools are unlimited on every plan.')}</p>
        <ul className="adv-chips">{HEAVY_TOOLS.map((id) => { const tl = TOOLS.find((x) => x.id === id); return tl ? <li key={id}><Link to={`/tools/${id}`}><Gauge size={14} aria-hidden="true" />{t(tl.title)}</Link></li> : null; })}</ul>
        <p className="text-xs opacity-70">{TOOLS.length - HEAVY_TOOLS.length} {t('other tools are basic and unlimited.')}</p></section>
      <div className="mt-12 overflow-x-auto"><table className="plan-table w-full text-sm"><caption className="text-start font-bold text-lg mb-3">{t('Compare plans')}</caption>
        <thead><tr><th scope="col" className="text-start">{t('Feature')}</th>{shown.map((p) => <th key={p.id} scope="col" className={p.price_usd > 0 ? 'paid' : ''}>{t(p.name)}</th>)}</tr></thead>
        <tbody>{rows.map((r) => <tr key={r.label}><th scope="row" className="text-start font-medium">{t(r.label)}</th>{shown.map((p) => <td key={p.id} className={p.price_usd > 0 ? "paid" : ""}><bdi dir="ltr">{r.get(p)}</bdi>{r.sfx && r.get(p) !== '-' ? ' ' + t(r.sfx) : ''}</td>)}</tr>)}</tbody></table>
        <p className="text-xs opacity-70 mt-2">{t('Shaded columns are paid plans.')}</p></div>
{msg && <p className="text-center text-red-300 text-sm mt-4">{msg}</p>}<p className="text-center text-xs text-gray-500 mt-8">{t('Plans are paid for 30 days at a time and do not renew automatically. See')} <Link className="text-violet-300" to="/legal/terms">{t('Terms')}</Link>{t(', ')}<Link className="text-violet-300" to="/legal/privacy">{t('Privacy')}</Link> {t('and')} <Link className="text-violet-300" to="/legal/refunds">{t('Refunds')}</Link>.</p></div>);
};
