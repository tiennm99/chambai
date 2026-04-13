'use client';

import { useCallback, useEffect, useState } from 'react';
import { resizeForProcessing } from '@/lib/image-preprocessing';
import { runDetectionPipeline } from '@/lib/detection-pipeline';

export default function ImageProcessor({ imageFile, testConfig, onProcessingComplete }) {
  const [processing, setProcessing] = useState(false);
  const [cvLoaded, setCvLoaded] = useState(false);
  const [debugImageUrl, setDebugImageUrl] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.cv) {
      setCvLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://docs.opencv.org/4.9.0/opencv.js';
    script.async = true;
    script.onload = () => {
      if (window.cv) {
        window.cv.onRuntimeInitialized = () => setCvLoaded(true);
      }
    };
    document.head.appendChild(script);
  }, []);

  const processImage = useCallback(async () => {
    if (!cvLoaded || !window.cv) return;

    setProcessing(true);
    setDebugImageUrl(null);

    try {
      const imageUrl = URL.createObjectURL(imageFile);
      const img = new Image();

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = img.width;
          canvas.height = img.height;
          ctx?.drawImage(img, 0, 0);

          const processCanvas = resizeForProcessing(canvas);
          const processCtx = processCanvas.getContext('2d');
          const imageData = processCtx?.getImageData(0, 0, processCanvas.width, processCanvas.height);
          if (!imageData) {
            setProcessing(false);
            return;
          }

          const config = testConfig || {
            phanI: { questionCount: 40, answers: [] },
            phanII: { questionCount: 8, answers: [] },
            phanIII: { questionCount: 6, answers: [] },
          };

          const { result, debugUrl } = runDetectionPipeline(imageData, canvas, config);
          setDebugImageUrl(debugUrl);
          onProcessingComplete(result);
        } catch (err) {
          console.error('Pipeline error:', err);
          onProcessingComplete({ error: true, errorMessage: err.message });
        } finally {
          URL.revokeObjectURL(imageUrl);
          setProcessing(false);
        }
      };

      img.src = imageUrl;
    } catch (error) {
      console.error('Error processing image:', error);
      setProcessing(false);
    }
  }, [cvLoaded, imageFile, testConfig, onProcessingComplete]);

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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Đang tải OpenCV...</p>
          </div>
        )}
        {cvLoaded && processing && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Đang xử lý ảnh...</p>
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
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full border-2 border-pink-400" />
                  <span>All positions</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full border-2 border-blue-500" />
                  <span>Student ID</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full border-2 border-purple-500" />
                  <span>Exam code</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full border-2 border-green-500" />
                  <span>Correct</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full border-2 border-red-500" />
                  <span>Wrong</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
