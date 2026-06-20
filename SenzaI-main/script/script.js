/**
 * SenzaI - Main Entry Point
 * Author: Abhidatta Benda
 * 
 * This file handles the initial loading, theme management, 
 * activation lock (Space/Enter to wake), and global keyboard shortcuts.
 */

/* --- Theme Management --- */

/**
 * Loads the user's preferred theme from storage and applies it to the document.
 */
function loadTheme() {
  const theme = getStoredTheme();
  THEMES.forEach(t => {
    document.body.classList.remove(`${t}-mode`);
    document.documentElement.classList.remove(`${t}-mode`);
  });
  if (theme) {
    document.body.classList.add(`${theme}-mode`);
    document.documentElement.classList.add(`${theme}-mode`);
  }
  
  // Broadcast the theme and glossy mode configuration so the Electron wrapper matches
  const glossy = (typeof getStoredGlossyMode === 'function') ? getStoredGlossyMode() : false;
  console.log(`[SenzalTheme] ${theme} ${glossy}`);
}

/**
 * Injects custom user fonts via an @import rule if configured.
 */
function applyUserFont(family, url) {
  const styleEl = document.getElementById('user-font-style');
  if (!styleEl) return;

  if (!family && !url) {
    styleEl.innerHTML = '';
    return;
  }

  let css = '';
  if (url) css += `@import url('${url}');\n`;
  if (family) {
    css += `:root { 
      --font-family: '${family}', sans-serif !important; 
      --monospace-font-family: '${family}', monospace !important; 
    }`;
  }
  styleEl.innerHTML = css;
}

/**
 * Updates the CSS variable for search bar corner rounding.
 */
function applyBarRounding(val) {
  document.documentElement.style.setProperty('--bar-rounding', `${val}px`);
}



/* --- Global Activation & Key Handling --- */

/**
 * isActivated tracks whether the search bar is focused and listening.
 * In the dormant state (false), single-key shortcuts like 't' and 'x' are active.
 */
