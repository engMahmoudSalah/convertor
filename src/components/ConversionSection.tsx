import React, { useEffect, useState } from "react";
import { DragDropZone } from "./DragDropZone";
import { ConversionStatus } from "./ConversionStatus";
import { jsPDF } from "jspdf";

export const ConversionSection: React.FC = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionStatus, setConversionStatus] = useState<string>("");
  const [scalingOption, setScalingOption] = useState<"fit" | "full" | "custom">(
    "fit"
  );
  const [customScale, setCustomScale] = useState<number>(1);
  const [isConversionComplete, setIsConversionComplete] =
    useState<boolean>(false);
  const [timer, setTimer] = useState<number>(5); // Timer for download delay
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(
    null
  );
  const [pdfInstance, setPdfInstance] = useState<jsPDF | null>(null); // Store PDF instance
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false); // Show success modal

  const handleFileSelect = (files: File[]) => {
    const validFiles = files.filter((file) => file.type === "image/png");
    if (validFiles.length === 0) {
      alert("Please select PNG files only.");
      return;
    }

    setSelectedFiles(validFiles);
    convertToPDF(validFiles);
  };

  const convertToPDF = async (files: File[]) => {
    setIsConverting(true);
    setConversionStatus("Starting Conversion...");
    setIsConversionComplete(false); // Reset on new conversion

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

            // Adjust image size based on scaling option
            if (scalingOption === "fit") {
              const scale = Math.min(
                maxPageWidth / width,
                maxPageHeight / height
              );
              width = width * scale;
              height = height * scale;
            } else if (scalingOption === "full") {
              // Use the original size
              width = image.width;
              height = image.height;
            } else if (scalingOption === "custom") {
              // Apply custom scale with bounds checking
              if (customScale < 0.1) customScale = 0.1;
              else if (customScale > 3) customScale = 3;

              width = image.width * customScale;
              height = image.height * customScale;

              // Ensure the image fits within the A4 page (rescale if too large)
              if (width > maxPageWidth) {
                width = maxPageWidth;
                height = (image.height * width) / image.width;
              }
              if (height > maxPageHeight) {
                height = maxPageHeight;
                width = (image.width * height) / image.height;
              }
            }

            // Add a new page if it's not the first image
            if (i > 0) pdf.addPage();

            // Center the image: Calculate offsets for centering on A4 page
            const xOffset = (maxPageWidth - width) / 2;
            const yOffset = (maxPageHeight - height) / 2;

            // Add the image to the PDF
            pdf.addImage(image, "PNG", xOffset, yOffset, width, height);

            URL.revokeObjectURL(imageUrl);
            resolve();
          };
          image.src = imageUrl;
        });
      }

      setConversionStatus("Conversion Complete");
      setIsConversionComplete(true);
      setPdfInstance(pdf); // Save the PDF instance
      setIsConverting(false);
    } catch (error) {
      console.error("Conversion failed:", error);
      setConversionStatus("Error: Conversion Failed");
      setIsConverting(false);
    }
  };

  const startTimer = () => {
    if (timerInterval) clearInterval(timerInterval); // Clear any existing intervals

    const savedTimer = localStorage.getItem("timer");
    const startingTimer = savedTimer ? Number(savedTimer) : 5;

    setTimer(startingTimer); // Use saved timer or default to 5
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimerInterval(null);
          return 0;
        }
        return prev - 1;
      });
      localStorage.setItem("timer", (startingTimer - 1).toString()); // Save the timer value to localStorage
    }, 1000);

    setTimerInterval(interval);
  };

  const handleDownload = () => {
    startTimer();
  };

  // Page Visibility API to pause/resume timer on tab switch or page close
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // When the tab is not visible, clear the interval and store the current timer state
        if (timerInterval) {
          clearInterval(timerInterval);
          setTimerInterval(null);
          localStorage.setItem("timer", timer.toString());
        }
      } else {
        // When the tab is visible again, start the timer
        const savedTimer = localStorage.getItem("timer");
        if (savedTimer && Number(savedTimer) > 0) {
          setTimer(Number(savedTimer));
          startTimer(); // Resume the timer from where it left off
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [timer, timerInterval]);

  useEffect(() => {
    if (timer === 0 && pdfInstance) {
      // Trigger PDF download after the timer finishes
      pdfInstance.save("downloaded.pdf");
      localStorage.removeItem("timer"); // Clear timer from localStorage after download

      // Show success modal
      setShowSuccessModal(true);
    }
  }, [timer, pdfInstance]);

  const handleModalClose = () => {
    window.location.reload();
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 flex flex-col justify-between">
      {/* Scaling Option Buttons */}
      <div className="flex max-w-xl space-x-4 mb-6 justify-between">
        <button
          onClick={() => setScalingOption("fit")}
          className={`flex-1 px-6 py-1 md:py-3 text-sm font-medium rounded-md  border   transition duration-300 transform ${
            scalingOption === "fit"
              ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white border-none"
              : "border-indigo-400 bg-transparent text-indigo-400"
          } hover:scale-105 shadow-md`}
        >
          Fit to A4
        </button>
        <button
          onClick={() => setScalingOption("full")}
          className={`flex-1 px-6 py-1 md:py-3 text-sm font-medium rounded-md border   transition duration-300 transform ${
            scalingOption === "full"
              ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white border-none"
              : "border-indigo-400 bg-transparent text-indigo-400"
          } hover:scale-105 shadow-md`}
        >
          Full Size
        </button>
        <button
          onClick={() => setScalingOption("custom")}
          className={`flex-1 px-6 py-1 md:py-3 text-sm font-medium rounded-md  border   transition duration-300 transform ${
            scalingOption === "custom"
              ? "bg-gradient-to-r  from-blue-500 to-purple-500 text-white border-none"
              : "border-indigo-400 bg-transparent text-indigo-400"
          } hover:scale-105 shadow-md`}
        >
          Custom Scale
        </button>
      </div>

      {/* Custom Scale Input */}
      {scalingOption === "custom" && (
        <div className="max-w-xl mb-4 flex justify-center items-center space-x-4">
          <label className="text-gray-600">Min : 0.1 | Max : 3</label>
          <label className="text-gray-600">Custom Scale Factor:</label>
          <input
            type="number"
            value={customScale}
            onChange={(e) => setCustomScale(Number(e.target.value))}
            className="px-3 py-2 border bg-gray-600 rounded text-sm"
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

      {/* Download Section */}

      {isConversionComplete && !isConverting && (
        <div className="mt-6 max-w-xl flex justify-end">
          <button
            onClick={handleDownload}
            className="px-6 py-3 bg-indigo-500 rounded-3xl text-white font-semibold rounded-md transition duration-300 hover:bg-indigo-600"
            disabled={timerInterval !== null}
          >
            {timerInterval === null ? `Download ` : `Wait... ${timer}s`}
          </button>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4">
          <div className="bg-slate-800 p-8 rounded-lg shadow-lg w-full max-w-sm sm:max-w-md lg:max-w-lg transition-all transform scale-95 hover:scale-100">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full border border-green-500 flex items-center justify-center text-white ">
                <span className="text-3xl font-semibold text-white">👽</span>
              </div>
            </div>
            <div className="flex items-center justify-center mb-3 mt-3">
              <h2 className="text-2xl font-semibold text-white">
                Download Started
              </h2>
            </div>
            <p className="text-gray-400 mb-6 text-center">
              Your file is being downloaded.
            </p>
            <button
              onClick={handleModalClose}
              className="w-full py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition duration-300 focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
