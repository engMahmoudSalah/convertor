import React from 'react';
import { FileImage, FileOutput, Edit, FolderKanban, FileSearch } from 'lucide-react';
import { FeatureGrid } from '../components/FeatureGrid';
import { GlowingOrb } from '../components/GlowingOrb';
import { MorphingShape } from '../components/MorphingShape';

const mainFeatures = [
  {
    title: 'Convert to PDF',
    description: 'Convert images, documents , and more to PDF format',
    icon: FileImage,
    path: '/convert-to-pdf'
  },
  {
    title: 'Convert from PDF',
    description: 'Transform your PDFs into other file formats',
    icon: FileOutput,
    path: '/convert-from-pdf'
  },
  {
    title: 'Edit PDF',
    description: 'Modify your PDFs with various editing tools',
    icon: Edit,
    path: '/edit-pdf'
  },
  {
    title: 'Organize PDF',
    description: 'Merge, split, and manage your PDF files',
    icon: FolderKanban,
    path: '/organize-pdf'
  },
  {
    title: 'Optimize PDF',
    description: 'Compress, repair, and enhance your PDFs',
    icon: FileSearch,
    path: '/optimize-pdf'
  }
];

export const Home: React.FC = () => {
  return (
    <div className="relative pt-32 pb-24">
      <GlowingOrb />
      <MorphingShape />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-violet-400 to-blue-400 text-transparent bg-clip-text">
              All-in-One PDF Tools
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Convert, edit, organize, and optimize your PDF files with our comprehensive suite of tools.
            Everything happens in your browser, ensuring complete privacy and security.
          </p>
        </div>

        <FeatureGrid features={mainFeatures} />
      </div>
    </div>
  );
};