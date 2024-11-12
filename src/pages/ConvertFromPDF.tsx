import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Image, FileText, Layout, FileSpreadsheet } from 'lucide-react';
import { FeatureGrid } from '../components/FeatureGrid';

const convertFeatures = [
  {
    title: 'PDF to JPG',
    description: 'Convert PDF pages to JPG images',
    icon: Image,
    path: '/convert-from-pdf/jpg'
  },
  {
    title: 'PDF to Word',
    description: 'Convert PDF to editable Word documents',
    icon: FileText,
    path: '/convert-from-pdf/word'
  },
  {
    title: 'PDF to PowerPoint',
    description: 'Convert PDF to PowerPoint presentations',
    icon: Layout,
    path: '/convert-from-pdf/powerpoint'
  },
  {
    title: 'PDF to Excel',
    description: 'Convert PDF tables to Excel spreadsheets',
    icon: FileSpreadsheet,
    path: '/convert-from-pdf/excel'
  }
];

export const ConvertFromPDF: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={
        <div className="pt-24 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                <span className="bg-gradient-to-r from-violet-400 to-blue-400 text-transparent bg-clip-text">
                  Convert from PDF
                </span>
              </h1>
              <p className="text-gray-400">
                Transform your PDFs into various file formats
              </p>
            </div>
            <FeatureGrid features={convertFeatures} />
          </div>
        </div>
      } />
    </Routes>
  );
};