import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { Image, FileText, Layout, FileSpreadsheet } from 'lucide-react';
import { FeatureGrid } from '../components/FeatureGrid';
import { PNGToPDF } from '../features/convert-to-pdf/PNGToPDF';
import { WordToPDF } from '../features/convert-to-pdf/WordToPDF';
import { PowerPointToPDF } from '../features/convert-to-pdf/PowerPointToPDF';
import { ExcelToPDF } from '../features/convert-to-pdf/ExcelToPDF';

const convertFeatures = [
  {
    title: 'PNG to PDF',
    description: 'Convert PNG images to PDF documents',
    icon: Image,
    path: '/convert-to-pdf/png'
  },
  {
    title: 'Word to PDF',
    description: 'Convert Word documents to PDF format',
    icon: FileText,
    path: '/convert-to-pdf/word'
  },
  {
    title: 'PowerPoint to PDF',
    description: 'Convert PowerPoint presentations to PDF',
    icon: Layout,
    path: '/convert-to-pdf/powerpoint'
  },
  {
    title: 'Excel to PDF',
    description: 'Convert Excel spreadsheets to PDF documents',
    icon: FileSpreadsheet,
    path: '/convert-to-pdf/excel'
  }
];

export const ConvertToPDF: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={
        <div className="pt-24 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                <span className="bg-gradient-to-r from-violet-400 to-blue-400 text-transparent bg-clip-text">
                  Convert to PDF
                </span>
              </h1>
              <p className="text-gray-400">
                Transform your files into PDF format with our conversion tools
              </p>
            </div>
            <FeatureGrid features={convertFeatures} />
          </div>
        </div>
      } />
      <Route path="/png" element={<PNGToPDF />} />
      <Route path="/word" element={<WordToPDF />} />
      <Route path="/powerpoint" element={<PowerPointToPDF />} />
      <Route path="/excel" element={<ExcelToPDF />} />
    </Routes>
  );
};