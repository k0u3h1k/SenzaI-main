/**
 * SenzaI - IndexedDB Storage Helper
 * Used to store larger background files (images & video clips) locally
 * without hitting the ~5MB limit of localStorage.
 */

const DB_NAME = 'SenzaIBackgroundsDB';
const DB_VERSION = 1;
const STORE_NAME = 'backgrounds';

/**
 * Opens a connection to the IndexedDB database.
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    
    request.onsuccess = (event) => {
      resolve(event.target.result);
    };
    
    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

/**
 * Stores a background file (Blob) in the database.
 * @param {Blob} blob - The image or video file blob
 * @returns {Promise<void>}
 */
async function storeBackgroundBlob(blob) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(blob, 'custom-bg');
    
    request.onsuccess = () => {
      resolve();
    };
    
    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Retrieves the stored background file (Blob).
 * @returns {Promise<Blob|null>}
 */
async function getBackgroundBlob() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get('custom-bg');
    
    request.onsuccess = (event) => {
      resolve(event.target.result || null);
    };
    
    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Deletes the stored background file.
 * @returns {Promise<void>}
 */
async function clearBackgroundBlob() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete('custom-bg');
    
    request.onsuccess = () => {
      resolve();
    };
    
    request.onerror = () => {
      reject(request.error);
    };
  });
}
