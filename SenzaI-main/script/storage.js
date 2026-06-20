/**
 * SenzaI - Storage Logic
 * Author: Abhidatta Benda
 * 
 * Handles reading and writing user preferences to localStorage.
 */


// Hook localStorage methods to broadcast changes to the shell wrapper
(function() {
  const shouldSyncLog = () => window.__SENZAI_SHELL_SYNC__ === true;
  const prevSetItem = localStorage.setItem.bind(localStorage);
  const prevRemoveItem = localStorage.removeItem.bind(localStorage);
  const prevClear = localStorage.clear.bind(localStorage);

  localStorage.setItem = function(key, value) {
    prevSetItem(key, value);
    if (!window._isSyncing && shouldSyncLog()) {
      console.log('[SenzalSyncLocalSetting] ' + JSON.stringify({ key, value }));
    }
  };

  localStorage.removeItem = function(key) {
    prevRemoveItem(key);
    if (!window._isSyncing && shouldSyncLog()) {
      console.log('[SenzalSyncLocalSettingRemove] ' + key);
    }
  };

  localStorage.clear = function() {
    prevClear();
    if (!window._isSyncing && shouldSyncLog()) {
      console.log('[SenzalSyncLocalSettingClear]');
    }
  };
})();

/* --- Default Configurations --- */

const DEFAULT_BOOKMARKS = [
  { href: "https://github.com", title: "GitHub" },
  { href: "https://youtube.com", title: "YouTube" },
  { href: "https://google.com", title: "Google" },
  { href: "https://reddit.com", title: "Reddit" },
  { href: "https://twitter.com", title: "Twitter" }
];

const DEFAULT_USERNAME = "user";
const DEFAULT_SEARCH_ENGINE = "google";
const DEFAULT_FONT_FAMILY = "";
const DEFAULT_FONT_URL = "";
const DEFAULT_KEY_CLOSE_TAB = "x";
const DEFAULT_KEY_NEW_TAB = "t";
const DEFAULT_BAR_ROUNDING = "32";

const DEFAULT_SYNTAX_COLORS = {
  cmd:     '#667eea',
  theme:   '#f6ad55',
  search:  '#f39c12',
  version: '#00b894',
  url:     '#5fafaf',
  unknown: '#e74c3c',
};

/* --- Core Accessors --- */

/**
 * Returns the array of quicklinks. Automatically migrates old "shelf" links if found.
 */
function getStoredBookmarks() {
  try {
    const upfront = JSON.parse(localStorage.getItem('bookmarks')) || DEFAULT_BOOKMARKS;
    const shelf = JSON.parse(localStorage.getItem('shelfBookmarks')) || [];
    // Consolidate into one list if shelf exists
    if (shelf.length > 0) {
      const all = [...upfront, ...shelf];
      localStorage.setItem('bookmarks', JSON.stringify(all));
      localStorage.removeItem('shelfBookmarks');
      return all;
    }
    return upfront;
  } catch { return DEFAULT_BOOKMARKS; }
}
function saveBookmarks(b) { 
  localStorage.setItem('bookmarks', JSON.stringify(b)); 
  if (window.__SENZAI_SHELL_SYNC__ === true) {
    console.log('[SenzalSyncBookmarks] ' + JSON.stringify(b));
  }
}

// Deprecated: legacy support for the old two-tier system
function getStoredShelfBookmarks() { return []; }
function saveShelfBookmarks(b) {}

function getStoredUsername() { return localStorage.getItem('username') || DEFAULT_USERNAME; }
function saveUsername(u) { localStorage.setItem('username', u); }

function getStoredTheme() { return localStorage.getItem('theme') || 'dark'; }
function saveTheme(t) { localStorage.setItem('theme', t); }

function getStoredSearchEngine() { return localStorage.getItem('searchEngine') || DEFAULT_SEARCH_ENGINE; }
function saveSearchEngine(e) { localStorage.setItem('searchEngine', e); }

