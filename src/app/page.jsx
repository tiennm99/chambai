'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import ConfigurationPage from '@/components/ConfigurationPage';
import UploadPage from '@/components/UploadPage';
import ResultsPage from '@/components/ResultsPage';
import { clearDebugImages } from '@/lib/indexed-db-store';

const DEFAULT_CONFIG = {
  phanI: { questionCount: 40, answers: [] },
  phanII: { questionCount: 8, answers: [] },
  phanIII: { questionCount: 6, answers: [] },
  scoring: {
    phanI: { pointsPerQuestion: 0.25 },
    phanII: { pointsPerQuestion: 0.25, partialCredit: true },
    phanIII: { pointsPerQuestion: 0.5 },
  },
};

export default function Home() {
  const [currentPage, setCurrentPage] = useState('config');
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [results, setResults] = useState([]);
  const [configSaved, setConfigSaved] = useState(false);

  // Load persisted state on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('testConfig');
    const savedResults = localStorage.getItem('studentResults');
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
      setConfigSaved(true);
    }
    if (savedResults) {
      setResults(JSON.parse(savedResults));
    }
  }, []);

  const handleConfigSave = (newConfig) => {
    setConfig(newConfig);
    setConfigSaved(true);
    localStorage.setItem('testConfig', JSON.stringify(newConfig));
  };

  const handleResultsAdd = (newResults) => {
    setResults((prev) => {
      const merged = [...prev, ...newResults];
      // Strip debugImageUrl before localStorage (stored in IndexedDB separately)
      const toSave = merged.map(({ debugImageUrl, ...rest }) => rest);
      localStorage.setItem('studentResults', JSON.stringify(toSave));
      return merged;
    });
  };

  const handleResultsUpdate = (updatedResults) => {
    setResults(updatedResults);
    const toSave = updatedResults.map(({ debugImageUrl, ...rest }) => rest);
    localStorage.setItem('studentResults', JSON.stringify(toSave));
  };

  const handleResultsClear = () => {
    setResults([]);
    localStorage.removeItem('studentResults');
    clearDebugImages().catch(() => {});
  };

  const handleResetAll = () => {
    setConfig(DEFAULT_CONFIG);
    setResults([]);
    setConfigSaved(false);
    localStorage.clear();
    clearDebugImages().catch(() => {});
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'config':
        return (
          <ConfigurationPage
            config={config}
            onConfigChange={setConfig}
            onSave={handleConfigSave}
            onResetAll={handleResetAll}
          />
        );
      case 'upload':
        return (
          <UploadPage
            config={config}
            onResultsAdd={handleResultsAdd}
          />
        );
      case 'results':
        return (
          <ResultsPage
            results={results}
            config={config}
            onResultsUpdate={handleResultsUpdate}
            onResultsClear={handleResultsClear}
          />
        );
      default:
        return null;
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
          configSaved={configSaved}
          hasResults={results.length > 0}
        />

        <div className="mt-8">
          {renderPage()}
        </div>
      </div>
    </div>
  );
}
