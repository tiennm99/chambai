'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import ImageProcessor from './ImageProcessor';
import ImageProcessorErrorBoundary from './image-processor-error-boundary';
import { saveDebugImage } from '@/lib/indexed-db-store';

export default function UploadPage({ config, onResultsAdd }) {
  const [selectedImages, setSelectedImages] = useState([]);
  const [processedResults, setProcessedResults] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [dragActive, setDragActive] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const fileInputRef = useRef(null);
  const resolveRef = useRef(null);
  // Accumulate results in a ref to avoid race conditions with React state batching
  const resultsRef = useRef([]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const addImageFiles = (files) => {
    const imageFiles = Array.from(files).filter(
      (file) => file.type === 'image/jpeg' || file.type === 'image/png'
    );
    if (imageFiles.length > 0) {
      setSelectedImages((prev) => [...prev, ...imageFiles]);
      setStatusMessage(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    addImageFiles(e.dataTransfer.files);
  };

  const handleFileSelect = (e) => {
    if (e.target.files) addImageFiles(e.target.files);
  };

  const removeImage = (index) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleProcessingComplete = useCallback((result) => {
    const newResult = {
      id: `student_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      fileName: selectedImages[currentIndex]?.name || 'unknown',
      studentId: result.studentId,
      examCode: result.examCode,
      phanI: result.phanI,
      phanII: result.phanII,
      phanIII: result.phanIII,
      confidenceMap: result.confidenceMap,
      qualityReport: result.qualityReport,
      processed: true,
      debugImageUrl: result.debugImageUrl,
    };

    resultsRef.current.push(newResult);
    setProcessedResults((prev) => [...prev, newResult]);

    if (resolveRef.current) {
      resolveRef.current();
      resolveRef.current = null;
    }
  }, [selectedImages, currentIndex]);

  const processImages = async () => {
    if (selectedImages.length === 0) {
      setStatusMessage({ type: 'error', text: 'Vui lòng chọn ít nhất một hình ảnh để xử lý.' });
      return;
    }
    if (!config || config.phanI.answers.length === 0) {
      setStatusMessage({ type: 'error', text: 'Vui lòng cấu hình đề thi trước khi xử lý ảnh.' });
      return;
    }

    setProcessing(true);
    setProcessedResults([]);
    resultsRef.current = [];
    setStatusMessage({ type: 'info', text: 'Đang xử lý...' });

    try {
      for (let i = 0; i < selectedImages.length; i++) {
        setCurrentIndex(i);
        await new Promise((resolve) => { resolveRef.current = resolve; });
      }

      // Save debug images to IndexedDB (non-blocking)
      for (const r of resultsRef.current) {
        if (r.debugImageUrl) {
          saveDebugImage(r.id, r.debugImageUrl).catch(() => {});
        }
      }

      // Notify parent to persist results (parent handles localStorage)
      onResultsAdd(resultsRef.current);
      resultsRef.current = [];

      setStatusMessage({ type: 'success', text: `Xử lý hoàn tất ${selectedImages.length} ảnh!` });
    } catch (error) {
      console.error('Error processing images:', error);
      setStatusMessage({ type: 'error', text: 'Có lỗi xảy ra khi xử lý ảnh.' });
    } finally {
      setProcessing(false);
      setCurrentIndex(-1);
    }
  };

  const progressPercent = processing && selectedImages.length > 0
    ? Math.round((processedResults.length / selectedImages.length) * 100)
    : 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Tải và xử lý ảnh bài thi</h2>
        <p className="text-gray-600">
          Kéo thả hoặc chọn các file ảnh (JPG, PNG) chứa phiếu trả lời của học sinh
        </p>
      </div>

      {statusMessage && (
        <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${
          statusMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
          statusMessage.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
          'bg-blue-50 text-blue-800 border border-blue-200'
        }`}>
          {statusMessage.text}
        </div>
      )}

      {/* Upload Area */}
      <DropZone
        dragActive={dragActive}
        onDrag={handleDrag}
        onDrop={handleDrop}
        onFileSelect={handleFileSelect}
        fileInputRef={fileInputRef}
      />

      {/* Selected Images */}
      {selectedImages.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Ảnh đã chọn ({selectedImages.length})</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {selectedImages.map((file, index) => (
              <ImageThumbnail key={index} file={file} index={index} onRemove={removeImage} />
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

      {/* Progress */}
      {processing && (
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Đang xử lý ảnh {processedResults.length + 1}/{selectedImages.length}</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="bg-gray-200 rounded-full h-2.5">
            <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progressPercent}%` }} />
          </div>
          {currentIndex >= 0 && currentIndex < selectedImages.length && (
            <p className="text-xs text-gray-500 mt-1">{selectedImages[currentIndex].name}</p>
          )}
        </div>
      )}

      {/* Image Processor (hidden worker) */}
      {currentIndex >= 0 && currentIndex < selectedImages.length && (
        <ImageProcessorErrorBoundary>
          <ImageProcessor imageFile={selectedImages[currentIndex]} testConfig={config} onProcessingComplete={handleProcessingComplete} />
        </ImageProcessorErrorBoundary>
      )}

      {/* Results Preview */}
      {processedResults.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Kết quả xử lý</h3>
          <div className="space-y-4">
            {processedResults.map((result, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900">{result.fileName}</h4>
                <p className="text-sm text-gray-600">SBD: {result.studentId}</p>
                {result.examCode && <p className="text-sm text-gray-600">Mã đề: {result.examCode}</p>}
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-1">
                  Đã xử lý
                </span>
                {result.qualityReport && !result.qualityReport.passed && (
                  <div className="mt-2 space-y-1">
                    {result.qualityReport.issues.map((issue, i) => (
                      <p key={i} className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded">
                        ⚠ {issue.message}
                      </p>
                    ))}
                  </div>
                )}
                {result.debugImageUrl && (
                  <img src={result.debugImageUrl} alt="Debug" className="mt-3 max-w-full h-auto border border-gray-300 rounded" style={{ maxHeight: '400px' }} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DropZone({ dragActive, onDrag, onDrop, onFileSelect, fileInputRef }) {
  return (
    <div className="mb-6">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={onDrag} onDragLeave={onDrag} onDragOver={onDrag} onDrop={onDrop}
      >
        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p className="text-lg text-gray-700 mt-4 mb-2">Kéo thả ảnh vào đây hoặc</p>
        <button onClick={() => fileInputRef.current?.click()} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          Chọn file
        </button>
        <input ref={fileInputRef} type="file" multiple accept="image/jpeg,image/png" onChange={onFileSelect} className="hidden" />
        <p className="text-sm text-gray-500 mt-2">Chỉ hỗ trợ file JPG và PNG</p>
      </div>
    </div>
  );
}

function ImageThumbnail({ file, index, onRemove }) {
  const [src, setSrc] = useState('');

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden group relative">
      {src && <img src={src} alt={file.name} className="w-full h-32 object-cover" />}
      <div className="p-2">
        <p className="text-xs font-medium text-gray-700 truncate">{file.name}</p>
        <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
      </div>
      <button
        onClick={() => onRemove(index)}
        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
      >X</button>
    </div>
  );
}
