// ========================================
// Custom Search Engines Modal Logic
// ========================================

/**
 * Opens the custom search engines list editor.
 */
function openSearchEnginesModal() {
  renderSearchEnginesGrid(getStoredCustomSearchEngines());
  document.getElementById('searchengines-modal').classList.add('active');
}

/**
 * Closes the custom search engines modal.
 */
function closeSearchEnginesModal() {
  document.getElementById('searchengines-modal').classList.remove('active');
  if (typeof window.setTerminalDormant === 'function') window.setTerminalDormant();
}

/**
 * Renders the editable table inputs list.
 */
function renderSearchEnginesGrid(engines) {
  const grid = document.getElementById('searchengines-grid-editor');
  grid.innerHTML = '';

  engines.forEach((item, idx) => _addSearchEngineRow(item, grid, idx));
  
  // Add an empty row for new entries
  _addSearchEngineRow({ prefix: '', url: '' }, grid, engines.length);
}

function _addSearchEngineRow(item, grid, idx) {
  const cell = document.createElement('div');
  cell.className = 'bookmark-edit-cell';

  const prefixInput = document.createElement('input');
  prefixInput.type = 'text';
  prefixInput.placeholder = 'Prefix (e.g. mdn)';
  prefixInput.value = item.prefix || '';
  prefixInput.spellcheck = false;

  const urlInput = document.createElement('input');
  urlInput.type = 'text';
  urlInput.placeholder = 'Query URL (https://...)';
  urlInput.value = item.url || '';
  urlInput.spellcheck = false;

  const removeBtn = document.createElement('button');
  removeBtn.className = 'btn-remove-bookmark';
  removeBtn.textContent = '×';
  removeBtn.title = 'Remove';
  removeBtn.addEventListener('click', () => {
    cell.remove();
  });

  const onInput = () => {
    if (prefixInput.value || urlInput.value) {
      if (!cell.dataset.dirty) {
        cell.dataset.dirty = 'true';
        _addSearchEngineRow({ prefix: '', url: '' }, grid, idx + 1);
      }
    }
  };
  prefixInput.addEventListener('input', onInput);
  urlInput.addEventListener('input', onInput);

  cell.appendChild(prefixInput);
  cell.appendChild(urlInput);
  cell.appendChild(removeBtn);
  grid.appendChild(cell);
}

function collectSearchEnginesGrid() {
  const cells = document.querySelectorAll('#searchengines-grid-editor .bookmark-edit-cell');
  const engines = [];
  cells.forEach(cell => {
    const prefix = cell.querySelector('input[placeholder^="Prefix"]').value.trim();
    const url  = cell.querySelector('input[placeholder^="Query"]').value.trim();
    if (prefix || url) {
      engines.push({ prefix: prefix || 'search', url: url || '#' });
    }
  });
  return engines;
}

function saveSearchEnginesFromModal() {
  const engines = collectSearchEnginesGrid();
  saveCustomSearchEngines(engines);
  showToast('Search engines saved', 'success');
  renderSearchEnginesGrid(engines);
}
