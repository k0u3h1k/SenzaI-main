// ========================================
// Custom Aliases Modal Logic
// ========================================

/**
 * Opens the custom aliases list editor.
 */
function openAliasesModal() {
  renderAliasesGrid(getStoredCustomAliases());
  document.getElementById('aliases-modal').classList.add('active');
}

/**
 * Closes the custom aliases modal.
 */
function closeAliasesModal() {
  document.getElementById('aliases-modal').classList.remove('active');
  if (typeof window.setTerminalDormant === 'function') window.setTerminalDormant();
}

/**
 * Renders the editable custom aliases inputs list.
 */
function renderAliasesGrid(aliases) {
  const grid = document.getElementById('aliases-grid-editor');
  if (!grid) return;
  grid.innerHTML = '';

  aliases.forEach((item, idx) => _addAliasRow(item, grid, idx));
  
  // Add an empty row for new entries
  _addAliasRow({ alias: '', url: '' }, grid, aliases.length);
}

function _addAliasRow(item, grid, idx) {
  const cell = document.createElement('div');
  cell.className = 'bookmark-edit-cell';

  const aliasInput = document.createElement('input');
  aliasInput.type = 'text';
  aliasInput.placeholder = 'Alias (e.g. mail)';
  aliasInput.value = item.alias || '';
  aliasInput.spellcheck = false;

  const urlInput = document.createElement('input');
  urlInput.type = 'text';
  urlInput.placeholder = 'Redirect URL (https://...)';
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
    if (aliasInput.value || urlInput.value) {
      if (!cell.dataset.dirty) {
        cell.dataset.dirty = 'true';
        _addAliasRow({ alias: '', url: '' }, grid, idx + 1);
      }
    }
  };
  aliasInput.addEventListener('input', onInput);
  urlInput.addEventListener('input', onInput);

  cell.appendChild(aliasInput);
  cell.appendChild(urlInput);
  cell.appendChild(removeBtn);
  grid.appendChild(cell);
}

function collectAliasesGrid() {
  const cells = document.querySelectorAll('#aliases-grid-editor .bookmark-edit-cell');
  const aliases = [];
  cells.forEach(cell => {
    const alias = cell.querySelector('input[placeholder^="Alias"]').value.trim();
    const url  = cell.querySelector('input[placeholder^="Redirect"]').value.trim();
    if (alias || url) {
      aliases.push({ alias: alias || 'shortcut', url: url || '#' });
    }
  });
  return aliases;
}

function saveAliasesFromModal() {
  const aliases = collectAliasesGrid();
  saveCustomAliases(aliases);
  showToast('Aliases saved', 'success');
  renderAliasesGrid(aliases);
}
