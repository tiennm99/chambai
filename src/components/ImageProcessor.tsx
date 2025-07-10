'use client';

import { useCallback, useEffect, useState } from 'react';
import { ImageSaver, matToDataUrl } from '../utils/fileUtils';
import { 
  rectContour, 
  getCornerPoints, 
  reorder, 
  splitBoxes, 
  showAnswers, 
  drawGrid 
} from '../utils/opencvUtils';

// Simplified OpenCV interfaces to avoid type conflicts
interface OpenCVMat {
  delete: () => void;
  rows: number;
  cols: number;
  [key: string]: unknown; // Allow any other properties
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
  symbol?: string;
}

declare global {
  interface Window {
    cv: any;
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

interface ProcessingSteps {
  original: string;
  grayscale: string;
  blur: string;
  edges: string;
  contours: string;
  warped: string;
  threshold: string;
  final: string;
}

interface ProcessingProgress {
  currentStep: string;
  stepIndex: number;
  totalSteps: number;
  error?: string;
}

export default function ImageProcessor({ imageFile, onProcessingComplete }: ImageProcessorProps) {
  const [processing, setProcessing] = useState(false);
  const [cvLoaded, setCvLoaded] = useState(false);
  const [debugImageUrl, setDebugImageUrl] = useState<string | null>(null);
  const [processingSteps, setProcessingSteps] = useState<ProcessingSteps | null>(null);
  const [processingProgress, setProcessingProgress] = useState<ProcessingProgress | null>(null);

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

  const getTestConfig = (): TestConfig => {
    if (typeof window !== 'undefined') {
      const savedConfig = localStorage.getItem('testConfig');
      if (savedConfig) {
        return JSON.parse(savedConfig);
      }
    }
    return {
      phanI: { questionCount: 40, answers: [] },
      phanII: { questionCount: 8, answers: [] },
      phanIII: { questionCount: 6, answers: [] },
    };
  };

  const updateProcessingStep = (stepName: string, stepIndex: number, totalSteps: number, imageUrl?: string) => {
    console.log(`📸 Processing step ${stepIndex + 1}/${totalSteps}: ${stepName}`);
    setProcessingProgress({
      currentStep: stepName,
      stepIndex,
      totalSteps
    });
    
    if (imageUrl) {
      setProcessingSteps(prev => ({
        ...prev,
        [stepName.toLowerCase().replace(' ', '')]: imageUrl
      }) as ProcessingSteps);
    }
  };

  const setProcessingError = (error: string, stepName: string, stepIndex: number, totalSteps: number) => {
    console.error(`❌ Error at step ${stepIndex + 1}/${totalSteps} (${stepName}):`, error);
    setProcessingProgress({
      currentStep: stepName,
      stepIndex,
      totalSteps,
      error
    });
  };

  const storeProcessingSteps = (
    images: {
      original: string;
      grayscale: string;
      blur: string;
      edges: string;
      contours: string;
      warped: string;
      threshold: string;
      final: string;
    }
  ) => {
    console.log('📸 Storing final processing steps for display...');
    setProcessingSteps(images);
    setProcessingProgress(null); // Clear progress when complete
  };

  const createDebugVisualization = (
    originalCanvas: HTMLCanvasElement,
    bubbles: Bubble[],
    detectedAnswers: ProcessingResult,
    testConfig: TestConfig
  ): string => {
    console.log('🎯 Creating debug visualization');

    const debugCanvas = document.createElement('canvas');
    const debugCtx = debugCanvas.getContext('2d');
    
    debugCanvas.width = originalCanvas.width;
    debugCanvas.height = originalCanvas.height;
    
    debugCtx?.drawImage(originalCanvas, 0, 0);
    
    if (!debugCtx) return '';
    
    // Add legend
    debugCtx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    debugCtx.fillRect(10, 10, 220, 100);
    debugCtx.strokeStyle = '#000000';
    debugCtx.lineWidth = 1;
    debugCtx.strokeRect(10, 10, 220, 100);
    
    debugCtx.fillStyle = '#000000';
    debugCtx.font = '14px Arial';
    debugCtx.fillText('Debug Processing Complete', 15, 30);
    
    return debugCanvas.toDataURL();
  };

  const generateBubbleGrid = (markers: { corners: unknown[]; edges: unknown[] }, imageWidth: number, imageHeight: number): Bubble[] => {
    console.log(`📐 Generating bubble grid for ${imageWidth}x${imageHeight}`);
    return [];
  };

  const processWithNewOpenCV = useCallback((imageData: ImageData, originalCanvas: HTMLCanvasElement): ProcessingResult => {
    const testConfig = getTestConfig();
    const totalSteps = 8;
    let stepIndex = 0;
    
    console.log('🚀 Running OpenCV bubble detection processing');
    
    const cv = window.cv as any;
    
    // Declare variables outside try block for proper cleanup
    let src: any = null;
    let imgGray: any = null;
    let imgBlur: any = null;
    let imgCanny: any = null;
    let imgContours: any = null;
    
    try {
      // Step 1: Create OpenCV Mat from ImageData
      updateProcessingStep('Original', stepIndex++, totalSteps, originalCanvas.toDataURL());
      src = cv.matFromImageData(imageData);
      
      // Step 2: Convert to grayscale
      updateProcessingStep('Grayscale', stepIndex, totalSteps);
      imgGray = new cv.Mat();
      cv.cvtColor(src, imgGray, cv.COLOR_RGBA2GRAY);
      updateProcessingStep('Grayscale', stepIndex++, totalSteps, matToDataUrl(imgGray));
      
      // Step 3: Apply Gaussian blur
      updateProcessingStep('Blur', stepIndex, totalSteps);
      imgBlur = new cv.Mat();
      cv.GaussianBlur(imgGray, imgBlur, new cv.Size(5, 5), 1);
      updateProcessingStep('Blur', stepIndex++, totalSteps, matToDataUrl(imgBlur));
      
      // Step 4: Apply Canny edge detection
      updateProcessingStep('Edges', stepIndex, totalSteps);
      imgCanny = new cv.Mat();
      cv.Canny(imgBlur, imgCanny, 10, 70);
      updateProcessingStep('Edges', stepIndex++, totalSteps, matToDataUrl(imgCanny));
    
      // Step 5: Find contours
      updateProcessingStep('Contours', stepIndex, totalSteps);
      const contours = new cv.MatVector();
      const hierarchy = new cv.Mat();
      cv.findContours(imgCanny, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
      
      // Create contour visualization
      imgContours = src.clone();
      cv.drawContours(imgContours, contours, -1, new cv.Scalar(0, 255, 0, 255), 2);
      updateProcessingStep('Contours', stepIndex++, totalSteps, matToDataUrl(imgContours));
      
      // Step 6: Filter for rectangle contours
      updateProcessingStep('Warped', stepIndex, totalSteps);
      const rectCon = rectContour(contours);
      
      if (rectCon.size() >= 1) {
        // Get corner points of the biggest rectangle
        const biggestPoints = getCornerPoints(rectCon.get(0));
        
        if (biggestPoints.rows >= 4) {
          // Reorder points for warping
          const reorderedPoints = reorder(biggestPoints);
          
          // Prepare points for perspective transform
          const heightImg = 700;
          const widthImg = 700;
          
          const pts1 = cv.matFromArray(4, 1, cv.CV_32FC2, [
            reorderedPoints.data32S[0], reorderedPoints.data32S[1],
            reorderedPoints.data32S[2], reorderedPoints.data32S[3], 
            reorderedPoints.data32S[4], reorderedPoints.data32S[5],
            reorderedPoints.data32S[6], reorderedPoints.data32S[7]
          ]);
          
          const pts2 = cv.matFromArray(4, 1, cv.CV_32FC2, [
            0, 0, widthImg, 0, 0, heightImg, widthImg, heightImg
          ]);
          
          // Get transformation matrix and apply perspective warp
          const matrix = cv.getPerspectiveTransform(pts1, pts2);
          const imgWarpColored = new cv.Mat();
          cv.warpPerspective(src, imgWarpColored, matrix, new cv.Size(widthImg, heightImg));
          updateProcessingStep('Warped', stepIndex++, totalSteps, matToDataUrl(imgWarpColored));
          
          // Step 7: Convert warped image to grayscale and apply threshold
          updateProcessingStep('Threshold', stepIndex, totalSteps);
          const imgWarpGray = new cv.Mat();
          cv.cvtColor(imgWarpColored, imgWarpGray, cv.COLOR_BGR2GRAY);
          
          const imgThresh = new cv.Mat();
          cv.threshold(imgWarpGray, imgThresh, 170, 255, cv.THRESH_BINARY_INV);
          updateProcessingStep('Threshold', stepIndex++, totalSteps, matToDataUrl(imgThresh));
          
          // Split into boxes
          const questions = 5;
          const choices = 5;
          const boxes = splitBoxes(imgThresh, questions, choices);
          
          // Calculate pixel values for each box
          const myPixelVal: number[][] = [];
          for (let r = 0; r < questions; r++) {
            myPixelVal[r] = [];
            for (let c = 0; c < choices; c++) {
              const boxIndex = r * choices + c;
              const totalPixels = cv.countNonZero(boxes[boxIndex]);
              myPixelVal[r][c] = totalPixels;
            }
          }
          
          // Find user answers
          const myIndex: number[] = [];
          for (let x = 0; x < questions; x++) {
            const maxVal = Math.max(...myPixelVal[x]);
            const maxIndex = myPixelVal[x].indexOf(maxVal);
            myIndex.push(maxIndex);
          }
          
          // Compare with correct answers
          const ans = [1, 2, 0, 2, 4]; // Example from Python code
          const grading: boolean[] = [];
          for (let x = 0; x < questions; x++) {
            grading.push(ans[x] === myIndex[x]);
          }
          
          const score = (grading.filter(g => g).length / questions) * 100;
          
          // Step 8: Show answers on the warped image
          updateProcessingStep('Final', stepIndex, totalSteps);
          showAnswers(imgWarpColored, myIndex, grading, ans, questions, choices);
          drawGrid(imgWarpColored, questions, choices);
          
          // Create debug visualization
          const bubbles = generateBubbleGrid({ corners: [], edges: [] }, imageData.width, imageData.height);
          const result = {
            studentId: 'DETECTED',
            phanI: myIndex.map(idx => ['A', 'B', 'C', 'D', 'E'][idx] || ''),
            phanII: Array(8).fill(null).map(() => ({ a: false, b: false, c: false, d: false })),
            phanIII: Array(6).fill(''),
            confidence: score / 100,
          };
          
          const debugUrl = createDebugVisualization(originalCanvas, bubbles, result, testConfig);
          setDebugImageUrl(debugUrl);
          updateProcessingStep('Final', stepIndex++, totalSteps, debugUrl);
          
          // Store processing steps for display
          storeProcessingSteps({
            original: originalCanvas.toDataURL(),
            grayscale: matToDataUrl(imgGray),
            blur: matToDataUrl(imgBlur),
            edges: matToDataUrl(imgCanny),
            contours: matToDataUrl(imgContours),
            warped: matToDataUrl(imgWarpColored),
            threshold: matToDataUrl(imgThresh),
            final: debugUrl
          });
          
          // Clean up
          boxes.forEach(box => box.delete());
          imgWarpColored.delete();
          imgWarpGray.delete();
          imgThresh.delete();
          pts1.delete();
          pts2.delete();
          matrix.delete();
          
          return {
            ...result,
            debugImageUrl: debugUrl
          };
        } else {
          setProcessingError('Not enough corner points detected', 'Warped', stepIndex, totalSteps);
        }
      } else {
        setProcessingError('No rectangular contours found', 'Contours', stepIndex, totalSteps);
      }
      
      // Cleanup
      contours.delete();
      hierarchy.delete();
      if (imgContours) imgContours.delete();
    } catch (processingError) {
      const errorMessage = processingError instanceof Error ? processingError.message : 'Unknown processing error';
      setProcessingError(`Processing failed: ${errorMessage}`, 'Processing', stepIndex, totalSteps);
      console.error('Error in OpenCV processing:', processingError);
    }
    
    // Fallback result
    const bubbles = generateBubbleGrid({ corners: [], edges: [] }, imageData.width, imageData.height);
    const fallbackResult = {
      studentId: 'UNKNOWN',
      phanI: Array(40).fill(''),
      phanII: Array(8).fill(null).map(() => ({ a: false, b: false, c: false, d: false })),
      phanIII: Array(6).fill(''),
      confidence: 0.0,
    };
    
    const debugUrl = createDebugVisualization(originalCanvas, bubbles, fallbackResult, testConfig);
    setDebugImageUrl(debugUrl);
    
    // Store fallback processing steps (only if variables exist)
    try {
      storeProcessingSteps({
        original: originalCanvas.toDataURL(),
        grayscale: imgGray ? matToDataUrl(imgGray) : originalCanvas.toDataURL(),
        blur: imgBlur ? matToDataUrl(imgBlur) : originalCanvas.toDataURL(),
        edges: imgCanny ? matToDataUrl(imgCanny) : originalCanvas.toDataURL(),
        contours: originalCanvas.toDataURL(), // Use original as fallback
        warped: originalCanvas.toDataURL(), // Use original as fallback
        threshold: imgCanny ? matToDataUrl(imgCanny) : originalCanvas.toDataURL(),
        final: debugUrl
      });
      
      // Clean up (only if variables exist)
      if (src) src.delete();
      if (imgGray) imgGray.delete();
      if (imgBlur) imgBlur.delete();
      if (imgCanny) imgCanny.delete();
      if (imgContours) imgContours.delete();
    } catch (cleanupError) {
      console.warn('Cleanup error:', cleanupError);
    }
    
    return {
      ...fallbackResult,
      debugImageUrl: debugUrl
    };
  }, [imageFile, updateProcessingStep, setProcessingError, createDebugVisualization, generateBubbleGrid]);

  const processImage = useCallback(async () => {
    if (!cvLoaded || !window.cv) {
      console.error('OpenCV not loaded');
      return;
    }

    setProcessing(true);
    setDebugImageUrl(null);
    setProcessingSteps(null);
    setProcessingProgress(null);

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
          const result = processWithNewOpenCV(imageData, canvas);
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
  }, [cvLoaded, imageFile, onProcessingComplete, processWithNewOpenCV]);

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
            {processingProgress && (
              <div className="mt-3 max-w-md mx-auto">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Step {processingProgress.stepIndex + 1} of {processingProgress.totalSteps}</span>
                  <span>{Math.round(((processingProgress.stepIndex + 1) / processingProgress.totalSteps) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${((processingProgress.stepIndex + 1) / processingProgress.totalSteps) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-600">{processingProgress.currentStep}</p>
                {processingProgress.error && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                    ❌ Error at step: {processingProgress.error}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      
      {(processingSteps || processingProgress?.error) && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            OpenCV Processing Steps
            {processingProgress?.error && (
              <span className="ml-2 text-sm font-normal text-red-600">
                (Failed at step {processingProgress.stepIndex + 1})
              </span>
            )}
          </h3>
          
          {processingProgress?.error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <span className="text-red-600 mr-2">⚠️</span>
                <div>
                  <div className="font-medium text-red-800">Processing Failed</div>
                  <div className="text-sm text-red-700">{processingProgress.error}</div>
                  <div className="text-xs text-red-600 mt-1">
                    Showing partial results up to step {processingProgress.stepIndex + 1}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {processingSteps && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {processingSteps.original && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-700">1. Original Image</h4>
                  <img 
                    src={processingSteps.original} 
                    alt="Original uploaded image"
                    className="w-full h-auto border border-gray-300 rounded"
                    style={{ maxHeight: '180px', objectFit: 'contain' }}
                  />
                </div>
              )}
            
              {processingSteps.grayscale && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-700">2. Grayscale</h4>
                  <img 
                    src={processingSteps.grayscale} 
                    alt="Grayscale conversion"
                    className="w-full h-auto border border-gray-300 rounded"
                    style={{ maxHeight: '180px', objectFit: 'contain' }}
                  />
                </div>
              )}
              
              {processingSteps.blur && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-700">3. Gaussian Blur</h4>
                  <img 
                    src={processingSteps.blur} 
                    alt="Gaussian blur for noise reduction"
                    className="w-full h-auto border border-gray-300 rounded"
                    style={{ maxHeight: '180px', objectFit: 'contain' }}
                  />
                </div>
              )}
              
              {processingSteps.edges && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-700">4. Edge Detection</h4>
                  <img 
                    src={processingSteps.edges} 
                    alt="Canny edge detection"
                    className="w-full h-auto border border-gray-300 rounded"
                    style={{ maxHeight: '180px', objectFit: 'contain' }}
                  />
                </div>
              )}
              
              {processingSteps.contours && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-700">5. Contour Detection</h4>
                  <img 
                    src={processingSteps.contours} 
                    alt="Detected contours visualization"
                    className="w-full h-auto border border-gray-300 rounded"
                    style={{ maxHeight: '180px', objectFit: 'contain' }}
                  />
                </div>
              )}
              
              {processingSteps.warped && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-700">6. Perspective Corrected</h4>
                  <img 
                    src={processingSteps.warped} 
                    alt="Perspective corrected answer sheet"
                    className="w-full h-auto border border-gray-300 rounded"
                    style={{ maxHeight: '180px', objectFit: 'contain' }}
                  />
                </div>
              )}
              
              {processingSteps.threshold && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-700">7. Binary Threshold</h4>
                  <img 
                    src={processingSteps.threshold} 
                    alt="Binary threshold for bubble detection"
                    className="w-full h-auto border border-gray-300 rounded"
                    style={{ maxHeight: '180px', objectFit: 'contain' }}
                  />
                </div>
              )}
              
              {processingSteps.final && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-700">8. Final Result</h4>
                  <img 
                    src={processingSteps.final} 
                    alt="Final result with answer markings"
                    className="w-full h-auto border border-gray-300 rounded"
                    style={{ maxHeight: '180px', objectFit: 'contain' }}
                  />
                </div>
              )}
            </div>
          )}
          
          <div className="mt-6 text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
            <div className="font-medium mb-3">Processing Pipeline:</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="font-medium text-gray-700 mb-2">Step Details:</div>
                <ul className="space-y-1 text-xs">
                  <li><span className="font-medium">1. Original:</span> Raw uploaded image</li>
                  <li><span className="font-medium">2. Grayscale:</span> Convert to single channel</li>
                  <li><span className="font-medium">3. Blur:</span> Gaussian blur (5×5 kernel, σ=1)</li>
                  <li><span className="font-medium">4. Edges:</span> Canny edge detection (10-70 threshold)</li>
                  <li><span className="font-medium">5. Contours:</span> Find and draw all contours</li>
                  <li><span className="font-medium">6. Warped:</span> Perspective correction to 700×700</li>
                  <li><span className="font-medium">7. Threshold:</span> Binary image (threshold=170)</li>
                  <li><span className="font-medium">8. Final:</span> Answer detection + grid overlay</li>
                </ul>
              </div>
              <div>
                <div className="font-medium text-gray-700 mb-2">Legend:</div>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full border-2 border-green-500"></div>
                    <span>Correct answers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full border-2 border-red-500"></div>
                    <span>Wrong answers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full border-2 border-yellow-500"></div>
                    <span>Grid lines</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}