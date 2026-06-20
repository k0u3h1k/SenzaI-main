/**
 * SenzaI - Extension Storage Bridge
 * Mirrors settings between localStorage and browser.storage.local (Chrome, Firefox, Edge, Opera).
 */
(function () {
  const storageApi =
    typeof browser !== 'undefined' && browser.storage?.local
      ? browser.storage.local
      : typeof chrome !== 'undefined' && chrome.storage?.local
        ? chrome.storage.local
        : null;

  if (!storageApi) {
    window.extStorageReady = Promise.resolve();
    return;
  }

  const LOCAL_PREFIX = 'senzai-';
  const SYNC_KEYS = new Set([
    'username', 'theme', 'searchEngine', 'bookmarks', 'syntaxColors',
    'fontFamily', 'fontUrl', 'keyCloseTab', 'keyNewTab', 'barRounding',
    'enableAutocompleteHint', 'enableSuggestionDropdown', 'enableDropdownNavigation',
    'enableStatusLine', 'enableInlineCalculator', 'enableAutofocus',
    'customSearchEngines', 'barOpacity', 'barTextOpacity', 'barTextCenter',
    'barBlur', 'barInvisible', 'focusIndicatorMode', 'barPositionMode',
    'barPositionPreset', 'barCustomX', 'barCustomY', 'barSnapMode',
    'cursorBlock', 'time24h', 'statusShowDay', 'statusShowMonth', 'statusShowDate',
    'glossyMode', 'customAliases', 'backgroundType', 'backgroundUrl',
    'statusLineColor', 'statusLineOpacity', 'terminal-history-v1',
  ]);

  function asPromise(result, callbackStyle) {
    if (result && typeof result.then === 'function') return result;
    return new Promise((resolve, reject) => {
      try {
        callbackStyle((data) => {
          const err = chrome?.runtime?.lastError;
          if (err) reject(err);
          else resolve(data);
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  function serializeForStorage(key, value) {
    if (value === null || value === undefined) return null;
    try {
      JSON.parse(value);
      return value;
    } catch {
      return value;
    }
  }

  async function hydrateFromExtensionStorage() {
    const data = await asPromise(storageApi.get(null), (cb) => storageApi.get(null, cb));
    window._isSyncing = true;
    try {
      for (const [key, value] of Object.entries(data || {})) {
        if (!key.startsWith(LOCAL_PREFIX)) continue;
        const localKey = key.slice(LOCAL_PREFIX.length);
        if (!SYNC_KEYS.has(localKey)) continue;
        localStorage.setItem(localKey, typeof value === 'string' ? value : JSON.stringify(value));
      }
    } finally {
      window._isSyncing = false;
    }
  }

  let persistTimer = null;
  function schedulePersistToExtensionStorage() {
    if (persistTimer) clearTimeout(persistTimer);
    persistTimer = setTimeout(persistToExtensionStorage, 400);
  }

  async function persistToExtensionStorage() {
    const payload = {};
    for (const key of SYNC_KEYS) {
      const val = localStorage.getItem(key);
      if (val !== null) payload[LOCAL_PREFIX + key] = serializeForStorage(key, val);
    }
    window._isSyncing = true;
    try {
      await asPromise(storageApi.set(payload), (cb) => storageApi.set(payload, cb));
    } catch (e) {
      console.warn('[SenzaI] Extension storage sync failed:', e);
    } finally {
      window._isSyncing = false;
    }
  }

  const originalSetItem = localStorage.setItem.bind(localStorage);
  const originalRemoveItem = localStorage.removeItem.bind(localStorage);
  const originalClear = localStorage.clear.bind(localStorage);

  localStorage.setItem = function (key, value) {
    originalSetItem(key, value);
    if (!window._isSyncing && SYNC_KEYS.has(key)) schedulePersistToExtensionStorage();
  };

  localStorage.removeItem = function (key) {
    originalRemoveItem(key);
    if (!window._isSyncing && SYNC_KEYS.has(key)) {
      asPromise(storageApi.remove(LOCAL_PREFIX + key), (cb) =>
        storageApi.remove(LOCAL_PREFIX + key, cb)
      ).catch(() => {});
    }
  };

  localStorage.clear = function () {
    originalClear();
    if (!window._isSyncing) {
      const keys = [...SYNC_KEYS].map((k) => LOCAL_PREFIX + k);
      asPromise(storageApi.remove(keys), (cb) => storageApi.remove(keys, cb)).catch(() => {});
    }
  };

  window.extStorageReady = hydrateFromExtensionStorage();
})();
