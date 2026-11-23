import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import yun from './integrations/yun.mjs';
import remarkHexo from './integrations/remark-hexo.mjs';
import rehypeYunCode from './integrations/rehype-yun-code.mjs';
import { site } from './src/lib/config.mjs';

export default defineConfig({
  site: site.url,
  output: 'static',
  publicDir: './.astro-static',
  integrations: [yun(), mdx(), react()],
  markdown: {
    remarkPlugins: [remarkMath, remarkHexo],
    rehypePlugins: [rehypeKatex, rehypeYunCode],
    syntaxHighlight: 'prism',
  },
});
