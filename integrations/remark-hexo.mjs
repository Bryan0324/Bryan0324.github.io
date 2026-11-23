import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import matter from 'gray-matter';
import { visit } from 'unist-util-visit';
import { href, postPath } from '../src/lib/urls.mjs';
import { site } from '../src/lib/config.mjs';

export default function remarkHexo() {
  return (tree) => {
    visit(tree, 'code', (node) => {
      node.lang = node.lang?.replace(/=$/, '');
      node.value = node.value.replace(/\{%\s*(?:raw|endraw)\s*%\}/g, '');
      if (node.lang === 'mermaid') {
        node.type = 'html';
        node.value = `<pre class="mermaid">${node.value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`;
      }
    });
    visit(tree, 'text', (node, index, parent) => {
      const pattern = /\{%\s*post_link\s+(\S+)(?:\s+['"]([^'"]+)['"])?\s*%\}/g;
      const children = [];
      let offset = 0;
      for (const match of node.value.matchAll(pattern)) {
        const id = match[1];
        const name = readdirSync(resolve('source/_posts')).find((name) => name.replace(/\.mdx?$/, '') === id);
        if (!name) throw new Error(`Unknown Hexo post_link: ${id}`);
        const { data } = matter(readFileSync(resolve('source/_posts', name), 'utf8'));
        children.push({ type: 'text', value: node.value.slice(offset, match.index) });
        children.push({ type: 'link', url: href(postPath(id, data, site)), children: [{ type: 'text', value: match[2] || data.title }] });
        offset = match.index + match[0].length;
      }
      if (children.length) {
        children.push({ type: 'text', value: node.value.slice(offset) });
        parent.children.splice(index, 1, ...children);
        return index + children.length;
      }
    });
    // Existing MDX React components become hydrated Astro islands.
    visit(tree, 'mdxJsxFlowElement', (node) => {
      if (/^[A-Z]/.test(node.name ?? '') && !node.attributes.some((a) => a.name?.startsWith('client:'))) {
        node.attributes.push({ type: 'mdxJsxAttribute', name: 'client:visible', value: null });
      }
    });
  };
}
