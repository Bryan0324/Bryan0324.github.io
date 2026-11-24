import assert from 'node:assert/strict';

// Run against `npm run dev`: production bundling alone cannot catch missing
// stylesheet imports in Astro's development HTML (for example virtual CSS).
const base = process.env.DEV_URL || 'http://localhost:4321';
const page = await fetch(base);
assert.equal(page.status, 200, 'Development homepage must load');
const html = await page.text();
assert.ok(html.includes('/src/styles/yun.css'), 'Development HTML must load the Yun stylesheet');
const response = await fetch(new URL('/src/styles/yun.css?direct', base));
assert.equal(response.status, 200, 'Yun stylesheet must be served');
assert.match(response.headers.get('content-type') || '', /text\/css/);
const css = await response.text();
for (const selector of ['#banner', '.sidebar', '.post-card', 'html.dark', 'html.sunset', '--yun-bg-image']) {
  assert.ok(css.includes(selector), `Missing native Yun style: ${selector}`);
}
assert.ok(html.includes('--yun-primary:'), 'Theme configuration must supply CSS variables');
console.log('Verified development HTML imports native Yun CSS and theme variables.');
