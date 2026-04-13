// IndexedDB wrapper for chambai app data
// Stores: debugImages (v1), sessions + results (v2)

const DB_NAME = 'chambai';
const DB_VERSION = 2;

/**
 * Open (or create) the IndexedDB database with versioned schema.
 * @returns {Promise<IDBDatabase>}
 */
export function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = request.result;
      const oldVersion = event.oldVersion;

      if (oldVersion < 1) {
        db.createObjectStore('debugImages', { keyPath: 'id' });
      }
      if (oldVersion < 2) {
        const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' });
        sessionStore.createIndex('date', 'date');
        const resultStore = db.createObjectStore('results', { keyPath: 'id' });
        resultStore.createIndex('sessionId', 'sessionId');
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save a debug image data URL for a student result.
 * @param {string} id - Student result ID
 * @param {string} dataUrl - Base64 data URL of the debug image
 * @returns {Promise<void>}
 */
export async function saveDebugImage(id, dataUrl) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put({ id, dataUrl });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Get a debug image data URL by student result ID.
 * @param {string} id - Student result ID
 * @returns {Promise<string|null>}
 */
export async function getDebugImage(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(id);
    request.onsuccess = () => resolve(request.result?.dataUrl ?? null);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Delete a debug image by student result ID.
 * @param {string} id - Student result ID
 * @returns {Promise<void>}
 */
export async function deleteDebugImage(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Clear all debug images from the store.
 * @returns {Promise<void>}
 */
export async function clearDebugImages() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
