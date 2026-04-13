// One-time migration from localStorage to IndexedDB sessions
import { saveSession } from './indexed-db-sessions';
import { saveResult } from './indexed-db-results';

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

/**
 * Migrate existing localStorage data to IndexedDB.
 * Creates an "Imported Session" with existing config + results.
 * Removes localStorage keys after successful migration.
 * @returns {Promise<object|null>} - migrated session, or null if nothing to migrate
 */
export async function migrateFromLocalStorage() {
  if (typeof window === 'undefined') return null;
  if (localStorage.getItem('chambai_migrated')) return null;

  const configStr = localStorage.getItem('testConfig');
  const resultsStr = localStorage.getItem('studentResults');
  if (!configStr && !resultsStr) {
    localStorage.setItem('chambai_migrated', '1');
    return null;
  }

  const sessionId = `session_migrated_${Date.now()}`;
  const config = configStr ? JSON.parse(configStr) : DEFAULT_CONFIG;

  const session = {
    id: sessionId,
    name: 'Phiên nhập khẩu',
    date: new Date().toISOString().split('T')[0],
    config,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await saveSession(session);

  if (resultsStr) {
    const results = JSON.parse(resultsStr);
    for (const r of results) {
      await saveResult({ ...r, sessionId });
    }
  }

  localStorage.removeItem('testConfig');
  localStorage.removeItem('studentResults');
  localStorage.setItem('chambai_migrated', '1');

  return session;
}
