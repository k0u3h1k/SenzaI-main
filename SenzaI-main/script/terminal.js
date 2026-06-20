/**
 * SenzaI - Terminal Logic
 * Author: Abhidatta Benda
 * 
 * This file handles input processing, syntax highlighting, 
 * ghost-text hints, and keyboard events for the search bar.
 */

/**
 * Initializes listeners for the terminal input field.
 */
function initializeTerminal() {
  const input = document.getElementById("terminal-input");
  if (!input) return;

  if (!input._listenersAttached) {
    handleInput(input);
    handleKeyboardEvents(input);
    
    input.addEventListener('focus', () => {
      if (typeof updateFocusIndicator === 'function') updateFocusIndicator();
    });
    input.addEventListener('blur', () => {
      if (typeof updateFocusIndicator === 'function') updateFocusIndicator();
    });
    input.addEventListener('keydown', () => {
      setTimeout(() => {
        if (typeof updateFocusIndicator === 'function') updateFocusIndicator();
      }, 0);
    });
    input.addEventListener('keyup', () => {
      if (typeof updateFocusIndicator === 'function') updateFocusIndicator();
    });
    input.addEventListener('click', () => {
      if (typeof updateFocusIndicator === 'function') updateFocusIndicator();
    });
    input.addEventListener('scroll', () => {
      if (typeof updateFocusIndicator === 'function') updateFocusIndicator();
    });
    
    input._listenersAttached = true;
  }
}

let activeResultIdx = -1;
let originalTypedValue = "";
let terminalHistory = [];
let terminalHistoryIdx = -1;

/**
 * Sets up the input event listener for live syntax highlighting and hints.
 */
function handleInput(input) {
  input.addEventListener("input", () => {
    // Only process if no modal is obstructing the view
    if (document.querySelector('.config-modal.active, #sp-modal-overlay')) return;
    activeResultIdx = -1;
    originalTypedValue = input.value;
    updateSyntaxHighlight(input.value);
  });
}

/**
 * Renders syntax highlighting markup into the syntax-overlay element.
 */
function renderSyntaxHighlight(rawValue) {
  const overlay = document.getElementById('syntax-overlay');
  if (!overlay) return;

  if (!rawValue) {
    overlay.innerHTML = '';
    return;
  }

  const value = rawValue.trim();
  const lowerValue = value.toLowerCase();

  // Preserve leading/trailing spaces for layout alignment
  const leadingSpaces = rawValue.match(/^\s*/)[0];
  const trailingSpaces = rawValue.match(/\s*$/)[0];

  let htmlContent = '';

  const isMath = /^[0-9+\-*/().\s%]+$/.test(value) && /[0-9]/.test(value) && /[\+\-\*\/%]/.test(value);
  const isUrl = value.includes('.') && !value.includes(' ');

  if (lowerValue.startsWith(':')) {
    const sysCommands = [':help', ':config', ':customize', ':bookmarks', ':history', ':version', ':ver', ':reset'];
    const themeName = lowerValue.slice(1);
    const themeAliases = ['ctp-frappe', 'frappe', 'ctp-macchiato', 'macchiato', 'ctp-mocha', 'mocha', 'tokyo', 'tokyo-night'];
    const isValidTheme = (typeof THEMES !== 'undefined' ? THEMES : []).includes(themeName) || themeAliases.includes(themeName);

    if (sysCommands.includes(lowerValue)) {
      htmlContent = `<span class="syn-cmd">${escapeHTML(value)}</span>`;
    } else if (isValidTheme) {
      htmlContent = `<span class="syn-theme">${escapeHTML(value)}</span>`;
    } else {
      htmlContent = `<span class="syn-unknown">${escapeHTML(value)}</span>`;
    }
  } else if (isMath) {
    htmlContent = value.replace(/([0-9.]+)/g, '<span class="syn-url">$1</span>')
                       .replace(/([\+\-\*\/%()]+)/g, '<span class="syn-cmd">$1</span>');
  } else if (isUrl) {
    htmlContent = `<span class="syn-url">${escapeHTML(value)}</span>`;
  } else {
    const searchPrefixes = ['yt:', 'r:', 'ddg:', 'gh:', 'ma:'];
    if (typeof getStoredCustomSearchEngines === 'function') {
      const customList = getStoredCustomSearchEngines();
      customList.forEach(item => {
        if (item.prefix) {
          const pfx = item.prefix.endsWith(':') ? item.prefix.toLowerCase() : `${item.prefix.toLowerCase()}:`;
          if (!searchPrefixes.includes(pfx)) {
            searchPrefixes.push(pfx);
          }
        }
      });
    }

    let matchedPrefix = null;
    for (const prefix of searchPrefixes) {
      if (lowerValue.startsWith(prefix)) {
        matchedPrefix = value.substring(0, prefix.length);
        break;
      }
    }

    if (matchedPrefix) {
      const rest = value.substring(matchedPrefix.length);
      htmlContent = `<span class="syn-search">${escapeHTML(matchedPrefix)}</span><span class="syn-text">${escapeHTML(rest)}</span>`;
    } else {
      htmlContent = `<span class="syn-text">${escapeHTML(value)}</span>`;
    }
  }

  overlay.innerHTML = leadingSpaces + htmlContent + trailingSpaces;
}

