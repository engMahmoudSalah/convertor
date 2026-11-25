import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { NavBar } from './components/NavBar';
import { Home } from './pages/Home';
import { AuthProvider } from './lib/auth';
import { AuthPage } from './pages/AuthPage';
import { Account } from './pages/Account';
import { Admin } from './pages/Admin';
import { Pricing } from './pages/Pricing';
import { TypePage } from './pages/TypePage';
import { ToolPage } from './pages/ToolPage';
import logo from "./../Magic.png"

function App() {
  return (
    <BrowserRouter>
    <AuthProvider>
      <div className="min-h-screen bg-gray-900 text-white overflow-hidden">
        <NavBar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/signup" element={<AuthPage mode="signup" />} />
          <Route path="/account" element={<Account />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/:type" element={<TypePage />} />
          <Route path="/tools/:id" element={<ToolPage />} />
        </Routes>
        <div className="text-md mb-6 flex justify-center items-center font-bold bg-gradient-to-r from-violet-400 to-blue-400 text-transparent bg-clip-text">
        Powered By 
        <img style={{height:"55px"}} src={logo} alt="" />
            </div>
      </div>
    </AuthProvider>
    </BrowserRouter>
  );
}

export default App;