function getStoredFontFamily() { return localStorage.getItem('fontFamily') || DEFAULT_FONT_FAMILY; }
function saveFontFamily(f) { localStorage.setItem('fontFamily', f); }

function getStoredFontUrl() { return localStorage.getItem('fontUrl') || DEFAULT_FONT_URL; }
function saveFontUrl(u) { localStorage.setItem('fontUrl', u); }

function getStoredKeyCloseTab() { return localStorage.getItem('keyCloseTab') || DEFAULT_KEY_CLOSE_TAB; }
function saveKeyCloseTab(k) { localStorage.setItem('keyCloseTab', k); }

function getStoredKeyNewTab() { return localStorage.getItem('keyNewTab') || DEFAULT_KEY_NEW_TAB; }
function saveKeyNewTab(k) { localStorage.setItem('keyNewTab', k); }

function getStoredBarRounding() { return localStorage.getItem('barRounding') || DEFAULT_BAR_ROUNDING; }
function saveBarRounding(r) { localStorage.setItem('barRounding', r); }


function getStoredEnableAutocompleteHint() { return localStorage.getItem('enableAutocompleteHint') !== 'false'; }
function saveEnableAutocompleteHint(enabled) { localStorage.setItem('enableAutocompleteHint', String(enabled)); }

function getStoredEnableSuggestionDropdown() { return localStorage.getItem('enableSuggestionDropdown') !== 'false'; }
function saveEnableSuggestionDropdown(enabled) { localStorage.setItem('enableSuggestionDropdown', String(enabled)); }

function getStoredEnableDropdownNavigation() { return localStorage.getItem('enableDropdownNavigation') !== 'false'; }
function saveEnableDropdownNavigation(enabled) { localStorage.setItem('enableDropdownNavigation', String(enabled)); }

function getStoredEnableStatusLine() { return localStorage.getItem('enableStatusLine') !== 'false'; }
function saveEnableStatusLine(enabled) { localStorage.setItem('enableStatusLine', String(enabled)); }

function getStoredEnableInlineCalculator() { return localStorage.getItem('enableInlineCalculator') !== 'false'; }
function saveEnableInlineCalculator(enabled) { localStorage.setItem('enableInlineCalculator', String(enabled)); }

function getStoredEnableAutofocus() { return localStorage.getItem('enableAutofocus') === 'true'; }
function saveEnableAutofocus(enabled) { localStorage.setItem('enableAutofocus', String(enabled)); }


/* --- Bar Material & Position Styling Settings --- */
function getStoredBarOpacity() { return localStorage.getItem('barOpacity') || "90"; }
function saveBarOpacity(val) { localStorage.setItem('barOpacity', String(val)); }

function getStoredBarBlur() { return localStorage.getItem('barBlur') || "18"; }
function saveBarBlur(val) { localStorage.setItem('barBlur', String(val)); }

function getStoredBarInvisible() { return localStorage.getItem('barInvisible') === 'true'; }
function saveBarInvisible(val) { localStorage.setItem('barInvisible', String(val)); }

function getStoredBarTextOpacity() { return localStorage.getItem('barTextOpacity') || "100"; }
function saveBarTextOpacity(val) { localStorage.setItem('barTextOpacity', String(val)); }

function getStoredBarTextCenter() { return localStorage.getItem('barTextCenter') === 'true'; }
function saveBarTextCenter(val) { localStorage.setItem('barTextCenter', String(val)); }

function getStoredFocusIndicatorMode() { return localStorage.getItem('focusIndicatorMode') || "off"; }
function saveFocusIndicatorMode(mode) { localStorage.setItem('focusIndicatorMode', mode); }

function getStoredBarPositionMode() { return localStorage.getItem('barPositionMode') || "preset"; }
function saveBarPositionMode(mode) { localStorage.setItem('barPositionMode', mode); }