function updateSyntaxHighlight(rawValue) {
  const value = rawValue.toLowerCase();
  const hintEl = document.getElementById('command-hint');
  const input = document.getElementById('terminal-input');

  // Render highlighted syntax overlay
  renderSyntaxHighlight(rawValue);

  // Always update focus indicator first to handle clearing text / Ctrl+A Backspace
  if (typeof updateFocusIndicator === 'function') {
    updateFocusIndicator();
  }

  if (typeof renderLiveResults === 'function') {
    renderLiveResults(rawValue);
  }

  if (!value) {
    hintEl.textContent = '';
    input.removeAttribute('data-suggestion');
    return;
  }

  let suggestion = null;

  // 0. Search for math evaluation if calculator is enabled
  const enableCalc = (typeof getStoredEnableInlineCalculator === 'function') ? getStoredEnableInlineCalculator() : true;
  if (enableCalc) {
    const isMath = /^[0-9+\-*/().\s%]+$/.test(rawValue) && /[0-9]/.test(rawValue) && /[\+\-\*\/%]/.test(rawValue);
    if (isMath) {
      try {
        const ans = safeEval(rawValue);
        if (ans !== null && !isNaN(ans)) {
          suggestion = rawValue + " = " + ans;
        }
      } catch (e) {}
    }
  }

  // 1. Search for best matching bookmark if not already resolved by math
  if (!suggestion && (typeof getStoredEnableAutocompleteHint !== 'function' || getStoredEnableAutocompleteHint())) {
    if (typeof getFilteredBookmarks === 'function') {
      const matches = getFilteredBookmarks(rawValue);
      // Only suggest if the match starts with what the user is typing
      if (matches.length > 0 && matches[0].title.toLowerCase().startsWith(value)) {
        suggestion = matches[0].title;
      }
    }

    // 2. Search for matching system command or theme command if no bookmark found
    if (!suggestion) {
      const themesList = (typeof THEMES !== 'undefined' ? THEMES : []).map(t => ':' + t);
      const themeAliases = [':rp', ':rp-moon', ':rp-dawn', ':forest', ':forest-light', ':onedark', ':cyber'];
      const sysCommands = [
        ':config',
        ':customize',
        ':bookmarks',
        ':history',
        ':version',
        ':help',
        ':reset',
        ...themesList,
        ...themeAliases
      ];
      for (const cmd of sysCommands) {
        if (cmd.startsWith(value)) {
          suggestion = cmd;
          break;
        }
      }
    }
  }

  // 3. Render the ghost text hint
  if (suggestion && suggestion.toLowerCase().startsWith(value)) {
    input.setAttribute('data-suggestion', suggestion);
    const remaining = suggestion.substring(rawValue.length);
    // The spacer ensures the ghost text aligns perfectly with the current text
    hintEl.innerHTML = `<span class="spacer">${escapeHTML(rawValue)}</span><span class="suggestion">${escapeHTML(remaining)}</span>`;
  } else {
    hintEl.textContent = '';
    input.removeAttribute('data-suggestion');
  }
}

