/**
 * SenzaI - Early Theme Initialization
 * Loads the theme from localStorage and applies it to the document element
 * immediately to prevent a flash of light/dark theme during loading.
 * Separated into an external file to comply with MV3 CSP regulations.
 */
(function() {
  try {
    const theme = localStorage.getItem('theme') || 'dark';
    const backgroundByTheme = {
      light:                '#ffffff',
      dark:                 '#2d3436',
      black:                '#000000',
      nord:                 '#2e3440',
      gruvbox:              '#282828',
      'tokyo-night':        '#1a1b26',
      dracula:              '#282a36',
      kanagawa:             '#1f1f28',
      'catppuccin-frappe':    '#303446',
      'catppuccin-macchiato': '#24273a',
      'catppuccin-mocha':     '#1e1e2e',
      'rose-pine':            '#191724',
      'rose-pine-moon':       '#232136',
      'rose-pine-dawn':       '#faf4ed',
      'everforest':           '#2d353b',
      'everforest-light':     '#fdf6e3',
      'one-dark':             '#282c34',
      'cyberpunk':            '#0f0f1b'
    };
    const darkThemes = new Set([
      'dark', 'black', 'nord', 'gruvbox', 'tokyo-night', 'dracula', 'kanagawa', 
      'catppuccin-frappe', 'catppuccin-macchiato', 'catppuccin-mocha',
      'rose-pine', 'rose-pine-moon', 'everforest', 'one-dark', 'cyberpunk'
    ]);
    document.documentElement.style.backgroundColor = backgroundByTheme[theme] || '#2d3436';
    document.documentElement.style.colorScheme = darkThemes.has(theme) ? 'dark' : 'light';
    document.documentElement.classList.add(theme + '-mode');
  } catch (e) {}
})();
