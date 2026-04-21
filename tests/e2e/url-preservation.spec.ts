import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { buildPostPath } from '../../src/lib/permalink';

const POSTS_DIR = path.resolve('src/content/posts');
const postFiles = fs.readdirSync(POSTS_DIR).filter((f) => /\.(md|mdx)$/.test(f));

for (const f of postFiles) {
  const src = fs.readFileSync(path.join(POSTS_DIR, f), 'utf8');
  const { data } = matter(src);
  const id = f.replace(/\.(md|mdx)$/, '');
  const url = `/${buildPostPath({ id, categories: data.categories as string[] })}/`;

  test(`legacy URL loads: ${url}`, async ({ page }) => {
    const response = await page.goto(url);
    expect(response?.status()).toBe(200);
    await expect(page.locator('main h1').first()).toBeVisible();
  });
}

test('home loads', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
});

test('feed.xml loads as RSS', async ({ page }) => {
  const response = await page.goto('/feed.xml');
  expect(response?.status()).toBe(200);
  const body = await response!.text();
  expect(body.startsWith('<?xml')).toBe(true);
});

test('sitemap loads', async ({ page }) => {
  const response = await page.goto('/sitemap-index.xml');
  expect(response?.status()).toBe(200);
});
