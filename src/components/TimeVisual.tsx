import React from 'react';

export const hasTimeVisual = (id: string) => id === 'timezone-converter';
type Row = { zone: string; date: string; h: number; m: number; off: string };
const parse = (out: string): Row[] => out.split('\n').map((l) => /^(.+?): (\d{4})-(\d{1,2})-(\d{1,2})[ T](\d{1,2}):(\d{2})(?: \((UTC[+-]\d{2}:\d{2})\))?$/.exec(l.trim())).filter(Boolean).map((m: any) => ({ zone: m[1], date: `${m[2]}-${m[3].padStart(2, '0')}-${m[4].padStart(2, '0')}`, h: +m[5], m: +m[6], off: m[7] || '' }));
const kind = (h: number) => (h >= 9 && h < 17 ? 'work' : h >= 7 && h < 22 ? 'awake' : 'night');
const COL: Record<string, string> = { work: '#2f8f4e', awake: '#e3b34a', night: '#33415c' };

/** Day strip for each time zone: where the converted time falls in that zone's day, with office hours, awake hours and night. */
export const TimeVisual: React.FC<{ out: string; t: (s: string) => string }> = ({ out, t }) => {
  const rows = parse(out); if (rows.length < 1) return null;
  const base = rows[0]?.date;
  return (<div className="rounded-xl border p-4" style={{ borderColor: 'rgba(128,128,128,.3)' }} aria-label={t('Day strip for each zone')}>
    <p className="text-xs uppercase tracking-widest opacity-70 mb-3">{t('Where the time falls in each day')}</p>
    <ul className="space-y-3">{rows.map((r, i) => {
      const pos = ((r.h * 60 + r.m) / 1440) * 100; const dayShift = i === 0 ? 0 : Math.round((Date.parse(r.date) - Date.parse(base)) / 864e5);
      return (<li key={r.zone + i}>
        <div className="flex flex-wrap justify-between gap-x-3 text-sm" dir="ltr"><span className="font-semibold">{r.zone}</span><span><b>{String(r.h).padStart(2, '0')}:{String(r.m).padStart(2, '0')}</b> <span className="opacity-70">{r.off}</span>{dayShift !== 0 && i > 0 && <span className="ml-2 text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(128,128,128,.25)' }}>{dayShift > 0 ? `+${dayShift}` : dayShift} {t('day')}</span>}</span></div>
        <div className="relative mt-1.5 flex h-4 rounded-md overflow-hidden" dir="ltr" role="img" aria-label={`${r.zone} ${r.h}:${String(r.m).padStart(2, '0')} ${t(kind(r.h) === 'work' ? 'Office hours' : kind(r.h) === 'awake' ? 'Awake hours' : 'Night')}`}>
          {Array.from({ length: 24 }, (_, h) => <span key={h} style={{ flex: 1, background: COL[kind(h)], opacity: 0.85, borderRight: '1px solid rgba(255,255,255,.25)' }} />)}
          <span className="absolute top-0 bottom-0" style={{ left: `calc(${pos}% - 2px)`, width: 4, background: '#fff', boxShadow: '0 0 0 1.5px #111' }} />
        </div>
        <div className="flex justify-between text-[10px] opacity-60 mt-0.5" dir="ltr"><span>00</span><span>06</span><span>12</span><span>18</span><span>24</span></div>
      </li>);
    })}</ul>
    <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs mt-3">{(['work', 'awake', 'night'] as const).map((k) => <span key={k} className="inline-flex items-center gap-1.5"><span style={{ width: 10, height: 10, borderRadius: 3, background: COL[k], display: 'inline-block' }} />{t(k === 'work' ? 'Office hours (9 to 17)' : k === 'awake' ? 'Awake hours (7 to 22)' : 'Night')}</span>)}</p>
  </div>);
};
