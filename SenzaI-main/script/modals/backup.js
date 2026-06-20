/* 
  SenzaI Backup — Export / Import Configuration
*/

const BACKUP_KEYS = [
  'username',
  'theme',
  'searchEngine',
  'bookmarks',
  'shelfBookmarks',
  'syntaxColors',
  'fontFamily',
  'fontUrl',
  'keyCloseTab',
  'keyNewTab',
  'barRounding',
  'enableAutocompleteHint',
  'enableSuggestionDropdown',
  'enableDropdownNavigation',
  'enableStatusLine',
  'enableInlineCalculator',
  'enableAutofocus',
  'customSearchEngines',
  'barOpacity',
  'barTextOpacity',
  'barTextCenter',
  'barBlur',
  'barInvisible',
  'focusIndicatorMode',
  'barPositionMode',
  'barPositionPreset',
  'barCustomX',
  'barCustomY',
  'barSnapMode',
  'cursorBlock',
  'time24h',
  'statusShowDay',
  'statusShowMonth',
  'statusShowDate'
];

function exportBackup() {
  const data = { 
    _app: "SenzaI",
    _version: "1.0.0", 
    _exported: new Date().toISOString() 
  };

  BACKUP_KEYS.forEach(key => {
    const val = localStorage.getItem(key);

    if (val !== null) {
      try {
        data[key] = JSON.parse(val);
      } catch {
        data[key] = val;
      }
    }
  });

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `SenzaI-config-${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showToast('Configuration exported', 'success');
}

function importBackup() {
  const input = document.createElement('input');
  input.type   = 'file';
  input.accept = '.json,application/json';

  input.addEventListener('change', () => {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);

        if (!data || typeof data !== 'object') throw new Error('Invalid file');
        
        const confirmed = await showConfirm('This will overwrite your current settings and quicklinks. Continue?', {
          title: 'Import Config',
          confirmLabel: 'Overwrite',
          cancelLabel: 'Cancel'
        });

        if (!confirmed) return;

        BACKUP_KEYS.forEach(key => {
          if (data[key] !== undefined) {
            const val = typeof data[key] === 'object' ? JSON.stringify(data[key]) : data[key];
            localStorage.setItem(key, val);
          }
        });

        showToast('Restoring setup...', 'info');
        setTimeout(() => location.reload(), 1000);

      } catch (err) {
        showAlert('Invalid SenzaI backup file.', { title: 'Import Failed' });
      }
    };
    reader.readAsText(file);
  });

  input.click();
}

async function resetToDefaults() {
  const confirmed = await showConfirm('Are you sure you want to restore all settings to default? This will clear all your custom layouts, themes, bookmarks, and configuration.', {
    title: 'Restore Defaults',
    confirmLabel: 'Restore Defaults',
    cancelLabel: 'Cancel'
  });

  if (!confirmed) return;

  // Clear localStorage
  localStorage.clear();
  showToast('Restoring default settings...', 'info');
  setTimeout(() => location.reload(), 1000);
}
