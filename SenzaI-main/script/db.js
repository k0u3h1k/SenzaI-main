/**
 * SenzaI - IndexedDB Storage Helper
 * Used to store larger background files (images & video clips) locally
 * without hitting the ~5MB limit of localStorage.
 */

const DB_NAME = 'SenzaIBackgroundsDB';
const DB_VERSION = 1;
const STORE_NAME = 'backgrounds';

let _dbPromise = null;

/**
 * Opens a connection to the IndexedDB database (reuses a single connection).
 */
function openDB() {
  if (_dbPromise) return _dbPromise;

  _dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      db.onversionchange = () => {
        db.close();
        _dbPromise = null;
      };
      resolve(db);
    };

    request.onerror = (event) => {
      _dbPromise = null;
      reject(event.target.error);
    };
  });

  return _dbPromise;
}

function _runStore(mode, fn) {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, mode);
        const store = transaction.objectStore(STORE_NAME);
        const request = fn(store);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      })
  );
}

/**
 * Stores a background file (Blob) in the database.
 * @param {Blob} blob - The image or video file blob
 * @returns {Promise<void>}
 */
async function storeBackgroundBlob(blob) {
  await _runStore('readwrite', (store) => store.put(blob, 'custom-bg'));
}

/**
 * Retrieves the stored background file (Blob).
 * @returns {Promise<Blob|null>}
 */
async function getBackgroundBlob() {
  const result = await _runStore('readonly', (store) => store.get('custom-bg'));
  return result || null;
}

/**
 * Deletes the stored background file.
 * @returns {Promise<void>}
 */
async function clearBackgroundBlob() {
  await _runStore('readwrite', (store) => store.delete('custom-bg'));
}
