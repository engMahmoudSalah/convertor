import React from 'react';
import { DragDropZone } from './DragDropZone';
import { ConversionStatus } from './ConversionStatus';
import { jsPDF } from 'jspdf';

export const ConversionSection: React.FC = () => {
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
  const [isConverting, setIsConverting] = React.useState(false);
  const [conversionStatus, setConversionStatus] = React.useState<string>('');
  const [scalingOption, setScalingOption] = React.useState<'fit' | 'full' | 'custom'>('fit');
  const [customScale, setCustomScale] = React.useState<number>(1);

  const handleFileSelect = (files: File[]) => {
    // Validate selected files are PNG
    const validFiles = files.filter(file => file.type === 'image/png');
    if (validFiles.length === 0) {
      alert('Please select PNG files only.');
      return;
    }

    setSelectedFiles(validFiles);
    convertToPDF(validFiles);
  };

  const convertToPDF = async (files: File[]) => {
  setIsConverting(true);
  setConversionStatus('Starting Conversion...');

  try {
    const pdf = new jsPDF();
    const maxPageWidth = 595; // A4 width in points (210mm)
    const maxPageHeight = 842; // A4 height in points (297mm)

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const image = new Image();
      const imageUrl = URL.createObjectURL(file);

      await new Promise<void>((resolve) => {
        image.onload = () => {
          let width = image.width;
          let height = image.height;

          // Scaling logic based on user selection
          if (scalingOption === 'fit') {
            // Fit to A4 page without distortion
            const scale = Math.min(maxPageWidth / width, maxPageHeight / height);
            width = width * scale;
            height = height * scale;
          } else if (scalingOption === 'full') {
            // Full size without scaling down
            width = image.width;
            height = image.height;
          } else if (scalingOption === 'custom') {
            // Custom scaling by user-selected factor
            if (customScale < 0.1) {
              customScale = 0.1; // Minimum scale value
            } else if (customScale > 3) {
              customScale = 3; // Maximum scale value
            }

            width = image.width * customScale;
            height = image.height * customScale;

            // Ensuring the custom scale does not exceed page dimensions
            if (width > maxPageWidth) {
              width = maxPageWidth;
              height = (image.height * width) / image.width;
            }
            if (height > maxPageHeight) {
              height = maxPageHeight;
              width = (image.width * height) / image.height;
            }
          }

          // Add a new page for each image except the first
          if (i > 0) pdf.addPage();

          // Add the image, centered on the page
          const xOffset = (maxPageWidth - width) / 2;
          const yOffset = (maxPageHeight - height) / 2;
          pdf.addImage(image, 'PNG', xOffset, yOffset, width, height);

          URL.revokeObjectURL(imageUrl);
          resolve();
        };

        image.src = imageUrl;
      });
    }

    pdf.save('combined_images.pdf'); // Save as one PDF containing all images
    setConversionStatus('Conversion Complete');
    setIsConverting(false);
  } catch (error) {
    console.error('Conversion failed:', error);
    setConversionStatus('Error: Conversion Failed');
    setIsConverting(false);
  }
};


  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 flex flex-col justify-between">
      
      {/* Scaling Option Buttons */}
      <div className="flex max-w-xl space-x-4 mb-6 justify-between">
        <button
          onClick={() => setScalingOption('fit')}
          className={`flex-1 px-6 py-3 text-sm font-medium rounded-lg transition duration-300 transform ${scalingOption === 'fit' ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' : 'bg-gray-200 text-gray-700'} hover:scale-105 shadow-md`}
        >
          Fit to A4
        </button>
        <button
          onClick={() => setScalingOption('full')}
          className={`flex-1 px-6 py-3 text-sm font-medium rounded-lg transition duration-300 transform ${scalingOption === 'full' ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white' : 'bg-gray-200 text-gray-700'} hover:scale-105 shadow-md`}
        >
          Full Size
        </button>
        <button
          onClick={() => setScalingOption('custom')}
          className={`flex-1 px-6 py-3 text-sm font-medium rounded-lg transition duration-300 transform ${scalingOption === 'custom' ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white' : 'bg-gray-200 text-gray-700'} hover:scale-105 shadow-md`}
        >
          Custom Scale
        </button>
      </div>

      {/* Custom Scale Input */}
      {scalingOption === 'custom' && (
        <div className="mb-4 flex justify-center items-center space-x-4">
          <label className="text-gray-700">Custom Scale Factor:</label>
          <input
            type="number"
            value={customScale}
            onChange={(e) => setCustomScale(Number(e.target.value))}
            className="px-3 py-2 border rounded text-sm"
            min={0.1}
            max={3}
            step={0.1}
          />
        </div>
      )}

      {/* Drag & Drop Zone */}
      <div className="mb-6 flex-grow">
        <DragDropZone onFileSelect={handleFileSelect} />
      </div>

      {/* Conversion Status */}
      {selectedFiles.length > 0 && (
        <div className="space-y-4 max-w-xl">
          <ConversionStatus 
            fileName={`${selectedFiles.length} files`} 
            isConverting={isConverting} 
            statusMessage={conversionStatus}
          />
        </div>
      )}
    </div>
  );
};
