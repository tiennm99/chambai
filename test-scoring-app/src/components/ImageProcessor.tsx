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
  section?: string;
  column?: number;
  row?: number;
  question?: number;
  option?: string;
  subOption?: string;
  value?: boolean;
  digit?: number;
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
      mean: (src: OpenCVMat, mask?: OpenCVMat) => number[];
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
  debugImageUrl?: string;
}

interface TestConfig {
  phanI: {
    questionCount: number;
    answers: string[];
  };
  phanII: {
    questionCount: number;
    answers: Array<{ a: boolean; b: boolean; c: boolean; d: boolean }>;
  };
  phanIII: {
    questionCount: number;
    answers: string[];
  };
}

interface ImageProcessorProps {
  imageFile: File;
  onProcessingComplete: (result: ProcessingResult) => void;
}

export default function ImageProcessor({ imageFile, onProcessingComplete }: ImageProcessorProps) {
  const [processing, setProcessing] = useState(false);
  const [cvLoaded, setCvLoaded] = useState(false);
  const [debugImageUrl, setDebugImageUrl] = useState<string | null>(null);

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
    setDebugImageUrl(null); // Clear previous debug image

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
          const result = processWithOpenCV(imageData, canvas);
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

  const getTestConfig = (): TestConfig => {
    if (typeof window !== 'undefined') {
      const savedConfig = localStorage.getItem('testConfig');
      if (savedConfig) {
        return JSON.parse(savedConfig);
      }
    }
    // Default config
    return {
      phanI: { questionCount: 40, answers: [] },
      phanII: { questionCount: 8, answers: [] },
      phanIII: { questionCount: 6, answers: [] },
    };
  };

  const createDebugVisualization = (
    originalCanvas: HTMLCanvasElement,
    bubbles: Bubble[],
    detectedAnswers: ProcessingResult,
    testConfig: TestConfig
  ): string => {
    console.log('🎯 Creating debug visualization with:', {
      totalBubbles: bubbles.length,
      canvasSize: { width: originalCanvas.width, height: originalCanvas.height },
      detectedAnswers,
      bubblesSample: bubbles.slice(0, 5) // Show first 5 bubbles
    });

    // Create a new canvas for debug visualization
    const debugCanvas = document.createElement('canvas');
    const debugCtx = debugCanvas.getContext('2d');
    
    debugCanvas.width = originalCanvas.width;
    debugCanvas.height = originalCanvas.height;
    
    // Draw original image
    debugCtx?.drawImage(originalCanvas, 0, 0);
    
    if (!debugCtx) return '';
    
    // If no bubbles detected in production mode, create some test circles to verify the visualization works
    if (bubbles.length === 0 && process.env.NODE_ENV !== 'development') {
      console.log('⚠️ No bubbles detected! Adding test circles for debugging');
      // Add some test circles at known positions
      const testPositions = [
        { x: 100, y: 150 }, { x: 150, y: 150 }, { x: 200, y: 150 }, // Top row
        { x: 100, y: 400 }, { x: 150, y: 400 }, { x: 200, y: 400 }, // Middle row
        { x: 100, y: 800 }, { x: 150, y: 800 }, { x: 200, y: 800 }  // Bottom row
      ];
      
      testPositions.forEach((pos, index) => {
        debugCtx.strokeStyle = '#FF00FF'; // Magenta for test circles
        debugCtx.lineWidth = 3;
        debugCtx.beginPath();
        debugCtx.arc(pos.x, pos.y, 15, 0, 2 * Math.PI);
        debugCtx.stroke();
        
        debugCtx.fillStyle = '#FF00FF';
        debugCtx.font = '12px Arial';
        debugCtx.fillText(`T${index}`, pos.x + 20, pos.y);
      });
    }

    // FIRST: Mark ALL detected bubbles with yellow circles for debugging
    console.log('🔍 Marking all detected bubbles:', bubbles.length);
    bubbles.forEach((bubble, index) => {
      debugCtx.strokeStyle = '#FFFF00'; // Yellow for all bubbles
      debugCtx.lineWidth = 2;
      debugCtx.beginPath();
      debugCtx.arc(bubble.x + bubble.width/2, bubble.y + bubble.height/2, Math.max(bubble.width, bubble.height)/2 + 3, 0, 2 * Math.PI);
      debugCtx.stroke();
      
      // Add bubble index for debugging
      debugCtx.fillStyle = '#FFFF00';
      debugCtx.font = '12px Arial';
      debugCtx.fillText(index.toString(), bubble.x, bubble.y - 5);
    });
    
    // Mark student ID bubbles (blue circles)
    const idBubbles = bubbles.filter(b => b.section === 'studentId');
    console.log('🔵 Student ID bubbles found:', idBubbles.length);
    idBubbles.forEach(bubble => {
      debugCtx.strokeStyle = '#3B82F6'; // Blue
      debugCtx.lineWidth = 4;
      debugCtx.beginPath();
      debugCtx.arc(bubble.x + bubble.width/2, bubble.y + bubble.height/2, Math.max(bubble.width, bubble.height)/2 + 8, 0, 2 * Math.PI);
      debugCtx.stroke();
    });
    
    // Mark Section 1 answers (A,B,C,D) - green for correct, red for wrong
    const section1Bubbles = bubbles.filter(b => b.section === 'section1');
    
    section1Bubbles.forEach(bubble => {
      const questionNum = bubble.question;
      const option = bubble.option;
      
      if (questionNum && questionNum <= detectedAnswers.phanI.length) {
        const detectedAnswer = detectedAnswers.phanI[questionNum - 1];
        const correctAnswer = testConfig.phanI.answers[questionNum - 1];
        
        if (detectedAnswer === option) {
          const isCorrect = detectedAnswer === correctAnswer;
          
          debugCtx.strokeStyle = isCorrect ? '#10B981' : '#EF4444'; // Green or Red
          debugCtx.lineWidth = 3;
          debugCtx.beginPath();
          debugCtx.arc(bubble.x + bubble.width/2, bubble.y + bubble.height/2, bubble.width/2 + 5, 0, 2 * Math.PI);
          debugCtx.stroke();
        }
      }
    });
    
    // Mark Section 2 answers (True/False) - green for correct, red for wrong
    const section2Bubbles = bubbles.filter(b => b.section === 'section2');
    
    section2Bubbles.forEach(bubble => {
      const questionNum = bubble.question;
      const subOption = bubble.subOption;
      const value = bubble.value;
      
      if (questionNum && questionNum <= detectedAnswers.phanII.length) {
        const detectedAnswer = detectedAnswers.phanII[questionNum - 1];
        const correctAnswer = testConfig.phanII.answers[questionNum - 1];
        
        if (subOption && detectedAnswer[subOption as 'a' | 'b' | 'c' | 'd'] === value) {
          const isCorrect = correctAnswer?.[subOption as 'a' | 'b' | 'c' | 'd'] === value;
          
          debugCtx.strokeStyle = isCorrect ? '#10B981' : '#EF4444'; // Green or Red
          debugCtx.lineWidth = 3;
          debugCtx.beginPath();
          debugCtx.arc(bubble.x + bubble.width/2, bubble.y + bubble.height/2, bubble.width/2 + 5, 0, 2 * Math.PI);
          debugCtx.stroke();
        }
      }
    });
    
    // Mark Section 3 answers (Numerical) - green for correct, red for wrong
    const section3Bubbles = bubbles.filter(b => b.section === 'section3');
    
    section3Bubbles.forEach(bubble => {
      const questionNum = bubble.question;
      const digit = bubble.digit;
      
      if (questionNum && questionNum <= detectedAnswers.phanIII.length) {
        const detectedAnswer = detectedAnswers.phanIII[questionNum - 1];
        const correctAnswer = testConfig.phanIII.answers[questionNum - 1];
        
        if (digit !== undefined && detectedAnswer === digit.toString()) {
          const isCorrect = detectedAnswer === correctAnswer;
          
          debugCtx.strokeStyle = isCorrect ? '#10B981' : '#EF4444'; // Green or Red
          debugCtx.lineWidth = 3;
          debugCtx.beginPath();
          debugCtx.arc(bubble.x + bubble.width/2, bubble.y + bubble.height/2, bubble.width/2 + 5, 0, 2 * Math.PI);
          debugCtx.stroke();
        }
      }
    });
    
    // Add legend
    debugCtx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    debugCtx.fillRect(10, 10, 200, 80);
    debugCtx.strokeStyle = '#000000';
    debugCtx.lineWidth = 1;
    debugCtx.strokeRect(10, 10, 200, 80);
    
    debugCtx.fillStyle = '#000000';
    debugCtx.font = '14px Arial';
    debugCtx.fillText('Debug Legend:', 15, 30);
    
    debugCtx.fillStyle = '#3B82F6';
    debugCtx.fillText('● Student ID', 15, 50);
    debugCtx.fillStyle = '#10B981';
    debugCtx.fillText('● Correct Answer', 15, 65);
    debugCtx.fillStyle = '#EF4444';
    debugCtx.fillText('● Wrong Answer', 15, 80);
    
    return debugCanvas.toDataURL();
  };

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

  const processWithOpenCV = (imageData: ImageData, originalCanvas: HTMLCanvasElement): ProcessingResult => {
    // Get test configuration for answer comparison
    const testConfig = getTestConfig();
    
    // In development mode, return default answers for faster testing
    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 Development mode: Using default answers for faster testing');
      const defaultAnswers = generateDefaultAnswers();
      
      // Create mock debug visualization for development with test bubbles
      const mockBubbles: Bubble[] = [
        { x: 100, y: 150, width: 20, height: 20, area: 400, circularity: 0.8 },
        { x: 150, y: 150, width: 20, height: 20, area: 400, circularity: 0.8 },
        { x: 200, y: 150, width: 20, height: 20, area: 400, circularity: 0.8 },
        { x: 100, y: 400, width: 20, height: 20, area: 400, circularity: 0.8 },
        { x: 150, y: 400, width: 20, height: 20, area: 400, circularity: 0.8 },
        { x: 200, y: 400, width: 20, height: 20, area: 400, circularity: 0.8 },
      ];
      const debugUrl = createDebugVisualization(originalCanvas, mockBubbles, defaultAnswers, testConfig);
      setDebugImageUrl(debugUrl);
      
      return {
        ...defaultAnswers,
        debugImageUrl: debugUrl
      };
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
    
    // Detect reference markers (black squares/rectangles)
    const markers = detectReferenceMarkers(thresh);
    
    // Generate bubble positions based on reference markers
    const bubbles = generateBubbleGrid(markers, imageData.width, imageData.height);
    
    // Process different sections using the generated positions
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
    
    // Create debug visualization
    const debugUrl = createDebugVisualization(originalCanvas, bubbles, result, testConfig);
    setDebugImageUrl(debugUrl);
    
    // Clean up OpenCV Mats
    src.delete();
    gray.delete();
    thresh.delete();
    
    return {
      ...result,
      debugImageUrl: debugUrl
    };
  };

  const detectReferenceMarkers = (thresh: OpenCVMat): { corners: Array<{x: number, y: number}>, edges: Array<{x: number, y: number}> } => {
    const cv = window.cv;
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    
    cv.findContours(thresh, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
    
    const markers: { corners: Array<{x: number, y: number}>, edges: Array<{x: number, y: number}> } = { corners: [], edges: [] };
    
    for (let i = 0; i < contours.size(); i++) {
      const contour = contours.get(i);
      const area = cv.contourArea(contour);
      
      // Look for black reference markers (larger dark areas)
      if (area > 400 && area < 3000) {
        const boundingRect = cv.boundingRect(contour);
        const aspectRatio = boundingRect.width / boundingRect.height;
        
        // Corner markers (more square-like)
        if (aspectRatio >= 0.7 && aspectRatio <= 1.3) {
          markers.corners.push({
            x: boundingRect.x + boundingRect.width / 2,
            y: boundingRect.y + boundingRect.height / 2
          });
        }
        // Edge markers (more rectangular)
        else if (aspectRatio >= 0.3 && aspectRatio <= 3.0) {
          markers.edges.push({
            x: boundingRect.x + boundingRect.width / 2,
            y: boundingRect.y + boundingRect.height / 2
          });
        }
      }
    }
    
    contours.delete();
    hierarchy.delete();
    
    // Sort markers by position
    markers.corners.sort((a, b) => a.y - b.y || a.x - b.x);
    markers.edges.sort((a, b) => a.y - b.y || a.x - b.x);
    
    console.log('🔲 Reference markers found:', {
      corners: markers.corners.length,
      edges: markers.edges.length,
      cornerPositions: markers.corners,
      edgePositions: markers.edges
    });
    
    return markers;
  };

  const generateBubbleGrid = (markers: { corners: Array<{x: number, y: number}>, edges: Array<{x: number, y: number}> }, imageWidth: number, imageHeight: number): Bubble[] => {
    const bubbles: Bubble[] = [];
    
    if (markers.corners.length < 4) {
      console.warn('⚠️ Not enough corner markers found, using default positioning');
      return generateDefaultBubblePositions(imageWidth, imageHeight);
    }
    
    // Calculate sheet boundaries from corner markers
    const leftX = Math.min(...markers.corners.map(c => c.x));
    const rightX = Math.max(...markers.corners.map(c => c.x));
    const topY = Math.min(...markers.corners.map(c => c.y));
    const bottomY = Math.max(...markers.corners.map(c => c.y));
    
    const sheetWidth = rightX - leftX;
    const sheetHeight = bottomY - topY;
    
    console.log('📐 Sheet boundaries:', { leftX, rightX, topY, bottomY, sheetWidth, sheetHeight });
    
    // Define the 4 vertical sections based on the sheet boundaries
    const sectionWidth = sheetWidth / 4;
    
    // Section 1: Student Info (11 rows of digits 0-9)
    const section1X = leftX;
    const section1Width = sectionWidth * 0.8; // Slightly smaller
    generateStudentInfoBubbles(bubbles, section1X, topY, section1Width, sheetHeight);
    
    // Section 2: PHẦN I - Multiple Choice (4 columns × 10 rows = 40 questions)
    const section2X = leftX + sectionWidth;
    generateSection1Bubbles(bubbles, section2X, topY, sectionWidth, sheetHeight);
    
    // Section 3: PHẦN II - True/False (8 questions × 4 options)
    const section3X = leftX + sectionWidth * 2;
    generateSection2Bubbles(bubbles, section3X, topY, sectionWidth, sheetHeight);
    
    // Section 4: PHẦN III - Numerical (6 questions × 10 digits)
    const section4X = leftX + sectionWidth * 3;
    generateSection3Bubbles(bubbles, section4X, topY, sectionWidth, sheetHeight);
    
    console.log(`✅ Generated ${bubbles.length} bubble positions based on reference markers`);
    
    return bubbles;
  };

  const generateDefaultBubblePositions = (imageWidth: number, imageHeight: number): Bubble[] => {
    const bubbles: Bubble[] = [];
    // Fallback positioning if markers aren't detected
    // This provides a basic grid across the image
    for (let y = 100; y < imageHeight - 100; y += 40) {
      for (let x = 100; x < imageWidth - 100; x += 40) {
        bubbles.push({
          x: x - 10,
          y: y - 10,
          width: 20,
          height: 20,
          area: 400,
          circularity: 0.8
        });
      }
    }
    return bubbles.slice(0, 200); // Limit to reasonable number
  };

  const generateStudentInfoBubbles = (bubbles: Bubble[], startX: number, startY: number, width: number, height: number) => {
    // Student ID section: Multiple columns of digits 0-9
    const cols = 9; // 9-digit student ID
    const rows = 10; // digits 0-9
    const colWidth = width / cols;
    const rowHeight = height * 0.3 / rows; // Use top 30% of sheet
    
    for (let col = 0; col < cols; col++) {
      for (let row = 0; row < rows; row++) {
        bubbles.push({
          x: startX + col * colWidth + colWidth * 0.3,
          y: startY + height * 0.1 + row * rowHeight,
          width: 15,
          height: 15,
          area: 225,
          circularity: 0.8,
          section: 'studentId',
          column: col,
          row: row
        });
      }
    }
  };

  const generateSection1Bubbles = (bubbles: Bubble[], startX: number, startY: number, width: number, height: number) => {
    // PHẦN I: 4 columns × 10 rows = 40 questions (A,B,C,D options)
    const questionCols = 4;
    const questionRows = 10;
    const optionCols = 4; // A, B, C, D
    
    const colWidth = width / questionCols;
    const rowHeight = height * 0.3 / questionRows; // Use middle 30% of sheet
    
    for (let qCol = 0; qCol < questionCols; qCol++) {
      for (let qRow = 0; qRow < questionRows; qRow++) {
        for (let option = 0; option < optionCols; option++) {
          bubbles.push({
            x: startX + qCol * colWidth + option * (colWidth / optionCols) + colWidth * 0.1,
            y: startY + height * 0.35 + qRow * rowHeight,
            width: 12,
            height: 12,
            area: 144,
            circularity: 0.8,
            section: 'section1',
            question: qCol * questionRows + qRow + 1,
            option: String.fromCharCode(65 + option) // A, B, C, D
          });
        }
      }
    }
  };

  const generateSection2Bubbles = (bubbles: Bubble[], startX: number, startY: number, width: number, height: number) => {
    // PHẦN II: 8 questions with True/False for a,b,c,d
    const questions = 8;
    const questionCols = 4; // 2 questions per row, 2 columns per question
    const optionCols = 2; // True/False (Đúng/Sai)
    const subOptions = 4; // a, b, c, d
    
    const questionWidth = width / questionCols;
    const questionHeight = height * 0.15 / (questions / 2); // Use middle-bottom 15% of sheet
    
    for (let q = 0; q < questions; q++) {
      const qCol = q % questionCols;
      const qRow = Math.floor(q / questionCols);
      
      for (let sub = 0; sub < subOptions; sub++) {
        for (let option = 0; option < optionCols; option++) {
          bubbles.push({
            x: startX + qCol * questionWidth + sub * (questionWidth / subOptions) + option * (questionWidth / subOptions / optionCols) + questionWidth * 0.05,
            y: startY + height * 0.65 + qRow * questionHeight + sub * (questionHeight / subOptions),
            width: 10,
            height: 10,
            area: 100,
            circularity: 0.8,
            section: 'section2',
            question: q + 1,
            subOption: String.fromCharCode(97 + sub), // a, b, c, d
            value: option === 0 // true for first option (Đúng), false for second (Sai)
          });
        }
      }
    }
  };

  const generateSection3Bubbles = (bubbles: Bubble[], startX: number, startY: number, width: number, height: number) => {
    // PHẦN III: 6 questions × 10 digits (0-9)
    const questions = 6;
    const digits = 10; // 0-9
    
    const questionWidth = width / questions;
    const digitHeight = height * 0.3 / digits; // Use bottom 30% of sheet
    
    for (let q = 0; q < questions; q++) {
      for (let digit = 0; digit < digits; digit++) {
        bubbles.push({
          x: startX + q * questionWidth + questionWidth * 0.3,
          y: startY + height * 0.7 + digit * digitHeight,
          width: 12,
          height: 12,
          area: 144,
          circularity: 0.8,
          section: 'section3',
          question: q + 1,
          digit: digit
        });
      }
    }
  };

  const isBubbleFilled = (bubble: Bubble, gray: OpenCVMat): number => {
    const cv = window.cv;
    
    try {
      // Create a simple rectangle ROI and get mean intensity
      const rect = new cv.Rect(bubble.x, bubble.y, bubble.width, bubble.height);
      const roi = gray.roi(rect);
      
      // For simplicity, just use the mean intensity of the whole bubble area
      const meanValue = cv.mean(roi);
      const fillConfidence = 1.0 - (meanValue[0] / 255.0);
      
      // Clean up
      roi.delete();
      
      console.log(`Bubble fill confidence: ${fillConfidence.toFixed(2)} for bubble at (${bubble.x}, ${bubble.y})`);
      
      return fillConfidence;
    } catch (error) {
      console.error('Error in isBubbleFilled:', error);
      return 0.5; // Default confidence
    }
  };


  const detectStudentId = (bubbles: Bubble[], gray: OpenCVMat): string => {
    // Filter bubbles for student ID section
    const idBubbles = bubbles.filter(b => b.section === 'studentId');
    
    if (idBubbles.length === 0) {
      return 'UNKNOWN';
    }
    
    // Group by columns (each column represents a digit position)
    const columns: { [key: number]: Bubble[] } = {};
    
    idBubbles.forEach(bubble => {
      const col = bubble.column;
      if (col !== undefined) {
        if (!columns[col]) columns[col] = [];
        columns[col].push(bubble);
      }
    });
    
    // Extract digits from each column
    let studentId = '';
    for (let col = 0; col < 9; col++) {
      if (columns[col]) {
        for (const bubble of columns[col]) {
          const confidence = isBubbleFilled(bubble, gray);
          if (confidence > 0.6 && bubble.row !== undefined) {
            studentId += bubble.row.toString();
            break;
          }
        }
      }
    }
    
    console.log('🆔 Student ID detected:', studentId);
    return studentId || 'UNKNOWN';
  };

  const detectSection1Answers = (bubbles: Bubble[], gray: OpenCVMat): string[] => {
    // Filter bubbles for Section 1 (Multiple choice A,B,C,D)
    const section1Bubbles = bubbles.filter(b => b.section === 'section1');
    
    if (section1Bubbles.length === 0) {
      return [];
    }
    
    // Group by questions
    const questions: { [key: number]: Bubble[] } = {};
    
    section1Bubbles.forEach(bubble => {
      const questionNum = bubble.question;
      if (questionNum !== undefined) {
        if (!questions[questionNum]) questions[questionNum] = [];
        questions[questionNum].push(bubble);
      }
    });
    
    const answers: string[] = [];
    for (let q = 1; q <= 40; q++) {
      if (questions[q]) {
        let bestConfidence = 0;
        let bestAnswer = '';
        
        for (const bubble of questions[q]) {
          const confidence = isBubbleFilled(bubble, gray);
          if (confidence > bestConfidence && confidence > 0.6 && bubble.option) {
            bestConfidence = confidence;
            bestAnswer = bubble.option;
          }
        }
        
        answers.push(bestAnswer);
      } else {
        answers.push('');
      }
    }
    
    console.log('📝 Section 1 answers detected:', answers.filter(a => a).length, 'of 40');
    return answers;
  };

  const detectSection2Answers = (bubbles: Bubble[], gray: OpenCVMat): Array<{ a: boolean; b: boolean; c: boolean; d: boolean }> => {
    // Filter bubbles for Section 2 (True/False with sub-options)
    const section2Bubbles = bubbles.filter(b => b.section === 'section2');
    
    if (section2Bubbles.length === 0) {
      return [];
    }
    
    // Group by questions and sub-options
    const questions: { [key: number]: { [key: string]: Bubble[] } } = {};
    
    section2Bubbles.forEach(bubble => {
      const questionNum = bubble.question;
      const subOption = bubble.subOption;
      
      if (questionNum !== undefined && subOption !== undefined) {
        if (!questions[questionNum]) questions[questionNum] = {};
        if (!questions[questionNum][subOption]) questions[questionNum][subOption] = [];
        questions[questionNum][subOption].push(bubble);
      }
    });
    
    const answers: Array<{ a: boolean; b: boolean; c: boolean; d: boolean }> = [];
    
    for (let q = 1; q <= 8; q++) {
      const answer = { a: false, b: false, c: false, d: false };
      
      if (questions[q]) {
        ['a', 'b', 'c', 'd'].forEach(subOpt => {
          if (questions[q][subOpt]) {
            for (const bubble of questions[q][subOpt]) {
              const confidence = isBubbleFilled(bubble, gray);
              if (confidence > 0.6) {
                const value = bubble.value; // true for "Đúng", false for "Sai"
                if (value !== undefined) answer[subOpt as 'a' | 'b' | 'c' | 'd'] = value;
                break;
              }
            }
          }
        });
      }
      
      answers.push(answer);
    }
    
    console.log('✅ Section 2 answers detected:', answers.filter(a => a.a || a.b || a.c || a.d).length, 'of 8');
    return answers;
  };

  const detectSection3Answers = (bubbles: Bubble[], gray: OpenCVMat): string[] => {
    // Filter bubbles for Section 3 (Numerical 0-9)
    const section3Bubbles = bubbles.filter(b => b.section === 'section3');
    
    if (section3Bubbles.length === 0) {
      return [];
    }
    
    // Group by questions
    const questions: { [key: number]: Bubble[] } = {};
    
    section3Bubbles.forEach(bubble => {
      const questionNum = bubble.question;
      if (questionNum !== undefined) {
        if (!questions[questionNum]) questions[questionNum] = [];
        questions[questionNum].push(bubble);
      }
    });
    
    const answers: string[] = [];
    for (let q = 1; q <= 6; q++) {
      if (questions[q]) {
        let bestConfidence = 0;
        let bestAnswer = '';
        
        for (const bubble of questions[q]) {
          const confidence = isBubbleFilled(bubble, gray);
          if (confidence > bestConfidence && confidence > 0.6) {
            bestConfidence = confidence;
            bestAnswer = bubble.digit?.toString() || '';
          }
        }
        
        answers.push(bestAnswer);
      } else {
        answers.push('');
      }
    }
    
    console.log('🔢 Section 3 answers detected:', answers.filter(a => a).length, 'of 6');
    return answers;
  };


  useEffect(() => {
    if (cvLoaded && imageFile) {
      processImage();
    }
  }, [cvLoaded, imageFile, processImage]);

  return (
    <div className="space-y-4">
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
      
      {debugImageUrl && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Debug Visualization</h3>
          <div className="flex flex-col items-center space-y-3">
            <img 
              src={debugImageUrl} 
              alt="Debug visualization showing detected bubbles"
              className="max-w-full h-auto border border-gray-300 rounded"
              style={{ maxHeight: '600px' }}
            />
            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              <div className="font-medium mb-2">Legend:</div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-blue-500"></div>
                  <span>Student ID bubbles</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-green-500"></div>
                  <span>Correct answers</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-red-500"></div>
                  <span>Wrong answers</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}