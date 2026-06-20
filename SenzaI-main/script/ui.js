/**
 * SenzaI - Custom UI Components
 * Author: Abhidatta Benda
 * 
 * Replaces native alert() and confirm() with themed, non-blocking modals.
 */

/**
 * Shows a custom alert modal.
 */
function showAlert(message, options = {}) {
  const { title = 'Alert' } = options;
  
  const overlay = document.createElement('div');
  overlay.className = 'sp-overlay';
  overlay.id = 'sp-modal-overlay';
  
  overlay.innerHTML = `
    <div class="sp-modal">
      <h2 class="sp-modal-title">${escapeHTML(title)}</h2>
      <div class="sp-modal-body">${escapeHTML(message).replace(/\n/g, '<br>')}</div>
      <div class="sp-modal-buttons">
        <button class="btn-save" id="sp-alert-ok">OK</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  setTimeout(() => overlay.classList.add('sp-overlay-show'), 10);
  
  return new Promise((resolve) => {
    const close = () => {
      overlay.classList.remove('sp-overlay-show');
      setTimeout(() => { overlay.remove(); resolve(); }, 300);
    };
    document.getElementById('sp-alert-ok').onclick = close;
    overlay.onclick = (e) => { if (e.target === overlay) close(); };
  });
}

/**
 * Shows a custom confirmation modal.
 */
function showConfirm(message, options = {}) {
  const { title = 'Confirm', confirmLabel = 'Confirm', cancelLabel = 'Cancel' } = options;
  
  const overlay = document.createElement('div');
  overlay.className = 'sp-overlay';
  overlay.id = 'sp-modal-overlay';
  
  overlay.innerHTML = `
    <div class="sp-modal">
      <h2 class="sp-modal-title">${escapeHTML(title)}</h2>
      <div class="sp-modal-body">${escapeHTML(message).replace(/\n/g, '<br>')}</div>
      <div class="sp-modal-buttons">
        <button class="btn-cancel" id="sp-confirm-cancel">${escapeHTML(cancelLabel)}</button>
        <button class="btn-save" id="sp-confirm-ok">${escapeHTML(confirmLabel)}</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  setTimeout(() => overlay.classList.add('sp-overlay-show'), 10);
  
  return new Promise((resolve) => {
    const close = (result) => {
      overlay.classList.remove('sp-overlay-show');
      setTimeout(() => { overlay.remove(); resolve(result); }, 300);
    };
    document.getElementById('sp-confirm-ok').onclick = () => close(true);
    document.getElementById('sp-confirm-cancel').onclick = () => close(false);
    overlay.onclick = (e) => { if (e.target === overlay) close(false); };
  });
}

/**
 * Shows a temporary toast notification at the bottom of the screen.
 */
function showToast(message, type = 'info') {
  const existing = document.querySelector('.sp-toast');
  if (existing) existing.remove();
  
  const toast = document.createElement('div');
  toast.className = `sp-toast sp-toast-show`;
  toast.textContent = message;
  
  if (type === 'success') toast.style.borderColor = 'var(--color-success)';
  if (type === 'error') toast.style.borderColor = 'var(--color-error)';
  
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.classList.remove('sp-toast-show');
    setTimeout(() => toast.remove(), 500);
  }, 3000);
}

function _removeSpModal() {
  const el = document.getElementById('sp-modal-overlay');
  if (el) el.remove();
}

/**
 * Replaces native <select> elements inside config/appearance modals
 * with themed, accessible, custom styled dropdown menus.
 */
function initializeCustomDropdowns() {
  const selects = document.querySelectorAll('select');
  selects.forEach(select => {
    if (select.dataset.customInitialized) return;
    select.dataset.customInitialized = "true";

    // Hide native select
    select.style.display = 'none';

    // Create container
    const container = document.createElement('div');
    container.className = 'custom-select-container';
    container.id = `custom-select-${select.id}`;

    // Create trigger
    const trigger = document.createElement('div');
    trigger.className = 'custom-select-trigger';
    trigger.innerHTML = `<span class="custom-select-trigger-text"></span><div class="custom-select-arrow"></div>`;
    container.appendChild(trigger);

    // Create options list
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'custom-select-options';

    // Populate options
    Array.from(select.options).forEach(opt => {
      const option = document.createElement('div');
      option.className = 'custom-select-option';
      option.dataset.value = opt.value;
      option.textContent = opt.textContent;
      option.addEventListener('click', (e) => {
        e.stopPropagation();
        select.value = opt.value;
        // Dispatch change event so existing listeners trigger
        select.dispatchEvent(new Event('change', { bubbles: true }));
        syncCustomDropdowns();
        container.classList.remove('open');
      });
      optionsContainer.appendChild(option);
    });

    container.appendChild(optionsContainer);

    // Toggle dropdown open state
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      document.querySelectorAll('.custom-select-container').forEach(c => {
        if (c !== container) c.classList.remove('open');
      });
      container.classList.toggle('open');
    });

    // Insert next to native select
    select.parentNode.insertBefore(container, select.nextSibling);
  });

  // Global click to dismiss open dropdowns
  window.addEventListener('click', () => {
    document.querySelectorAll('.custom-select-container').forEach(c => {
      c.classList.remove('open');
    });
  });
}

/**
 * Synchronizes the visual state of custom dropdowns with their hidden native equivalents.
 */
function syncCustomDropdowns() {
  const selects = document.querySelectorAll('select');
  selects.forEach(select => {
    const container = document.getElementById(`custom-select-${select.id}`);
    if (!container) return;

    const triggerText = container.querySelector('.custom-select-trigger-text');
    const selectedOption = select.options[select.selectedIndex];
    if (triggerText && selectedOption) {
      triggerText.textContent = selectedOption.textContent;
    }

    const options = container.querySelectorAll('.custom-select-option');
    options.forEach(opt => {
      if (opt.dataset.value === select.value) {
        opt.classList.add('selected');
      } else {
        opt.classList.remove('selected');
      }
    });
  });
}

