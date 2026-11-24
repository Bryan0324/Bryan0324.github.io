// Build isolated fixtures so configuration checks never overwrite the user's site.
import assert from 'node:assert/strict';
import { cpSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { parse, stringify } from 'yaml';

const root = process.cwd();
const temp = join(tmpdir(), 'opencode');
mkdirSync(temp, { recursive: true });
const sandbox = mkdtempSync(join(temp, 'yun-config-'));
const original = parse(readFileSync('_config.yml', 'utf8'));
const write = (path, content) => {
  const file = join(sandbox, path);
  mkdirSync(resolve(file, '..'), { recursive: true });
  writeFileSync(file, content);
};
const html = (path) => readFileSync(join(sandbox, 'dist', path), 'utf8').replaceAll('&quot;', '"').replaceAll('&#34;', '"').replaceAll('&#39;', "'").replaceAll('&amp;', '&');
const count = (text, pattern) => [...text.matchAll(pattern)].length;
const has = (text, value) => assert.ok(text.includes(value), `Missing ${value}`);
const absent = (text, value) => assert.ok(!text.includes(value), `Unexpected ${value}`);
function build(config) {
  write('_config.yml', stringify(config));
  // Markdown rendering depends on configuration (for example code line numbers).
  rmSync(join(sandbox, '.astro'), { recursive: true, force: true });
  rmSync(join(sandbox, '.astro-cache'), { recursive: true, force: true });
  const result = spawnSync(process.execPath, [join(root, 'node_modules/astro/astro.js'), 'build', '--silent'], {
    cwd: sandbox, encoding: 'utf8', timeout: 180000,
  });
  assert.equal(result.status, 0, `${result.error || ''}\n${result.stdout}\n${result.stderr}`);
}

try {
  for (const directory of ['src', 'integrations']) cpSync(directory, join(sandbox, directory), { recursive: true });
  for (const file of ['astro.config.mjs', 'package.json', 'tsconfig.json']) copyFileSync(file, join(sandbox, file));
  write('astro.config.mjs', readFileSync('astro.config.mjs', 'utf8').replace("output: 'static',", "output: 'static', cacheDir: './.astro-cache', vite: { cacheDir: './.vite-cache' },"));
  symlinkSync(join(root, 'node_modules'), join(sandbox, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir');
  write('source/about/index.md', '---\ntitle: About\n---\nAbout');
  write('source/about/site.md', '---\ntitle: Site\n---\nSite');
  write('source/friends/index.md', '---\ntitle: Friends\nlinks:\n  - name: Test Friend\n    url: https://example.com\n---\n');
  for (const [id, date] of [['a', '2026-01-01T00:30:00+08:00'], ['b', '2026-01-02'], ['c', '2026-01-03'], ['future', '2100-01-02']]) {
    write(`source/_posts/${id}/index.md`, `---\ntitle: Fixture ${id}\ndate: '${date}'\nupdated: '2101-01-01'\ntags: [Alpha, Beta]\ncategories: [Notes]\n---\n# Level One\n\n## Level Two\n\n### Level Three\n\n\`\`\`js\nconst answer = 42;\n\`\`\`\n\n\`\`\`mermaid\ngraph LR\n A --> B\n\`\`\`\n`);
  }
  const off = structuredClone(original);
  off.future = false;
  off.index_generator.per_page = 0;
  off.per_page = 0;
  for (const path of ['mode_toggle', 'avatar', 'banner', 'fireworks', 'scrollreveal', 'bg_image', 'local_search', 'mermaid', 'comment']) off.theme[path].enable = false;
  off.theme.sidebar.tagcloud.enable = false;
  off.theme.font.cdn.enable = false;
  off.theme.footer.powered.enable = false;
  off.theme.footer.live_time.enable = false;
  off.theme.creative_commons.post = false;
  off.theme.codeblock.prismjs.line_number = false;
  for (const key of Object.keys(off.theme.post_meta)) off.theme.post_meta[key] = false;
  build(off);
  const disabledHome = html('index.html');
  assert.equal(count(disabledHome, /class="post-card"/g), 3);
  assert.equal(existsSync(join(sandbox, 'dist/page/2/index.html')), false);
  for (const marker of ['id="banner"', 'class="fireworks"', 'id="toggle-mode-btn"', 'class="site-author-avatar"', 'tag-cloud-tags', 'id="search-dialog"', 'class="powered"', 'id="live-time"', 'class="post-card-category"', 'class="post-card-tag"', '<time ']) absent(disabledHome, marker);
  has(disabledHome, 'data-mermaid="false"');
  has(disabledHome, 'data-reveal="false"');
  absent(disabledHome, 'fonts.googleapis.com');
  const disabledPost = html('2026/01/01/a/index.html');
  for (const marker of ['id="giscus"', 'post-copyright', 'line-numbers-rows']) absent(disabledPost, marker);
  const disabledIndex = JSON.parse(readFileSync(join(sandbox, 'dist/search.json'), 'utf8'));
  assert.equal(disabledIndex.length, 3);
  console.log('Configuration: disabled features, future filtering, and zero pagination passed.');

  const custom = structuredClone(original);
  Object.assign(custom, { title: 'Config Title', subtitle: 'Config Subtitle', description: 'Config Description', author: 'Config Author', language: 'en', timezone: 'UTC', url: 'https://example.com', permalink: 'notes/:year/:month/:day/:title/', future: true, per_page: 2, category_map: { Notes: 'mapped-notes' }, tag_map: { Alpha: 'mapped-alpha' } });
  custom.index_generator.per_page = 1;
  const t = custom.theme;
  t.mode = 'sunset';
  t.favicon = '/custom-icon.png';
  t['404'].message = 'Custom missing page';
  t.sidebar.tagcloud.amount = 1;
  t.toc = { min_depth: 2, max_depth: 2, list_number: false, collapse: false };
  t.avatar.url = '/custom-avatar.png';
  t.avatar.rounded = false;
  t.social = [{ name: 'Custom Social', link: 'https://example.com/social', icon: 'ri:star-line', color: '#123456' }];
  t.pages = [{ name: 'Custom Page', url: '/about/', icon: 'ri:book-line', color: '#654321' }];
  t.anonymous_image = '/custom-fallback.png';
  t.menu.home = { path: '/about/', icon: 'ri:star-line' };
  t.menu.list = [{ type: 'tags', path: '/tags/', icon: 'ri:star-line' }];
  t.menu.custom = { title: 'Custom Menu', path: 'https://example.com/menu', icon: 'ri:star-line' };
  t.archive.last_word = 'Custom archive end';
  t.tags = { Alpha: '#123456' };
  t.categories = { Notes: 'purple' };
  t.post_meta.item_text = true;
  t.creative_commons.license = 'by';
  t.creative_commons.language = 'deed.en';
  t.icons = { category: 'ri:star-line', tag: 'ri:book-line' };
  t.banner.title = 'Custom Banner';
  t.banner.border = false;
  t.banner.cloud.enable = false;
  t.banner.go_down.enable = false;
  t.font.cdn.lib = ['https://example.com/font.css'];
  t.font.serif = { family: 'Georgia, serif', weight: 700 };
  t.font.sans_serif = { family: 'Arial, sans-serif', weight: 500 };
  t.font.monospace.family = 'monospace';
  t.fireworks.colors = ['255, 0, 0'];
  t.cursor.enable = true;
  t.smoothScroll = false;
  t.post_card.opacity = 0.4;
  t.bg_image.opacity = 0.3;
  t.footer.since = 2000;
  t.footer.icon = { name: 'ri:star-line', animated: false, color: '#abcdef' };
  t.footer.live_time = { enable: true, prefix: 'Custom uptime', suffix: 'Custom suffix', start_time: '2025-01-01T00:00:00' };
  t.search.modal = false;
  t.search.placeholder = 'Custom search';
  t.giscus.theme = 'light';
  t.giscus.loading = 'eager';
  build(custom);
  const home = html('index.html');
  assert.equal(count(home, /class="post-card"/g), 1);
  assert.ok(existsSync(join(sandbox, 'dist/page/4/index.html')));
  assert.equal(count(html('archives/index.html'), /class="post-item"/g), 2);
  for (const marker of ['Config Title', 'Config Subtitle', 'Config Description', 'Config Author', 'lang="en"', 'class="sunset"', 'https://example.com/', '/custom-icon.png', '/custom-avatar.png', 'Custom Social', 'Custom Page', 'Custom Menu', 'Custom Banner', 'Custom search', 'Custom uptime', 'Custom suffix', '2025-01-01T00:00:00.000Z', 'https://example.com/font.css', '255, 0, 0', '--yun-card-opacity:0.4', '--yun-background-opacity:0.3', '--yun-font-serif:Georgia, serif', '--yun-font-serif-weight:700', '--yun-font-sans:Arial, sans-serif', '--yun-font-sans-weight:500', '--yun-font-mono:monospace', '--yun-banner-border:0px', '--yun-scroll-behavior:auto', '--yun-footer-icon-color:#abcdef', '--yun-search-filter:none']) has(home, marker);
  for (const marker of ['class="cloud"', 'id="goDown"']) absent(home, marker);
  const cloud = home.match(/<div class="tag-cloud-tags">([\s\S]*?)<\/div>/)[1];
  assert.equal(count(cloud, /<a /g), 1);
  has(cloud, '/tags/mapped-alpha/');
  has(home, '/categories/mapped-notes/');
  has(home, '--text-color:#123456');
  has(home, '--text-color:purple');
  has(html('archives/page/2/index.html'), 'Custom archive end');
  has(html('404.html'), 'Custom missing page');
  has(html('friends/index.html'), '/custom-fallback.png');
  const post = html('notes/2025/12/31/a/index.html');
  const toc = post.match(/<nav id="post-toc-wrap"[\s\S]*?<\/nav>/)[0];
  has(toc, 'Level Two');
  absent(toc, 'Level One');
  absent(toc, 'Level Three');
  absent(toc, 'toc-number');
  for (const marker of ['id="giscus"', '"loading":"eager"', '"theme":"light"', 'line-numbers-rows', 'licenses/by/4.0/deed.en', '發表於', '更新於']) has(post, marker);
  console.log('Configuration: custom metadata, routes, menus, fonts, TOC, copyright, comments and style bindings passed.');

  t.sidebar.tagcloud.amount = 0;
  t.giscus.enable = false;
  t.banner.cloud.enable = true;
  t.banner.cloud.color = '#123456';
  t.banner.go_down.enable = true;
  t.banner.go_down.icon = 'ri:star-line';
  build(custom);
  const zeroHome = html('index.html');
  const emptyCloud = zeroHome.match(/<div class="tag-cloud-tags">([\s\S]*?)<\/div>/)[1];
  assert.equal(count(emptyCloud, /<a /g), 0);
  has(zeroHome, 'class="cloud"');
  has(zeroHome, 'fill="#123456"');
  has(zeroHome, 'id="goDown"');
  absent(html('notes/2025/12/31/a/index.html'), 'id="giscus"');
  console.log('Configuration: zero tag limit, banner subfeatures and independent Giscus toggle passed.');
} finally {
  // Remove the junction first: never recurse into the real node_modules.
  rmSync(join(sandbox, 'node_modules'), { recursive: true, force: true });
  rmSync(sandbox, { recursive: true, force: true });
}
