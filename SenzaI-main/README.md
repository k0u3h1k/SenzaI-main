# SenzaI ⚡

A keyboard-centric, distraction-free start page and quicklink launcher for web browsers. It replaces the default new tab page with a lightweight terminal-like interface.

SenzaI runs entirely in your browser, works offline, and respects your privacy.

## Features

- **Keyboard-driven**: Focus the bar instantly, auto-complete suggestions, browse history, and manage tabs without a mouse.
- **Glossy Aesthetics**: Optional glassmorphism visual mode providing a premium frosted glass design.
- **Custom Backgrounds**: Upload local images, remote video loops, or short looping live video clips (2-10 seconds) memory-efficiently (IndexedDB storage, visibility-aware pausing, automatic URL release).
- **Status Line Customization**: Customize the text color and opacity of the clock/greeting status line directly within the Appearance menu to guarantee readability on custom backgrounds.
- **Custom Aliases**: Map keyword shortcuts (e.g. `inbox`) to jump directly to target URLs.
- **Syntax Highlighting**: Real-time coloring for system commands, search engines, bookmarks, URLs, and math equations.
- **Custom Positioning**: Drag-and-drop the launcher anywhere on the screen with preset alignments (center, top-left, bottom, etc.) and snap grid options.
- **Offline Favicons**: Uses the browser's native favicon cache for fast and local icon loading.
- **AST Calculator**: A secure, inline calculator that does not use `eval()` or `new Function()`, fully complying with modern browser Extension policies.
- **Multiple Theme Presets**: Switch instantly between Everforest, Dracula, Nord, Gruvbox, Tokyo Night, Rose Pine, Cyberpunk, and more.

## Installation

1. Clone or download this repository:
   ```bash
   git clone {repo_Link}
   cd SenzaI-Main
   ```
2. Build the manifest for your browser:
   ```bash
   # Chrome
   node build.js chrome

   # Firefox
   node build.js firefox

   # Opera
   node build.js opera
   ```
3. Load the extension in your browser:
   - **Chrome / Opera**: Go to `chrome://extensions`, enable **Developer mode**, click **Load unpacked**, and select this folder.
   - **Firefox**: Go to `about:debugging#/runtime/this-firefox`, click **Load Temporary Add-on**, and choose `manifest.json` from this folder.

## Keybinds & Commands

### Dormant Mode (unfocused)
- `Space` / `Enter` — Focus and wake the input bar
- `Arrow Up` / `Arrow Down` — Focus the bar and begin history traversal
- `1` - `9` — Instantly launch corresponding quicklink bookmark
- `t` — Open a new tab (configurable)
- `x` — Close current tab (configurable)

### Active Mode (focused)
- `Esc` — Lock search bar (return to dormant mode)
- `Tab` / `Right Arrow` — Autocomplete suggestion
- `Arrow Up` / `Arrow Down` — Navigate search suggestions / history
- `Enter` — Run command, go to URL, or search

### System Commands
Type these directly into the input bar and press `Enter`:
- `:config` — Configure settings (shortcuts, clock format, autofocus, default search engines, backup)
- `:customize` — Adjust layout, theme presets, opacity, custom fonts, glossy mode, backgrounds, and status line styling
- `:bookmarks` or `:bm` — Edit links (supports list UI or raw JSON)
- `:aliases` or `:al` — Configure custom keyword alias redirections
- `:history` — View/clear search history
- `:help` — View help manual
- `:reset` — Wipe all settings and restore defaults

### Theme Swapping
Type `:theme-name` (e.g. `:everforest`, `:mocha`, `:rose-pine`, `:cyberpunk`) to hot-swap appearance instantly.

## Development & Customization
Modify settings or styles as needed:
- `style.css`: Core layout and theme styling tokens
- `script/terminal.js`: Terminal input, autocomplete, and syntax highlighting logic
- `script/theme-init.js`: Inline script replacement to prevent theme flash without violating CSP

## License
<<<<<<< HEAD
Created by Abhidatta Benda.
=======
 Created by Abhidatta Benda.
>>>>>>> 13efa0b031e118eb37f4a53e8e7e2fdf9a9cdff7