/**
 * Handles Tab, Arrow, and Enter keys for completion and navigation.
 */
function handleKeyboardEvents(input) {
  terminalHistory = loadHistory().reverse();
  terminalHistoryIdx = -1;

  input.addEventListener("keydown", (e) => {
    // Ignore input events if a modal is open
    const anyModal = document.querySelector('.config-modal.active, #sp-modal-overlay');
    if (anyModal) return;

    const enableNav = (typeof getStoredEnableDropdownNavigation === 'function') ? getStoredEnableDropdownNavigation() : true;
    const resultsContainer = document.getElementById('live-results');
    const items = resultsContainer ? resultsContainer.querySelectorAll('.live-result-item') : [];
    const hasResults = resultsContainer && resultsContainer.classList.contains('visible') && items.length > 0;

    // --- Autocomplete Completion (Tab or Right Arrow) ---
    if ((e.key === "Tab" || e.key === "ArrowRight") && input.hasAttribute('data-suggestion')) {
      e.preventDefault();
      input.value = input.getAttribute('data-suggestion');
      updateSyntaxHighlight(input.value);
      return;
    }

    // --- Arrow Keys: Dropdown Navigation vs. History Navigation ---
    if (e.key === "ArrowDown") {
      if (hasResults && enableNav) {
        e.preventDefault();
        
        // Remove highlight from previous item
        if (activeResultIdx >= 0 && activeResultIdx < items.length) {
          items[activeResultIdx].classList.remove('selected');
        }
        
        // Move selection index forward (downwards)
        activeResultIdx++;
        if (activeResultIdx >= items.length) {
          activeResultIdx = -1;
          input.value = originalTypedValue;
          updateSyntaxHighlight(originalTypedValue);
        } else {
          items[activeResultIdx].classList.add('selected');
          items[activeResultIdx].scrollIntoView({ block: 'nearest' });
          
          // Clear ghost hint
          const hintEl = document.getElementById('command-hint');
          if (hintEl) hintEl.textContent = '';
        }
      } else {
        // Navigate history forward (towards newer items / clear)
        e.preventDefault();
        if (terminalHistoryIdx > 0) {
          terminalHistoryIdx--;
          input.value = terminalHistory[terminalHistoryIdx];
          updateSyntaxHighlight(input.value);
        } else if (terminalHistoryIdx === 0) {
          terminalHistoryIdx = -1;
          input.value = originalTypedValue || "";
          updateSyntaxHighlight(input.value);
        }
      }
      return;
    }

    if (e.key === "ArrowUp") {
      if (hasResults && enableNav) {
        e.preventDefault();
        
        // Remove highlight from previous item
        if (activeResultIdx >= 0 && activeResultIdx < items.length) {
          items[activeResultIdx].classList.remove('selected');
        }
        
        // Move selection index backward (upwards)
        activeResultIdx--;
        if (activeResultIdx < -1) {
          activeResultIdx = items.length - 1;
        }
        
        if (activeResultIdx === -1) {
          input.value = originalTypedValue;
          updateSyntaxHighlight(originalTypedValue);
        } else {
          items[activeResultIdx].classList.add('selected');
          items[activeResultIdx].scrollIntoView({ block: 'nearest' });
          
          // Clear ghost hint
          const hintEl = document.getElementById('command-hint');
          if (hintEl) hintEl.textContent = '';
        }
      } else {
        // Navigate history backward (towards older items)
        e.preventDefault();
        if (terminalHistoryIdx < terminalHistory.length - 1) {
          terminalHistoryIdx++;
          input.value = terminalHistory[terminalHistoryIdx];
          updateSyntaxHighlight(input.value);
        }
      }
      return;
    }

    // --- Execution (Enter) ---
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      
      // If we have a highlighted dropdown suggestion, navigate to it directly
      if (hasResults && enableNav && activeResultIdx >= 0 && activeResultIdx < items.length) {
        const targetHref = items[activeResultIdx].getAttribute('href');
        pushHistory(originalTypedValue);
        if (typeof navigate === 'function') {
          navigate(targetHref);
        } else {
          window.location.href = targetHref;
        }
        return;
      }

      const val = input.value.trim();
      if (!val) return;

      const enableCalc = (typeof getStoredEnableInlineCalculator === 'function') ? getStoredEnableInlineCalculator() : true;
      if (enableCalc) {
        const isMath = /^[0-9+\-*/().\s%]+$/.test(val) && /[0-9]/.test(val) && /[\+\-\*\/%]/.test(val);
        if (isMath) {
          try {
            const ans = safeEval(val);
            if (ans !== null && !isNaN(ans)) {
              pushHistory(val);
              terminalHistory = loadHistory().reverse();
              terminalHistoryIdx = -1;
              input.value = String(ans);
              updateSyntaxHighlight(String(ans));
              return;
            }
          } catch (e) {}
        }
      }
      
      // Auto-complete to suggestion if visible
      const suggestion = input.getAttribute('data-suggestion');
      const finalVal = (suggestion && suggestion.toLowerCase().startsWith(val.toLowerCase())) ? suggestion : val;
      
      pushHistory(finalVal);
      terminalHistory = loadHistory().reverse();
      terminalHistoryIdx = -1;
      handleSpecialCommands(finalVal);
    }
  });
}

