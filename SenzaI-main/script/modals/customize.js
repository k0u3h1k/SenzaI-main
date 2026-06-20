// Customize Modal — Appearance Customizer

const THEME_DEFS = [
  { value: 'light',                label: 'Light'       },
  { value: 'dark',                 label: 'Dark'        },
  { value: 'black',                label: 'Black'       },
  { value: 'nord',                 label: 'Nord'        },
  { value: 'gruvbox',              label: 'Gruvbox'     },
  { value: 'tokyo-night',          label: 'Tokyo Night' },
  { value: 'dracula',              label: 'Dracula'     },
  { value: 'kanagawa',             label: 'Kanagawa'    },
  { value: 'catppuccin-frappe',    label: 'CTP Frappe'  },
  { value: 'catppuccin-macchiato', label: 'CTP Macchiato'},
  { value: 'catppuccin-mocha',     label: 'CTP Mocha'   },
  { value: 'rose-pine',            label: 'Rose Pine'   },
  { value: 'rose-pine-moon',       label: 'RP Moon'     },
  { value: 'rose-pine-dawn',       label: 'RP Dawn'     },
  { value: 'everforest',           label: 'Everforest'  },
  { value: 'everforest-light',     label: 'Everforest L'},
  { value: 'one-dark',             label: 'One Dark'    },
  { value: 'cyberpunk',            label: 'Cyberpunk'   },
];

let _selectedTheme = null;
let _tempStatusLineColor = '';

