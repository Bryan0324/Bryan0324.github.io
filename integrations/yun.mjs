import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve, extname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import stylus from 'stylus';
import { theme } from '../src/lib/config.mjs';

export default function yun() {
  const target = resolve('.astro-static');
  const source = resolve('source');
  const entry = resolve('themes/yun/source/css/hexo-theme-yun.styl');
  const stylesheet = resolve('src/styles/yun.css').replaceAll('\\', '/');
  function copyAssets() {
    rmSync(target, { recursive: true, force: true });
    mkdirSync(target, { recursive: true });
    cpSync(source, target, {
      recursive: true,
      filter: (file) => {
        const parts = relative(source, file).split(sep);
        return !parts.some((part) => part.startsWith('_') || part === 'components')
          && !['.md', '.mdx', '.tsx', '.ts'].includes(extname(file));
      },
    });
    if (existsSync('CNAME')) cpSync('CNAME', resolve(target, 'CNAME'));
    writeFileSync(resolve(target, '.nojekyll'), '');
  }
  return {
    name: 'astro-theme-yun',
    hooks: {
      'astro:config:setup': ({ updateConfig }) => {
        copyAssets();
        updateConfig({ vite: { plugins: [{
          name: 'yun-stylus',
          load(id) {
            if (id.split('?')[0].replaceAll('\\', '/') !== stylesheet) return;
            const watch = (dir) => {
              for (const item of readdirSync(dir, { withFileTypes: true })) {
                const path = resolve(dir, item.name);
                if (item.isDirectory()) watch(path); else this.addWatchFile(path);
              }
            };
            watch(resolve('themes/yun/source/css'));
            return stylus(readFileSync(entry, 'utf8')).set('filename', entry)
              .define('$cursor-pointer', stylus.utils.coerce(theme.cursor.pointer || ''))
              .define('hexo-config', (key) => stylus.utils.coerce(
                key.val.split('.').reduce((value, part) => value?.[part], theme) ?? '',
              )).render();
          },
          configureServer(server) {
            server.watcher.add(source);
            server.watcher.on('all', (_, file) => {
              if (file.startsWith(source) && !['.md', '.mdx', '.tsx', '.ts'].includes(extname(file))) copyAssets();
            });
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
