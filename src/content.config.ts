import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const labels = z.union([z.string(), z.array(z.string()), z.null()]).optional()
  .transform((value) => typeof value === 'string' ? [value] : value ?? []);
const schema = z.object({
  title: z.string().optional(),
  description: z.string().nullable().optional(),
  date: z.union([z.string(), z.date()]).optional(),
  updated: z.union([z.string(), z.date()]).optional(),
  tags: labels,
  categories: labels,
  comments: z.boolean().default(true),
  hide: z.boolean().default(false),
  draft: z.boolean().default(false),
  toc: z.boolean().optional(),
  top: z.union([z.boolean(), z.number()]).optional(),
  sticky: z.union([z.boolean(), z.number()]).optional(),
  permalink: z.string().optional(),
  slug: z.string().optional(),
  type: z.string().optional(),
  url: z.string().optional(),
  links: z.array(z.object({
    url: z.string(), avatar: z.string().optional(), name: z.string().optional(),
    blog: z.string().optional(), desc: z.string().optional(), color: z.string().optional(),
  })).optional(),
});

export const collections = {
  posts: defineCollection({
    loader: glob({ pattern: '**/*.{md,mdx}', base: './source/_posts', generateId: ({ entry }) => entry.replaceAll('\\', '/').replace(/\/index\.mdx?$|\.mdx?$/, '') }),
    schema,
  }),
  pages: defineCollection({
    loader: glob({ pattern: ['**/*.{md,mdx}', '!_*/**', '!components/**', '!tags/**', '!categories/**', '!404.md'], base: './source', generateId: ({ entry }) => entry.replace(/\.mdx?$/, '') }),
    schema,
  }),
};
