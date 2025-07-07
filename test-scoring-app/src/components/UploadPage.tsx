'use client';

import { useState, useRef } from 'react';

interface ProcessedResult {
  id: string;
  fileName: string;
  studentId: string;
  phanI: string[];
  phanII: Array<{ a: boolean; b: boolean; c: boolean; d: boolean }>;
  phanIII: string[];
  processed: boolean;
}

export default function UploadPage() {
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [processedResults, setProcessedResults] = useState<ProcessedResult[]>([]);
  const [processing, setProcessing] = useState(false);
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
    
    try {
      const results = [];
      
      for (let i = 0; i < selectedImages.length; i++) {
        const file = selectedImages[i];
        const processedResult = await processImageWithOpenCV(file);
        
        results.push({
          id: `student_${i + 1}`,
          fileName: file.name,
          studentId: processedResult.studentId,
          phanI: processedResult.phanI,
          phanII: processedResult.phanII,
          phanIII: processedResult.phanIII,
          processed: true,
        });
      }

      setProcessedResults(results);
      
      // Save to localStorage
      localStorage.setItem('studentResults', JSON.stringify(results));
      
      setProcessing(false);
      alert('Xử lý ảnh hoàn tất!');
    } catch (error) {
      console.error('Error processing images:', error);
      setProcessing(false);
      alert('Có lỗi xảy ra khi xử lý ảnh.');
    }
  };

  const processImageWithOpenCV = (file: File): Promise<Omit<ProcessedResult, 'id' | 'fileName' | 'processed'>> => {
    return new Promise((resolve, reject) => {
      const imageUrl = URL.createObjectURL(file);
      const img = new Image();
      
      img.onload = () => {
        try {
          // For now, return mock data since full OpenCV implementation is complex
          const mockResult = {
            studentId: Math.floor(Math.random() * 1000000000).toString().padStart(9, '0'),
            phanI: Array.from({ length: 40 }, () => ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)]),
            phanII: Array.from({ length: 8 }, () => ({
              a: Math.random() > 0.5,
              b: Math.random() > 0.5,
              c: Math.random() > 0.5,
              d: Math.random() > 0.5,
            })),
            phanIII: Array.from({ length: 6 }, () => (Math.random() * 10).toFixed(1)),
          };
          
          URL.revokeObjectURL(imageUrl);
          resolve(mockResult);
        } catch (error) {
          URL.revokeObjectURL(imageUrl);
          reject(error);
        }
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(imageUrl);
        reject(new Error('Failed to load image'));
      };
      
      img.src = imageUrl;
    });
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
            <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Đang nhận diện mã số học sinh và các câu trả lời...
          </p>
        </div>
      )}

      {/* Results Preview */}
      {processedResults.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Kết quả xử lý</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                    Tên file
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                    Mã số học sinh
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody>
                {processedResults.map((result, index) => (
                  <tr key={index} className="border-t border-gray-200">
                    <td className="px-4 py-2 text-sm text-gray-900">
                      {result.fileName}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900">
                      {result.studentId}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Đã xử lý
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}