import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import defaults from '../src/lib/theme-defaults.mjs';
import { adjustLightness, themeStyle } from '../src/lib/theme-style.mjs';

test('native theme colors preserve Yun HSL lightening and absolute darkening', () => {
  assert.equal(adjustLightness('#0078e7', 20), '#2094ff');
  assert.equal(adjustLightness('#0078e7', 30), '#3ca1ff');
  assert.equal(adjustLightness('#0078e7', 80), '#c7e4ff');
  assert.equal(adjustLightness('#0078e7', -10, false), '#005eb4');
  assert.equal(adjustLightness('#f00', 20), '#ff3333');
  assert.equal(adjustLightness('#000', 20), '#333333');
  assert.equal(adjustLightness('#fff', 30), '#ffffff');
  assert.equal(adjustLightness('#123456', -10, false), '#091a2c');
});

test('every native Yun variable is supplied by configuration or the stylesheet', () => {
  const css = readFileSync(new URL('../src/styles/yun.css', import.meta.url), 'utf8');
  const definitions = new Set([...`${css}\n${themeStyle(defaults)}`.matchAll(/(--yun-[\w-]+)\s*:/g)].map((match) => match[1]));
  for (const [, name] of css.matchAll(/var\((--yun-[\w-]+)/g)) {
    assert.ok(definitions.has(name), `Undefined CSS variable: ${name}`);
  }
  assert.doesNotMatch(css, /yun-marker|hexo-config|0\.873/);
});

test('theme settings remain configurable after removing the Stylus compiler', () => {
  const config = structuredClone(defaults);
  config.colors.primary = '#f00';
  config.bg_image.enable = false;
  config.bg_image.url = 'https://example.com/background.png';
  config.font.serif.family = 'Georgia, serif';
  config.banner.border = false;
  config.avatar.rounded = false;
  config.toc.collapse = false;
  config.footer.icon.animated = false;
  config.smoothScroll = false;
  config.search.modal = false;
  config.search.bg_image = '/search.png';
  config.cursor.enable = true;
  config.cursor.pointer = '/pointer.cur';
  const style = themeStyle(config);
  for (const declaration of [
    '--yun-primary-rgb:255 0 0', '--yun-primary-light-30:#ff4d4d',
    '--yun-background-display:none', '--yun-image-light:url("https://example.com/background.png")',
    '--yun-font-serif:Georgia, serif', '--yun-banner-border:0px', '--yun-avatar-radius:0',
    '--yun-toc-child-height:none', '--yun-footer-animation:none', '--yun-scroll-behavior:auto',
    '--yun-search-filter:none', '--yun-search-light:url("/search.png")',
    '--yun-cursor-pointer:url("/pointer.cur"), pointer',
  ]) assert.ok(style.includes(declaration), `Missing ${declaration}`);
});