// ---- Open / Close ----
function openCustomizeModal() {
  _selectedTheme = getStoredTheme();
  
  _renderCustomizeModal();

  // Hydrate Bar rounding slider
  const barRounding = getStoredBarRounding();
  const barRoundingInput = document.getElementById('config-bar-rounding');
  const barRoundingDisplay = document.getElementById('rounding-value-display');
  if (barRoundingInput && barRoundingDisplay) {
    barRoundingInput.value = barRounding;
    barRoundingDisplay.textContent = `${barRounding}px`;
    barRoundingInput.oninput = () => {
      barRoundingDisplay.textContent = `${barRoundingInput.value}px`;
      if (typeof applyBarRounding === 'function') {
        applyBarRounding(barRoundingInput.value);
      }
    };
  }

  // Hydrate Bar opacity slider
  const barOpacity = getStoredBarOpacity();
  const barOpacityInput = document.getElementById('config-bar-opacity');
  const barOpacityDisplay = document.getElementById('bar-opacity-value-display');
  if (barOpacityInput && barOpacityDisplay) {
    barOpacityInput.value = barOpacity;
    barOpacityDisplay.textContent = `${barOpacity}%`;
    barOpacityInput.oninput = () => {
      barOpacityDisplay.textContent = `${barOpacityInput.value}%`;
      document.documentElement.style.setProperty('--bar-opacity-factor', Number(barOpacityInput.value) / 100);
    };
  }

  // Hydrate Bar text opacity slider
  const barTextOpacity = getStoredBarTextOpacity();
  const textOpacityInput = document.getElementById('config-text-opacity');
  const textOpacityDisplay = document.getElementById('text-opacity-value-display');
  if (textOpacityInput && textOpacityDisplay) {
    textOpacityInput.value = barTextOpacity;
    textOpacityDisplay.textContent = `${barTextOpacity}%`;
    textOpacityInput.oninput = () => {
      textOpacityDisplay.textContent = `${textOpacityInput.value}%`;
      document.documentElement.style.setProperty('--bar-text-opacity', Number(textOpacityInput.value) / 100);
    };
  }

  // Hydrate Bar blur slider
  const barBlur = getStoredBarBlur();
  const barBlurInput = document.getElementById('config-bar-blur');
  const barBlurDisplay = document.getElementById('bar-blur-value-display');
  if (barBlurInput && barBlurDisplay) {
    barBlurInput.value = barBlur;
    barBlurDisplay.textContent = `${barBlur}px`;
    barBlurInput.oninput = () => {
      barBlurDisplay.textContent = `${barBlurInput.value}px`;
      document.documentElement.style.setProperty('--bar-blur', `${barBlurInput.value}px`);
    };
  }

  // Hydrate Bar invisible checkbox
  const barInvisible = getStoredBarInvisible();
  const barInvisibleInput = document.getElementById('config-bar-invisible');
  if (barInvisibleInput) {
    barInvisibleInput.checked = barInvisible;
    barInvisibleInput.onchange = () => {
      const bar = document.querySelector('.terminal-section');
      const results = document.getElementById('live-results');
      if (barInvisibleInput.checked) {
        if (bar) bar.classList.add('bar-invisible');
        if (results) results.classList.add('bar-invisible');
      } else {
        if (bar) bar.classList.remove('bar-invisible');
        if (results) results.classList.remove('bar-invisible');
      }
    };
  }

  // Hydrate Bar text center checkbox
  const barTextCenter = getStoredBarTextCenter();
  const barTextCenterInput = document.getElementById('config-bar-text-center');
  if (barTextCenterInput) {
    barTextCenterInput.checked = barTextCenter;
    barTextCenterInput.onchange = () => {
      const content = document.querySelector('.content');
      if (content) {
        if (barTextCenterInput.checked) {
          content.classList.add('text-center');
        } else {
          content.classList.remove('text-center');
        }
      }
      if (typeof updateFocusIndicator === 'function') {
        updateFocusIndicator();
      }
    };
  }

  // Hydrate Cursor block checkbox
  const cursorBlock = getStoredCursorBlock();
  const cursorBlockInput = document.getElementById('config-cursor-block');
  if (cursorBlockInput) {
    cursorBlockInput.checked = cursorBlock;
    cursorBlockInput.onchange = () => {
      if (typeof updateFocusIndicator === 'function') {
        updateFocusIndicator();
      }
    };
  }

  // Hydrate Focus Underline dropdown mode
  const focusIndicatorMode = getStoredFocusIndicatorMode();
  const focusIndicatorSelect = document.getElementById('config-focus-indicator-mode');
  if (focusIndicatorSelect) {
    focusIndicatorSelect.value = focusIndicatorMode;
    focusIndicatorSelect.onchange = () => {
      // Re-trigger indicator update to preview styling changes live
      if (typeof updateFocusIndicator === 'function') {
        updateFocusIndicator();
      }
    };
  }

  // Hydrate layout and position controls
  const mode = getStoredBarPositionMode();
  const preset = getStoredBarPositionPreset();
  const snapMode = getStoredBarSnapMode();
  
  _tempCustomX = Number(getStoredBarCustomX());
  _tempCustomY = Number(getStoredBarCustomY());

  const modeSelect = document.getElementById('config-bar-position-mode');
  const presetSelect = document.getElementById('config-bar-position-preset');
  const snapSelect = document.getElementById('config-bar-snap-mode');

  if (modeSelect) modeSelect.value = mode;
  if (presetSelect) presetSelect.value = preset;
  if (snapSelect) snapSelect.value = snapMode;

  const presetContainer = document.getElementById('bar-preset-selection-container');
  const snapContainer = document.getElementById('bar-snap-selection-container');

  const updatePositionUI = () => {
    const activeMode = modeSelect.value;
    if (activeMode === 'preset') {
      if (presetContainer) presetContainer.classList.remove('hidden');
      if (snapContainer) snapContainer.classList.add('hidden');
      _applyLivePositionPreset(presetSelect.value);
    } else {
      if (presetContainer) presetContainer.classList.add('hidden');
      if (snapContainer) snapContainer.classList.remove('hidden');
      _applyLivePositionCustom(_tempCustomX, _tempCustomY);
    }
    _updateDragIndicator();
  };

  if (modeSelect) modeSelect.onchange = updatePositionUI;
  if (presetSelect) {
    presetSelect.onchange = () => {
      _applyLivePositionPreset(presetSelect.value);
    };
  }

  updatePositionUI();
  
  // Hydrate Glossy Mode
  const glossyMode = getStoredGlossyMode();
  const glossyInput = document.getElementById('config-enable-glossy');
  if (glossyInput) {
    glossyInput.checked = glossyMode;
    glossyInput.onchange = () => {
      if (glossyInput.checked) {
        document.documentElement.classList.add('glassy-mode');
      } else {
        document.documentElement.classList.remove('glassy-mode');
      }
    };
  }

  // Hydrate Background Setup
  const bgType = getStoredBackgroundType();
  const bgTypeSelect = document.getElementById('config-bg-type');
  const bgUrlInput = document.getElementById('config-bg-url');
  const urlContainer = document.getElementById('bg-url-input-container');
  const fileContainer = document.getElementById('bg-file-input-container');
  const fileStatus = document.getElementById('bg-file-status');
  
  if (bgTypeSelect) {
    bgTypeSelect.value = bgType;
    if (bgUrlInput) bgUrlInput.value = getStoredBackgroundUrl();
    
    const updateBgUI = () => {
      const type = bgTypeSelect.value;
      if (type === 'img-url' || type === 'vid-url') {
        if (urlContainer) urlContainer.classList.remove('hidden');
        if (fileContainer) fileContainer.classList.add('hidden');
      } else if (type === 'img-file' || type === 'vid-file') {
        if (urlContainer) urlContainer.classList.add('hidden');
        if (fileContainer) fileContainer.classList.remove('hidden');
        // Update file status message asynchronously
        if (typeof getBackgroundBlob === 'function') {
          getBackgroundBlob().then(blob => {
            if (blob && fileStatus) {
              fileStatus.textContent = `Stored file: ${blob.type} (${(blob.size/1024/1024).toFixed(2)} MB)`;
            } else if (fileStatus) {
              fileStatus.textContent = 'No file stored';
            }
          }).catch(() => {
            if (fileStatus) fileStatus.textContent = 'Error loading status';
          });
        }
      } else {
        if (urlContainer) urlContainer.classList.add('hidden');
        if (fileContainer) fileContainer.classList.add('hidden');
      }
    };
    bgTypeSelect.onchange = () => {
      updateBgUI();
      if (typeof syncCustomDropdowns === 'function') syncCustomDropdowns();
    };
    updateBgUI();
  }

  if (typeof syncCustomDropdowns === 'function') {
    syncCustomDropdowns();
  }

  // Hydrate Status Line Setup
  _tempStatusLineColor = getStoredStatusLineColor();
  const statusLineColorInput = document.getElementById('config-status-line-color');
  const resetStatusLineColorBtn = document.getElementById('btn-reset-status-line-color');
  const statusLineEl = document.getElementById('status-line');
  
  if (statusLineColorInput) {
    statusLineColorInput.value = _tempStatusLineColor || '#ffffff';
    statusLineColorInput.oninput = () => {
      _tempStatusLineColor = statusLineColorInput.value;
      if (statusLineEl) {
        statusLineEl.style.color = _tempStatusLineColor;
      }
    };
  }
  if (resetStatusLineColorBtn) {
    resetStatusLineColorBtn.onclick = () => {
      _tempStatusLineColor = '';
      if (statusLineColorInput) statusLineColorInput.value = '#ffffff';
      if (statusLineEl) {
        statusLineEl.style.removeProperty('color');
      }
    };
  }

  const statusLineOpacity = getStoredStatusLineOpacity();
  const statusLineOpacityInput = document.getElementById('config-status-line-opacity');
  const statusLineOpacityDisplay = document.getElementById('status-line-opacity-value-display');
  
  if (statusLineOpacityInput && statusLineOpacityDisplay) {
    statusLineOpacityInput.value = statusLineOpacity;
    statusLineOpacityDisplay.textContent = `${statusLineOpacity}%`;
    statusLineOpacityInput.oninput = () => {
      statusLineOpacityDisplay.textContent = `${statusLineOpacityInput.value}%`;
      document.documentElement.style.setProperty('--status-line-opacity', Number(statusLineOpacityInput.value) / 100);
    };
  }

  document.getElementById('customize-modal').classList.add('active');
  _updateDragIndicator();
}

