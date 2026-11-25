import React from 'react';
import { Menu, X, Sun, Moon, User } from 'lucide-react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useTheme } from '../lib/theme';
import { useT } from '../lib/i18n';
import { Languages } from 'lucide-react';
import logoo from './../../Magic0.png';

const menuItems = [
  { name: 'PDF', path: '/pdf' },
  { name: 'Images', path: '/images' },
  { name: 'Documents', path: '/documents' },
  { name: 'Pricing', path: '/pricing' },
];

export const NavBar: React.FC = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const loc = useLocation(); const { user, adminExists } = useAuth(); const { light, toggle } = useTheme(); const { t, lang, setLang } = useT();
  React.useEffect(() => setIsOpen(false), [loc.pathname]);
  const items = [...menuItems, ...(user?.role === 'admin' ? [{ name: 'Admin', path: '/admin' }] : user && !adminExists ? [{ name: 'Claim admin', path: '/admin' }] : [])];
  const link = ({ isActive }: { isActive: boolean }) => `px-3.5 py-2 rounded-lg text-sm font-medium ${isActive ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'}`;
  return (
    <nav className="fixed w-full z-50 bg-black/20 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2 min-w-0" aria-label="Magic Convertor home">
          <img className="h-10 w-10 object-contain" src={logoo} alt="" />
          <span className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-violet-400 to-blue-400 text-transparent bg-clip-text whitespace-nowrap">Magic Convertor</span>
        </Link>
        <div className="hidden md:flex items-center gap-1" role="navigation">
          {items.map((i) => <NavLink key={i.path} to={i.path} className={link}>{t(i.name)}</NavLink>)}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggle} aria-label={t(light ? 'Switch to dark theme' : 'Switch to light theme')} title={t(light ? 'Dark theme' : 'Light theme')} className="w-9 h-9 grid place-items-center rounded-lg border border-white/20 text-gray-300 hover:text-white hover:bg-white/10">{light ? <Moon size={17} /> : <Sun size={17} />}</button>
          <button onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} aria-label="Language" title="English / العربية" className="h-9 px-2.5 inline-flex items-center gap-1.5 rounded-lg border border-white/20 text-gray-300 hover:text-white hover:bg-white/10 text-sm font-semibold"><Languages size={16} /><span className="hidden min-[420px]:inline">{lang === 'ar' ? 'EN' : 'عربي'}</span></button>
          <Link to={user ? '/account' : '/login'} className="hidden sm:flex items-center gap-2 px-3.5 h-9 rounded-lg text-sm font-semibold bg-gradient-to-r from-violet-500 to-blue-500 hover:opacity-90"><User size={15} />{t(user ? 'Account' : 'Sign in')}</Link>
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