(function setupGlobalKeyHandlers() {
  let isActivated = false;
  const input = () => document.getElementById('terminal-input');
  
  const activate = () => {
    if (isActivated) return;
    isActivated = true;
    document.body.classList.add('is-active');
    const el = input();
    if (el) el.focus({ preventScroll: true });
    updateStatusLineVisibility();
  };

  const deactivate = () => {
    isActivated = false;
    document.body.classList.remove('is-active');
    const el = input();
    if (el) {
      el.value = '';
      if (typeof updateSyntaxHighlight === 'function') updateSyntaxHighlight('');
      el.blur();
    }
    updateStatusLineVisibility();
  };

  function updateStatusLineVisibility() {
    const statusEl = document.getElementById('status-line');
    if (!statusEl) return;
    
    const enabled = (typeof getStoredEnableStatusLine === 'function') ? getStoredEnableStatusLine() : true;
    
    if (enabled && !isActivated) {
      statusEl.classList.add('visible');
      updateStatusText();
    } else {
      statusEl.classList.remove('visible');
    }
  }

  function updateStatusText() {
    const statusEl = document.getElementById('status-line');
    if (!statusEl) return;
    
    const now = new Date();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    const use24h = (typeof getStoredTime24h === 'function') ? getStoredTime24h() : false;
    let timeStr;
    if (use24h) {
      const hoursStr = String(now.getHours()).padStart(2, '0');
      timeStr = `${hoursStr}:${minutes}`;
    } else {
      let hours = now.getHours();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      timeStr = `${hours}:${minutes} ${ampm}`;
    }
    
    const showDay = (typeof getStoredStatusShowDay === 'function') ? getStoredStatusShowDay() : true;
    const showMonth = (typeof getStoredStatusShowMonth === 'function') ? getStoredStatusShowMonth() : true;
    const showDate = (typeof getStoredStatusShowDate === 'function') ? getStoredStatusShowDate() : true;
    
    let dateParts = [];
    if (showDay) {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      dateParts.push(days[now.getDay()]);
    }
    
    let monthDayParts = [];
    if (showMonth) {
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      monthDayParts.push(months[now.getMonth()]);
    }
    if (showDate) {
      monthDayParts.push(now.getDate());
    }
    
    if (monthDayParts.length > 0) {
      dateParts.push(monthDayParts.join(' '));
    }
    
    const dateStr = dateParts.join(', ');
    const dateTimeStr = dateStr ? `${dateStr}, ${timeStr}` : timeStr;
    
    const currentHour = now.getHours();
    let greeting = 'Hello';
    if (currentHour >= 5 && currentHour < 12) {
      greeting = 'Good morning';
    } else if (currentHour >= 12 && currentHour < 17) {
      greeting = 'Good afternoon';
    } else {
      greeting = 'Good evening';
    }
    
    const username = (typeof getStoredUsername === 'function') ? getStoredUsername() : 'user';
    statusEl.textContent = `${greeting}, ${username}. It's ${dateTimeStr}.`;
  }

  window.setTerminalDormant = deactivate;
  window.activateTerminal = activate;
  window.updateStatusLineVisibility = updateStatusLineVisibility;
  window.updateStatusText = updateStatusText;

  // Main global keyboard listener
  window.addEventListener('keydown', (e) => {
    const activeModal = document.querySelector('.config-modal.active, .sp-overlay');
    
    // 1. Handle Escape key for Modals and Deactivation
    if (e.key === 'Escape') {
      if (activeModal) {
        if (typeof closeConfig === 'function') closeConfig();
        if (typeof closeHelp === 'function') closeHelp();
        if (typeof closeBookmarksModal === 'function') closeBookmarksModal();
        if (typeof closeSearchEnginesModal === 'function') closeSearchEnginesModal();
        if (typeof closeCustomizeModal === 'function') closeCustomizeModal();
        if (typeof closeHistoryModal === 'function') closeHistoryModal();
        if (typeof _removeSpModal === 'function') _removeSpModal();
        e.preventDefault();
      } else if (isActivated) {
        deactivate();
        e.preventDefault();
      }
      return;
    }

    // 2. Ignore all other keys if a modal is open
    if (activeModal) return;

    // 3. Dormant State Logic (Keybinds)
    if (!isActivated) {
      // Numerical shortcut launcher for Quicklinks (1 to 9 maps to bookmark index 0 to 8)
      if (/^[1-9]$/.test(e.key)) {
        e.preventDefault();
        if (typeof getStoredBookmarks === 'function') {
          const bookmarks = getStoredBookmarks();
          const index = parseInt(e.key, 10) - 1;
          if (bookmarks && bookmarks[index] && bookmarks[index].href) {
            if (typeof navigate === 'function') {
              navigate(bookmarks[index].href);
            } else {
              window.location.href = bookmarks[index].href;
            }
          }
        }
        return;
      }

      // Activation keys
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        activate();
        return;
      }

      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        activate();
        if (typeof window.navigateHistoryExternal === 'function') {
          window.navigateHistoryExternal(e.key);
        }
        return;
      }

      // Tab management shortcuts
      const keyNew = (typeof getStoredKeyNewTab === 'function') ? getStoredKeyNewTab() : 't';
      const keyClose = (typeof getStoredKeyCloseTab === 'function') ? getStoredKeyCloseTab() : 'x';

      if (e.key.toLowerCase() === keyNew) {
        e.preventDefault();
        const nt = SenzaIBrowser.getURL('index.html');
        SenzaIBrowser.openNewTab(nt);
        return;
      }

      if (e.key.toLowerCase() === keyClose) {
        e.preventDefault();
        SenzaIBrowser.closeCurrentTab();
        return;
      }

      return; 
    }

    // 4. Activated State Logic
    if (isActivated) {
      // Automatic focus recovery if user clicks away then starts typing
      const el = input();
      if (el && document.activeElement !== el) {
        if (e.key.length === 1 || e.key === 'Backspace') {
          el.focus({ preventScroll: true });
        }
      }
    }
  }, { capture: false });

  // Activation by click on background
  document.addEventListener('mousedown', (e) => {
    if (!document.querySelector('.config-modal.active, .sp-overlay')) {
      if (e.target.closest('.content') || e.target === document.body) {
        activate();
      }
    }
  });
})();

/* --- Initialization --- */

function initGlossyMode() {
  if (getStoredGlossyMode()) {
    document.documentElement.classList.add('glassy-mode');
  } else {
    document.documentElement.classList.remove('glassy-mode');
  }
}

let currentBgObjectUrl = null;
let cachedBackgroundKey = '';

function _releaseBackgroundResources() {
  if (currentBgObjectUrl) {
    URL.revokeObjectURL(currentBgObjectUrl);
    currentBgObjectUrl = null;
  }
  const video = document.getElementById('custom-bg-video');
  if (video) {
    video.pause();
    video.removeAttribute('src');
    video.load();
  }
}

