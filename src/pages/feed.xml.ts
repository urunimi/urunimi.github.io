import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { buildPostSlug } from '../lib/permalink';
import type { APIContext } from 'astro';

export const GET = async (context: APIContext) => {
  const posts = await getCollection('posts');
  return rss({
    title: "Ben'space",
    description: '유병우(Ben)의 기술 블로그',
    site: context.site!,
    items: posts
      .sort((a, b) => b.data.date.getTime() - a.data.date.getTime())
      .map((p) => ({
        title: p.data.title,
        pubDate: p.data.date,
        link: `/${buildPostSlug(p.id)}/`,
        categories: p.data.categories,
      })),
    customData: '<language>ko-KR</language>',
  });
};
