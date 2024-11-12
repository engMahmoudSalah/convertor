import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ConversionSection } from '../../components/ConversionSection';

export const PNGToPDF: React.FC = () => {
  return (
    <div className="pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link 
          to="/convert-to-pdf"
          className="inline-flex items-center text-sm text-gray-400 hover:text-white mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Convert to PDF
        </Link>
        
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-violet-400 to-blue-400 text-transparent bg-clip-text">
              PNG to PDF Converter
            </span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Convert your PNG images to PDF format with our easy-to-use tool. 
            Drag and drop your files to get started.
          </p>
        </div>

        <ConversionSection />
      </div>
    </div>
  );
};