function closeCustomizeModal() {
  // Revert active settings in case they cancelled
  applyTheme(getStoredTheme());
  
  // Revert glassy mode
  if (getStoredGlossyMode()) {
    document.documentElement.classList.add('glassy-mode');
  } else {
    document.documentElement.classList.remove('glassy-mode');
  }

  // Revert background
  if (typeof applyBackground === 'function') {
    applyBackground();
  }
  
  // Revert bar layout settings
  applyBarLayout();

  const bar = document.querySelector('.terminal-section');
  if (bar) bar.classList.remove('draggable-active', 'dragging');
  
  document.getElementById('customize-modal').classList.remove('active');
}

// ---- Render Themes ----
function _renderCustomizeModal() {
  const themeGrid = document.getElementById('customize-theme-grid');
  themeGrid.innerHTML = '';

  THEME_DEFS.forEach(({ value, label }) => {
    const btn = document.createElement('button');
    btn.className = 'customize-theme-btn' + (value === _selectedTheme ? ' active-theme' : '');
    btn.textContent = label;
    btn.addEventListener('click', () => {
      _selectedTheme = value;
      applyTheme(value);
      themeGrid.querySelectorAll('.customize-theme-btn').forEach(b => b.classList.remove('active-theme'));
      btn.classList.add('active-theme');
    });
    themeGrid.appendChild(btn);
  });
}

