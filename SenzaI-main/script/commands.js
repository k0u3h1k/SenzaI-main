/**
 * SenzaI - Command Routing
 * Author: Abhidatta Benda
 * 
 * Handles the logic for special commands (:config, :help, etc.), 
 * theme switching, search prefixes (yt:, gh:), and general navigation.
 */

/**
 * Main router for all terminal input submissions.
 */
function handleSpecialCommands(rawValue) {
  const value = rawValue.trim();
  const normalized = value.toLowerCase();

  // Reference the input to clear it after command execution
  const input = document.getElementById('terminal-input');
  const clear = () => {
    input.value = '';
    if (typeof updateSyntaxHighlight === 'function') updateSyntaxHighlight('');
  };

  // --- 1. Modal & System Commands ---
  if (normalized === ":help") { openHelp(); clear(); return; }
  if (normalized === ":config") { openConfig(); clear(); return; }
  if (normalized === ":customize") { openCustomizeModal(); clear(); return; }
  if (normalized === ":bookmarks" || normalized === ":bm") { openBookmarksModal(); clear(); return; }
  if (normalized === ":aliases" || normalized === ":al") { openAliasesModal(); clear(); return; }
  if (normalized === ":history") { openHistory(); clear(); return; }
  if (normalized === ":version" || normalized === ":ver") { 
    showAlert(`SenzaI v${APP_VERSION}\nBy: ${APP_AUTHOR}`, { title: 'Version' });
    clear(); 
    return; 
  }
  if (normalized === ":reset") { handleResetCommand(); clear(); return; }

  // --- 2. Theme Commands (:dark, :dracula, etc.) ---
  const theme = normalized.startsWith(':') ? normalized.slice(1) : null;
  if (theme) {
    const themeAliases = {
      'ctp-frappe': 'catppuccin-frappe',
      'frappe':     'catppuccin-frappe',
      'ctp-macchiato': 'catppuccin-macchiato',
      'macchiato':     'catppuccin-macchiato',
      'ctp-mocha':  'catppuccin-mocha',
      'mocha':      'catppuccin-mocha',
      'tokyo':      'tokyo-night',
      'rp':         'rose-pine',
      'rp-moon':    'rose-pine-moon',
      'rp-dawn':    'rose-pine-dawn',
      'forest':     'everforest',
      'forest-light': 'everforest-light',
      'onedark':    'one-dark',
      'cyber':      'cyberpunk'
    };
    const target = themeAliases[theme] || theme;
    if (THEMES.includes(target)) {
      applyTheme(target);
      saveTheme(target);
      clear();
      if (typeof window.setTerminalDormant === 'function') {
        window.setTerminalDormant();
      }
      return;
    }
  }

  // --- 2.5. Custom Alias Redirection ---
  if (typeof getStoredCustomAliases === 'function') {
    const aliases = getStoredCustomAliases();
    const matched = aliases.find(a => a.alias && a.alias.trim().toLowerCase() === normalized);
    if (matched && matched.url) {
      const targetUrl = matched.url.startsWith('http') ? matched.url : `https://${matched.url}`;
      navigate(targetUrl);
      return;
    }
  }

  // --- 3. Exact Bookmark Title Match ---
  const matches = (typeof getFilteredBookmarks === 'function') ? getFilteredBookmarks(value) : [];
  if (matches.length > 0 && matches[0].title.toLowerCase() === normalized) {
    navigate(matches[0].href);
    return;
  }

  // --- 4. Built-in & Custom Search Prefixes ---
  const searchPrefixes = {
    'yt:': 'https://www.youtube.com/results?search_query=',
    'r:': 'https://google.com/search?q=site:reddit.com ',
    'ddg:': 'https://duckduckgo.com/?q=',
    'gh:': 'https://github.com/search?q=',
    'ma:': 'https://www.google.com/maps/search/'
  };

  if (typeof getStoredCustomSearchEngines === 'function') {
    const customList = getStoredCustomSearchEngines();
    customList.forEach(item => {
      if (item.prefix && item.url) {
        const pfx = item.prefix.endsWith(':') ? item.prefix.toLowerCase() : `${item.prefix.toLowerCase()}:`;
        searchPrefixes[pfx] = item.url;
      }
    });
  }

  for (const [prefix, url] of Object.entries(searchPrefixes)) {
    if (normalized.startsWith(prefix)) {
      const query = encodeURIComponent(value.slice(prefix.length).trim());
      navigate(url + query);
      return;
    }
  }

  // --- 5. Direct URL Detection (e.g., google.com) ---
  if (value.includes('.') && !value.includes(' ')) {
    navigate(value.startsWith('http') ? value : `https://${value}`);
  } 
  
  // --- 6. Fallback: Default Search Engine ---
  else {
    const engine = (typeof getStoredSearchEngine === 'function') ? getStoredSearchEngine() : 'google';
    const query = encodeURIComponent(value);
    const searchEngines = {
      google: 'https://google.com/search?q=',
      ddg: 'https://duckduckgo.com/?q=',
      bing: 'https://www.bing.com/search?q='
    };
    navigate((searchEngines[engine] || searchEngines.google) + query);
  }
}

/**
 * Navigates to a URL with a smooth fade-out and loading overlay.
 */
function navigate(url) {
  const overlay = document.getElementById('loading-overlay');
  document.body.classList.add('navigating');
  
  if (overlay) {
    overlay.classList.add('visible');
  }

  // Short delay to allow the exit animation to play before navigation
  setTimeout(() => {
    window.location.href = url;
  }, 50);
}

/**
 * Applies a theme CSS class to the document.
 */
function applyTheme(theme) {
  THEMES.forEach(t => {
    document.body.classList.remove(`${t}-mode`);
    document.documentElement.classList.remove(`${t}-mode`);
  });
  document.documentElement.classList.add(`${theme}-mode`);
  document.body.classList.add(`${theme}-mode`);
}

/**
 * Handles the :reset command with a confirmation dialog.
 */
async function handleResetCommand() {
  const confirmed = await showConfirm('Wipe all settings and bookmarks?', { title: 'Reset SenzaI' });
  if (confirmed) {
    localStorage.clear();
    location.reload();
  }
}