/**
 * Traverses history externally (e.g. from dormant mode).
 */
function navigateHistoryExternal(key) {
  const input = document.getElementById("terminal-input");
  if (!input) return;

  if (terminalHistory.length === 0) {
    terminalHistory = loadHistory().reverse();
  }

  if (key === "ArrowUp") {
    if (terminalHistoryIdx < terminalHistory.length - 1) {
      terminalHistoryIdx++;
      input.value = terminalHistory[terminalHistoryIdx];
      updateSyntaxHighlight(input.value);
    }
  } else if (key === "ArrowDown") {
    if (terminalHistoryIdx > 0) {
      terminalHistoryIdx--;
      input.value = terminalHistory[terminalHistoryIdx];
      updateSyntaxHighlight(input.value);
    } else {
      terminalHistoryIdx = -1;
      input.value = "";
      updateSyntaxHighlight("");
    }
  }
}
window.navigateHistoryExternal = navigateHistoryExternal;

/**
 * Escapes HTML characters to prevent XSS.
 */
function escapeHTML(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* --- History Persistence --- */

const HISTORY_KEY = 'terminal-history-v1';
function loadHistory() { try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; } }
function saveHistory(h) { localStorage.setItem(HISTORY_KEY, JSON.stringify(h)); }

/**
 * Adds an entry to the command history, maintaining a max of 50 unique items.
 */
function pushHistory(entry) {
  if (!entry) return;
  const h = loadHistory().filter(e => e !== entry);
  h.push(entry);
  if (h.length > 50) h.shift();
  saveHistory(h);
}

function openHistory() {
  renderHistoryList();
  document.getElementById('history-modal').classList.add('active');
}

function closeHistoryModal() {
  document.getElementById('history-modal').classList.remove('active');
}

function clearHistory() {
  saveHistory([]);
  renderHistoryList();
  showToast('History cleared', 'success');
}

function renderHistoryList() {
  const list = document.getElementById('history-list');
  if (!list) return;

  const history = loadHistory().slice().reverse();
  if (history.length === 0) {
    list.innerHTML = '<p class="history-empty">No commands yet</p>';
    return;
  }

  list.innerHTML = '';
  history.forEach((entry) => {
    const button = document.createElement('button');
    button.className = 'history-item';
    button.type = 'button';
    button.textContent = entry;
    button.addEventListener('click', () => {
      const input = document.getElementById('terminal-input');
      if (input) {
        input.value = entry;
        updateSyntaxHighlight(entry);
      }
      closeHistoryModal();
    });
    list.appendChild(button);
  });
}

