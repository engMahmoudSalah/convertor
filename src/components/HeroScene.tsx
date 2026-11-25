import React from 'react';
const sheets = [
  { c: 'from-violet-500 to-fuchsia-500', l: 'PDF', z: 0 },
  { c: 'from-blue-500 to-cyan-400', l: 'IMG', z: 1 },
  { c: 'from-emerald-500 to-teal-400', l: 'DOC', z: 2 },
  { c: 'from-amber-500 to-orange-400', l: 'XLS', z: 3 },
];
export const HeroScene: React.FC = () => (
  <div dir="ltr" className="relative h-48 md:h-56 mb-2 select-none pointer-events-none" aria-hidden="true">
    <div className="aurora a1" /><div className="aurora a2" /><div className="aurora a3" />
    <div className="scene3d">
      <div className="stack3d">
        {sheets.map((s, i) => (
          <div key={s.l} className="sheet3d" style={{ ['--i' as any]: i }}>
            <div className={`w-full h-full rounded-xl bg-gradient-to-br ${s.c} p-3 flex flex-col justify-between border border-white/30`}>
              <span className="text-xs font-extrabold tracking-widest text-white/90">{s.l}</span>
              <div className="space-y-1.5"><i className="block h-1.5 rounded bg-white/70 w-4/5" /><i className="block h-1.5 rounded bg-white/50 w-3/5" /><i className="block h-1.5 rounded bg-white/50 w-2/3" /></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);
