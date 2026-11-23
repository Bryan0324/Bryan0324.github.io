import { test } from 'node:test';
import assert from 'node:assert/strict';
import remarkHexo from '../integrations/remark-hexo.mjs';

test('migrates Hexo post links while preserving surrounding text', () => {
  const tree = { type: 'root', children: [{ type: 'paragraph', children: [{ type: 'text', value: "前 {% post_link 4-threads-api-teach '教學' %} 後" }] }] };
  remarkHexo()(tree);
  assert.deepEqual(tree.children[0].children, [
    { type: 'text', value: '前 ' },
    { type: 'link', url: '/2026/01/03/4-threads-api-teach/', children: [{ type: 'text', value: '教學' }] },
    { type: 'text', value: ' 後' },
  ]);
});
test('normalizes code fences without executing example template syntax', () => {
  const tree = { type: 'root', children: [{ type: 'code', lang: 'shell=', value: '{% raw %}{% block content %}{% endraw %}' }] };
  remarkHexo()(tree);
  assert.equal(tree.children[0].lang, 'shell');
  assert.equal(tree.children[0].value, '{% block content %}');
});
test('hydrates legacy MDX components and respects explicit hydration', () => {
  const tree = { type: 'root', children: [
    { type: 'mdxJsxFlowElement', name: 'Tarjan', attributes: [] },
    { type: 'mdxJsxFlowElement', name: 'Graph', attributes: [{ name: 'client:load' }] },
    { type: 'mdxJsxFlowElement', name: 'table', attributes: [] },
  ] };
  remarkHexo()(tree);
  assert.equal(tree.children[0].attributes[0].name, 'client:visible');
  assert.equal(tree.children[1].attributes.length, 1);
  assert.equal(tree.children[2].attributes.length, 0);
});
