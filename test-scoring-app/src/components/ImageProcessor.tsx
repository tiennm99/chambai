'use client';

import { useEffect, useState } from 'react';

interface OpenCVMat {
  delete: () => void;
}

declare global {
  interface Window {
    cv: {
      matFromImageData: (imageData: ImageData) => OpenCVMat;
      cvtColor: (src: OpenCVMat, dst: OpenCVMat, code: number) => void;
      adaptiveThreshold: (src: OpenCVMat, dst: OpenCVMat, maxValue: number, adaptiveMethod: number, thresholdType: number, blockSize: number, C: number) => void;
      findContours: (image: OpenCVMat, contours: OpenCVMat, hierarchy: OpenCVMat, mode: number, method: number) => void;
      Mat: new () => OpenCVMat;
      MatVector: new () => OpenCVMat;
      COLOR_RGBA2GRAY: number;
      ADAPTIVE_THRESH_GAUSSIAN_C: number;
      THRESH_BINARY: number;
      RETR_EXTERNAL: number;
      CHAIN_APPROX_SIMPLE: number;
      onRuntimeInitialized: () => void;
    };
  }
}

interface ProcessingResult {
  studentId: string;
  phanI: string[];
  phanII: Array<{ a: boolean; b: boolean; c: boolean; d: boolean }>;
  phanIII: string[];
  confidence: number;
}

interface ImageProcessorProps {
  imageFile: File;
  onProcessingComplete: (result: ProcessingResult) => void;
}

export default function ImageProcessor({ imageFile, onProcessingComplete }: ImageProcessorProps) {
  const [processing, setProcessing] = useState(false);
  const [cvLoaded, setCvLoaded] = useState(false);

  useEffect(() => {
    const loadOpenCV = () => {
      if (typeof window !== 'undefined' && window.cv) {
        setCvLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://docs.opencv.org/4.9.0/opencv.js';
      script.async = true;
      script.onload = () => {
        if (window.cv) {
          window.cv.onRuntimeInitialized = () => {
            setCvLoaded(true);
          };
        }
      };
      document.head.appendChild(script);
    };

    loadOpenCV();
  }, []);

  const processImage = async () => {
    if (!cvLoaded || !window.cv) {
      console.error('OpenCV not loaded');
      return;
    }

    setProcessing(true);

    try {
      const imageUrl = URL.createObjectURL(imageFile);
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        
        const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
        
        if (imageData) {
          const result = processWithOpenCV(imageData);
          onProcessingComplete(result);
        }
        
        URL.revokeObjectURL(imageUrl);
        setProcessing(false);
      };
      
      img.src = imageUrl;
    } catch (error) {
      console.error('Error processing image:', error);
      setProcessing(false);
    }
  };

  const processWithOpenCV = (imageData: ImageData): ProcessingResult => {
    const cv = window.cv;
    
    // Create OpenCV Mat from ImageData
    const src = cv.matFromImageData(imageData);
    
    // Convert to grayscale
    const gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    
    // Apply adaptive threshold
    const thresh = new cv.Mat();
    cv.adaptiveThreshold(gray, thresh, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 11, 2);
    
    // Find contours for bubble detection
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    cv.findContours(thresh, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
    
    // Mock bubble detection and recognition
    const mockResult = {
      studentId: generateRandomStudentId(),
      phanI: generateRandomAnswers(40, ['A', 'B', 'C', 'D']),
      phanII: generateRandomPhanII(8),
      phanIII: generateRandomNumbers(6),
      confidence: 0.85,
    };
    
    // Clean up OpenCV Mats
    src.delete();
    gray.delete();
    thresh.delete();
    contours.delete();
    hierarchy.delete();
    
    return mockResult;
  };

  const generateRandomStudentId = () => {
    return Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
  };

  const generateRandomAnswers = (count: number, options: string[]) => {
    return Array.from({ length: count }, () => options[Math.floor(Math.random() * options.length)]);
  };

  const generateRandomPhanII = (count: number) => {
    return Array.from({ length: count }, () => ({
      a: Math.random() > 0.5,
      b: Math.random() > 0.5,
      c: Math.random() > 0.5,
      d: Math.random() > 0.5,
    }));
  };

  const generateRandomNumbers = (count: number) => {
    return Array.from({ length: count }, () => (Math.random() * 100).toFixed(1));
  };

  useEffect(() => {
    if (cvLoaded && imageFile) {
      processImage();
    }
  }, [cvLoaded, imageFile]);

  return (
    <div className="flex items-center justify-center p-4">
      {!cvLoaded && (
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Đang tải OpenCV...</p>
        </div>
      )}
      
      {cvLoaded && processing && (
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Đang xử lý ảnh...</p>
        </div>
      )}
    </div>
  );
}