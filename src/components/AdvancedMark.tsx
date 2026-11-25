import React from 'react';
import { Gauge } from 'lucide-react';
import { useT } from '../lib/i18n';
import { isHeavy } from '../lib/heavy';
/** Quiet corner mark on cards of advanced tools. The legend explains it once per list. */
export const AdvancedMark: React.FC<{ id: string }> = ({ id }) => {
  const { t } = useT(); if (!isHeavy(id)) return null;
  const tip = t('Advanced tool: counts toward the daily limit on Guest and Free');
  return <span className="adv-mark" title={tip} role="img" aria-label={tip}><Gauge size={14} aria-hidden="true" /></span>;
};
export const AdvancedLegend: React.FC = () => {
  const { t } = useT();
  return <p className="adv-legend"><span className="adv-mark static" aria-hidden="true"><Gauge size={13} /></span> {t('Advanced tool: counts toward the daily limit on Guest and Free. All other tools are unlimited.')}</p>;
};
