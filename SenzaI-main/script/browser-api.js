/**
 * SenzaI - Cross-platform Browser Extension API shim
 * Unifies Chrome (MV3), Firefox (WebExtensions), Opera, and Edge APIs.
 */
const SenzaIBrowser = (function () {
  const api =
    typeof browser !== 'undefined' && browser.runtime
      ? browser
      : typeof chrome !== 'undefined' && chrome.runtime
        ? chrome
        : null;

  function getURL(path) {
    return api?.runtime?.getURL ? api.runtime.getURL(path) : path;
  }

  function asPromise(maybePromise, callbackStyle) {
    if (maybePromise && typeof maybePromise.then === 'function') return maybePromise;
    return new Promise((resolve, reject) => {
      try {
        callbackStyle((result) => {
          const err = api?.runtime?.lastError || chrome?.runtime?.lastError;
          if (err) reject(err);
          else resolve(result);
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  async function getCurrentTab() {
    if (!api?.tabs) return null;
    try {
      return await asPromise(api.tabs.getCurrent(), (cb) => api.tabs.getCurrent(cb));
    } catch {
      return null;
    }
  }

  async function openNewTab(url) {
    if (api?.tabs?.create) {
      try {
        await asPromise(api.tabs.create({ url }), (cb) => api.tabs.create({ url }, cb));
        return;
      } catch {
        /* fall through */
      }
    }
    window.open(url, '_blank');
  }

  async function closeCurrentTab() {
    if (!api?.tabs) {
      window.close();
      return;
    }
    try {
      const tab = await getCurrentTab();
      if (tab?.id != null) {
        await asPromise(api.tabs.remove(tab.id), (cb) => api.tabs.remove(tab.id, cb));
      } else {
        window.close();
      }
    } catch {
      window.close();
    }
  }

  function getNativeFaviconUrl(pageUrl) {
    if (!api?.runtime?.getURL) return null;
    try {
      const origin = new URL(pageUrl).origin;
      const runtimeId = api.runtime.id;
      // Chrome / Edge / Opera MV3 favicon API
      if (typeof chrome !== 'undefined') {
        return `chrome-extension://${runtimeId}/_favicon/?pageUrl=${encodeURIComponent(origin)}&size=32`;
      }
      // Firefox exposes favicons via moz-extension protocol when permitted
      return `moz-extension://${runtimeId}/_favicon/?pageUrl=${encodeURIComponent(origin)}&size=32`;
    } catch {
      return null;
    }
  }

  return {
    api,
    isExtension: !!api,
    getURL,
    openNewTab,
    closeCurrentTab,
    getNativeFaviconUrl,
  };
})();
