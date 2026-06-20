// ========================================
// Favicon helper
// ========================================
const FAVICON_PROBE_TIMEOUT_MS = 6000;
const FAVICON_CACHE_KEY = 'favicon-resolved-v1';
const FAVICON_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const _faviconMemCache = {};

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
  try {
    const now = Date.now();
    const out = {};
    for (const [key, src] of Object.entries(_faviconMemCache)) {
      out[key] = { src, ts: now };
    }
    localStorage.setItem(FAVICON_CACHE_KEY, JSON.stringify(out));
  } catch {}
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
    const finish = (w) => { if (!settled) { settled = true; resolve(w); } };
    const timer = setTimeout(() => finish(0), FAVICON_PROBE_TIMEOUT_MS);
    img.onload  = () => { clearTimeout(timer); finish(img.naturalWidth >= minSize ? img.naturalWidth : 0); };
    img.onerror = () => { clearTimeout(timer); finish(0); };
    img.src = src;
  });
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

async function _loadFavicon(displayImg, domain, sources) {
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

  if (!sources) { displayImg.style.display = 'none'; return; }

  let winner = await _raceTier(sources.tier1);
  if (!winner) winner = await _probeSequential(sources.tier2);
  if (!winner) winner = await _probeSequential(sources.tier3);

  _faviconMemCache[domain] = winner;
  _persistFaviconCache();

  if (winner) {
    displayImg.src = winner;
    displayImg.style.display = 'block';
  } else {
    displayImg.style.display = 'none';
  }
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
  try {
    const u = new URL(url);
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
      // Chrome extension native favicon utility
      return `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=${encodeURIComponent(u.origin)}&size=32`;
    }
  } catch (e) {}
  return null;
}

function renderLiveResults(rawValue) {
  const container = document.getElementById('live-results');
  if (!container) return;

  if (typeof getStoredEnableSuggestionDropdown === 'function' && !getStoredEnableSuggestionDropdown()) {
    container.classList.remove('visible');
    container.style.height = '0px';
    return;
  }

  const filtered = getFilteredBookmarks(rawValue).slice(0, 5);

  if (filtered.length === 0) {
    container.classList.remove('visible');
    container.style.height = '0px';
    return;
  }

  // Get current height before changing contents
  const isVisible = container.classList.contains('visible');
  const prevHeight = isVisible ? container.getBoundingClientRect().height : 0;

  container.innerHTML = filtered.map((bm, idx) => {
    let domain = '';
    try { domain = new URL(bm.href).hostname; } catch {}
    return `
      <a href="${bm.href}" class="live-result-item">
        <img class="result-favicon" id="favicon-${idx}" src="" alt="" style="width: 16px; height: 16px; margin-right: 10px; border-radius: 4px; object-fit: contain; flex-shrink: 0; display: none;" />
        <span class="result-type">${bm.type}</span>
        <span class="result-title">${escapeHTML(bm.title)}</span>
        <span class="result-domain">${escapeHTML(domain)}</span>
      </a>
    `;
  }).join('');

  // Hydrate favicons asynchronously
  filtered.forEach((bm, idx) => {
    const img = document.getElementById(`favicon-${idx}`);
    if (!img) return;

    let domain = '';
    try { domain = new URL(bm.href).hostname; } catch {}

    const nativeUrl = getNativeFaviconUrl(bm.href);
    if (nativeUrl) {
      img.src = nativeUrl;
      img.style.display = 'block';
    } else {
      const sources = _buildSources(domain);
      _loadFavicon(img, domain, sources);
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
}