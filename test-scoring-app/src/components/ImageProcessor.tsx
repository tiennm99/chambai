'use client';

import { useCallback, useEffect, useState } from 'react';

interface OpenCVRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface OpenCVScalar {
  [key: number]: number;
}

interface OpenCVMat {
  delete: () => void;
  roi: (rect: OpenCVRect) => OpenCVMat;
  setTo: (scalar: OpenCVScalar) => void;
  rows: number;
  cols: number;
  size: () => number;
  get: (index: number) => OpenCVMat;
}

interface Bubble {
  x: number;
  y: number;
  width: number;
  height: number;
  area: number;
  circularity: number;
}

declare global {
  interface Window {
    cv: {
      matFromImageData: (imageData: ImageData) => OpenCVMat;
      cvtColor: (src: OpenCVMat, dst: OpenCVMat, code: number) => void;
      adaptiveThreshold: (src: OpenCVMat, dst: OpenCVMat, maxValue: number, adaptiveMethod: number, thresholdType: number, blockSize: number, C: number) => void;
      findContours: (image: OpenCVMat, contours: OpenCVMat, hierarchy: OpenCVMat, mode: number, method: number) => void;
      contourArea: (contour: OpenCVMat) => number;
      arcLength: (contour: OpenCVMat, closed: boolean) => number;
      boundingRect: (contour: OpenCVMat) => { x: number; y: number; width: number; height: number };
      mean: (src: OpenCVMat, mask?: OpenCVMat) => { [key: number]: number };
      circle: (img: OpenCVMat, center: { x: number; y: number }, radius: number, color: number[], thickness: number) => void;
      bitwise_and: (src1: OpenCVMat, src2: OpenCVMat, dst: OpenCVMat, mask?: OpenCVMat) => void;
      Mat: new (rows?: number, cols?: number, type?: number) => OpenCVMat;
      MatVector: new () => OpenCVMat;
      Rect: new (x: number, y: number, width: number, height: number) => OpenCVRect;
      Scalar: new (...values: number[]) => OpenCVScalar;
      COLOR_RGBA2GRAY: number;
      ADAPTIVE_THRESH_GAUSSIAN_C: number;
      THRESH_BINARY: number;
      THRESH_BINARY_INV: number;
      RETR_EXTERNAL: number;
      CHAIN_APPROX_SIMPLE: number;
      CV_8UC1: number;
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

  const processImage = useCallback(async () => {
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
  }, [cvLoaded, imageFile, onProcessingComplete]);

  const generateDefaultAnswers = (): ProcessingResult => {
    // Default answers for development mode
    const defaultPhanI = [
      'A', 'B', 'C', 'D', 'A', 'B', 'C', 'D', 'A', 'B', // Questions 1-10
      'C', 'D', 'A', 'B', 'C', 'D', 'A', 'B', 'C', 'D', // Questions 11-20
      'A', 'B', 'C', 'D', 'A', 'B', 'C', 'D', 'A', 'B', // Questions 21-30
      'C', 'D', 'A', 'B', 'C', 'D', 'A', 'B', 'C', 'D'  // Questions 31-40
    ];
    
    const defaultPhanII = [
      { a: true, b: false, c: true, d: false },   // Question 1
      { a: false, b: true, c: false, d: true },   // Question 2
      { a: true, b: true, c: false, d: false },   // Question 3
      { a: false, b: false, c: true, d: true },   // Question 4
      { a: true, b: false, c: false, d: true },   // Question 5
      { a: false, b: true, c: true, d: false },   // Question 6
      { a: true, b: true, c: true, d: false },    // Question 7
      { a: false, b: false, c: false, d: true }   // Question 8
    ];
    
    const defaultPhanIII = ['7', '3', '9', '1', '5', '2']; // Questions 1-6
    
    return {
      studentId: '123456789',
      phanI: defaultPhanI,
      phanII: defaultPhanII,
      phanIII: defaultPhanIII,
      confidence: 0.95,
    };
  };

  const processWithOpenCV = (imageData: ImageData): ProcessingResult => {
    // In development mode, return default answers for faster testing
    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 Development mode: Using default answers for faster testing');
      return generateDefaultAnswers();
    }
    
    const cv = window.cv;
    
    // Create OpenCV Mat from ImageData
    const src = cv.matFromImageData(imageData);
    
    // Convert to grayscale
    const gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    
    // Apply adaptive threshold for bubble detection
    const thresh = new cv.Mat();
    cv.adaptiveThreshold(gray, thresh, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, 11, 2);
    
    // Find contours for bubble detection
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    cv.findContours(thresh, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
    
    // Detect bubbles
    const bubbles = detectBubbles(contours);
    
    // Process different sections
    const studentId = detectStudentId(bubbles, gray);
    const phanI = detectSection1Answers(bubbles, gray);
    const phanII = detectSection2Answers(bubbles, gray);
    const phanIII = detectSection3Answers(bubbles, gray);
    
    const result = {
      studentId,
      phanI,
      phanII,
      phanIII,
      confidence: 0.85,
    };
    
    // Clean up OpenCV Mats
    src.delete();
    gray.delete();
    thresh.delete();
    contours.delete();
    hierarchy.delete();
    
    return result;
  };

  const detectBubbles = (contours: OpenCVMat): Bubble[] => {
    const cv = window.cv;
    const bubbles: Bubble[] = [];
    
    for (let i = 0; i < contours.size(); i++) {
      const contour = contours.get(i);
      const area = cv.contourArea(contour);
      
      // Filter by area (bubble size)
      if (area > 50 && area < 500) {
        const perimeter = cv.arcLength(contour, true);
        const circularity = perimeter > 0 ? (4 * Math.PI * area) / (perimeter * perimeter) : 0;
        
        // Check if shape is reasonably circular
        if (circularity > 0.4) {
          const boundingRect = cv.boundingRect(contour);
          const aspectRatio = boundingRect.width / boundingRect.height;
          
          // Check aspect ratio
          if (aspectRatio >= 0.5 && aspectRatio <= 2.0) {
            bubbles.push({
              x: boundingRect.x,
              y: boundingRect.y,
              width: boundingRect.width,
              height: boundingRect.height,
              area: area,
              circularity: circularity
            });
          }
        }
      }
    }
    
    return bubbles;
  };

  const isBubbleFilled = (bubble: Bubble, gray: OpenCVMat): number => {
    const cv = window.cv;
    
    // Extract bubble region
    const roi = gray.roi(new cv.Rect(bubble.x, bubble.y, bubble.width, bubble.height));
    
    // Create circular mask
    const mask = new cv.Mat(bubble.height, bubble.width, cv.CV_8UC1);
    mask.setTo({ 0: 0 });
    
    const center = { x: bubble.width / 2, y: bubble.height / 2 };
    const radius = Math.min(bubble.width, bubble.height) / 3;
    
    cv.circle(mask, center, radius, [255], -1);
    
    // Calculate mean intensity in masked region
    const meanValue = cv.mean(roi, mask);
    const fillConfidence = 1.0 - (meanValue[0] / 255.0);
    
    // Clean up
    roi.delete();
    mask.delete();
    
    return fillConfidence;
  };

  const groupBubblesByRows = (bubbles: Bubble[], tolerance: number = 20): Bubble[][] => {
    if (!bubbles.length) return [];
    
    const sortedBubbles = bubbles.sort((a, b) => a.y - b.y);
    const rows: Bubble[][] = [];
    let currentRow: Bubble[] = [sortedBubbles[0]];
    
    for (let i = 1; i < sortedBubbles.length; i++) {
      if (Math.abs(sortedBubbles[i].y - currentRow[0].y) <= tolerance) {
        currentRow.push(sortedBubbles[i]);
      } else {
        currentRow.sort((a, b) => a.x - b.x);
        rows.push(currentRow);
        currentRow = [sortedBubbles[i]];
      }
    }
    
    if (currentRow.length) {
      currentRow.sort((a, b) => a.x - b.x);
      rows.push(currentRow);
    }
    
    return rows;
  };

  const detectStudentId = (bubbles: Bubble[], gray: OpenCVMat): string => {
    // Filter bubbles in student ID area (top section)
    const idBubbles = bubbles.filter(b => b.y >= 80 && b.y <= 340);
    
    // Group by columns for ID detection
    const sortedBubbles = idBubbles.sort((a, b) => a.x - b.x);
    const columns: Bubble[][] = [];
    let currentCol: Bubble[] = [];
    const colThreshold = 30;
    
    for (const bubble of sortedBubbles) {
      if (!currentCol.length || Math.abs(bubble.x - currentCol[0].x) <= colThreshold) {
        currentCol.push(bubble);
      } else {
        currentCol.sort((a, b) => a.y - b.y);
        columns.push(currentCol);
        currentCol = [bubble];
      }
    }
    
    if (currentCol.length) {
      currentCol.sort((a, b) => a.y - b.y);
      columns.push(currentCol);
    }
    
    // Extract digits from each column
    let studentId = '';
    for (const col of columns) {
      for (let i = 0; i < col.length; i++) {
        const confidence = isBubbleFilled(col[i], gray);
        if (confidence > 0.6) {
          studentId += i.toString();
          break;
        }
      }
    }
    
    return studentId || 'UNKNOWN';
  };

  const detectSection1Answers = (bubbles: Bubble[], gray: OpenCVMat): string[] => {
    // Filter bubbles for Section 1 (Multiple choice A,B,C,D)
    const section1Bubbles = bubbles.filter(b => b.y >= 370 && b.y <= 600);
    const rows = groupBubblesByRows(section1Bubbles);
    
    const answers: string[] = [];
    for (const row of rows) {
      if (row.length >= 4) {
        const options = row.slice(0, 4);
        let bestConfidence = 0;
        let bestAnswer = '';
        
        for (let i = 0; i < options.length; i++) {
          const confidence = isBubbleFilled(options[i], gray);
          if (confidence > bestConfidence && confidence > 0.6) {
            bestConfidence = confidence;
            bestAnswer = String.fromCharCode(65 + i); // A, B, C, D
          }
        }
        
        answers.push(bestAnswer);
      }
    }
    
    return answers;
  };

  const detectSection2Answers = (bubbles: Bubble[], gray: OpenCVMat): Array<{ a: boolean; b: boolean; c: boolean; d: boolean }> => {
    // Filter bubbles for Section 2 (True/False with sub-options)
    const section2Bubbles = bubbles.filter(b => b.y >= 620 && b.y <= 760);
    const rows = groupBubblesByRows(section2Bubbles);
    
    const answers: Array<{ a: boolean; b: boolean; c: boolean; d: boolean }> = [];
    for (const row of rows) {
      if (row.length >= 4) {
        const options = row.slice(0, 4);
        const answer = { a: false, b: false, c: false, d: false };
        
        for (let i = 0; i < options.length; i++) {
          const confidence = isBubbleFilled(options[i], gray);
          if (confidence > 0.6) {
            const key = String.fromCharCode(97 + i) as 'a' | 'b' | 'c' | 'd'; // a, b, c, d
            answer[key] = true;
          }
        }
        
        answers.push(answer);
      }
    }
    
    return answers;
  };

  const detectSection3Answers = (bubbles: Bubble[], gray: OpenCVMat): string[] => {
    // Filter bubbles for Section 3 (Numerical 0-9)
    const section3Bubbles = bubbles.filter(b => b.y >= 780 && b.y <= 1070);
    const rows = groupBubblesByRows(section3Bubbles);
    
    const answers: string[] = [];
    for (const row of rows) {
      if (row.length >= 10) {
        const options = row.slice(0, 10);
        let bestConfidence = 0;
        let bestAnswer = '';
        
        for (let i = 0; i < options.length; i++) {
          const confidence = isBubbleFilled(options[i], gray);
          if (confidence > bestConfidence && confidence > 0.6) {
            bestConfidence = confidence;
            bestAnswer = i.toString();
          }
        }
        
        answers.push(bestAnswer);
      }
    }
    
    return answers;
  };


  useEffect(() => {
    if (cvLoaded && imageFile) {
      processImage();
    }
  }, [cvLoaded, imageFile, processImage]);

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
          {process.env.NODE_ENV === 'development' && (
            <p className="text-xs text-blue-500 mt-1">🚀 Dev mode: Using default answers</p>
          )}
        </div>
      )}
    </div>
  );
}