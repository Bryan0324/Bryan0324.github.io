import { getCollection, type CollectionEntry } from 'astro:content';
import { site } from './config.mjs';
import { href, localDate, postPath, slugify } from './urls.mjs';

export type Post = CollectionEntry<'posts'>;
export type Entry = Post | CollectionEntry<'pages'>;
export const postUrl = (post: Post) => href(postPath(post.id, post.data, site));
export const formatDate = (value: string | Date) => localDate(value, site.timezone).format('YYYY-MM-DD');
export const taxonomyPath = (kind: 'tags' | 'categories', name: string) =>
  `${kind}/${site[kind === 'tags' ? 'tag_map' : 'category_map']?.[name] || slugify(name)}`;
export const taxonomyUrl = (kind: 'tags' | 'categories', name: string) => href(taxonomyPath(kind, name));

export async function allPosts() {
  const entries = await getCollection('posts');
  return entries.filter((entry) => {
    if (!entry.data.title && !entry.body?.trim()) return false;
    if (!entry.data.title || !entry.data.date) throw new Error(`文章需要 title 與 date：${entry.id}`);
    return !entry.data.draft && (site.future !== false || localDate(entry.data.date, site.timezone).valueOf() <= Date.now());
  }).sort((a, b) => localDate(b.data.date, site.timezone).valueOf() - localDate(a.data.date, site.timezone).valueOf() || a.id.localeCompare(b.id));
}

export const visiblePosts = async () => (await allPosts()).filter((post) => !post.data.hide);
export function taxonomy(posts: Post[], kind: 'tags' | 'categories') {
  const groups = new Map<string, Post[]>();
  for (const post of posts) for (const name of post.data[kind]) {
    groups.set(name, [...(groups.get(name) ?? []), post]);
  }
  return [...groups].sort(([a], [b]) => a.localeCompare(b, site.language));
}

export function plainText(body = '') {
  return body.replace(/```[\s\S]*?```/g, ' ')
    .replace(/^import .+$/gm, '').replace(/<[^>]*>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[#*`~>|]/g, '').replace(/\s+/g, ' ').trim();
}

export interface ListRoute {
  kind: 'list';
  title?: string;
  posts: Post[];
  page: number;
  total: number;
  base: string;
  home?: boolean;
}
export type Route = ListRoute | { kind: 'entry'; entry: Entry; prev?: Post; next?: Post }
  | { kind: 'taxonomy'; title: string; taxonomy: 'tags' | 'categories'; groups: [string, Post[]][] };

export async function routes() {
  const result: { params: { path: string | undefined }; props: { route: Route } }[] = [];
  const add = (path: string, route: Route) => result.push({ params: { path: path || undefined }, props: { route } });
  const posts = await allPosts();
  const visible = posts.filter((post) => !post.data.hide);
  const paginate = (base: string, title: string | undefined, items: Post[], home = false) => {
    const size = (home ? site.index_generator?.per_page : site.per_page) || Math.max(items.length, 1);
    const total = Math.max(1, Math.ceil(items.length / size));
    for (let page = 1; page <= total; page++) {
      add(page === 1 ? base : `${base ? base + '/' : ''}page/${page}`, {
        kind: 'list', title, posts: items.slice((page - 1) * size, page * size), page, total, base, home,
      });
    }
  };
  paginate('', undefined, [...visible].sort((a, b) => Number(b.data.sticky || b.data.top || 0) - Number(a.data.sticky || a.data.top || 0)), true);
  paginate('archives', '文章歸檔', visible);
  const periods = new Set(visible.flatMap((post) => {
    const date = formatDate(post.data.date!);
    return [date.slice(0, 4), date.slice(0, 7).replace('-', '/')];
  }));
  for (const period of periods) paginate(`archives/${period}`, `文章歸檔 · ${period}`, visible.filter((post) => formatDate(post.data.date!).replaceAll('-', '/').startsWith(period)));
  for (const kind of ['tags', 'categories'] as const) {
    const groups = taxonomy(visible, kind);
    add(kind, { kind: 'taxonomy', title: kind === 'tags' ? '標籤' : '分類', taxonomy: kind, groups });
    for (const [name, items] of groups) paginate(taxonomyPath(kind, name), name, items);
  }
  for (const entry of posts) {
    const index = visible.findIndex((post) => post.id === entry.id);
    add(postPath(entry.id, entry.data, site), { kind: 'entry', entry, prev: index >= 0 ? visible[index + 1] : undefined, next: index > 0 ? visible[index - 1] : undefined });
  }
  for (const entry of await getCollection('pages')) {
    const path = entry.data.permalink?.replace(/^\/+|\/+$/g, '')
      || (entry.id.endsWith('/index') ? entry.id.slice(0, -6) : `${entry.id}.html`);
    add(path, { kind: 'entry', entry });
  }
  const paths = new Set<string>();
  for (const { params } of result) {
    const path = params.path || '';
    if (paths.has(path)) throw new Error(`重複的頁面網址：/${path}`);
    paths.add(path);
  }
  return result;
}
