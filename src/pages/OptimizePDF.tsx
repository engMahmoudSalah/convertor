import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { FileDown, Wrench, ScanLine } from 'lucide-react';
import { FeatureGrid } from '../components/FeatureGrid';

const optimizeFeatures = [
  {
    title: 'Compress PDF',
    description: 'Reduce PDF file size while maintaining quality',
    icon: FileDown,
    path: '/optimize-pdf/compress'
  },
  {
    title: 'Repair PDF',
    description: 'Fix corrupted PDF files',
    icon: Wrench,
    path: '/optimize-pdf/repair'
  },
  {
    title: 'OCR PDF',
    description: 'Make scanned PDFs searchable',
    icon: ScanLine,
    path: '/optimize-pdf/ocr'
  }
];

export const OptimizePDF: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={
        <div className="pt-24 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                <span className="bg-gradient-to-r from-violet-400 to-blue-400 text-transparent bg-clip-text">
                  Optimize PDF
                </span>
              </h1>
              <p className="text-gray-400">
                Enhance and optimize your PDF files
              </p>
            </div>
            <FeatureGrid features={optimizeFeatures} />
          </div>
        </div>
      } />
    </Routes>
  );
};