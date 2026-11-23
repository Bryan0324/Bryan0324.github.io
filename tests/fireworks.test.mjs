import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

test('fireworks survive rapid clicks with a newer start time than the RAF timestamp', () => {
  const callbacks = new Map();
  let id = 0;
  let now = 100;
  let click;
  let arcs = 0;
  let fail = false;
  const ctx = {
    setTransform() {}, clearRect() {}, beginPath() {}, fill() {}, stroke() {},
    arc(x, y, radius) {
      assert.ok(radius >= 0, `Negative radius: ${radius}`);
      if (fail) throw new Error('drawing failure');
      arcs++;
    },
  };
  const canvas = { getContext: () => ctx, style: {} };
  const exports = {};
  const source = ts.transpileModule(readFileSync(new URL('../src/scripts/fireworks.ts', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  runInNewContext(source, {
    exports, innerWidth: 800, innerHeight: 600, devicePixelRatio: 1,
    performance: { now: () => now },
    matchMedia: () => ({ matches: false }),
    document: { addEventListener: (_, handler) => { click = handler; } },
    window: { addEventListener() {} },
    requestAnimationFrame: (callback) => { callbacks.set(++id, callback); return id; },
  });
  exports.initFireworks(canvas, []);
  const press = () => click({ button: 0, clientX: 100, clientY: 100 });
  const tick = (time) => {
    const [key, callback] = callbacks.entries().next().value;
    callbacks.delete(key);
    callback(time);
  };
  press();
  now = 115;
  press();
  tick(110);
  assert.equal(arcs, 42, 'Both bursts draw 20 particles and a ring');
  assert.equal(callbacks.size, 1);
  tick(3000);
  assert.equal(callbacks.size, 0, 'Animation becomes idle');
  now = 3100;
  press();
  assert.equal(callbacks.size, 1, 'Next click restarts animation');
  fail = true;
  assert.throws(() => tick(3110), /drawing failure/);
  fail = false;
  press();
  assert.equal(callbacks.size, 1, 'A failed frame does not lock out subsequent clicks');
  tick(3120);
});
