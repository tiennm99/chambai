'use client';

import { useState, useEffect, useCallback } from 'react';
import Navigation from '@/components/Navigation';
import ConfigurationPage from '@/components/ConfigurationPage';
import UploadPage from '@/components/UploadPage';
import ResultsPage from '@/components/ResultsPage';
import SessionList from '@/components/session-list';
import SessionHeader from '@/components/session-header';
import { clearDebugImages } from '@/lib/indexed-db-store';
import { getAllSessions, saveSession, deleteSession } from '@/lib/indexed-db-sessions';
import { getSessionResults, saveResults, deleteSessionResults } from '@/lib/indexed-db-results';
import { migrateFromLocalStorage } from '@/lib/local-storage-migration';

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
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [currentPage, setCurrentPage] = useState('config');
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [results, setResults] = useState([]);
  const [configSaved, setConfigSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  // Boot: migrate localStorage, then load sessions
  useEffect(() => {
    (async () => {
      try {
        await migrateFromLocalStorage();
        const allSessions = await getAllSessions();
        setSessions(allSessions);
      } catch (err) {
        console.error('Failed to load sessions:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Load session data when active session changes
  const loadSession = useCallback(async (session) => {
    setActiveSession(session);
    setConfig(session.config || DEFAULT_CONFIG);
    setConfigSaved(true);
    setCurrentPage('config');
    try {
      const sessionResults = await getSessionResults(session.id);
      setResults(sessionResults);
    } catch {
      setResults([]);
    }
  }, []);

  const handleCreateSession = async (name) => {
    const session = {
      id: `session_${Date.now()}`,
      name,
      date: new Date().toISOString().split('T')[0],
      config: DEFAULT_CONFIG,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await saveSession(session);
    setSessions((prev) => [...prev, session]);
    loadSession(session);
  };

  const handleDeleteSession = async (id) => {
    await deleteSession(id);
    await deleteSessionResults(id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeSession?.id === id) {
      setActiveSession(null);
      setResults([]);
    }
  };

  const handleBackToList = async () => {
    setActiveSession(null);
    setResults([]);
    setConfigSaved(false);
    const allSessions = await getAllSessions();
    setSessions(allSessions);
  };

  const handleConfigSave = async (newConfig) => {
    setConfig(newConfig);
    setConfigSaved(true);
    if (activeSession) {
      const updated = { ...activeSession, config: newConfig, updatedAt: Date.now() };
      await saveSession(updated);
      setActiveSession(updated);
      setSessions((prev) => prev.map((s) => s.id === updated.id ? updated : s));
    }
  };

  const handleResultsAdd = async (newResults) => {
    const withSession = newResults.map((r) => ({
      ...r,
      sessionId: activeSession?.id,
    }));
    setResults((prev) => [...prev, ...withSession]);
    if (activeSession) {
      // Strip debugImageUrl before IndexedDB (stored separately)
      const toSave = withSession.map(({ debugImageUrl, ...rest }) => rest);
      await saveResults(toSave);
    }
  };

  const handleResultsUpdate = async (updatedResults) => {
    setResults(updatedResults);
    if (activeSession) {
      const toSave = updatedResults.map(({ debugImageUrl, ...rest }) => rest);
      await saveResults(toSave);
    }
  };

  const handleResultsClear = async () => {
    setResults([]);
    if (activeSession) {
      await deleteSessionResults(activeSession.id);
    }
    clearDebugImages().catch(() => {});
  };

  const handleResetAll = async () => {
    setConfig(DEFAULT_CONFIG);
    setResults([]);
    setConfigSaved(false);
    if (activeSession) {
      await deleteSessionResults(activeSession.id);
      const updated = { ...activeSession, config: DEFAULT_CONFIG, updatedAt: Date.now() };
      await saveSession(updated);
      setActiveSession(updated);
    }
    clearDebugImages().catch(() => {});
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

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

        {!activeSession ? (
          <SessionList
            sessions={sessions}
            onSelect={loadSession}
            onCreate={handleCreateSession}
            onDelete={handleDeleteSession}
          />
        ) : (
          <>
            <SessionHeader session={activeSession} onBack={handleBackToList} />
            <Navigation
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              configSaved={configSaved}
              hasResults={results.length > 0}
            />
            <div className="mt-8">
              {renderPage()}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
