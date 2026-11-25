import { useT } from '../lib/i18n';
import { PageHeader } from '../components/PageArt';
import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { TYPES, toolsOfType, CATS } from '../tools/registry';
export const TypePage: React.FC = () => {
  const { t: tr } = useT(); const { type = '' } = useParams(); const t = TYPES[type];
  if (!t) return <div className="pt-28 text-center">Not found. <Link className="text-violet-300" to="/">Home</Link></div>;
  const list = toolsOfType(type);
  return (<div className="pt-28 pb-12 max-w-6xl mx-auto px-4">
    <PageHeader kind={type as any} title={tr(t.title)} sub={<>{tr(t.desc)}. <span className="text-gray-500">{list.length} {tr('tools')}.</span></>} />
    {[...new Set(list.map((x) => x.category))].map((c) => (<section key={c} className="mb-8"><h2 className="text-lg font-semibold text-gray-300 mb-3">{tr(CATS[c])}</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">{list.filter((x) => x.category === c).map((x) => { const I = x.icon; return (
        <Link key={x.id} to={`/tools/${x.id}`} className="group p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-violet-400/60 hover:bg-white/10 transition">
          <I className="text-violet-300 mb-3" /><h3 className="font-semibold mb-1">{tr(x.title)}</h3><p className="text-sm text-gray-400">{tr(x.desc)}</p></Link>); })}</div></section>))}
  </div>);
};
