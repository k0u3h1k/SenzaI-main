// ========================================
// Bookmarks Modal Logic - SenzaI Edition
// ========================================

function openBookmarksModal() {
  renderGridEditor(getStoredBookmarks());
  document.getElementById('bookmarks-modal').classList.add('active');
}

function closeBookmarksModal() {
  document.getElementById('bookmarks-modal').classList.remove('active');
}

// ========================================
// Unified list editor
// ========================================
function renderGridEditor(bookmarks) {
  const grid = document.getElementById('bookmarks-grid-editor');
  const textarea = document.getElementById('config-textarea');
  const addBtn = document.getElementById('btn-add-bookmark');
  grid.classList.remove('hidden');
  textarea.classList.add('hidden');
  if (addBtn) addBtn.classList.remove('hidden');
  grid.innerHTML = '';

  bookmarks.forEach((bm, idx) => _addBookmarkRow(bm, grid, idx));
  
  // Add an empty row for new entries
  _addBookmarkRow({ title: '', href: '' }, grid, bookmarks.length);
}

function _addBookmarkRow(bm, grid, idx) {
  const cell = document.createElement('div');
  cell.className = 'bookmark-edit-cell';

  const titleInput = document.createElement('input');
  titleInput.type = 'text';
  titleInput.placeholder = 'Title';
  titleInput.value = bm.title || '';
  titleInput.spellcheck = false;

  const urlInput = document.createElement('input');
  urlInput.type = 'text';
  urlInput.placeholder = 'URL (https://...)';
  urlInput.value = bm.href || '';
  urlInput.spellcheck = false;

  const removeBtn = document.createElement('button');
  removeBtn.className = 'btn-remove-bookmark';
  removeBtn.textContent = '×';
  removeBtn.title = 'Remove';
  removeBtn.addEventListener('click', () => {
    cell.remove();
  });

  // If this is the "new entry" row, handle auto-adding next row
  const onInput = () => {
    if (titleInput.value || urlInput.value) {
      if (!cell.dataset.dirty) {
        cell.dataset.dirty = 'true';
        _addBookmarkRow({ title: '', href: '' }, grid, idx + 1);
      }
    }
  };
  titleInput.addEventListener('input', onInput);
  urlInput.addEventListener('input', onInput);

  cell.appendChild(titleInput);
  cell.appendChild(urlInput);
  cell.appendChild(removeBtn);
  grid.appendChild(cell);
}

function toggleEditorMode() {
  const grid = document.getElementById('bookmarks-grid-editor');
  const textarea = document.getElementById('config-textarea');
  const btn = document.getElementById('toggle-editor-btn');
  const addBtn = document.getElementById('btn-add-bookmark');

  const inJsonMode = !textarea.classList.contains('hidden');

  if (inJsonMode) {
    try {
      const parsed = JSON.parse(textarea.value);
      if (!Array.isArray(parsed)) throw new Error('Not an array');
      textarea.classList.add('hidden');
      renderGridEditor(parsed);
      grid.classList.remove('hidden');
      if (addBtn) addBtn.classList.remove('hidden');
      btn.textContent = 'Edit JSON';
    } catch {
      showAlert('Invalid JSON format.', { type: 'error', title: 'Invalid JSON' });
    }
  } else {
    const bookmarks = collectGridBookmarks();
    textarea.value = JSON.stringify(bookmarks, null, 2);
    textarea.classList.remove('hidden');
    grid.classList.add('hidden');
    if (addBtn) addBtn.classList.add('hidden');
    btn.textContent = 'Edit List';
  }
}

function collectGridBookmarks() {
  const cells = document.querySelectorAll('#bookmarks-grid-editor .bookmark-edit-cell');
  const bookmarks = [];
  cells.forEach(cell => {
    const title = cell.querySelector('input[placeholder="Title"]').value.trim();
    const href  = cell.querySelector('input[placeholder^="URL"]').value.trim();
    if (title || href) {
      bookmarks.push({ title: title || href, href: href || '#' });
    }
  });
  return bookmarks;
}

function saveBookmarksFromModal() {
  const grid = document.getElementById('bookmarks-grid-editor');
  const textarea = document.getElementById('config-textarea');
  let bookmarks = null;

  if (!grid.classList.contains('hidden')) {
    bookmarks = collectGridBookmarks();
  } else {
    try {
      const parsed = JSON.parse(textarea.value);
      if (Array.isArray(parsed)) bookmarks = parsed;
    } catch (e) {}
  }

  if (bookmarks) {
    saveBookmarks(bookmarks);
    showToast('Bookmarks saved', 'success');
    // Re-render to refresh the list and dirty flags for auto-adding
    if (!grid.classList.contains('hidden')) {
      renderGridEditor(bookmarks);
    }
  } else {
    showAlert('Invalid format.', { type: 'error', title: 'Error' });
  }
}
