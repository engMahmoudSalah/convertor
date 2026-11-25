import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { NavBar } from './components/NavBar';
import { Home } from './pages/Home';
import { ToolPage } from './pages/ToolPage';
import logo from "./../Magic.png"

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-900 text-white overflow-hidden">
        <NavBar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tools/:id" element={<ToolPage />} />
        </Routes>
        <div className="text-md mb-6 flex justify-center items-center font-bold bg-gradient-to-r from-violet-400 to-blue-400 text-transparent bg-clip-text">
        Powered By 
        <img style={{height:"55px"}} src={logo} alt="" />
            </div>
      </div>
    </BrowserRouter>
  );
}

export default App;