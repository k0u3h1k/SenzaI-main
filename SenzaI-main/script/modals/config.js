/*
  Config Modal Logic - Abhidatta Benda Edition
*/

function openConfig() {
  document.getElementById('config-username').value = getStoredUsername();
  document.getElementById('search-engine').value = getStoredSearchEngine();
  document.getElementById('config-font-family').value = getStoredFontFamily();
  document.getElementById('config-font-url').value = getStoredFontUrl();
  document.getElementById('config-key-close').value = getStoredKeyCloseTab();
  document.getElementById('config-key-new').value = getStoredKeyNewTab();
  
  document.getElementById('config-enable-hint').checked = getStoredEnableAutocompleteHint();
  document.getElementById('config-enable-dropdown').checked = getStoredEnableSuggestionDropdown();
  document.getElementById('config-enable-dropdown-nav').checked = getStoredEnableDropdownNavigation();
  document.getElementById('config-enable-status-line').checked = getStoredEnableStatusLine();
  document.getElementById('config-enable-calculator').checked = getStoredEnableInlineCalculator();
  document.getElementById('config-enable-autofocus').checked = getStoredEnableAutofocus();
  document.getElementById('config-time-24h').checked = getStoredTime24h();

  document.getElementById('config-status-show-day').checked = getStoredStatusShowDay();
  document.getElementById('config-status-show-month').checked = getStoredStatusShowMonth();
  document.getElementById('config-status-show-date').checked = getStoredStatusShowDate();
  
  if (typeof syncCustomDropdowns === 'function') {
    syncCustomDropdowns();
  }

  document.getElementById('config-modal').classList.add('active');
}

function closeConfig() {
  document.getElementById('config-modal').classList.remove('active');
  if (typeof window.setTerminalDormant === 'function') window.setTerminalDormant();
}

function saveConfig() {
  const u = document.getElementById('config-username').value.trim();
  const e = document.getElementById('search-engine').value;
  const f = document.getElementById('config-font-family').value.trim();
  const l = document.getElementById('config-font-url').value.trim();
  const kc = document.getElementById('config-key-close').value.trim().toLowerCase();
  const kn = document.getElementById('config-key-new').value.trim().toLowerCase();
  
  const eh = document.getElementById('config-enable-hint').checked;
  const ed = document.getElementById('config-enable-dropdown').checked;
  const edn = document.getElementById('config-enable-dropdown-nav').checked;
  const esl = document.getElementById('config-enable-status-line').checked;
  const ec = document.getElementById('config-enable-calculator').checked;
  const eaf = document.getElementById('config-enable-autofocus').checked;
  const t24 = document.getElementById('config-time-24h').checked;

  const showDay = document.getElementById('config-status-show-day').checked;
  const showMonth = document.getElementById('config-status-show-month').checked;
  const showDate = document.getElementById('config-status-show-date').checked;
  
  if (u) saveUsername(u);
  saveSearchEngine(e);
  saveFontFamily(f);
  saveFontUrl(l);
  if (kc) saveKeyCloseTab(kc);
  if (kn) saveKeyNewTab(kn);
  saveEnableAutocompleteHint(eh);
  saveEnableSuggestionDropdown(ed);
  saveEnableDropdownNavigation(edn);
  saveEnableStatusLine(esl);
  saveEnableInlineCalculator(ec);
  saveEnableAutofocus(eaf);
  saveTime24h(t24);
  saveStatusShowDay(showDay);
  saveStatusShowMonth(showMonth);
  saveStatusShowDate(showDate);

  // Trigger immediate visibility update for the clock greeting line
  if (typeof updateStatusLineVisibility === 'function') {
    updateStatusLineVisibility();
  }
  if (typeof updateStatusText === 'function') {
    updateStatusText();
  }
  
  applyUserFont(f, l);
  
  // Re-run updates immediately
  const inputEl = document.getElementById('terminal-input');
  if (inputEl) {
    updateSyntaxHighlight(inputEl.value);
  }
  
  closeConfig();
  showToast('Settings Saved', 'success');
}
