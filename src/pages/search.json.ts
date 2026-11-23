import { visiblePosts, postUrl, plainText } from '../lib/content';
export async function GET() {
  const posts = await visiblePosts();
  return Response.json(posts.map((post) => ({
    title: post.data.title, url: postUrl(post),
    content: `${post.data.description || ''} ${plainText(post.body)}`,
    tags: [...post.data.tags, ...post.data.categories],
  })));
}
