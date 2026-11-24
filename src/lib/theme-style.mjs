// Configuration -> CSS custom properties. Layout and selectors live in native CSS.
function rgb(hex) {
  if (!/^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(hex)) throw new Error(`Expected a hex theme color, received ${hex}`);
  const value = hex.length === 4 ? [...hex.slice(1)].map((c) => c + c).join('') : hex.slice(1);
  return value.match(/../g).map((c) => parseInt(c, 16));
}

// Preserve Yun's HSL lightness adjustments, including its relative lighten().
export function adjustLightness(hex, amount, relative = true) {
  const channels = rgb(hex).map((c) => c / 255);
  const max = Math.max(...channels), min = Math.min(...channels);
  const delta = max - min;
  const light = (max + min) / 2;
  const saturation = delta === 0 ? 0 : delta / (light < 0.5 ? 2 * light : 2 - 2 * light);
  let hue = 0;
  if (delta) {
    const [r, g, b] = channels;
    hue = max === r ? 60 * (g - b) / delta : max === g ? 60 * (b - r) / delta + 120 : 60 * (r - g) / delta + 240;
  }
  const percent = light * 100;
  const l = Math.max(0, Math.min(100, percent + (relative ? (amount > 0 ? 100 - percent : percent) * amount / 100 : amount))) / 100;
  const s = saturation * 100 / 100;
  const high = l <= 0.5 ? l * (s + 1) : l + s - l * s;
  const low = 2 * l - high;
  const h = ((hue % 360 + 360) % 360) / 360;
  const channel = (position) => {
    if (position < 0) position++;
    if (position > 1) position--;
    const value = position * 6 < 1 ? low + (high - low) * position * 6
      : position * 2 < 1 ? high
      : position * 3 < 2 ? low + (high - low) * (2 / 3 - position) * 6 : low;
    return Number((value * 255).toFixed(0)).toString(16).padStart(2, '0');
  };
  return '#' + [h + 1 / 3, h, h - 1 / 3].map(channel).join('');
}

export function themeStyle(theme) {
  const vars = {};
  const set = (name, value) => { vars[`--yun-${name}`] = String(value); };
  const color = (name, value) => { set(name, value); set(`${name}-rgb`, rgb(value).join(' ')); };
  const image = (url) => url ? `url(${JSON.stringify(url)})` : 'none';
  color('primary', theme.colors.primary);
  for (const amount of [20, 30, 80]) color(`primary-light-${amount}`, adjustLightness(theme.colors.primary, amount));
  color('primary-dark-10', adjustLightness(theme.colors.primary, -10, false));
  color('dark-block', theme.colors.dark.block);
  set('background', theme.colors.bg);
  set('selection', theme.colors.selection_bg);
  for (const [name, key] of Object.entries({ background: 'bg', block: 'block', text: 'text', link: 'link', banner: 'banner' })) {
    set(`sunset-${name}`, theme.colors.sunset[key]);
  }
  set('footer-icon-color', theme.footer.icon.color);
  for (const [name, key] of Object.entries({ serif: 'serif', sans: 'sans_serif', mono: 'monospace' })) {
    set(`font-${name}`, theme.font[key].family);
    if (key !== 'monospace') set(`font-${name}-weight`, theme.font[key].weight);
  }
  for (const [mode, key] of Object.entries({ light: 'url', dark: 'dark', sunset: 'sunset' })) set(`image-${mode}`, image(theme.bg_image[key]));
  for (const [mode, key] of Object.entries({ light: 'bg_image', dark: 'dark_bg_image', sunset: 'sunset_bg_image' })) set(`sidebar-${mode}`, image(theme.sidebar[key]));
  set('sidebar-position', theme.sidebar.bg_position);
  set('card-opacity', theme.post_card.opacity);
  set('background-opacity', theme.bg_image.opacity);
  set('background-display', theme.bg_image.enable ? 'block' : 'none');
  set('background-blur', theme.bg_image.blur || '0px');
  set('avatar-radius', theme.avatar.rounded ? '50%' : '0');
  set('banner-border', theme.banner.border ? '1px' : '0px');
  set('scroll-behavior', theme.smoothScroll ? 'smooth' : 'auto');
  set('toc-child-height', theme.toc.collapse ? '0' : 'none');
  set('toc-child-overflow', theme.toc.collapse ? 'hidden' : 'visible');
  set('footer-animation', theme.footer.icon.animated ? 'iconAnimate' : 'none');
  set('search-filter', theme.search.modal ? 'blur(30px)' : 'none');
  set('search-light', theme.search.modal ? 'none' : image(theme.search.bg_image));
  set('search-dark', theme.search.modal ? 'none' : image(theme.search.dark_bg_image));
  for (const [name, fallback] of Object.entries({ default: 'auto', pointer: 'pointer', text: 'text' })) {
    set(`cursor-${name}`, theme.cursor.enable ? `${image(theme.cursor[name])}, ${fallback}` : fallback);
  }
  // Assigned to an HTML style attribute; Astro escapes the attribute value.
  return Object.entries(vars).map(([name, value]) => `${name}:${value}`).join(';');
}