// ---- Save Customizations ----
function saveCustomize() {
  if (_selectedTheme) {
    saveTheme(_selectedTheme);
    applyTheme(_selectedTheme);
  }

  // Save Bar Material & Position Settings
  const opacityVal = document.getElementById('config-bar-opacity').value;
  const textOpacityVal = document.getElementById('config-text-opacity').value;
  const textCenterVal = document.getElementById('config-bar-text-center').checked;
  const blurVal = document.getElementById('config-bar-blur').value;
  const invisibleVal = document.getElementById('config-bar-invisible').checked;
  const focusIndicatorModeVal = document.getElementById('config-focus-indicator-mode').value;
  const modeVal = document.getElementById('config-bar-position-mode').value;
  const presetVal = document.getElementById('config-bar-position-preset').value;
  const snapVal = document.getElementById('config-bar-snap-mode').value;
  const cursorBlockVal = document.getElementById('config-cursor-block').checked;
  const roundingVal = document.getElementById('config-bar-rounding').value;

  saveBarOpacity(opacityVal);
  saveBarTextOpacity(textOpacityVal);
  saveBarTextCenter(textCenterVal);
  saveBarBlur(blurVal);
  saveBarInvisible(invisibleVal);
  saveFocusIndicatorMode(focusIndicatorModeVal);
  saveBarPositionMode(modeVal);
  saveBarPositionPreset(presetVal);
  saveBarSnapMode(snapVal);
  saveCursorBlock(cursorBlockVal);
  saveBarRounding(roundingVal);

  // Save Glossy mode and Background Settings
  const glossyEnabled = document.getElementById('config-enable-glossy').checked;
  const bgTypeVal = document.getElementById('config-bg-type').value;
  const bgUrlVal = document.getElementById('config-bg-url').value.trim();

  saveGlossyMode(glossyEnabled);
  saveBackgroundType(bgTypeVal);
  saveBackgroundUrl(bgUrlVal);

  saveStatusLineColor(_tempStatusLineColor);
  const statusLineOpacityInput = document.getElementById('config-status-line-opacity');
  if (statusLineOpacityInput) {
    saveStatusLineOpacity(statusLineOpacityInput.value);
  }

  if (glossyEnabled) {
    document.documentElement.classList.add('glassy-mode');
  } else {
    document.documentElement.classList.remove('glassy-mode');
  }

  if (typeof applyBackground === 'function') {
    applyBackground();
  }

  if (modeVal === 'custom') {
    saveBarCustomX(_tempCustomX);
    saveBarCustomY(_tempCustomY);
  }

  applyBarLayout();

  const bar = document.querySelector('.terminal-section');
  if (bar) bar.classList.remove('draggable-active', 'dragging');
  
  document.getElementById('customize-modal').classList.remove('active');
  showToast('Appearance updated', 'success');
}



