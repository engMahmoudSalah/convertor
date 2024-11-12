import React from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';

interface ConversionStatusProps {
  fileName: string;
  isConverting: boolean;
  statusMessage: string;
}

export const ConversionStatus: React.FC<ConversionStatusProps> = ({ fileName, isConverting, statusMessage }) => {
  return (
    <div className="flex items-center space-x-3 bg-white rounded-lg p-4 shadow-sm border border-gray-200">
      {isConverting ? (
        <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
      ) : (
        <CheckCircle className="w-5 h-5 text-green-500" />
      )}
      <span className="text-gray-700 font-medium">{fileName}</span>
      <span className="text-gray-500">{statusMessage}</span>
    </div>
  );
};
