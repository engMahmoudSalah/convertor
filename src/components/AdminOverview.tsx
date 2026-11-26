import React from 'react';
import { AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CountUp, EmptyArt } from './PageArt';
import { TOOLS } from '../tools/registry';
import { useT } from '../lib/i18n';

type Go = (tab: string) => void;
const Kpi: React.FC<{ label: string; value: any; sub?: string; to: string; go: Go }> = ({ label, value, sub, to, go }) => {
  const { t } = useT();
  return <button type="button" onClick={() => go(to)} className="flow-panel p-4 text-start w-full" aria-label={`${label}: ${typeof value === 'number' ? value : String(value)}. ${t('Open')} ${t(to)}`}>
    <span className="text-xs opacity-70 block">{label}</span><span className="text-2xl font-bold block" dir="ltr">{typeof value === 'number' ? <CountUp value={value} /> : value}</span>{sub && <span className="text-xs opacity-60 block mt-0.5">{sub}</span>}</button>;
};

export const AdminOverview: React.FC<{ st: any; ov: any; sys: any; plans: any[]; go: Go; charts: React.ReactNode }> = ({ st, ov, sys, plans, go, charts }) => {
  const { t } = useT();
  const rev = (s: string, c: string) => (ov.revenue ?? []).filter((r: any) => r.status === s && r.currency === c).reduce((a: number, r: any) => a + r.amt, 0);
  const pending = (ov.revenue ?? []).filter((r: any) => r.status === 'pending').reduce((a: number, r: any) => a + r.n, 0);
  const unverified = Math.max(0, ov.total - ov.verified);
  const pct = ov.total ? Math.round((st.pro / ov.total) * 100) : 0;
  const alerts: { text: string; to: string }[] = [];
  if (st.banned > 0) alerts.push({ text: `${st.banned} ${t('suspended users')}`, to: 'Users' });
  if (ov.abuse24 > 0) alerts.push({ text: `${ov.abuse24} ${t('blocked requests in the last 24 hours')}`, to: 'Abuse' });
  if (pending > 0) alerts.push({ text: `${pending} ${t('orders waiting for payment')}`, to: 'Payments' });
  if (sys && !sys.mail) alerts.push({ text: t('Email is not connected, so verification and reset emails cannot be sent.'), to: 'Ads and SEO' });
  if (sys && !sys.payments) alerts.push({ text: t('Payments are not connected yet.'), to: 'Ads and SEO' });
  if (sys && !sys.google) alerts.push({ text: t('Google sign-in is not connected yet.'), to: 'Ads and SEO' });
  if (unverified > 0) alerts.push({ text: `${unverified} ${t('users have not verified their email')}`, to: 'Users' });
  const names = new Map(TOOLS.map((x) => [x.id, x.title])); const maxN = Math.max(1, ...ov.topTools30.map((x: any) => x.n));
  const planName = (id: string) => t(plans.find((p) => p.id === id)?.name ?? id);
  const group = (title: string, children: React.ReactNode) => <section className="mb-5"><h3 className="text-sm font-bold opacity-80 mb-2">{title}</h3><div className="grid grid-cols-2 md:grid-cols-4 gap-3">{children}</div></section>;
  return <div>
    <section className="flow-panel p-4 mb-5" aria-label={t('Needs attention')}>
      <h3 className="font-bold mb-2 inline-flex items-center gap-2">{alerts.length ? <AlertTriangle size={16} className="text-amber-600" aria-hidden="true" /> : <CheckCircle2 size={16} className="text-emerald-600" aria-hidden="true" />}{alerts.length ? t('Needs attention') : t('All clear')}</h3>
      {alerts.length > 0 && <ul>{alerts.map((a) => <li key={a.text} className="flex items-center justify-between gap-3 py-1.5 border-t border-white/10 first:border-0 text-sm"><span>{a.text}</span><button type="button" className="flow-ghost px-3 py-1 rounded-lg text-xs font-semibold inline-flex items-center gap-1 shrink-0" onClick={() => go(a.to)}>{t(a.to)}<ArrowRight size={12} className="rtl:rotate-180" aria-hidden="true" /></button></li>)}</ul>}
    </section>
    {group(t('People'), <>
      <Kpi label={t('Users')} value={st.users} to="Users" go={go} /><Kpi label={t('Paid users')} value={st.pro} sub={`${pct}% ${t('of users')}`} to="Users" go={go} />
      <Kpi label={t('Signups (7d)')} value={st.signups7} to="Users" go={go} /><Kpi label={t('Suspended')} value={st.banned} to="Users" go={go} /></>)}
    {group(t('Activity'), <>
      <Kpi label={t('Jobs (24h)')} value={st.jobs24} to="Usage" go={go} /><Kpi label={t('Jobs (7d)')} value={st.jobs7} to="Usage" go={go} />
      <Kpi label={t('Abuse events (24h)')} value={ov.abuse24} to="Abuse" go={go} /><Kpi label={t('Saved operations')} value={ov.saved} to="Backup" go={go} /></>)}
    {group(t('Money'), <>
      <Kpi label={t('MRR (list price)')} value={`$${st.mrrUsd}`} to="Plans" go={go} /><Kpi label={t('Revenue')} value={`${Math.round(rev('paid', 'EGP'))} EGP`} sub={`${Math.round(rev('paid', 'USD'))} USD`} to="Payments" go={go} />
      <Kpi label={t('Orders waiting for payment')} value={pending} to="Payments" go={go} /></>)}
    <div className="grid md:grid-cols-3 gap-4 mb-5">{charts}</div>
    <div className="grid md:grid-cols-2 gap-4">
      <div className="flow-panel p-4"><p className="text-xs opacity-70 mb-2">{t('Users by plan')}</p>{ov.plans.map((p: any) => <div key={p.id} className="flex items-center gap-2 text-sm mb-1"><span className="w-20 shrink-0">{planName(p.id)}</span><span className="flex-1 h-2 rounded bg-black/10"><span className="block h-2 rounded" style={{ width: `${Math.round((p.n / Math.max(1, ov.total)) * 100)}%`, background: 'var(--ac)' }} /></span><b dir="ltr">{p.n}</b></div>)}
        <p className="text-xs opacity-70 mt-3">{t('Email verified')}: <bdi dir="ltr">{ov.verified}/{ov.total}</bdi> · Google: <bdi dir="ltr">{ov.google}</bdi></p></div>
      <div className="flow-panel p-4"><p className="text-xs opacity-70 mb-2">{t('Top tools (30d)')}</p>{ov.topTools30.length ? ov.topTools30.map((x: any) => <div key={x.tool} className="mb-1.5"><p className="text-sm flex justify-between gap-2"><Link to={`/tools/${x.tool}`} className="hover:underline">{t(names.get(x.tool) ?? x.tool)}</Link><b dir="ltr">{x.n}</b></p><div className="h-1 rounded" style={{ width: `${(x.n / maxN) * 100}%`, background: 'var(--ac)' }} /></div>) : <EmptyArt text={t('No jobs yet')} />}
        <button type="button" className="text-xs underline mt-2" onClick={() => go('Usage')}>{t('Open')} {t('Usage')}</button></div></div>
  </div>;
};
