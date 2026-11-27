import React from 'react';

const GROUPS: { g: string; items: [string, number, number][] }[] = [
  { g: 'Social', items: [['Instagram post', 1080, 1080], ['Instagram portrait', 1080, 1350], ['Story / Reel / TikTok', 1080, 1920], ['X header', 1500, 500], ['Facebook cover', 820, 312], ['LinkedIn banner', 1584, 396]] },
  { g: 'Video and web', items: [['YouTube thumbnail', 1280, 720], ['Full HD', 1920, 1080], ['Open Graph card', 1200, 630], ['Favicon', 512, 512]] },
  { g: 'Profile', items: [['Avatar', 400, 400], ['Passport 35x45 mm at 300 dpi', 413, 531]] },
];

/** One-tap size presets for Resize image. Sets pixels mode with "keep ratio" on, so the picture fits inside the box and is never stretched. */
export const ResizePresets: React.FC<{ opts: any; setOpts: (o: any) => void; t: (s: string) => string }> = ({ opts, setOpts, t }) => (
  <div className="mt-4">
    <p className="text-xs uppercase tracking-widest opacity-70 mb-2">{t('Size presets')}</p>
    {GROUPS.map((gr) => (
      <div key={gr.g} className="mb-2"><p className="text-xs opacity-70 mb-1">{t(gr.g)}</p>
        <div className="flex flex-wrap gap-2">{gr.items.map(([n, w, h]) => {
          const on = opts.mode === 'pixels' && Number(opts.width) === w && Number(opts.height) === h && opts.keep;
          return (<button key={n} type="button" aria-pressed={on} onClick={() => setOpts({ ...opts, mode: 'pixels', width: w, height: h, keep: true, fit: opts.fit ?? 'inside' })}
            className="flow-ghost px-3 py-1.5 rounded-lg text-xs font-semibold" style={on ? { background: '#0c2b22', color: '#d4f53c', borderColor: '#0c2b22' } : undefined}>{t(n)} <span dir="ltr" className={on ? '' : 'opacity-70'}>{w}×{h}</span></button>);
        })}</div></div>))}
    <p className="text-xs opacity-70 mt-1">{t('The picture is never stretched. Choose above whether it fits inside, fills and crops, or gets padded.')}</p>
  </div>);
