'use client';

import { useState, useRef } from 'react';
import ImageProcessor from './ImageProcessor';

interface ProcessedResult {
  id: string;
  fileName: string;
  studentId: string;
  phanI: string[];
  phanII: Array<{ a: boolean; b: boolean; c: boolean; d: boolean }>;
  phanIII: string[];
  processed: boolean;
  debugImageUrl?: string;
}

export default function UploadPage() {
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [processedResults, setProcessedResults] = useState<ProcessedResult[]>([]);
  const [processing, setProcessing] = useState(false);
  const [currentProcessingImage, setCurrentProcessingImage] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => 
      file.type.startsWith('image/') && (file.type.includes('jpeg') || file.type.includes('png'))
    );
    
    setSelectedImages(prev => [...prev, ...imageFiles]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(file => 
      file.type.startsWith('image/') && (file.type.includes('jpeg') || file.type.includes('png'))
    );
    
    setSelectedImages(prev => [...prev, ...imageFiles]);
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const processImages = async () => {
    if (selectedImages.length === 0) {
      alert('Vui lòng chọn ít nhất một hình ảnh để xử lý.');
      return;
    }

    const testConfig = localStorage.getItem('testConfig');
    if (!testConfig) {
      alert('Vui lòng cấu hình đề thi trước khi xử lý ảnh.');
      return;
    }

    setProcessing(true);
    setProcessedResults([]); // Clear previous results
    
    try {
      // Process images one by one
      for (let i = 0; i < selectedImages.length; i++) {
        const file = selectedImages[i];
        setCurrentProcessingImage(file);
        
        // Wait for the ImageProcessor to complete processing
        await new Promise<void>((resolve) => {
          // This will be handled by the onProcessingComplete callback
          const processingId = `processing-${i}`;
          (window as unknown as Record<string, () => void>)[processingId] = resolve;
        });
      }
      
      setProcessing(false);
      setCurrentProcessingImage(null);
      
      // Save to localStorage
      const savedResults = localStorage.getItem('studentResults');
      const existingResults = savedResults ? JSON.parse(savedResults) : [];
      localStorage.setItem('studentResults', JSON.stringify([...existingResults, ...processedResults]));
      
      alert('Xử lý ảnh hoàn tất!');
    } catch (error) {
      console.error('Error processing images:', error);
      setProcessing(false);
      setCurrentProcessingImage(null);
      alert('Có lỗi xảy ra khi xử lý ảnh.');
    }
  };

  const handleProcessingComplete = (result: {
    studentId: string;
    phanI: string[];
    phanII: Array<{ a: boolean; b: boolean; c: boolean; d: boolean }>;
    phanIII: string[];
    confidence: number;
    debugImageUrl?: string;
  }) => {
    const newResult: ProcessedResult = {
      id: `student_${processedResults.length + 1}`,
      fileName: currentProcessingImage?.name || 'unknown',
      studentId: result.studentId,
      phanI: result.phanI,
      phanII: result.phanII,
      phanIII: result.phanIII,
      processed: true,
      debugImageUrl: result.debugImageUrl,
    };
    
    setProcessedResults(prev => [...prev, newResult]);
    
    // Resolve the processing promise
    const currentIndex = selectedImages.findIndex(img => img === currentProcessingImage);
    const processingId = `processing-${currentIndex}`;
    const windowRecord = window as unknown as Record<string, () => void>;
    if (windowRecord[processingId]) {
      windowRecord[processingId]();
      delete windowRecord[processingId];
    }
  };


  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Tải và xử lý ảnh bài thi</h2>
        <p className="text-gray-600">
          Kéo thả hoặc chọn các file ảnh (JPG, PNG) chứa phiếu trả lời của học sinh
        </p>
      </div>

      {/* Upload Area */}
      <div className="mb-6">
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="mb-4">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <p className="text-lg text-gray-700 mb-2">
            Kéo thả ảnh vào đây hoặc
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Chọn file
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png"
            onChange={handleFileSelect}
            className="hidden"
          />
          <p className="text-sm text-gray-500 mt-2">
            Chỉ hỗ trợ file JPG và PNG
          </p>
        </div>
      </div>

      {/* Selected Images */}
      {selectedImages.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Ảnh đã chọn ({selectedImages.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedImages.map((file, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-medium text-gray-700 truncate">
                    {file.name}
                  </span>
                  <button
                    onClick={() => removeImage(index)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Xóa
                  </button>
                </div>
                <div className="text-xs text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Process Button */}
      <div className="mb-6">
        <button
          onClick={processImages}
          disabled={processing || selectedImages.length === 0}
          className={`px-8 py-3 rounded-lg font-semibold transition-colors ${
            processing || selectedImages.length === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {processing ? 'Đang xử lý...' : 'Xử lý ảnh'}
        </button>
      </div>

      {/* Processing Progress */}
      {processing && (
        <div className="mb-6">
          <div className="bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full animate-pulse" 
                 style={{ width: `${((processedResults.length) / selectedImages.length) * 100}%` }}></div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Đang xử lý ảnh {processedResults.length + 1}/{selectedImages.length}: {currentProcessingImage?.name}
          </p>
        </div>
      )}

      {/* Image Processor */}
      {currentProcessingImage && (
        <div className="mb-6">
          <ImageProcessor
            imageFile={currentProcessingImage}
            onProcessingComplete={handleProcessingComplete}
          />
        </div>
      )}

      {/* Results Preview */}
      {processedResults.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Kết quả xử lý</h3>
          <div className="space-y-6">
            {processedResults.map((result, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-medium text-gray-900">{result.fileName}</h4>
                    <p className="text-sm text-gray-600">Mã số học sinh: {result.studentId}</p>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-1">
                      Đã xử lý
                    </span>
                  </div>
                </div>
                
                {result.debugImageUrl && (
                  <div className="mt-4">
                    <h5 className="font-medium text-gray-700 mb-2">Debug Visualization</h5>
                    <img 
                      src={result.debugImageUrl} 
                      alt={`Debug visualization for ${result.fileName}`}
                      className="max-w-full h-auto border border-gray-300 rounded"
                      style={{ maxHeight: '400px' }}
                    />
                    <div className="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded">
                      <strong>Legend:</strong> 🔵 Student ID | 🟢 Correct Answer | 🔴 Wrong Answer
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}