/* ========================================
   Bar Material & Position Layout Handlers
   ======================================== */

let _isDragging = false;
let _tempCustomX = 50;
let _tempCustomY = 50;
let _dragOffsetX = 0;
let _dragOffsetY = 0;

/**
 * Reads all layout properties from storage and applies them to the document.
 */
function applyBarLayout() {
  const mode = getStoredBarPositionMode();
  const preset = getStoredBarPositionPreset();
  const x = getStoredBarCustomX();
  const y = getStoredBarCustomY();
  const opacity = getStoredBarOpacity();
  const textOpacity = getStoredBarTextOpacity();
  const textCenter = getStoredBarTextCenter();
  const blur = getStoredBarBlur();
  const invisible = getStoredBarInvisible();
  const rounding = getStoredBarRounding();

  // 1. Apply opacity, blur and rounding to CSS variables
  if (typeof applyBarRounding === 'function') {
    applyBarRounding(rounding);
  }
  const opacityFactor = Number(opacity) / 100;
  document.documentElement.style.setProperty('--bar-opacity-factor', opacityFactor);
  document.documentElement.style.setProperty('--bar-text-opacity', Number(textOpacity) / 100);
  document.documentElement.style.setProperty('--bar-blur', `${blur}px`);

  // Toggle invisible bar class
  const bar = document.querySelector('.terminal-section');
  const results = document.getElementById('live-results');
  if (bar) {
    if (invisible) bar.classList.add('bar-invisible');
    else bar.classList.remove('bar-invisible');
  }
  if (results) {
    if (invisible) results.classList.add('bar-invisible');
    else results.classList.remove('bar-invisible');
  }

  // 2. Apply position classes and inline styles to .content container
  const content = document.querySelector('.content');
  if (content) {
    // Reset all position classes
    const positionClasses = [
      'position-preset-center', 'position-preset-top-center', 'position-preset-bottom-center',
      'position-preset-left', 'position-preset-top-left', 'position-preset-bottom-left',
      'position-preset-right', 'position-preset-top-right', 'position-preset-bottom-right',
      'position-mode-custom'
    ];
    positionClasses.forEach(cls => content.classList.remove(cls));

    if (mode === 'preset') {
      content.classList.add(`position-preset-${preset}`);
      document.documentElement.style.removeProperty('--bar-custom-x');
      document.documentElement.style.removeProperty('--bar-custom-y');
    } else {
      content.classList.add('position-mode-custom');
      document.documentElement.style.setProperty('--bar-custom-x', `${x}%`);
      document.documentElement.style.setProperty('--bar-custom-y', `${y}%`);
    }

    if (textCenter) {
      content.classList.add('text-center');
    } else {
      content.classList.remove('text-center');
    }
  }

  // 3. Update the focus indicator underline length
  if (typeof updateFocusIndicator === 'function') {
    updateFocusIndicator();
  }

  // 4. Apply status line styling from storage
  const statusLineEl = document.getElementById('status-line');
  if (statusLineEl) {
    const customColor = getStoredStatusLineColor();
    if (customColor) {
      statusLineEl.style.color = customColor;
    } else {
      statusLineEl.style.removeProperty('color');
    }
  }
  const customOpacity = getStoredStatusLineOpacity();
  document.documentElement.style.setProperty('--status-line-opacity', Number(customOpacity) / 100);
}