function getStoredBarPositionPreset() { return localStorage.getItem('barPositionPreset') || "center"; }
function saveBarPositionPreset(preset) { localStorage.setItem('barPositionPreset', preset); }

function getStoredBarCustomX() { return localStorage.getItem('barCustomX') || "50"; }
function saveBarCustomX(x) { localStorage.setItem('barCustomX', String(x)); }

function getStoredBarCustomY() { return localStorage.getItem('barCustomY') || "50"; }
function saveBarCustomY(y) { localStorage.setItem('barCustomY', String(y)); }

function getStoredBarSnapMode() { return localStorage.getItem('barSnapMode') || "free"; }
function saveBarSnapMode(mode) { localStorage.setItem('barSnapMode', mode); }


/**
 * Returns the object containing syntax highlighting hex codes.
 */
function getStoredSyntaxColors() {
  try { return { ...DEFAULT_SYNTAX_COLORS, ...JSON.parse(localStorage.getItem('syntaxColors')) }; } catch { return DEFAULT_SYNTAX_COLORS; }
}
function saveSyntaxColors(c) { localStorage.setItem('syntaxColors', JSON.stringify(c)); }

/**
 * Injects syntax colors into CSS variables on the root element.
 */
function applySyntaxColors(colors) {
  const root = document.documentElement;
  for (const [k, v] of Object.entries(colors)) {
    root.style.setProperty(`--syn-${k}`, v);
  }
}

function getStoredCustomSearchEngines() {
  try {
    const list = JSON.parse(localStorage.getItem('customSearchEngines'));
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}
function saveCustomSearchEngines(engines) {
  localStorage.setItem('customSearchEngines', JSON.stringify(engines));
  if (typeof window.invalidateSearchPrefixCache === 'function') {
    window.invalidateSearchPrefixCache();
  }
}

function getStoredCursorBlock() { return localStorage.getItem('cursorBlock') === 'true'; }
function saveCursorBlock(val) { localStorage.setItem('cursorBlock', String(val)); }

function getStoredTime24h() { return localStorage.getItem('time24h') === 'true'; }
function saveTime24h(val) { localStorage.setItem('time24h', String(val)); }

function getStoredStatusShowDay() { return localStorage.getItem('statusShowDay') !== 'false'; }
function saveStatusShowDay(val) { localStorage.setItem('statusShowDay', String(val)); }

function getStoredStatusShowMonth() { return localStorage.getItem('statusShowMonth') !== 'false'; }
function saveStatusShowMonth(val) { localStorage.setItem('statusShowMonth', String(val)); }

function getStoredStatusShowDate() { return localStorage.getItem('statusShowDate') !== 'false'; }
function saveStatusShowDate(val) { localStorage.setItem('statusShowDate', String(val)); }

/* --- Glossy Mode, Aliases & Background Settings --- */
function getStoredGlossyMode() { return localStorage.getItem('glossyMode') === 'true'; }
function saveGlossyMode(enabled) { localStorage.setItem('glossyMode', String(enabled)); }

function getStoredCustomAliases() {
  try {
    const list = JSON.parse(localStorage.getItem('customAliases'));
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}
function saveCustomAliases(aliases) {
  localStorage.setItem('customAliases', JSON.stringify(aliases));
}

function getStoredBackgroundType() { return localStorage.getItem('backgroundType') || 'none'; }
function saveBackgroundType(type) { localStorage.setItem('backgroundType', type); }

function getStoredBackgroundUrl() { return localStorage.getItem('backgroundUrl') || ''; }
function saveBackgroundUrl(url) { localStorage.setItem('backgroundUrl', url); }

function getStoredStatusLineColor() { return localStorage.getItem('statusLineColor') || ''; }
function saveStatusLineColor(val) { localStorage.setItem('statusLineColor', String(val)); }

function getStoredStatusLineOpacity() { return localStorage.getItem('statusLineOpacity') || '55'; }
function saveStatusLineOpacity(val) { localStorage.setItem('statusLineOpacity', String(val)); }


