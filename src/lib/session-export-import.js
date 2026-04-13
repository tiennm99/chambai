// Export and import exam sessions as .chambai.json files
import { getSession, saveSession } from './indexed-db-sessions';
import { getSessionResults, saveResult } from './indexed-db-results';

/**
 * Export a session + results as a downloadable JSON file.
 * @param {string} sessionId
 */
export async function exportSession(sessionId) {
  const session = await getSession(sessionId);
  if (!session) throw new Error('Phiên không tồn tại');

  const results = await getSessionResults(sessionId);
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    session,
    results: results.map(({ debugImageUrl, ...rest }) => rest),
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${session.name.replace(/\s+/g, '_')}.chambai.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}

/**
 * Import a session from a .chambai.json file.
 * Generates new IDs to avoid collisions.
 * @param {File} file
 * @returns {Promise<object>} - imported session
 */
export async function importSession(file) {
  const text = await file.text();
  const data = JSON.parse(text);

  if (data.version !== 1) throw new Error('Phiên bản file không được hỗ trợ');
  if (!data.session) throw new Error('File không hợp lệ: thiếu dữ liệu phiên');

  const newSessionId = `session_imported_${Date.now()}`;
  const session = {
    ...data.session,
    id: newSessionId,
    name: `${data.session.name} (nhập)`,
    importedAt: Date.now(),
    updatedAt: Date.now(),
  };

  await saveSession(session);

  if (data.results) {
    for (const r of data.results) {
      await saveResult({
        ...r,
        id: `${r.id}_imp_${Date.now()}`,
        sessionId: newSessionId,
      });
    }
  }

  return session;
}
