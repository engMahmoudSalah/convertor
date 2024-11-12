import React from 'react';
import { DragDropZone } from './DragDropZone';
import { ConversionStatus } from './ConversionStatus';
import { jsPDF } from 'jspdf';

export const ConversionSection: React.FC = () => {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [isConverting, setIsConverting] = React.useState(false);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    convertToPDF(file);
  };

  const convertToPDF = async (file: File) => {
    setIsConverting(true);
    
    try {
      const image = new Image();
      const imageUrl = URL.createObjectURL(file);
      
      image.onload = () => {
        const pdf = new jsPDF({
          orientation: image.width > image.height ? 'landscape' : 'portrait',
          unit: 'px',
          format: [image.width, image.height]
        });
        
        pdf.addImage(image, 'PNG', 0, 0, image.width, image.height);
        pdf.save(`${file.name.replace('.png', '')}.pdf`);
        
        setIsConverting(false);
        URL.revokeObjectURL(imageUrl);
      };
      
      image.src = imageUrl;
    } catch (error) {
      console.error('Conversion failed:', error);
      setIsConverting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <DragDropZone onFileSelect={handleFileSelect} />
      {selectedFile && (
        <ConversionStatus 
          fileName={selectedFile.name} 
          isConverting={isConverting} 
        />
      )}
    </div>
  );
};