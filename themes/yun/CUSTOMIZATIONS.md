# Customizations Made to hexo-theme-yun

This document tracks all custom modifications made to the original hexo-theme-yun theme.

## Table of Contents
- [Search Enhancements](#search-enhancements)
- [Visual Effects](#visual-effects)
- [Comments Integration](#comments-integration)
- [Theme Toggle](#theme-toggle)
- [Multi-Mode Theme System](#multi-mode-theme-system)
- [Configuration](#configuration)

---

## Search Enhancements

### Local Search Improvements
**Files Modified:**
- `scripts/helpers/yun-config.js`
- `source/js/search/local-search.js`

**Changes:**
- Added null safety guard for `local_search.path` configuration to prevent TypeError when config is missing
- Implemented auto-trigger search functionality on input change
- Added Enter key support for triggering search
- Removed search button UI element in favor of input-only interface

**Configuration Required:**
```yaml
# In _config.yml (root)
search:
  path: search.xml
  field: post

# In _config.yun.yml
local_search:
  enable: true
  trigger: auto  # triggers search on typing
```

---

## Visual Effects

### Fireworks Animation
**Files Modified:**
- `source/js/ui/fireworks.js`
- `layout/_partial/background.pug`
- `source/css/_components/ui.styl`
- `scripts/helpers/yun-config.js`

**Changes:**
- Reformatted fireworks code for better readability
- Fixed anime.js vendor path to `animejs@latest/lib/anime.min.js`
- Added wait mechanism for anime.js library to load
- Implemented customizable fireworks colors via configuration
- Added canvas pointer-events prevention to avoid click interference
- Triggers on click with animated particle bursts

**Configuration:**
```yaml
fireworks:
  enable: true
  colors:
    - "102, 167, 221"
    - "62, 131, 225"
    - "33, 78, 194"
    - "3, 28, 95"
    - "0, 8, 55"
```

### Aurora Mouse Trail Effect
**Files Created:**
- `source/js/ui/aurora.js` (new file)

**Files Modified:**
- `layout/_partial/background.pug`
- `source/css/_components/ui.styl`
- `scripts/helpers/yun-config.js`

**Changes:**
- Created custom aurora particle effect following mouse cursor
- Canvas-based implementation with gradient particles
- Pointer-events disabled to prevent interaction issues
- Configurable colors and enable/disable toggle

**Features:**
- Particle trail follows mouse movement
- Gradient effects with customizable colors
- Fade-out animation for particles
- Non-intrusive (pointer-events: none)

---

## Code Syntax Highlighting

### Prism.js Integration
**Files Modified:**
- `layout/_partial/head.pug`
- `source/js/hexo-theme-yun.js`
- `_vendors.yml`

**Changes:**
- Added Prism.js core library and language-specific components to head
- Implemented automatic syntax highlighting on page load
- Added pjax support for re-highlighting on dynamic page changes
- Loads language components for bash, python, yaml, and javascript

**Implementation Details:**

The head.pug now loads:
```jade
//- Load Prism.js for syntax highlighting
script(src='https://fastly.jsdelivr.net/npm/prismjs@1/prism.min.js')
script(src='https://fastly.jsdelivr.net/npm/prismjs@1/components/prism-bash.min.js')
script(src='https://fastly.jsdelivr.net/npm/prismjs@1/components/prism-python.min.js')
script(src='https://fastly.jsdelivr.net/npm/prismjs@1/components/prism-yaml.min.js')
script(src='https://fastly.jsdelivr.net/npm/prismjs@1/components/prism-javascript.min.js')
```

**Hexo Config Setup:**
The main Hexo configuration already has Prism.js enabled:
```yaml
syntax_highlighter: prism.js
prismjs:
  enable: true
  preprocess: true
  line_number: true
  tab_replace: ''
```

**Markdown Code Block Format:**
Use standard language identifiers in markdown:
````markdown
```bash
# Bash/shell script
pip install threads-py
```

```python
# Python code
from threads_py import ThreadsClient
```

```yaml
# YAML configuration
key: value
```
````

**Supported Languages:**
- `bash` or `shell` - Shell scripts
- `python` - Python code
- `yaml` or `yml` - YAML configuration
- `javascript` or `js` - JavaScript code

To add more language support, add additional script tags in head.pug:
```jade
script(src='https://fastly.jsdelivr.net/npm/prismjs@1/components/prism-[language].min.js')
```

**Automatic Highlighting:**
The hexo-theme-yun.js initializes highlighting:
1. On page load via `DOMContentLoaded` event
2. After pjax navigation via `pjax:complete` event
3. Calls `window.Prism.highlightAll()` to process all code blocks

**CSS Theme:**
Syntax highlighting colors are provided by:
- CDN: `https://fastly.jsdelivr.net/npm/prism-theme-vars/base.css`
- Configured in `_vendors.yml` as `prism_theme_vars`

Colors adapt to the current theme mode (light/dark/sunset) via CSS variables.

---

## Comments Integration

### Utterances Theme Synchronization
**Files Modified:**
- `layout/_third-party/comments/utterances.pug`

**Changes:**
- Added automatic theme sync between site mode and utterances iframe
- Supports all theme modes: `light`, `dark`, `auto`, and `time`
- Uses postMessage API to communicate with utterances iframe
- Detects system color scheme preference via `prefers-color-scheme`
- Listens for HTML class changes to catch auto/time mode transitions
- Syncs on theme toggle button clicks
- Re-checks theme after utterances ready event with delay

**Implementation Details:**
- Monitors `document.documentElement` class changes for "dark" class
- Considers `CONFIG.mode` setting and system preferences
- Sets utterances theme to `github-dark` or `github-light` accordingly
- Handles timing issues with delayed re-sync after iframe ready

**Configuration:**
```yaml
utterances:
  enable: true
  repo: your-username/your-repo
  issue-term: pathname
  theme: preferred-color-scheme  # initial theme, will auto-sync
```

---

## Theme Toggle

### Mode Toggle Button Control
**Files Modified:**
- `layout/_partial/sidebar.pug`
- `_config.yml` (theme default)

**Changes:**
- Changed mode toggle button visibility logic
- Previously only showed for `auto` and `time` modes
- Now shows for all modes when configured
- Added `mode_toggle.enable` setting for manual control
- Toggle renders when `mode` is set AND `mode_toggle.enable !== false`

**Configuration:**
```yaml
# mode: light | dark | auto | time
mode: time

# Toggle button for switching theme mode in sidebar
mode_toggle:
  enable: true  # set to false to hide toggle button
```

**Behavior:**
- When `mode_toggle.enable: true` (default): button shows if mode is set
- When `mode_toggle.enable: false`: button is hidden regardless of mode
- Works with all mode types: light, dark, auto, time

---

## Multi-Mode Theme System

### Sunset Mode & Extensible Architecture
**Files Created:**
- `source/js/ui/mode-handler.js` (new modular mode system)

**Files Modified:**
- `layout/_partial/layout.pug`
- `source/css/_variables/var.styl`
- `_config.yml` (theme default)
- `_config.yun.yml` (user config)

**Overview:**
Implemented a sunset theme mode as an independent third mode alongside light and dark, with a refactored architecture that makes adding new modes straightforward. The system now supports:
- **Light mode** (☀️): Default bright theme
- **Sunset mode** (🌅): Warm evening palette (5pm-8pm when using time mode)
- **Dark mode** (🌙): Night theme
- **Easy extensibility**: Add new modes by editing configuration object

### Sunset Mode Features

**Color Palette:**
- Primary: `#FF6B6B` (coral red)
- Background: `#FFF5E6` (warm cream)
- Block: `#FFE8D6` (light peach)
- Text: `#8B4513` (saddle brown)
- Links: `#FF8E53` (orange)
- Selection: `#FFB5E8` (light pink)

**Time Mode Integration:**
When `mode: time` is set, the theme automatically cycles based on time:
- **07:00-17:00** (7am-5pm): Light mode
- **17:00-20:00** (5pm-8pm): Sunset mode 🌅
- **20:00-07:00** (8pm-7am): Dark mode 🌙

**Background Images:**
Supports independent background images for each mode:
```yaml
bg_image:
  enable: true
  url: https://example.com/light-bg.jpg
  dark: https://example.com/dark-bg.jpg
  sunset: https://example.com/sunset-bg.jpg
  opacity: 1
```

### Extensible Mode System Architecture

**Configuration-Driven Design:**
The `mode-handler.js` uses a `MODE_CONFIG` object where new modes can be added:

```javascript
const MODE_CONFIG = {
  light: {
    name: 'light',
    class: '',           // No class for default
- [ ] Sunset mode displays correct colors and backgrounds
- [ ] Time mode switches to sunset at 5pm-8pm
- [ ] Toggle button cycles through all modes: light → sunset → dark → light
- [ ] Mode preference persists in localStorage
- [ ] New modes can be added by updating MODE_CONFIG

---

**Last Updated:** December 31
    name: 'sunset',
    class: 'sunset',     // CSS class: html.sunset
    icon: '🌅',
    next: 'dark'
  },
  dark: {
    name: 'dark',
    class: 'dark',
    icon: '🌙',
    next: 'light'
  }
  // Add new modes here by following the same pattern
};
```

**How to Add a New Mode:**

1. **Add to MODE_CONFIG** in `mode-handler.js`:
```javascript
midnight: {
  name: 'midnight',
  class: 'midnight',
  icon: '🌌',
  next: 'light'  // or any existing mode
}
```

2. **Add CSS Variables** in `source/css/_variables/var.styl`:
```stylus
html.midnight {
  --hty-mode: 'midnight';
  --hty-bg-color: #0a0e27;
  --hty-text-color: #b8c5d6;
  --post-block-bg-color: #141b2d;
  --smc-link-color: #6b9bd1;
  // ... more variables
}
```

3. **Add Color Configuration** in `_config.yun.yml`:
```yaml
colors:
  midnight:
    primary: '#6b9bd1'
    bg: '#0a0e27'
    block: '#141b2d'
    text: '#b8c5d6'
    link: '#89b4f8'
    selection_bg: '#1a2f5a'
```

4. **Optional: Add Background Image**:
```yaml
bg_image:
  midnight: https://example.com/midnight-bg.jpg
```

### Toggle Button Behavior

The mode toggle button now cycles through all defined modes in sequence:
- Automatically removes darken.js event listeners to prevent conflicts
- Uses `localStorage` with key `darken-mode` to persist user preference
- Cycles through modes in the order defined by the `next` property in `MODE_CONFIG`
- Works independently from `CONFIG.mode` setting (manual override)

**Integration with Time/Auto Modes:**
- `time` mode: Automatically applies mode based on hour, but manual toggle overrides
- `auto` mode: Uses system preference, manual toggle overrides
- Manual toggle preference persists in localStorage

### CSS Variables System

**Sunset Mode Variables:**
```stylus
html.sunset {
  --hty-mode: 'sunset';
  --hty-bg-color: #FFF5E6;
  --hty-text-color: #8B4513;
  --post-block-bg-color: #FFE8D6;
  --smc-link-color: #FF8E53;
  --yun-bg-image: url(hexo-config('bg_image.sunset'));
  --banner-line-color: #FF6B35;
  --post-card-bg-color: rgba(#FFE8D6, 0.9);
  --sidebar-bg-color: rgba(#FFE8D6, 0.95);
  // pagination, buttons, shadows, etc.
}
```

**Variable Categories:**
- Mode identifier: `--hty-mode`
- Colors: Background, text, links, blocks
- Banner styling: Line and character colors
- Post cards: Background and shadows
- Sidebar: Background color and image
- Pagination: Button colors and hover states

### ModeHandler Class API

**Methods:**
- `getCurrentMode()`: Returns current active mode name
- `applyMode(modeName)`: Applies specified mode to DOM
- `toggle()`: Cycles to next mode
- `init()`: Initializes handler and sets up toggle button
- `getModeConfig(modeName)`: Returns configuration for a mode
- `addMode(name, config)`: Dynamically add new mode (advanced)

**Usage Example:**
```javascript
// Access globally available handler
window.modeHandler.applyMode('sunset');
window.modeHandler.toggle(); // Switch to next mode
```

### Configuration

**Theme Config (_config.yun.yml):**
```yaml
# mode: light | dark | auto | time | sunset
# time mode schedule: 07:00-17:00 light, 17:00-20:00 sunset, 20:00-07:00 dark
mode: time  # or 'sunset' for static sunset mode

mode_toggle:
  enable: true

colors:
  sunset:
    primary: '#FF6B6B'
    bg: '#FFF5E6'
    block: '#FFE8D6'
    text: '#8B4513'
    link: '#FF8E53'
    selection_bg: '#FFB5E8'

bg_image:
  sunset: https://example.com/sunset-bg.jpg

sidebar:
  sunset_bg_image: https://example.com/sunset-sidebar.jpg

search:
  sunset_bg_image: https://example.com/sunset-search.jpg
```

### Implementation Details

**Initial Mode Detection (layout.pug):**
```javascript
// Time mode with sunset
if (CONFIG.mode === 'time') {
  const hour = new Date().getHours()
  if (hour >= 17 && hour < 20) {
    document.documentElement.classList.add('sunset')
  } else if (hour >= 20 || hour < 7) {
    document.documentElement.classList.add('dark')
  }
}
```

**Manual Toggle Override:**
The `mode-handler.js` loads after initial detection, allowing users to manually override the time-based or auto-based mode selection. The manual choice is saved to `localStorage` and persists across page loads.

### Benefits

1. **User Experience**: Smooth transition between day/evening/night themes
2. **Developer Experience**: Adding new modes requires minimal code
3. **Maintainability**: Configuration-driven approach keeps code DRY
4. **Extensibility**: No core logic changes needed for new modes
5. **Compatibility**: Works with existing darken.js infrastructure
6. **Performance**: Lightweight, class-based mode switching

---

## Configuration

### Package.json Updates
**File Modified:**
- `package.json` (root)

**Changes:**
- Updated `start` script to include `hexo clean` before generate
- Changed from `hexo generate && hexo server` to `hexo clean && hexo generate && hexo server`
- Ensures clean builds during development

### Frontmatter Reference Updates
**File Modified:**
- `themes/yun/post-template.md`

**Changes:**
- Documented how to write frontmatter for post
- Documented how to configure custom `type` entries in `_config.yun.yml` (color/icon) and reference via `type: <name>` in frontmatter

---

## Dependencies

### Required Packages
```json
{
  "hexo-generator-searchdb": "^1.5.0",  // for local search
  "hexo-render-pug": "^2.1.4",           // pug template rendering
  "hexo-renderer-stylus": "^3.0.1"       // stylus css processing
}
```

### CDN Vendors
- **anime.js**: `animejs@latest/lib/anime.min.js` (for fireworks)
- **darken.js**: `darken@1.5.0` (for theme switching)

---

## Notes

### Maintenance Considerations
1. **Search**: Ensure `hexo-generator-searchdb` plugin is installed and generates `search.xml`
2. **Fireworks**: Anime.js must load before fireworks initialization
3. **Utterances**: Theme sync requires iframe to emit 'ready' event
4. **Aurora**: Canvas-based, may impact performance on low-end devices

### Future Enhancements
- Consider adding aurora enable/disable toggle in config
- Add more fireworks customization options (speed, size, duration)
- Implement search result highlighting
- Add theme transition animations

---

## Testing Checklist

- [ ] Local search works on typing
- [ ] Search results display correctly
- [ ] Code blocks display with proper syntax highlighting colors
- [ ] Multiple language syntax highlighting works (bash, python, yaml, javascript)
- [ ] Syntax highlighting persists after pjax navigation
- [ ] Fireworks trigger on click with configured colors
- [ ] Aurora trail follows mouse smoothly
- [ ] Utterances comments respect theme changes
- [ ] Theme toggle button visibility controlled by config
- [ ] Theme switching updates utterances in real-time
- [ ] All modes work: light, dark, auto, time, sunset

---

**Last Updated:** January 4, 2026
**Base Theme Version:** hexo-theme-yun v1.10.11
