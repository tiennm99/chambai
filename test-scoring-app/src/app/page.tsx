'use client';

import { useState } from 'react';
import Navigation from '@/components/Navigation';
import ConfigurationPage from '@/components/ConfigurationPage';
import UploadPage from '@/components/UploadPage';
import ResultsPage from '@/components/ResultsPage';

export default function Home() {
  const [currentPage, setCurrentPage] = useState<'config' | 'upload' | 'results'>('config');

  const renderPage = () => {
    switch (currentPage) {
      case 'config':
        return <ConfigurationPage />;
      case 'upload':
        return <UploadPage />;
      case 'results':
        return <ResultsPage />;
      default:
        return <ConfigurationPage />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Hệ thống chấm điểm trắc nghiệm
          </h1>
          <p className="text-gray-600">
            Tự động nhận diện và chấm điểm bài thi trắc nghiệm tiếng Việt
          </p>
        </div>
        
        <Navigation 
          currentPage={currentPage} 
          onPageChange={setCurrentPage} 
        />
        
        <div className="mt-8">
          {renderPage()}
        </div>
      </div>
    </div>
  );
}