import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve, extname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export default function yun() {
  const target = resolve('.astro-static');
  const source = resolve('source');
  function copyAssets() {
    // Dev, check, and build can overlap. Never remove their shared public root.
    mkdirSync(target, { recursive: true });
    const expected = new Set([resolve(target, '.nojekyll')]);
    const copy = (directory) => {
      for (const item of readdirSync(directory, { withFileTypes: true })) {
        if (item.name.startsWith('_') || item.name === 'components') continue;
        const file = resolve(directory, item.name);
        if (item.isDirectory()) { copy(file); continue; }
        if (['.md', '.mdx', '.tsx', '.ts'].includes(extname(file))) continue;
        const destination = resolve(target, relative(source, file));
        expected.add(destination);
        mkdirSync(resolve(destination, '..'), { recursive: true });
        copyFileSync(file, destination);
      }
    };
    copy(source);
    if (existsSync('CNAME')) {
      expected.add(resolve(target, 'CNAME'));
      copyFileSync('CNAME', resolve(target, 'CNAME'));
    }
    writeFileSync(resolve(target, '.nojekyll'), '');
    const prune = (directory) => {
      for (const item of readdirSync(directory, { withFileTypes: true })) {
        const file = resolve(directory, item.name);
        if (item.isDirectory()) prune(file);
        else if (!expected.has(file)) rmSync(file, { force: true });
      }
    };
    prune(target);
  }
  return {
    name: 'astro-theme-yun',
    hooks: {
      'astro:config:setup': ({ updateConfig }) => {
        copyAssets();
        updateConfig({ vite: { plugins: [{
          name: 'yun-static-assets',
          configureServer(server) {
            server.watcher.add(source);
            const onChange = (_, file) => {
              if (file.startsWith(source + sep) && !['.md', '.mdx', '.tsx', '.ts'].includes(extname(file))) copyAssets();
            };
            server.watcher.on('all', onChange);
            server.httpServer?.once('close', () => server.watcher.off('all', onChange));
          },
        }] } });
      },
      'astro:build:done': ({ dir }) => {
        // Astro's catch-all routes emit directories even for legacy *.html URLs.
        // Publish these as actual files so GitHub Pages does not redirect them.
        const flatten = (directory) => {
          for (const item of readdirSync(directory, { withFileTypes: true })) {
            if (!item.isDirectory()) continue;
            const path = resolve(directory, item.name);
            flatten(path);
            if (!item.name.endsWith('.html')) continue;
            const children = readdirSync(path);
            if (children.length !== 1 || children[0] !== 'index.html') throw new Error(`Cannot preserve legacy HTML URL: ${path}`);
            const html = readFileSync(resolve(path, 'index.html'));
            rmSync(path, { recursive: true });
            writeFileSync(path, html);
          }
        };
        flatten(fileURLToPath(dir));
      },
    },
  };
}
