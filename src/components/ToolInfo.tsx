import React from 'react';
import { Link } from 'react-router-dom';
import { useT } from '../lib/i18n';
import { toolById, howTo, faq, related, toolMeta } from '../seo/content';
export const ToolInfo: React.FC<{ id: string }> = ({ id }) => {
  const { lang } = useT(); const tool = toolById(id); if (!tool) return null;
  const m = toolMeta(tool, lang); const steps = howTo(tool, lang); const qs = faq(tool, lang);
  return (
    <section className="max-w-3xl mx-auto mt-16 px-4 pb-8" aria-label={m.h1}>
      <h2 className="ed-h2 text-2xl font-bold mb-3">{lang === 'ar' ? `كيف تستخدم ${m.h1}` : `How to use ${m.h1}`}</h2>
      <ol className="list-decimal ps-6 space-y-1 mb-8 opacity-90">{steps.map((s) => <li key={s}>{s}</li>)}</ol>
      <h2 className="text-2xl font-bold mb-3">{lang === 'ar' ? 'أسئلة شائعة' : 'Frequently asked questions'}</h2>
      <dl className="space-y-3 mb-8">{qs.map((f) => <div key={f.q}><dt className="font-semibold">{f.q}</dt><dd className="opacity-80">{f.a}</dd></div>)}</dl>
      <h2 className="text-2xl font-bold mb-3">{lang === 'ar' ? 'أدوات ذات صلة' : 'Related tools'}</h2>
      <ul className="flex flex-wrap gap-2">{related(tool).map((r) => <li key={r.id}><Link className="inline-block px-3 py-1.5 rounded-full border border-current/25 text-sm hover:border-current" to={`/tools/${r.id}`}>{lang === 'ar' && r.ar.title ? r.ar.title : r.title}</Link></li>)}</ul>
    </section>);
};
