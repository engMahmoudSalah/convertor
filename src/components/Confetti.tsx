import React, { useEffect, useRef } from 'react';
export const Confetti: React.FC = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const c = ref.current!; const x = c.getContext('2d')!; const W = (c.width = c.offsetWidth * 2), H = (c.height = c.offsetHeight * 2);
    const cols = ['#8b5cf6', '#3b82f6', '#14b8a6', '#f59e0b', '#ec4899'];
    const ps = Array.from({ length: 70 }, () => ({ x: W / 2, y: H * 0.7, vx: (Math.random() - 0.5) * 22, vy: -Math.random() * 20 - 6, s: 6 + Math.random() * 8, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, c: cols[(Math.random() * cols.length) | 0] }));
    let raf = 0, f = 0;
    const tick = () => { x.clearRect(0, 0, W, H); f++; ps.forEach((p) => { p.vy += 0.7; p.x += p.vx; p.y += p.vy; p.r += p.vr; x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.c; x.globalAlpha = Math.max(0, 1 - f / 90); x.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); x.restore(); }); if (f < 90) raf = requestAnimationFrame(tick); else x.clearRect(0, 0, W, H); };
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={ref} className="absolute inset-x-0 -top-24 h-48 w-full pointer-events-none" aria-hidden="true" />;
};
