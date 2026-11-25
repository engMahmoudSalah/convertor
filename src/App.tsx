import { useEffect } from 'react';
import { LangProvider } from './lib/i18n';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { NavBar } from './components/NavBar';
import { Home } from './pages/Home';
import { AuthProvider } from './lib/auth';
import { AuthPage } from './pages/AuthPage';
import { Account } from './pages/Account';
import { Admin } from './pages/Admin';
import { Pricing } from './pages/Pricing';
import { TypePage } from './pages/TypePage';
import { ToolPage } from './pages/ToolPage';
import { ByMahmoud } from './pages/ByMahmoud';
import { Legal } from './pages/Legal';
import { SiteFooter } from './components/SiteFooter';
import logo from "./../Magic.png"

const useReveal = () => {
  const loc = useLocation();
  useEffect(() => {
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.08 });
    const t = setTimeout(() => document.querySelectorAll('.grid > a, .grid > div, main section').forEach((el) => { if (el.getBoundingClientRect().top > window.innerHeight * 0.9) { el.classList.add('reveal'); io.observe(el); } }), 120);
    return () => { clearTimeout(t); io.disconnect(); };
  }, [loc.pathname]);
};
const Reveal = () => { useReveal(); return null; };
function App() {
  return (
    <BrowserRouter>
    <LangProvider><AuthProvider>
      <div className="min-h-screen min-h-[100dvh] flex flex-col bg-gray-900 text-white overflow-x-hidden">
        <NavBar /><Reveal />
        <div className="flex-1 w-full"><Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/signup" element={<AuthPage mode="signup" />} />
          <Route path="/account" element={<Account />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/legal/:doc" element={<Legal />} />
          <Route path="/by-mahmoud" element={<ByMahmoud />} />
          <Route path="/:type" element={<TypePage />} />
          <Route path="/tools/:id" element={<ToolPage />} />
        </Routes></div>
        <div className="text-md mb-6 mt-6 flex justify-center items-center font-display font-semibold">
        Powered By 
        <img style={{height:"55px"}} src={logo} alt="" />
            </div>
        <SiteFooter />
      </div>
    </AuthProvider></LangProvider>
    </BrowserRouter>
  );
}

export default App;