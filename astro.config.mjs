// @ts-check
import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import expressiveCode from 'astro-expressive-code';
import pagefind from 'astro-pagefind';
import tailwindcss from '@tailwindcss/vite';
import matter from 'gray-matter';
import { remarkAlert } from 'remark-github-blockquote-alert';
import rehypeMermaid from 'rehype-mermaid';

const SITE = 'https://urunimi.github.io';

// Compute the set of legacy /:categories/:slug/ URLs so the sitemap excludes
// them — only the short canonical /slug/ URLs belong in the sitemap. The
// legacy pages themselves still render a meta-refresh stub with rel=canonical,
// which is the SEO-correct signal for a static migration.
const shortSlug = (id) => id.replace(/\.(md|mdx)$/, '').replace(/^\d{4}-\d{2}-\d{2}-/, '');
const legacyUrls = new Set();
const postsDir = './src/content/posts';
for (const f of fs.readdirSync(postsDir)) {
  if (!/\.(md|mdx)$/.test(f)) continue;
  const src = fs.readFileSync(path.join(postsDir, f), 'utf8');
  const { data } = matter(src);
  const id = f.replace(/\.(md|mdx)$/, '');
  const short = shortSlug(id);
  const cats = (data.categories ?? []).map((c) => String(c).toLowerCase());
  if (cats.length === 0) continue;
  const legacyPath = [...cats, short].join('/');
  if (legacyPath !== short) {
    legacyUrls.add(`${SITE}/${legacyPath}/`);
  }
}

export default defineConfig({
  site: SITE,
  trailingSlash: 'always',
  build: { format: 'directory' },
  markdown: {
    remarkPlugins: [remarkAlert],
    rehypePlugins: [[rehypeMermaid, { strategy: 'img-svg' }]],
  },
  integrations: [
    expressiveCode({
      themes: ['github-light'],
      styleOverrides: {
        borderRadius: '0.5rem',
        frames: { shadowColor: 'transparent' },
      },
    }),
    mdx(),
    sitemap({ filter: (page) => !legacyUrls.has(page) }),
    pagefind(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
