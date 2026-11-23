import { visit } from 'unist-util-visit';
import { theme } from '../src/lib/config.mjs';

// Match Yun's Prism line-number gutter without a browser-side highlighter.
export default function rehypeYunCode() {
  return (tree) => {
    if (!theme.codeblock.prismjs.line_number) return;
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'pre') return;
      const code = node.children.find((child) => child.type === 'element' && child.tagName === 'code');
      if (!code) return;
      const text = (node) => node.type === 'text' ? node.value : (node.children || []).map(text).join('');
      const lines = text(code).replace(/\n$/, '').split('\n').length;
      node.properties.className = [...(node.properties.className || []), 'line-numbers'];
      code.children.push({ type: 'element', tagName: 'span', properties: { className: ['line-numbers-rows'], ariaHidden: 'true' }, children: Array.from({ length: lines }, () => ({ type: 'element', tagName: 'span', properties: {}, children: [] })) });
    });
  };
}