function updateFocusIndicator() {
  const input = document.getElementById('terminal-input');
  const indicator = document.getElementById('focus-indicator-line');
  const ruler = document.getElementById('text-ruler');
  const cursor = document.getElementById('terminal-cursor');
  if (!input || !indicator || !ruler) return;

  const rawValue = input.value;
  ruler.textContent = rawValue;

  const totalTextWidth = ruler.offsetWidth;

  // Expose ruler width as CSS variable for centering calculations
  document.documentElement.style.setProperty('--ruler-width', `${totalTextWidth}px`);

  const wrapper = input.closest('.terminal-input-wrapper');
  const maxWidth = wrapper ? wrapper.offsetWidth : 0;
  const isOverflowing = maxWidth > 0 && totalTextWidth > maxWidth;

  // Toggle overflowing class on the input wrapper for layout styling
  if (wrapper) {
    if (isOverflowing) {
      wrapper.classList.add('overflowing');
    } else {
      wrapper.classList.remove('overflowing');
    }
  }

  // Sync scrollLeft of syntax overlay and command hint with terminal input
  const overlay = document.getElementById('syntax-overlay');
  if (overlay) {
    overlay.scrollLeft = input.scrollLeft;
  }
  const hintEl = document.getElementById('command-hint');
  if (hintEl) {
    hintEl.scrollLeft = input.scrollLeft;
  }

  // Cap the underline width to the visible input wrapper width to handle text scrolling
  const finalWidth = maxWidth > 0 ? Math.min(totalTextWidth, maxWidth) : totalTextWidth;
  indicator.style.width = `${finalWidth}px`;

  const customizeModal = document.getElementById('customize-modal');
  const isModalActive = customizeModal && customizeModal.classList.contains('active');

  const focusIndicatorSelect = document.getElementById('config-focus-indicator-mode');
  const mode = (focusIndicatorSelect && isModalActive) ? focusIndicatorSelect.value : ((typeof getStoredFocusIndicatorMode === 'function') ? getStoredFocusIndicatorMode() : 'off');

  // Style according to selected mode (glowing vs regular)
  indicator.classList.remove('mode-glowing', 'mode-regular');
  if (mode === 'glowing') {
    indicator.classList.add('mode-glowing');
  } else if (mode === 'regular') {
    indicator.classList.add('mode-regular');
  }

  const show = mode !== 'off' && document.activeElement === input && rawValue.length > 0;
  indicator.style.opacity = show ? '1' : '0';

  // --- Block Cursor Logic ---
  if (cursor) {
    const cursorBlockInput = document.getElementById('config-cursor-block');
    const isBlockMode = (cursorBlockInput && isModalActive) ? cursorBlockInput.checked : ((typeof getStoredCursorBlock === 'function') ? getStoredCursorBlock() : false);
    
    const isFocused = document.activeElement === input;
    const hasSelection = input.selectionStart !== input.selectionEnd;

    if (isBlockMode && isFocused && !hasSelection) {
      input.classList.add('cursor-block');
      cursor.classList.add('active', 'blinking');

      const cursorIndex = input.selectionStart;

      // Measure width of text before the cursor
      ruler.textContent = rawValue.substring(0, cursorIndex);
      const textBeforeWidth = ruler.offsetWidth;

      // Measure single character width
      ruler.textContent = "A";
      const charWidth = ruler.offsetWidth;

      // Restore ruler text
      ruler.textContent = rawValue;

      cursor.style.width = `${charWidth}px`;
      cursor.style.height = `${ruler.offsetHeight || 24}px`;

      const barTextCenterInput = document.getElementById('config-bar-text-center');
      const textCenter = (barTextCenterInput && isModalActive) ? barTextCenterInput.checked : ((typeof getStoredBarTextCenter === 'function') ? getStoredBarTextCenter() : false);

      const scrollOffset = input.scrollLeft || 0;

      if (textCenter && !isOverflowing) {
        cursor.style.left = `calc(50% - ${totalTextWidth / 2}px + ${textBeforeWidth - scrollOffset}px)`;
      } else {
        cursor.style.left = `${textBeforeWidth - scrollOffset}px`;
      }
    } else {
      input.classList.remove('cursor-block');
      cursor.classList.remove('active', 'blinking');
    }
  }
}
