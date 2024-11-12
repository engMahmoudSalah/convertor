import React from 'react';
import { Upload } from 'lucide-react';

interface DragDropZoneProps {
  onFileSelect: (file: File) => void;
}

export const DragDropZone: React.FC<DragDropZoneProps> = ({ onFileSelect }) => {
  const [isDragging, setIsDragging] = React.useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const pngFile = files.find(file => file.type === "image/png");
    
    if (pngFile) {
      onFileSelect(pngFile);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div
      className={`w-full max-w-xl h-64 rounded-lg border-2 border-dashed transition-colors duration-200 flex flex-col items-center justify-center p-6 text-center cursor-pointer
        ${isDragging 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        type="file"
        id="fileInput"
        className="hidden"
        accept="image/png"
        onChange={handleFileInput}
      />
      <label htmlFor="fileInput" className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
        <Upload className="w-12 h-12 text-gray-400 mb-4" />
        <p className="text-lg font-medium text-gray-700 mb-2">
          Drag and drop your PNG file here
        </p>
        <p className="text-sm text-gray-500">
          or click to select a file
        </p>
      </label>
    </div>
  );
};