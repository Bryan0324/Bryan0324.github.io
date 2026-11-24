import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

function setup(config) {
  const exports = {};
  const scripts = [];
  const messages = [];
  let intersect;
  let disconnected = false;
  const source = ts.transpileModule(readFileSync(new URL('../src/scripts/giscus.ts', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  runInNewContext(source, {
    exports,
    document: { createElement: () => ({ attributes: {}, setAttribute(key, value) { this.attributes[key] = value; } }) },
    IntersectionObserver: class {
      constructor(callback) { intersect = callback; }
      observe() {}
      disconnect() { disconnected = true; }
    },
  });
  const container = {
    dataset: { config: JSON.stringify(config) }, append: (script) => scripts.push(script),
    querySelector: () => ({ contentWindow: { postMessage: (message, origin) => messages.push({ message, origin }) } }),
  };
  return { exports, container, scripts, messages, intersect: (visible) => intersect([{ isIntersecting: visible }]), disconnected: () => disconnected };
}

test('Giscus eager loading forwards every configured client attribute and fixed theme', () => {
  const config = { loading: 'eager', theme: 'https://example.com/giscus.css', repo: 'owner/repo', 'repo-id': 'r1', category: 'General', 'category-id': 'c1', mapping: 'pathname', 'reactions-enabled': 0, 'emit-metadata': 1, lang: 'en', 'input-position': 'bottom', strict: 1 };
  const env = setup(config);
  const sync = env.exports.initGiscus(env.container, () => 'dark');
  assert.equal(env.scripts.length, 1);
  for (const [key, value] of Object.entries(config)) assert.equal(env.scripts[0].attributes[`data-${key}`], String(value));
  sync();
  assert.equal(env.messages[0].message.giscus.setConfig.theme, config.theme);
  assert.equal(env.messages[0].origin, 'https://giscus.app');
});

test('Giscus lazy loading waits for visibility and auto theme follows site mode', () => {
  const env = setup({ loading: 'lazy', theme: 'auto' });
  let mode = 'dark';
  const sync = env.exports.initGiscus(env.container, () => mode);
  assert.equal(env.scripts.length, 0);
  env.intersect(false);
  assert.equal(env.scripts.length, 0);
  env.intersect(true);
  assert.equal(env.scripts[0].attributes['data-theme'], 'transparent_dark');
  assert.ok(env.disconnected());
  mode = 'sunset';
  sync();
  assert.equal(env.messages[0].message.giscus.setConfig.theme, 'light');
});
