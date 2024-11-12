import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { RotateCw, Hash, Stamp } from 'lucide-react';
import { FeatureGrid } from '../components/FeatureGrid';

const editFeatures = [
  {
    title: 'Rotate PDF',
    description: 'Rotate PDF pages to any angle',
    icon: RotateCw,
    path: '/edit-pdf/rotate'
  },
  {
    title: 'Add Page Numbers',
    description: 'Add custom page numbers to your PDF',
    icon: Hash,
    path: '/edit-pdf/page-numbers'
  },
  {
    title: 'Add Watermark',
    description: 'Add text or image watermarks to PDF pages',
    icon: Stamp,
    path: '/edit-pdf/watermark'
  }
];

export const EditPDF: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={
        <div className="pt-24 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                <span className="bg-gradient-to-r from-violet-400 to-blue-400 text-transparent bg-clip-text">
                  Edit PDF
                </span>
              </h1>
              <p className="text-gray-400">
                Modify your PDF files with our editing tools
              </p>
            </div>
            <FeatureGrid features={editFeatures} />
          </div>
        </div>
      } />
    </Routes>
  );
};