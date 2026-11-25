import React from 'react';
import { Menu, X, Sun, Moon, User, Palette } from 'lucide-react';
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
        <Link to="/" className="flex items-center gap-2 min-w-0" aria-label="Magic Convertor home">
          <Wand className="h-9 w-9 shrink-0" />
          <span className="font-display text-lg min-[400px]:text-xl sm:text-2xl font-semibold whitespace-nowrap">Magic Convertor</span>
        </Link>
        <div className="hidden md:flex items-center gap-1" role="navigation">
          {items.map((i) => <NavLink key={i.path} to={i.path} className={link}>{t(i.name)}</NavLink>)}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { applyIdentity(currentIdentity() === 'forest' ? 'paper' : 'forest'); }} aria-label="Switch visual identity" title="Identity: Paper / Forest" className="hidden sm:grid w-9 h-9 grid place-items-center rounded-lg border border-white/20 text-gray-300 hover:text-white hover:bg-white/10"><Palette size={17} /></button>
          <div dir="ltr" className="mc-sw" role="group" aria-label={t('Appearance and language')}>
            <button type="button" role="switch" aria-checked={!light} aria-label={t('Dark theme')} title={t(light ? 'Dark theme' : 'Light theme')} onClick={toggle} data-on={light ? '0' : '1'} className="mc-sw-btn"><i className="mc-sw-thumb" /><span><Sun size={14} /></span><span><Moon size={14} /></span></button>
            <button type="button" role="switch" aria-checked={lang === 'ar'} aria-label={t('Arabic language')} title="English / العربية" onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} data-on={lang === 'ar' ? '1' : '0'} className="mc-sw-btn"><i className="mc-sw-thumb" /><span>EN</span><span className="font-semibold">ع</span></button>
          </div>
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
