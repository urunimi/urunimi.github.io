import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { buildPostPath, buildPostSlug } from '../../src/lib/permalink';

const POSTS_DIR = path.resolve('src/content/posts');
const postFiles = fs.readdirSync(POSTS_DIR).filter((f) => /\.(md|mdx)$/.test(f));

for (const f of postFiles) {
  const src = fs.readFileSync(path.join(POSTS_DIR, f), 'utf8');
  const { data } = matter(src);
  const id = f.replace(/\.(md|mdx)$/, '');
  const shortUrl = `/${buildPostSlug(id)}/`;
  const legacyUrl = `/${buildPostPath({ id, categories: data.categories as string[] })}/`;

  test(`canonical short URL renders: ${shortUrl}`, async ({ page }) => {
    const response = await page.goto(shortUrl);
    expect(response?.status()).toBe(200);
    await expect(page.locator('main h1').first()).toBeVisible();
  });

  if (legacyUrl !== shortUrl) {
    test(`legacy URL serves meta-refresh + canonical to: ${legacyUrl} → ${shortUrl}`, async ({
      request,
    }) => {
      // Assert static redirect stub shape (SEO-correct signal for Google).
      // Using `request` — we only care about the HTML, not JS navigation timing.
      const res = await request.get(legacyUrl);
      expect(res.status()).toBe(200);
      const html = await res.text();
      expect(html).toMatch(
        new RegExp(`<meta http-equiv="refresh" content="0; url=${shortUrl}"`),
      );
      expect(html).toMatch(
        new RegExp(`<link rel="canonical" href="https://urunimi\\.github\\.io${shortUrl}"`),
      );
      expect(html).toMatch(/noindex/);
    });
  }
}

test('home loads', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
});

test('feed.xml loads and advertises short URLs only', async ({ page }) => {
  const response = await page.goto('/feed.xml');
  expect(response?.status()).toBe(200);
  const body = await response!.text();
  expect(body.startsWith('<?xml')).toBe(true);
  // Sanity: feed should not mention a multi-segment post path like /:cat/:cat/:slug/
  expect(body).not.toMatch(/<link>[^<]+\/architecture\/design-pattern\/[^<]+<\/link>/);
});

test('sitemap omits legacy URLs', async ({ page }) => {
  const response = await page.goto('/sitemap-0.xml');
  expect(response?.status()).toBe(200);
  const body = await response!.text();
  // No /:cat/:cat/:slug/ triple-segment post paths.
  expect(body).not.toMatch(/architecture\/design-pattern\/(solid|kiss-yagni)/);
});