async function applyBackground() {
  const container = document.getElementById('custom-bg-container');
  const video = document.getElementById('custom-bg-video');
  if (!container || !video) return;

  const bgType = getStoredBackgroundType();
  const bgUrl = getStoredBackgroundUrl();
  const cacheKey = `${bgType}|${bgUrl}`;
  const isFileBg = bgType === 'img-file' || bgType === 'vid-file';

  if (cacheKey === cachedBackgroundKey && bgType !== 'none' && !isFileBg) {
    return;
  }
  cachedBackgroundKey = cacheKey;

  _releaseBackgroundResources();

  // Hide background and video by default, resetting
  container.style.backgroundImage = 'none';
  video.style.display = 'none';

  if (bgType === 'img-url') {
    if (bgUrl) {
      container.style.backgroundImage = `url('${bgUrl}')`;
    }
  } else if (bgType === 'vid-url') {
    if (bgUrl) {
      video.src = bgUrl;
      video.style.display = 'block';
      video.play().catch(() => {});
    }
  } else if (bgType === 'img-file' || bgType === 'vid-file') {
    try {
      if (typeof getBackgroundBlob === 'function') {
        const blob = await getBackgroundBlob();
        if (blob) {
          currentBgObjectUrl = URL.createObjectURL(blob);
          if (bgType === 'img-file') {
            container.style.backgroundImage = `url('${currentBgObjectUrl}')`;
          } else {
            video.src = currentBgObjectUrl;
            video.style.display = 'block';
            video.play().catch(() => {});
          }
        }
      }
    } catch (err) {
      console.error('Error loading background file from IndexedDB:', err);
    }
  }
}
window.applyBackground = applyBackground;
window.invalidateBackgroundCache = () => {
  cachedBackgroundKey = '';
};

function setupBackgroundOptimization() {
  const video = document.getElementById('custom-bg-video');
  if (!video) return;

  const handleVisibilityChange = () => {
    const bgType = getStoredBackgroundType();
    const isVideo = bgType === 'vid-url' || bgType === 'vid-file';
    if (!isVideo) return;

    if (document.hidden) {
      video.pause();
    } else {
      video.play().catch(() => {});
    }
  };

  const handleWindowBlur = () => {
    const bgType = getStoredBackgroundType();
    const isVideo = bgType === 'vid-url' || bgType === 'vid-file';
    if (isVideo) {
      video.pause();
    }
  };

  const handleWindowFocus = () => {
    const bgType = getStoredBackgroundType();
    const isVideo = bgType === 'vid-url' || bgType === 'vid-file';
    if (isVideo && !document.hidden) {
      video.play().catch(() => {});
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('blur', handleWindowBlur);
  window.addEventListener('focus', handleWindowFocus);

  window.addEventListener('pagehide', () => {
    _releaseBackgroundResources();
    cachedBackgroundKey = '';
  });
}

function scheduleStatusClock() {
  const statusEl = document.getElementById('status-line');
  const enabled = typeof getStoredEnableStatusLine === 'function' ? getStoredEnableStatusLine() : true;
  const isVisible = statusEl && statusEl.classList.contains('visible');

  if (enabled && isVisible && typeof updateStatusText === 'function') {
    updateStatusText();
  }

  const now = new Date();
  const msToNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds() + 50;
  setTimeout(scheduleStatusClock, Math.max(msToNextMinute, 1000));
}

document.addEventListener("DOMContentLoaded", async () => {
  // Check if we are running in a private/incognito session
  window.isPrivateSession = new URLSearchParams(window.location.search).get('private') === 'true';

  // Wait for async storage shim if present
  if (window.extStorageReady) await window.extStorageReady;
  
  // Load user settings
  applyUserFont(getStoredFontFamily(), getStoredFontUrl());
  applyBarRounding(getStoredBarRounding());
  loadTheme();
  applySyntaxColors(getStoredSyntaxColors());
  initGlossyMode();
  await applyBackground();
  setupBackgroundOptimization();
  
  // Apply bar material styling and position layout
  if (typeof applyBarLayout === 'function') {
    applyBarLayout();
  }
  if (typeof setupBarDragHandler === 'function') {
    setupBarDragHandler();
  }
  
  // Start the terminal logic
  initializeTerminal();

  // Initialize custom themed dropdown selectors
  if (typeof initializeCustomDropdowns === 'function') {
    initializeCustomDropdowns();
  }

  // Start status clock loop (minute-aligned, only when visible)
  if (typeof updateStatusLineVisibility === 'function') updateStatusLineVisibility();
  scheduleStatusClock();

  // Redundant click-outside handlers for modals
  [
    ['config-modal', typeof closeConfig === 'function' ? closeConfig : null],
    ['help-modal', typeof closeHelp === 'function' ? closeHelp : null],
    ['bookmarks-modal', typeof closeBookmarksModal === 'function' ? closeBookmarksModal : null],
    ['searchengines-modal', typeof closeSearchEnginesModal === 'function' ? closeSearchEnginesModal : null],
    ['customize-modal', typeof closeCustomizeModal === 'function' ? closeCustomizeModal : null],
    ['history-modal', typeof closeHistoryModal === 'function' ? closeHistoryModal : null],
  ].forEach(([id, fn]) => {
    const el = document.getElementById(id);
    if (el && fn) el.addEventListener('click', (e) => { if (e.target === el) fn(); });
  });

  // Handle auto-focus option on load
  if (typeof getStoredEnableAutofocus === 'function' && getStoredEnableAutofocus()) {
    setTimeout(() => {
      if (typeof window.activateTerminal === 'function') {
        window.activateTerminal();
      }
    }, 60);
  }
});