function _applyLivePositionPreset(preset) {
  const content = document.querySelector('.content');
  if (!content) return;
  
  const positionClasses = [
    'position-preset-center', 'position-preset-top-center', 'position-preset-bottom-center',
    'position-preset-left', 'position-preset-top-left', 'position-preset-bottom-left',
    'position-preset-right', 'position-preset-top-right', 'position-preset-bottom-right',
    'position-mode-custom'
  ];
  positionClasses.forEach(cls => content.classList.remove(cls));
  content.classList.add(`position-preset-${preset}`);
}

function _applyLivePositionCustom(x, y) {
  const content = document.querySelector('.content');
  if (!content) return;
  
  const positionClasses = [
    'position-preset-center', 'position-preset-top-center', 'position-preset-bottom-center',
    'position-preset-left', 'position-preset-top-left', 'position-preset-bottom-left',
    'position-preset-right', 'position-preset-top-right', 'position-preset-bottom-right'
  ];
  positionClasses.forEach(cls => content.classList.remove(cls));
  content.classList.add('position-mode-custom');
  
  document.documentElement.style.setProperty('--bar-custom-x', `${x}%`);
  document.documentElement.style.setProperty('--bar-custom-y', `${y}%`);
}

function setupBarDragHandler() {
  const bar = document.querySelector('.terminal-section');
  if (!bar) return;

  if (bar._dragListenersAttached) return;
  bar._dragListenersAttached = true;

  const onStart = (e) => {
    // Only drag if custom mode is selected and customize modal is open
    const mode = document.getElementById('config-bar-position-mode').value;
    const isCustomizeActive = document.getElementById('customize-modal').classList.contains('active');
    if (mode !== 'custom' || !isCustomizeActive) return;

    const content = document.querySelector('.content');
    if (content) {
      const rect = content.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      _dragOffsetX = clientX - centerX;
      _dragOffsetY = clientY - centerY;
    } else {
      _dragOffsetX = 0;
      _dragOffsetY = 0;
    }

    _isDragging = true;
    document.body.classList.add('dragging-bar');
    bar.classList.add('dragging');
    e.preventDefault();
  };

  const onMove = (e) => {
    if (!_isDragging) return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const targetCenterX = clientX - _dragOffsetX;
    const targetCenterY = clientY - _dragOffsetY;

    let xPct = (targetCenterX / window.innerWidth) * 100;
    let yPct = (targetCenterY / window.innerHeight) * 100;

    // Snapping options
    const snapMode = document.getElementById('config-bar-snap-mode').value;
    if (snapMode === 'grid-5') {
      xPct = Math.round(xPct / 5) * 5;
      yPct = Math.round(yPct / 5) * 5;
    } else if (snapMode === 'grid-10') {
      xPct = Math.round(xPct / 10) * 10;
      yPct = Math.round(yPct / 10) * 10;
    }

    // Guard coordinates bounding box
    xPct = Math.max(5, Math.min(95, xPct));
    yPct = Math.max(5, Math.min(95, yPct));

    _tempCustomX = xPct;
    _tempCustomY = yPct;

    _applyLivePositionCustom(xPct, yPct);
  };

  const onEnd = () => {
    if (!_isDragging) return;
    _isDragging = false;
    document.body.classList.remove('dragging-bar');
    bar.classList.remove('dragging');
  };

  // Mouse Listeners
  bar.addEventListener('mousedown', onStart);
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onEnd);

  // Touch Listeners
  bar.addEventListener('touchstart', onStart, { passive: false });
  window.addEventListener('touchmove', onMove, { passive: false });
  window.addEventListener('touchend', onEnd);
}

function _updateDragIndicator() {
  const modeSelect = document.getElementById('config-bar-position-mode');
  const isCustomizeActive = document.getElementById('customize-modal').classList.contains('active');
  const bar = document.querySelector('.terminal-section');
  if (bar && modeSelect) {
    const mode = modeSelect.value;
    if (mode === 'custom' && isCustomizeActive) {
      bar.classList.add('draggable-active');
    } else {
      bar.classList.remove('draggable-active');
    }
  }
}
