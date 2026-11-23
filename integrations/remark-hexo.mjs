import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import matter from 'gray-matter';
import { visit } from 'unist-util-visit';
import { href, postPath } from '../src/lib/urls.mjs';
import { site } from '../src/lib/config.mjs';

function resolvePost(id) {
  const base = resolve('source/_posts');
  for (const ext of ['.md', '.mdx']) {
    const flat = resolve(base, `${id}${ext}`);
    if (existsSync(flat)) return { id, file: flat };
    const folder = resolve(base, id, `index${ext}`);
    if (existsSync(folder)) return { id, file: folder };
  }
  throw new Error(`Unknown Hexo post_link: ${id}`);
}

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
        const { file } = resolvePost(id);
        const { data } = matter(readFileSync(file, 'utf8'));
        if (match.index > offset) children.push({ type: 'text', value: node.value.slice(offset, match.index) });
        children.push({ type: 'link', url: href(postPath(id, data, site)), children: [{ type: 'text', value: match[2] || data.title || id }] });
        offset = match.index + match[0].length;
      }
      if (!children.length) return;
      if (offset < node.value.length) children.push({ type: 'text', value: node.value.slice(offset) });
      parent.children.splice(index, 1, ...children);
      return index + children.length;
    });
    visit(tree, ['mdxJsxFlowElement', 'mdxJsxTextElement'], (node) => {
      if (!/^[A-Z]/.test(node.name) || node.attributes.some((attr) => /^client:/.test(attr.name))) return;
      node.attributes.push({ type: 'mdxJsxAttribute', name: 'client:visible', value: null });
    });
  };
}
