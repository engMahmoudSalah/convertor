import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Lock } from 'lucide-react';
import { useT } from '../lib/i18n';
import type { Plan } from '../lib/auth';
export type Feat = 'heavy' | 'size' | 'files' | 'saved' | 'savedmb' | 'history' | 'ads';
const val = (p: Plan, k: Feat) => ({ heavy: p.heavy_daily, size: p.max_mb, files: p.max_files, saved: p.saved_max, savedmb: p.saved_mb, history: p.history_days, ads: -p.ads }[k]);
/** The cheapest paid plan whose value for `k` is at least `v`. Null when the free plan already gives it. */
export function unlockPlan(plans: Plan[], k: Feat, v: number): Plan | null {
  const free = plans.find((p) => p.id === 'free'); if (!free || val(free, k) >= v) return null;
  return plans.filter((p) => p.price_usd > 0).sort((a, b) => a.price_usd - b.price_usd).find((p) => val(p, k) >= v) ?? null;
}
/** Better than the current plan: the cheapest paid plan that beats `cur`. */
export function upgradePlan(plans: Plan[], k: Feat, cur: Plan | null): Plan | null {
  const c = cur ? val(cur, k) : -1e9;
  return plans.filter((p) => p.price_usd > 0).sort((a, b) => a.price_usd - b.price_usd).find((p) => val(p, k) > c) ?? null;
}
export const PlanBadge: React.FC<{ plan: Plan | null | undefined; more?: boolean }> = ({ plan, more }) => {
  const { t } = useT(); if (!plan) return null;
  const label = t(plan.name);
  const tip = more ? `${t('More with the paid plan')}: ${label}` : `${t('Paid feature')}: ${t('unlocked by')} ${label}`;
  return (<Link to="/pricing" title={tip} aria-label={tip} className={`plan-badge ${plan.id}`}><Sparkles size={11} aria-hidden="true" /><span>{more ? '' : t('Paid') + ' · '}{label}</span></Link>);
};

/** A notice shown at the moment someone uses or hits something paid. Non-blocking, links to Pricing. */
export const PaidNotice: React.FC<{ plan: Plan | null | undefined; children: React.ReactNode; tone?: 'info' | 'warn' }> = ({ plan, children, tone = 'info' }) => {
  const { t } = useT();
  return (<div role="status" className={`paid-notice ${tone}`}><Sparkles size={16} aria-hidden="true" className="shrink-0 mt-0.5" /><p className="flex-1">{children}</p>
    {plan && <Link to="/pricing" className="paid-notice-link">{t('See')} {t(plan.name)}<span aria-hidden="true"> →</span></Link>}</div>);
};

/** One quiet line: the next paid plan, with a lock glyph. Used once per screen. */
export const PlanHint: React.FC<{ plan: Plan | null | undefined; plans: Plan[]; children: React.ReactNode }> = ({ plan, plans, children }) => {
  const { t } = useT();
  const next = plans.filter((p) => p.price_usd > 0 && p.price_usd > (plan?.price_usd ?? 0)).sort((a, b) => a.price_usd - b.price_usd)[0]; if (!next) return null;
  return (<Link to="/pricing" className="plan-hint" title={`${t('Paid feature')}: ${t('unlocked by')} ${t(next.name)}`}><Lock size={12} aria-hidden="true" /><span>{children} <b>{t(next.name)}</b><span aria-hidden="true" className="plan-hint-arrow"> →</span></span></Link>);
};
