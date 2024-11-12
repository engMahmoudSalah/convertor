import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Combine, Scissors, FileX } from 'lucide-react';
import { FeatureGrid } from '../components/FeatureGrid';

const organizeFeatures = [
  {
    title: 'Merge PDF',
    description: 'Combine multiple PDFs into one document',
    icon: Combine,
    path: '/organize-pdf/merge'
  },
  {
    title: 'Split PDF',
    description: 'Split PDF into multiple documents',
    icon: Scissors,
    path: '/organize-pdf/split'
  },
  {
    title: 'Remove Pages',
    description: 'Delete pages from your PDF',
    icon: FileX,
    path: '/organize-pdf/remove-pages'
  }
];

export const OrganizePDF: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={
        <div className="pt-24 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                <span className="bg-gradient-to-r from-violet-400 to-blue-400 text-transparent bg-clip-text">
                  Organize PDF
                </span>
              </h1>
              <p className="text-gray-400">
                Manage and organize your PDF files
              </p>
            </div>
            <FeatureGrid features={organizeFeatures} />
          </div>
        </div>
      } />
    </Routes>
  );
};