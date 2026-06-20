/*
  Event Wiring - Abhidatta Benda Edition
*/

document.addEventListener('DOMContentLoaded', () => {

  const on = (id, fn) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', fn);
  };

  // --- Modal Openers ---
  on('btn-edit-bookmarks',     () => openBookmarksModal());
  on('btn-customize-from-config', () => { closeConfig(); openCustomizeModal(); });
  on('btn-import-backup',      () => importBackup());
  on('btn-export-backup',      () => exportBackup());
  on('btn-reset-defaults',     () => resetToDefaults());

  // --- Config Modal ---
  on('btn-cancel-config',      () => closeConfig());
  on('btn-save-config',        () => saveConfig());

  // --- Help Modal ---
  on('btn-close-help',         () => closeHelp());

  // --- Bookmarks Modal ---
  on('toggle-editor-btn',      () => toggleEditorMode());
  on('btn-cancel-bookmarks',   () => closeBookmarksModal());
  on('btn-save-bookmarks',     () => saveBookmarksFromModal());
  on('btn-back-bookmarks',     () => closeBookmarksModal());
  on('btn-add-bookmark',       () => {
    const grid = document.getElementById('bookmarks-grid-editor');
    if (grid) {
      _addBookmarkRow({ title: '', href: '' }, grid, grid.children.length);
    }
  });

  // --- Search Engines Modal ---
  on('btn-edit-searchengines',   () => { closeConfig(); openSearchEnginesModal(); });
  on('btn-cancel-searchengines', () => closeSearchEnginesModal());
  on('btn-save-searchengines',   () => saveSearchEnginesFromModal());
  on('btn-back-searchengines',   () => closeSearchEnginesModal());
  on('btn-add-searchengine',     () => {
    const grid = document.getElementById('searchengines-grid-editor');
    if (grid) {
      _addSearchEngineRow({ prefix: '', url: '' }, grid, grid.children.length);
    }
  });

  // --- Customize Modal ---
  on('btn-cancel-customize',   () => closeCustomizeModal());
  on('btn-save-customize',     () => saveCustomize());

  // --- History Modal ---
  on('btn-clear-history',      () => clearHistory());
  on('btn-close-history',      () => closeHistoryModal());

  // --- Live Results Click Interception ---
  const liveResults = document.getElementById('live-results');
  if (liveResults) {
    liveResults.addEventListener('click', (e) => {
      const item = e.target.closest('.live-result-item');
      if (item) {
        e.preventDefault();
        const href = item.getAttribute('href');
        if (typeof navigate === 'function') {
          navigate(href);
        } else {
          window.location.href = href;
        }
      }
    });
  }

  // --- 3-Dots Navigation Dropdown Menu ---
  const dotsBtn = document.getElementById('dots-menu-btn');
  const dotsDropdown = document.getElementById('dots-dropdown');
  if (dotsBtn && dotsDropdown) {
    dotsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dotsDropdown.classList.toggle('visible');
    });
    window.addEventListener('click', () => {
      dotsDropdown.classList.remove('visible');
    });
  }

  const dotsAction = (id, action) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('click', () => {
        if (dotsDropdown) dotsDropdown.classList.remove('visible');
        action();
      });
    }
  };
  dotsAction('dots-item-config', () => openConfig());
  dotsAction('dots-item-customize', () => openCustomizeModal());
  dotsAction('dots-item-bookmarks', () => openBookmarksModal());
  dotsAction('dots-item-searchengines', () => openSearchEnginesModal());
  dotsAction('dots-item-aliases', () => openAliasesModal());
  dotsAction('dots-item-history', () => openHistory());
  dotsAction('dots-item-help', () => openHelp());

  // --- Aliases Modal ---
  on('btn-cancel-aliases', () => closeAliasesModal());
  on('btn-save-aliases', () => { saveAliasesFromModal(); closeAliasesModal(); });
  on('btn-back-aliases', () => closeAliasesModal());
  on('btn-add-alias', () => {
    const grid = document.getElementById('aliases-grid-editor');
    if (grid) {
      _addAliasRow({ alias: '', url: '' }, grid, grid.children.length);
    }
  });

  // --- Background Upload Handlers ---
  const fileInput = document.getElementById('config-bg-file');
  const triggerBtn = document.getElementById('btn-trigger-upload');
  const clearBtn = document.getElementById('btn-clear-upload');
  const statusText = document.getElementById('bg-file-status');

  if (triggerBtn && fileInput) {
    triggerBtn.addEventListener('click', () => fileInput.click());
  }

  if (fileInput) {
    fileInput.addEventListener('change', async () => {
      if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        try {
          if (typeof storeBackgroundBlob === 'function') {
            await storeBackgroundBlob(file);
            if (statusText) {
              statusText.textContent = `Stored file: ${file.type} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
            }
            showToast('Background file saved', 'success');
            if (typeof applyBackground === 'function') {
              applyBackground();
            }
          }
        } catch (err) {
          console.error(err);
          showToast('Failed to store background file', 'error');
        }
      }
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', async () => {
      try {
        if (typeof clearBackgroundBlob === 'function') {
          await clearBackgroundBlob();
          if (statusText) statusText.textContent = 'No file stored';
          if (fileInput) fileInput.value = '';
          showToast('Background file cleared', 'success');
          if (typeof applyBackground === 'function') {
            applyBackground();
          }
        }
      } catch (err) {
        console.error(err);
        showToast('Failed to clear background file', 'error');
      }
    });
  }

});

