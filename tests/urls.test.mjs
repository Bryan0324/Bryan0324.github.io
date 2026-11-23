import { test } from 'node:test';
import assert from 'node:assert/strict';
import { href, localDate, postPath, slugify } from '../src/lib/urls.mjs';

const config = { timezone: 'Asia/Taipei', permalink: ':year/:month/:day/:title/' };
test('preserves Hexo permalink spelling and Taipei dates in every build timezone', () => {
  assert.equal(postPath('a8-ais3-jr-Day3-Pwn', { date: '2026-08-06' }, config), '2026/08/06/a8-ais3-jr-Day3-Pwn');
  assert.equal(postPath('midnight', { date: '2026-01-05T00:30:00+08:00' }, config), '2026/01/05/midnight');
  assert.equal(localDate('2026-01-04 18:00:00 +0000', config.timezone).format('YYYY-MM-DD'), '2026-01-05');
  assert.equal(localDate('2025-12-25 00:00:00', config.timezone).toISOString(), '2025-12-24T16:00:00.000Z');
});
test('preserves legacy taxonomy URLs and HTML pages', () => {
  assert.equal(slugify('線性對數時間(n log n)'), '線性對數時間-n-log-n');
  assert.equal(slugify('Hello world'), 'Hello-world');
  assert.equal(href('about/site.html'), '/about/site.html');
  assert.equal(href('tags/競程'), '/tags/%E7%AB%B6%E7%A8%8B/');
  assert.equal(href(), '/');
});
test('honors explicit permalink and slug', () => {
  assert.equal(postPath('old', { permalink: '/custom/' }, config), 'custom');
  assert.equal(postPath('old', { date: '2026-01-01', slug: 'new' }, config), '2026/01/01/new');
});
