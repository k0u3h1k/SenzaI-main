// ========================================
// Favicon helper
// ========================================
const FAVICON_PROBE_TIMEOUT_MS = 4000;
const FAVICON_CACHE_KEY = 'favicon-resolved-v1';
const FAVICON_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const FAVICON_MAX_CONCURRENT = 2;

const _faviconMemCache = {};
let _faviconPersistTimer = null;
let _liveResultsGeneration = 0;
let _activeFaviconProbes = 0;
const _faviconProbeQueue = [];

(function _hydrateFaviconCache() {
  try {
    const raw = localStorage.getItem(FAVICON_CACHE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    const now = Date.now();
    for (const [key, entry] of Object.entries(parsed)) {
      if (entry && typeof entry === 'object' && now - entry.ts < FAVICON_CACHE_TTL_MS) {
        _faviconMemCache[key] = entry.src;
      }
    }
  } catch {}
})();

function _persistFaviconCache() {
  if (_faviconPersistTimer) clearTimeout(_faviconPersistTimer);
  _faviconPersistTimer = setTimeout(() => {
    _faviconPersistTimer = null;
    try {
      const now = Date.now();
      const out = {};
      for (const [key, src] of Object.entries(_faviconMemCache)) {
        out[key] = { src, ts: now };
      }
      localStorage.setItem(FAVICON_CACHE_KEY, JSON.stringify(out));
    } catch {}
  }, 800);
}

function _rootDomain(hostname) {
  const parts = hostname.split('.');
  return parts.length > 2 ? parts.slice(-2).join('.') : hostname;
}

function _buildSources(hostname) {
  const root  = _rootDomain(hostname);
  const isSub = root !== hostname;

  const tier1 = [
    [`https://icons.duckduckgo.com/ip3/${hostname}.ico`,   16],
    [`https://favicon.im/${hostname}?larger=true`,          16],
    [`https://icon.horse/icon/${hostname}`,                 16],
    [`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`, 16],
  ];

  if (isSub) {
    tier1.push(
      [`https://icons.duckduckgo.com/ip3/${root}.ico`,   16],
      [`https://favicon.im/${root}?larger=true`,          16],
      [`https://icon.horse/icon/${root}`,                 16],
      [`https://www.google.com/s2/favicons?domain=${root}&sz=32`, 16],
    );
  }

  const tier2 = [
    [`https://${hostname}/apple-touch-icon.png`, 20],
    [`https://${hostname}/favicon.ico`,          20],
  ];
  if (isSub) {
    tier2.push(
      [`https://${root}/apple-touch-icon.png`, 20],
      [`https://${root}/favicon.ico`,          20],
    );
  }

  const tier3 = [
    [`https://geticon.io/img?url=${hostname}&size=128`, 16],
    [`https://api.faviconkit.com/${hostname}/256`,       16],
  ];

  return { tier1, tier2, tier3 };
}

function _probeIcon(src, minSize) {
  return new Promise((resolve) => {
    const img = new Image();
    let settled = false;
    const finish = (w) => {
      if (settled) return;
      settled = true;
      img.onload = null;
      img.onerror = null;
      img.src = '';
      resolve(w);
    };
    const timer = setTimeout(() => finish(0), FAVICON_PROBE_TIMEOUT_MS);
    img.onload = () => {
      clearTimeout(timer);
      finish(img.naturalWidth >= minSize ? img.naturalWidth : 0);
    };
    img.onerror = () => {
      clearTimeout(timer);
      finish(0);
    };
    img.src = src;
  });
}

function _runFaviconProbe(task) {
  _activeFaviconProbes++;
  task().finally(() => {
    _activeFaviconProbes--;
    if (_faviconProbeQueue.length > 0) {
      _runFaviconProbe(_faviconProbeQueue.shift());
    }
  });
}

function _enqueueFaviconProbe(task) {
  if (_activeFaviconProbes < FAVICON_MAX_CONCURRENT) {
    _runFaviconProbe(task);
  } else {
    _faviconProbeQueue.push(task);
  }
}

async function _raceTier(sources) {
  if (!sources.length) return null;
  return new Promise((resolve) => {
    let remaining = sources.length;
    let won = false;
    for (const [src, minSize] of sources) {
      _probeIcon(src, minSize).then((w) => {
        remaining--;
        if (w > 0 && !won) { won = true; resolve(src); }
        else if (remaining === 0 && !won) { resolve(null); }
      });
    }
  });
}

async function _probeSequential(sources) {
  for (const [src, minSize] of sources) {
    const w = await _probeIcon(src, minSize);
    if (w > 0) return src;
  }
  return null;
}

async function _loadFavicon(displayImg, domain, sources, generation) {
  if (generation !== _liveResultsGeneration) return;

  if (domain in _faviconMemCache) {
    const cached = _faviconMemCache[domain];
    if (cached) {
      displayImg.src = cached;
      displayImg.style.display = 'block';
    } else {
      displayImg.style.display = 'none';
    }
    return;
  }

  if (!sources) {
    displayImg.style.display = 'none';
    return;
  }

  return new Promise((resolve) => {
    _enqueueFaviconProbe(async () => {
      if (generation !== _liveResultsGeneration) {
        resolve();
        return;
      }

      let winner = await _raceTier(sources.tier1);
      if (generation !== _liveResultsGeneration) {
        resolve();
        return;
      }
      if (!winner) winner = await _probeSequential(sources.tier2);
      if (generation !== _liveResultsGeneration) {
        resolve();
        return;
      }
      if (!winner) winner = await _probeSequential(sources.tier3);
      if (generation !== _liveResultsGeneration) {
        resolve();
        return;
      }

      _faviconMemCache[domain] = winner;
      _persistFaviconCache();

      if (winner) {
        displayImg.src = winner;
        displayImg.style.display = 'block';
      } else {
        displayImg.style.display = 'none';
      }
      resolve();
    });
  });
}

function getFilteredBookmarks(rawValue) {
  const value = (rawValue || '').trim().toLowerCase();
  if (!value) return [];
  
  const upfront = getStoredBookmarks();
  const shelf = getStoredShelfBookmarks();
  const all = [
    ...upfront.map(bm => ({ ...bm, type: 'link' })),
    ...shelf.map(bm => ({ ...bm, type: 'shelf' }))
  ];

  // Prioritize startsWith, then includes
  const startsWith = all.filter(bm => bm.title.toLowerCase().startsWith(value));
  const includes = all.filter(bm => !bm.title.toLowerCase().startsWith(value) && bm.title.toLowerCase().includes(value));
  
  return [...startsWith, ...includes];
}

// ---- Live Results Rendering ----
function getNativeFaviconUrl(url) {
  return typeof SenzaIBrowser !== 'undefined'
    ? SenzaIBrowser.getNativeFaviconUrl(url)
    : null;
}

const renderLiveResults = debounce(function renderLiveResultsImpl(rawValue) {
  const container = document.getElementById('live-results');
  if (!container) return;

  if (typeof getStoredEnableSuggestionDropdown === 'function' && !getStoredEnableSuggestionDropdown()) {
    container.classList.remove('visible');
    container.style.height = '0px';
    return;
  }

  const filtered = getFilteredBookmarks(rawValue).slice(0, 5);
  const generation = ++_liveResultsGeneration;

  if (filtered.length === 0) {
    container.classList.remove('visible');
    container.style.height = '0px';
    container.replaceChildren();
    return;
  }

  // Get current height before changing contents
  const isVisible = container.classList.contains('visible');
  const prevHeight = isVisible ? container.getBoundingClientRect().height : 0;

  container.replaceChildren();
  filtered.forEach((bm) => {
    let domain = '';
    try { domain = new URL(bm.href).hostname; } catch {}

    const link = document.createElement('a');
    link.href = bm.href;
    link.className = 'live-result-item';

    const img = document.createElement('img');
    img.className = 'result-favicon';
    img.alt = '';
    img.width = 16;
    img.height = 16;
    img.style.cssText = 'width:16px;height:16px;margin-right:10px;border-radius:4px;object-fit:contain;flex-shrink:0;display:none;';

    const typeSpan = document.createElement('span');
    typeSpan.className = 'result-type';
    typeSpan.textContent = bm.type;

    const titleSpan = document.createElement('span');
    titleSpan.className = 'result-title';
    titleSpan.textContent = bm.title;

    const domainSpan = document.createElement('span');
    domainSpan.className = 'result-domain';
    domainSpan.textContent = domain;

    link.append(img, typeSpan, titleSpan, domainSpan);
    container.appendChild(link);

    const nativeUrl = getNativeFaviconUrl(bm.href);
    if (nativeUrl) {
      img.src = nativeUrl;
      img.style.display = 'block';
    } else if (domain) {
      _loadFavicon(img, domain, _buildSources(domain), generation);
    }
  });
  
  container.classList.add('visible');

  // Trigger smooth height shift
  requestAnimationFrame(() => {
    // Reset to auto to measure new content height accurately
    container.style.height = 'auto';
    const targetHeight = container.scrollHeight;
    
    // Temporarily apply previous height and trigger browser layout reflow
    container.style.height = `${prevHeight}px`;
    container.offsetHeight; // Force layout recalculation
    
    // Apply target height so the transition plays smoothly
    container.style.height = `${targetHeight}px`;
  });
}, 120);