import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
import { ArrowUp } from 'lucide-react';
import { useT } from '../lib/i18n';

const saved: Record<string, number> = {};
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Every route change starts at the top; back/forward restores the old position; #hash links still scroll to their target. */
export const ScrollManager: React.FC = () => {
  const loc = useLocation(); const nav = useNavigationType(); const prev = useRef(loc.key);
  useEffect(() => { try { history.scrollRestoration = 'manual'; } catch { /* ignore */ } }, []);
  useEffect(() => {
    const onScroll = () => { saved[prev.current] = window.scrollY; };
    window.addEventListener('scroll', onScroll, { passive: true }); return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => {
    prev.current = loc.key;
    if (loc.hash) { const t = setTimeout(() => document.getElementById(decodeURIComponent(loc.hash.slice(1)))?.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth' }), 80); return () => clearTimeout(t); }
    if (nav === 'POP' && saved[loc.key] !== undefined) { const y = saved[loc.key]; const t = setTimeout(() => window.scrollTo(0, y), 60); return () => clearTimeout(t); }
    window.scrollTo(0, 0);
  }, [loc.key]);
  return null;
};

/** Floating back-to-top button: appears after scrolling, hides before the footer so it never covers it or ad slots. */
export const BackToTop: React.FC = () => {
  const { t } = useT(); const [show, setShow] = useState(false); const [lift, setLift] = useState(0);
  useEffect(() => {
    const f = () => {
      setShow(window.scrollY > 700);
      const ft = document.querySelector('footer')?.getBoundingClientRect(); setLift(ft && ft.top < window.innerHeight ? window.innerHeight - ft.top : 0);
    };
    f(); window.addEventListener('scroll', f, { passive: true }); window.addEventListener('resize', f); return () => { window.removeEventListener('scroll', f); window.removeEventListener('resize', f); };
  }, []);
  return (
    <button type="button" aria-label={t('Back to top')} title={t('Back to top')} tabIndex={show ? 0 : -1} aria-hidden={!show}
      onClick={() => window.scrollTo({ top: 0, behavior: reduced() ? 'auto' : 'smooth' })}
      className="back-top fixed z-40 end-4 w-12 h-12 rounded-full grid place-items-center shadow-lg border"
      style={{ bottom: 20 + lift, opacity: show ? 1 : 0, pointerEvents: show ? 'auto' : 'none', transform: show ? 'none' : 'translateY(12px)', transition: reduced() ? 'none' : 'opacity .25s, transform .25s', background: 'var(--ink)', color: 'var(--card)', borderColor: 'rgba(120,110,95,.4)' }}>
      <ArrowUp size={20} />
    </button>);
};
