import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { NavBar } from './components/NavBar';
import { Home } from './pages/Home';
import { ConvertToPDF } from './pages/ConvertToPDF';
import { ConvertFromPDF } from './pages/ConvertFromPDF';
import { EditPDF } from './pages/EditPDF';
import { OrganizePDF } from './pages/OrganizePDF';
import { OptimizePDF } from './pages/OptimizePDF';
import logo from "./../Magic.png"

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-900 text-white overflow-hidden">
        <NavBar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/convert-to-pdf/*" element={<ConvertToPDF />} />
          <Route path="/convert-from-pdf/*" element={<ConvertFromPDF />} />
          <Route path="/edit-pdf/*" element={<EditPDF />} />
          <Route path="/organize-pdf/*" element={<OrganizePDF />} />
          <Route path="/optimize-pdf/*" element={<OptimizePDF />} />
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