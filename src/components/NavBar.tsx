import React from 'react';
import { Menu, X, Sun, Moon, User, SlidersHorizontal } from 'lucide-react';
import { applyIdentity, currentIdentity } from '../lib/identity';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useTheme } from '../lib/theme';
import { useT } from '../lib/i18n';
import { Languages } from 'lucide-react';
import { Wand } from './Wand';

const menuItems = [
  { name: 'PDF', path: '/pdf' },
  { name: 'Images', path: '/images' },
  { name: 'Documents', path: '/documents' },
  { name: 'Pricing', path: '/pricing' },
];


const SettingsMenu: React.FC = () => {
  const { light, toggle } = useTheme(); const { t, lang, setLang } = useT(); const [open, setOpen] = React.useState(false); const [idn, setIdn] = React.useState(currentIdentity());
  const btn = React.useRef<HTMLButtonElement>(null); const box = React.useRef<HTMLDivElement>(null);
  const items = () => Array.from(box.current?.querySelectorAll<HTMLElement>('[role^=menuitem]') ?? []);
  const close = (back = true) => { setOpen(false); if (back) btn.current?.focus(); };
  React.useEffect(() => { if (!open) return; items()[0]?.focus(); const down = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node) && !btn.current?.contains(e.target as Node)) close(false); }; document.addEventListener('mousedown', down); return () => document.removeEventListener('mousedown', down); }, [open]);
  const key = (e: React.KeyboardEvent) => {
    const it = items(); const i = it.indexOf(document.activeElement as HTMLElement);
    if (e.key === 'Escape') { e.preventDefault(); close(); } else if (e.key === 'ArrowDown') { e.preventDefault(); it[(i + 1) % it.length]?.focus(); } else if (e.key === 'ArrowUp') { e.preventDefault(); it[(i - 1 + it.length) % it.length]?.focus(); }
    else if (e.key === 'Home') { e.preventDefault(); it[0]?.focus(); } else if (e.key === 'End') { e.preventDefault(); it[it.length - 1]?.focus(); } else if (e.key === 'Tab') close(false);
  };
  const row = 'flex items-center justify-between gap-4 px-3 py-2.5 rounded-xl text-sm font-medium w-full text-start hover:bg-black/5 focus-visible:bg-black/5';
  return (<div className="relative">
    <button ref={btn} type="button" aria-haspopup="menu" aria-expanded={open} aria-label={t('Settings')} title={t('Settings')} onClick={() => setOpen(!open)} className="w-9 h-9 grid place-items-center rounded-lg border border-white/20 text-gray-300 hover:text-white hover:bg-white/10"><SlidersHorizontal size={17} /></button>
    {open && <div ref={box} role="menu" aria-label={t('Settings')} onKeyDown={key} className="mc-menu flow-panel absolute end-0 top-full mt-2 w-64 p-2 z-50">
      <button role="menuitemcheckbox" aria-checked={!light} onClick={toggle} className={row}><span>{t('Theme')}</span><span dir="ltr" className="mc-sw-btn" data-on={light ? '0' : '1'} aria-hidden="true"><i className="mc-sw-thumb" /><span><Sun size={14} /></span><span><Moon size={14} /></span></span></button>
      <button role="menuitemcheckbox" aria-checked={lang === 'ar'} onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} className={row}><span>{t('Language')}</span><span dir="ltr" className="mc-sw-btn" data-on={lang === 'ar' ? '1' : '0'} aria-hidden="true"><i className="mc-sw-thumb" /><span>EN</span><span className="font-semibold">ع</span></span></button>
      <div role="group" aria-label={t('Identity')} className="px-3 pt-2 pb-1"><p className="text-xs uppercase tracking-wider opacity-60 mb-1.5">{t('Identity')}</p>
        <div className="grid grid-cols-2 gap-1.5">{(['paper', 'forest'] as const).map((k) => <button key={k} role="menuitemradio" aria-checked={idn === k} onClick={() => { applyIdentity(k); setIdn(k); }} className={`mc-idn px-3 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-2 justify-center ${idn === k ? 'on' : ''}`}><i className={`mc-idn-dot ${k}`} />{t(k === 'paper' ? 'Paper' : 'Forest')}</button>)}</div></div>
    </div>}</div>);
};

export const NavBar: React.FC = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const loc = useLocation(); const { user, adminExists } = useAuth(); const { light, toggle } = useTheme(); const { t, lang, setLang } = useT();
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => { const f = () => setScrolled(window.scrollY > 8); f(); window.addEventListener('scroll', f, { passive: true }); return () => window.removeEventListener('scroll', f); }, []);
  React.useEffect(() => setIsOpen(false), [loc.pathname]);
  const items = [...menuItems, ...(user?.role === 'admin' ? [{ name: 'Admin', path: '/admin' }] : user && !adminExists ? [{ name: 'Claim admin', path: '/admin' }] : [])];
  const link = ({ isActive }: { isActive: boolean }) => `px-3.5 py-2 rounded-lg text-sm font-medium ${isActive ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'}`;
  return (
    <nav data-scrolled={scrolled || isOpen ? '1' : '0'} className="mc-nav fixed w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        <Link to="/" aria-label="Magic Convertor home" className={`nav-logo flex items-center min-w-0 ${loc.pathname === '/' ? (scrolled ? 'mode-icon' : 'mode-word') : 'mode-both'}`}>
          <span className="nav-wand shrink-0"><Wand className="h-10 w-10" /></span>
          <span className="nav-word font-display text-lg min-[400px]:text-xl sm:text-2xl font-semibold whitespace-nowrap">Magic Convertor</span>
        </Link>
        <div className="hidden md:flex items-center gap-1" role="navigation">
          {items.map((i) => <NavLink key={i.path} to={i.path} className={link}>{t(i.name)}</NavLink>)}
        </div>
        <div className="flex items-center gap-2">
          <SettingsMenu />
          <Link to={user ? '/account' : '/login'} className="hidden sm:flex items-center gap-2 px-3.5 h-9 rounded-lg text-sm font-semibold btn-ink-sm"><User size={15} />{t(user ? 'Account' : 'Sign in')}</Link>
          <button className="md:hidden w-9 h-9 grid place-items-center rounded-lg border border-white/20 text-gray-300" onClick={() => setIsOpen(!isOpen)} aria-label={t('Menu')} aria-expanded={isOpen}>{isOpen ? <X size={18} /> : <Menu size={18} />}</button>
        </div>
      </div>
      <div className={`md:hidden border-t border-white/10 ${isOpen ? 'block' : 'hidden'}`}>
        <div className="px-3 py-3 space-y-1">
          {[...items, user ? { name: 'Account', path: '/account' } : { name: 'Sign in', path: '/login' }].map((i) => <NavLink key={i.path} to={i.path} className={({ isActive }) => `block ${link({ isActive })} text-base`}>{t(i.name)}</NavLink>)}
        </div>
      </div>
    </nav>
  );
};
