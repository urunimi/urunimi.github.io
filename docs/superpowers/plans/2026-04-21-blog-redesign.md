# Blog Redesign Implementation Plan (Jekyll → Astro)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate urunimi.github.io from Jekyll (Minimal Mistakes "air") to Astro with a light-only warm-cream palette, right sticky TOC, Expressive Code, GitHub admonitions, Giscus comments, and full preservation of existing post URLs.

**Architecture:** Astro content collection drives `src/pages/[...slug].astro` which rebuilds Jekyll's `/:categories/:title/` URLs. Content stays as Markdown (with optional MDX upgrades). Tailwind + CSS custom properties hold design tokens. Deploy via GitHub Actions → `actions/deploy-pages`.

**Tech Stack:** Astro 5 · MDX · Tailwind · TypeScript · pnpm · astro-expressive-code (github-light) · remark-github-admonitions · rehype-mermaid · Motion One · Pagefind · Giscus · @astrojs/rss · @astrojs/sitemap · Vitest · Playwright · GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-04-21-blog-redesign-design.md`

---

## File Structure (end state)

**Created:**
- `astro.config.mjs`, `tailwind.config.mjs`, `tsconfig.json`, `package.json` (replaces Jekyll one), `pnpm-lock.yaml`
- `src/content.config.ts` — zod schema for `posts` collection
- `src/content/posts/*.md` — migrated from `_posts/`
- `src/styles/global.css` — CSS custom properties, typography, print styles
- `src/layouts/BaseLayout.astro` — `<html>`, head, header/footer slots
- `src/layouts/PostLayout.astro` — 3-column (gutter / prose 680px / sticky TOC)
- `src/components/Header.astro`, `Footer.astro`, `Hero.astro`, `PostList.astro`, `Toc.astro`, `Giscus.astro`, `Search.astro`, `Prose.astro`
- `src/lib/permalink.ts` — `buildPostPath({ categories, slug })` helper + unit tests
- `src/pages/index.astro`, `src/pages/[...slug].astro`, `src/pages/posts/index.astro`, `src/pages/categories/[name].astro`, `src/pages/about.astro`, `src/pages/feed.xml.ts`
- `scripts/migrate-frontmatter.mjs`, `scripts/migrate-callouts.mjs` (+ Vitest tests)
- `tests/e2e/url-preservation.spec.ts` — Playwright crawl of all legacy URLs
- `.github/workflows/deploy.yml`

**Deleted (Jekyll):**
- `_config.yml`, `_data/`, `_sass/`, `assets/css/`, `assets/js/`, `banner.js`, `feed.xml`, `Gemfile`, `Rakefile`, `sitemap.xml`, `staticman.yml`, `google6807992ff6bda66d.html`, `index.html`, old `package.json`, old `package-lock.json`
- `_posts/` (after moving to `src/content/posts/`)

**Preserved:**
- `LICENSE`, `README.md` (rewritten), `.gitignore` (extended), `robots.txt`, `.git/`

---

## Phase 1 — Setup

### Task 1: Create `astro` branch

**Files:** none

- [ ] **Step 1: Verify clean working tree**

```bash
git status
```
Expected: `nothing to commit, working tree clean` (the spec commit is already in main).

- [ ] **Step 2: Create and checkout feature branch**

```bash
git checkout -b astro
```
Expected: `Switched to a new branch 'astro'`

- [ ] **Step 3: Confirm branch**

```bash
git branch --show-current
```
Expected: `astro`

---

### Task 2: Scaffold Astro project in place

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `src/`, `public/`, `.astro/`

- [ ] **Step 1: Remove old Node/Jekyll package files**

The existing `package.json` / `package-lock.json` are Jekyll's. Delete them so Astro's init doesn't collide.

```bash
rm package.json package-lock.json
```

- [ ] **Step 2: Initialize Astro (minimal template, no TS questions)**

```bash
pnpm create astro@latest . -- --template minimal --typescript strict --install --no-git --skip-houston
```
Expected: new `package.json`, `astro.config.mjs`, `tsconfig.json`, `src/pages/index.astro` placeholder.

- [ ] **Step 3: Verify dev server boots**

```bash
pnpm dev
```
Expected: `Local http://localhost:4321/` log. `Ctrl-C` to stop.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: scaffold Astro project (replace Jekyll)"
```

---

### Task 3: Install integrations and runtime deps

**Files:**
- Modify: `package.json`, `pnpm-lock.yaml`

- [ ] **Step 1: Install Astro integrations**

```bash
pnpm add -D @astrojs/mdx @astrojs/rss @astrojs/sitemap @astrojs/tailwind astro-expressive-code astro-pagefind pagefind
pnpm add -D remark-github-admonitions rehype-mermaid @playwright/browser-chromium
pnpm add motion gray-matter
```

- [ ] **Step 2: Install dev/test deps**

```bash
pnpm add -D vitest @playwright/test tailwindcss@3 postcss autoprefixer
```

- [ ] **Step 3: Verify install (no peer warnings block build)**

```bash
pnpm astro info
```
Expected: lists Astro version + Node version; exits 0.

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "feat: add Astro integrations (mdx, expressive-code, mermaid, pagefind, tailwind)"
```

---

### Task 4: Configure `astro.config.mjs`

**Files:**
- Modify: `astro.config.mjs`

- [ ] **Step 1: Replace contents**

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import expressiveCode from 'astro-expressive-code';
import pagefind from 'astro-pagefind';
import githubAdmonitions from 'remark-github-admonitions';
import rehypeMermaid from 'rehype-mermaid';

export default defineConfig({
  site: 'https://urunimi.github.io',
  trailingSlash: 'always',
  build: { format: 'directory' },
  markdown: {
    remarkPlugins: [githubAdmonitions],
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
    tailwind({ applyBaseStyles: false }),
    sitemap(),
    pagefind(),
  ],
});
```

- [ ] **Step 2: Confirm build succeeds (empty site)**

```bash
pnpm build
```
Expected: `Complete!` with `dist/` created. No fatal errors. Warnings about no pages OK.

- [ ] **Step 3: Commit**

```bash
git add astro.config.mjs
git commit -m "feat: configure Astro (site, trailingSlash, integrations)"
```

---

### Task 5: Configure Tailwind + global CSS with design tokens

**Files:**
- Create: `tailwind.config.mjs`, `src/styles/global.css`
- Modify: `src/pages/index.astro` (placeholder swap)

- [ ] **Step 1: Create `tailwind.config.mjs`**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        ink: 'var(--text)',
        'ink-muted': 'var(--text-muted)',
        border: 'var(--border)',
        'code-bg': 'var(--code-bg)',
        primary: 'var(--accent-primary)',
        secondary: 'var(--accent-secondary)',
        tertiary: 'var(--accent-tertiary)',
      },
      fontFamily: {
        sans: ['"Pretendard Variable"', 'Pretendard', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      maxWidth: { prose: '680px' },
    },
  },
};
```

- [ ] **Step 2: Create `src/styles/global.css`**

```css
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css');
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --bg: #FDF8F3;
  --text: #2B2424;
  --text-muted: #706962;
  --border: #E8DDD0;
  --code-bg: #F3ECE0;
  --accent-primary: #455A64;   /* Blue Grey 700 */
  --accent-secondary: #00897B; /* Teal 600 */
  --accent-tertiary: #FFA000;  /* Amber 700 */
}

html { color-scheme: light; }
body {
  background: var(--bg);
  color: var(--text);
  font-family: theme('fontFamily.sans');
  font-size: 17px;
  line-height: 1.75;
  -webkit-font-smoothing: antialiased;
}

a { color: var(--accent-primary); text-decoration: underline; text-underline-offset: 2px; }
a:hover { color: var(--accent-secondary); }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

- [ ] **Step 3: Swap scaffolded index to load global.css**

Replace `src/pages/index.astro`:

```astro
---
import '../styles/global.css';
---
<html lang="ko">
  <head><meta charset="utf-8" /><title>Ben'space</title></head>
  <body><h1 class="text-primary">Palette OK</h1></body>
</html>
```

- [ ] **Step 4: Verify dev renders palette**

```bash
pnpm dev
```
Open http://localhost:4321 — heading should render in `#455A64` on cream background with Pretendard applied. `Ctrl-C`.

- [ ] **Step 5: Commit**

```bash
git add tailwind.config.mjs src/styles/global.css src/pages/index.astro
git commit -m "feat: design tokens (Option C palette) + Pretendard/JetBrains Mono"
```

---

## Phase 2 — Content Migration

### Task 6: Define content collection schema

**Files:**
- Create: `src/content.config.ts`

- [ ] **Step 1: Create schema**

```ts
// src/content.config.ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    categories: z.array(z.string()).min(1),
  }),
});

export const collections = { posts };
```

- [ ] **Step 2: Commit**

```bash
git add src/content.config.ts
git commit -m "feat: content collection schema for posts"
```

---

### Task 7: Move posts into content collection

**Files:**
- Move: `_posts/*.md` → `src/content/posts/*.md`
- Move: `_posts/<slug>/` image directories → `src/content/posts/<slug>/` (for local references; external raw URLs stay as-is)

- [ ] **Step 1: Move files**

```bash
mkdir -p src/content/posts
git mv _posts/*.md src/content/posts/
# Move any non-md subdirs (e.g. 2021-04-17-oci-k8s) that hold image scaffolds
for d in _posts/*/; do [ -d "$d" ] && git mv "$d" "src/content/posts/$(basename "$d")"; done
rmdir _posts 2>/dev/null || true
```

- [ ] **Step 2: Verify count**

```bash
ls src/content/posts/*.md | wc -l
```
Expected: 22 (matches pre-move count from `ls _posts/*.md`).

- [ ] **Step 3: Commit (moves only, no content change yet)**

```bash
git add -A
git commit -m "chore: move _posts into src/content/posts"
```

---

### Task 8: TDD — write the front-matter migration script test

**Files:**
- Create: `scripts/migrate-frontmatter.mjs` (empty stub)
- Create: `scripts/migrate-frontmatter.test.mjs`

- [ ] **Step 1: Create empty stub**

```js
// scripts/migrate-frontmatter.mjs
export function transformFrontmatter(input) {
  throw new Error('not implemented');
}
```

- [ ] **Step 2: Write failing test**

```js
// scripts/migrate-frontmatter.test.mjs
import { describe, it, expect } from 'vitest';
import { transformFrontmatter } from './migrate-frontmatter.mjs';

describe('transformFrontmatter', () => {
  it('removes toc and layout, preserves rest', () => {
    const input = `---
toc: true
title: "SOLID 원칙"
date: 2023-05-06
categories: [ architecture, design-pattern ]
layout: single
---

# body`;
    const out = transformFrontmatter(input);
    expect(out).not.toMatch(/^toc:/m);
    expect(out).not.toMatch(/^layout:/m);
    expect(out).toMatch(/^title: "SOLID 원칙"$/m);
    expect(out).toMatch(/^date: 2023-05-06$/m);
    expect(out).toMatch(/^categories: \[architecture, design-pattern\]$/m);
    expect(out).toMatch(/# body$/);
  });

  it('is idempotent when toc and layout already absent', () => {
    const input = `---
title: "A"
date: 2020-01-01
categories: [x]
---

body`;
    expect(transformFrontmatter(input)).toContain('title: "A"');
    expect(transformFrontmatter(transformFrontmatter(input))).toBe(transformFrontmatter(input));
  });
});
```

- [ ] **Step 3: Run test — expect FAIL**

```bash
pnpm vitest run scripts/migrate-frontmatter.test.mjs
```
Expected: FAIL ("not implemented").

---

### Task 9: Implement front-matter migration

**Files:**
- Modify: `scripts/migrate-frontmatter.mjs`

- [ ] **Step 1: Implement**

```js
// scripts/migrate-frontmatter.mjs
import matter from 'gray-matter';
import fs from 'node:fs';
import path from 'node:path';

const DROP_KEYS = new Set(['toc', 'layout']);

export function transformFrontmatter(source) {
  const { data, content } = matter(source);
  const cleaned = Object.fromEntries(
    Object.entries(data).filter(([k]) => !DROP_KEYS.has(k)),
  );
  return matter.stringify(content, cleaned, {
    // Inline-flow arrays so `categories: [a, b]` stays on one line (matches spec style)
    flowLevel: 1,
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const dir = 'src/content/posts';
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md') || f.endsWith('.mdx'));
  for (const f of files) {
    const p = path.join(dir, f);
    const src = fs.readFileSync(p, 'utf8');
    fs.writeFileSync(p, transformFrontmatter(src));
  }
  console.log(`Migrated front matter for ${files.length} posts.`);
}
```

- [ ] **Step 2: Run test — expect PASS**

```bash
pnpm vitest run scripts/migrate-frontmatter.test.mjs
```
Expected: 2 tests passed.

- [ ] **Step 3: Run migration on real posts**

```bash
node scripts/migrate-frontmatter.mjs
```
Expected: `Migrated front matter for 22 posts.`

- [ ] **Step 4: Spot-check a post**

```bash
head -6 src/content/posts/2023-05-16-solid.md
```
Expected: no `toc:` line, `title:`/`date:`/`categories:` preserved.

- [ ] **Step 5: Commit**

```bash
git add scripts/ src/content/posts/
git commit -m "chore: strip toc/layout from post front matter"
```

---

### Task 10: TDD — callout migration script

**Files:**
- Create: `scripts/migrate-callouts.mjs` (stub)
- Create: `scripts/migrate-callouts.test.mjs`

- [ ] **Step 1: Stub**

```js
// scripts/migrate-callouts.mjs
export function transformCallouts(input) {
  throw new Error('not implemented');
}
```

- [ ] **Step 2: Failing test**

```js
// scripts/migrate-callouts.test.mjs
import { describe, it, expect } from 'vitest';
import { transformCallouts } from './migrate-callouts.mjs';

describe('transformCallouts', () => {
  it('rewrites > 💡 to > [!TIP] block', () => {
    const input = '> 💡 클래스의 필드를 추가할 때 Direct 필드로 적절한지 확인해보자.';
    const expected = '> [!TIP]\n> 클래스의 필드를 추가할 때 Direct 필드로 적절한지 확인해보자.';
    expect(transformCallouts(input)).toBe(expected);
  });

  it('handles multi-line callouts (consecutive `>` lines stay attached)', () => {
    const input = '> 💡 first line\n> second line\n\nafter';
    const expected = '> [!TIP]\n> first line\n> second line\n\nafter';
    expect(transformCallouts(input)).toBe(expected);
  });

  it('does not touch plain blockquotes without 💡', () => {
    const input = '> just a quote\n\n> 💡 tip here';
    const out = transformCallouts(input);
    expect(out).toContain('> just a quote');
    expect(out).toContain('> [!TIP]\n> tip here');
  });
});
```

- [ ] **Step 3: Run — expect FAIL**

```bash
pnpm vitest run scripts/migrate-callouts.test.mjs
```

---

### Task 11: Implement and run callout migration

**Files:**
- Modify: `scripts/migrate-callouts.mjs`

- [ ] **Step 1: Implement**

```js
// scripts/migrate-callouts.mjs
import fs from 'node:fs';
import path from 'node:path';

export function transformCallouts(input) {
  // Match a line starting with "> 💡 " and rewrite the marker into an admonition header
  return input.replace(/^> 💡 (.*)$/gm, '> [!TIP]\n> $1');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const dir = 'src/content/posts';
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md') || f.endsWith('.mdx'));
  let touched = 0;
  for (const f of files) {
    const p = path.join(dir, f);
    const src = fs.readFileSync(p, 'utf8');
    const out = transformCallouts(src);
    if (out !== src) { fs.writeFileSync(p, out); touched++; }
  }
  console.log(`Rewrote callouts in ${touched} posts.`);
}
```

- [ ] **Step 2: Run test — expect PASS**

```bash
pnpm vitest run scripts/migrate-callouts.test.mjs
```

- [ ] **Step 3: Run migration**

```bash
node scripts/migrate-callouts.mjs
```
Expected: `Rewrote callouts in 2 posts.` (solid + oci-k8s).

- [ ] **Step 4: Spot-check**

```bash
grep -A1 '\[!TIP\]' src/content/posts/2023-05-16-solid.md | head -6
```
Expected: `> [!TIP]` followed by quote line.

- [ ] **Step 5: Commit**

```bash
git add scripts/ src/content/posts/
git commit -m "chore: convert 💡 blockquote callouts to GitHub admonitions"
```

---

## Phase 3 — Permalink + Base Layout

### Task 12: TDD — permalink builder

**Files:**
- Create: `src/lib/permalink.ts`
- Create: `src/lib/permalink.test.ts`

- [ ] **Step 1: Stub**

```ts
// src/lib/permalink.ts
export function buildPostPath(_: { id: string; categories: string[] }): string {
  throw new Error('not implemented');
}
```

- [ ] **Step 2: Failing test**

```ts
// src/lib/permalink.test.ts
import { describe, it, expect } from 'vitest';
import { buildPostPath } from './permalink';

describe('buildPostPath', () => {
  it('strips YYYY-MM-DD date prefix and joins categories', () => {
    expect(buildPostPath({ id: '2023-05-16-solid', categories: ['architecture', 'design-pattern'] }))
      .toBe('architecture/design-pattern/solid');
  });

  it('handles single category', () => {
    expect(buildPostPath({ id: '2018-08-24-intro-myself', categories: ['intro'] }))
      .toBe('intro/intro-myself');
  });

  it('strips .md/.mdx extension if present', () => {
    expect(buildPostPath({ id: '2020-03-31-clean-arch.md', categories: ['architecture'] }))
      .toBe('architecture/clean-arch');
  });

  it('lowercases categories', () => {
    expect(buildPostPath({ id: '2024-08-21-mypy', categories: ['Python'] }))
      .toBe('python/mypy');
  });
});
```

- [ ] **Step 3: Run — expect FAIL**

```bash
pnpm vitest run src/lib/permalink.test.ts
```

---

### Task 13: Implement permalink builder

**Files:**
- Modify: `src/lib/permalink.ts`

- [ ] **Step 1: Implement**

```ts
// src/lib/permalink.ts
export function buildPostPath({ id, categories }: { id: string; categories: string[] }): string {
  const slug = id.replace(/\.(md|mdx)$/, '').replace(/^\d{4}-\d{2}-\d{2}-/, '');
  const cats = categories.map((c) => c.toLowerCase());
  return [...cats, slug].join('/');
}
```

- [ ] **Step 2: Run test — expect PASS**

```bash
pnpm vitest run src/lib/permalink.test.ts
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/
git commit -m "feat: permalink builder (Jekyll /:categories/:title/ parity)"
```

---

### Task 14: BaseLayout

**Files:**
- Create: `src/layouts/BaseLayout.astro`

- [ ] **Step 1: Create**

```astro
---
// src/layouts/BaseLayout.astro
import '../styles/global.css';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';

interface Props { title: string; description?: string; }
const { title, description = "유병우(Ben)의 기술 블로그 — 지속 가능한 코드와 설계" } = Astro.props;
---
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content={description} />
    <link rel="alternate" type="application/atom+xml" title="Ben'space" href="/feed.xml" />
    <link rel="sitemap" href="/sitemap-index.xml" />
    <title>{title}</title>
  </head>
  <body class="min-h-screen flex flex-col">
    <Header />
    <main class="flex-1"><slot /></main>
    <Footer />
  </body>
</html>
```

- [ ] **Step 2: Commit (component files land together in next tasks)**

```bash
git add src/layouts/BaseLayout.astro
git commit -m "feat: BaseLayout with head metadata + RSS link"
```

---

### Task 15: Header component

**Files:**
- Create: `src/components/Header.astro`

- [ ] **Step 1: Create**

```astro
---
// src/components/Header.astro
---
<header class="sticky top-0 z-40 bg-bg/90 backdrop-blur border-b border-border">
  <div class="mx-auto max-w-5xl px-4 h-14 flex items-center justify-between">
    <a href="/" class="font-bold text-ink no-underline">Ben'space</a>
    <nav class="flex gap-5 items-center text-sm">
      <a href="/posts/">Posts</a>
      <a href="/categories/">Categories</a>
      <a href="/about/">About</a>
      <button data-search-trigger aria-label="Search" class="text-ink-muted hover:text-ink">
        ⌘K
      </button>
    </nav>
  </div>
</header>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Header.astro
git commit -m "feat: Header with sticky nav"
```

---

### Task 16: Footer component

**Files:**
- Create: `src/components/Footer.astro`

- [ ] **Step 1: Create**

```astro
---
// src/components/Footer.astro
const year = new Date().getFullYear();
---
<footer class="border-t border-border mt-16">
  <div class="mx-auto max-w-5xl px-4 py-8 flex flex-wrap items-center justify-between gap-4 text-sm text-ink-muted">
    <span>© {year} 유병우</span>
    <nav class="flex gap-4">
      <a href="https://github.com/urunimi" target="_blank" rel="noopener">GitHub</a>
      <a href="https://instagram.com/yoostaa" target="_blank" rel="noopener">Instagram</a>
      <a href="mailto:byungwoo.yoo@datarize.ai">Email</a>
      <a href="/feed.xml">RSS</a>
    </nav>
  </div>
</footer>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Footer.astro
git commit -m "feat: Footer with social + RSS"
```

---

### Task 17: Prose wrapper (typography styles)

**Files:**
- Create: `src/components/Prose.astro`

- [ ] **Step 1: Create**

```astro
---
// src/components/Prose.astro — typographic reset for rendered markdown
---
<div class="prose-root">
  <slot />
</div>

<style is:global>
  .prose-root { max-width: 680px; }
  .prose-root h1 { font-size: 2.25rem; line-height: 1.2; font-weight: 700; margin: 2rem 0 1rem; }
  .prose-root h2 { font-size: 1.75rem; font-weight: 700; margin: 2.5rem 0 1rem; scroll-margin-top: 5rem; }
  .prose-root h3 { font-size: 1.375rem; font-weight: 700; margin: 2rem 0 0.75rem; scroll-margin-top: 5rem; }
  .prose-root p, .prose-root li { font-size: 17px; line-height: 1.75; }
  .prose-root p { margin: 1rem 0; }
  .prose-root ul, .prose-root ol { margin: 1rem 0; padding-left: 1.5rem; }
  .prose-root li { margin: 0.25rem 0; }
  .prose-root blockquote { border-left: 3px solid var(--border); padding: 0.25rem 0 0.25rem 1rem; color: var(--text-muted); margin: 1.25rem 0; }
  .prose-root code:not(pre code) { background: var(--code-bg); padding: 0.1em 0.4em; border-radius: 0.25rem; font-family: theme('fontFamily.mono'); font-size: 0.9em; }
  .prose-root table { width: 100%; border-collapse: collapse; margin: 1.25rem 0; }
  .prose-root th, .prose-root td { border: 1px solid var(--border); padding: 0.5rem 0.75rem; text-align: left; }
  .prose-root th { background: var(--code-bg); }
  .prose-root img { border-radius: 0.5rem; margin: 1.5rem auto; }
  .prose-root hr { border: 0; border-top: 1px solid var(--border); margin: 2rem 0; }

  /* GitHub-style admonitions — remark-github-admonitions renders as blockquote with class */
  .prose-root .markdown-alert { border-left: 4px solid var(--accent-primary); background: var(--code-bg); padding: 0.75rem 1rem; margin: 1.25rem 0; border-radius: 0 0.5rem 0.5rem 0; }
  .prose-root .markdown-alert-title { font-weight: 700; margin-bottom: 0.25rem; }
  .prose-root .markdown-alert-note   { border-left-color: #455A64; }
  .prose-root .markdown-alert-tip    { border-left-color: #00897B; }
  .prose-root .markdown-alert-important { border-left-color: #FFA000; background: #FFF8E1; }
  .prose-root .markdown-alert-warning   { border-left-color: #FF8F00; }
  .prose-root .markdown-alert-caution   { border-left-color: #C62828; }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Prose.astro
git commit -m "feat: Prose typography wrapper + admonition styles"
```

---

## Phase 4 — Pages

### Task 18: PostList component (chronological grouping)

**Files:**
- Create: `src/components/PostList.astro`

- [ ] **Step 1: Create**

```astro
---
// src/components/PostList.astro
import type { CollectionEntry } from 'astro:content';
import { buildPostPath } from '../lib/permalink';

interface Props { posts: CollectionEntry<'posts'>[]; }
const { posts } = Astro.props;

const sorted = [...posts].sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
const byYear = new Map<number, typeof sorted>();
for (const p of sorted) {
  const y = p.data.date.getFullYear();
  if (!byYear.has(y)) byYear.set(y, []);
  byYear.get(y)!.push(p);
}

const fmt = (d: Date) => d.toISOString().slice(0, 10).replaceAll('-', '.');
---
<ol class="list-none p-0 m-0">
  {[...byYear.entries()].map(([year, items]) => (
    <li class="mb-10">
      <h2 class="text-3xl font-bold text-ink-muted mb-4">{year}</h2>
      <ul class="list-none p-0 m-0 space-y-3">
        {items.map((p) => (
          <li class="flex flex-wrap items-baseline gap-3 group" data-fade>
            <time class="text-ink-muted font-mono text-sm tabular-nums">{fmt(p.data.date)}</time>
            <a href={`/${buildPostPath({ id: p.id, categories: p.data.categories })}/`}
               class="text-ink hover:text-secondary no-underline font-medium">{p.data.title}</a>
            <span class="flex gap-1">
              {p.data.categories.map((c) => (
                <span class="text-xs text-secondary bg-[#E0F2F1] rounded-full px-2 py-0.5">{c}</span>
              ))}
            </span>
          </li>
        ))}
      </ul>
    </li>
  ))}
</ol>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/PostList.astro
git commit -m "feat: PostList chronological list grouped by year"
```

---

### Task 19: Hero component

**Files:**
- Create: `src/components/Hero.astro`

- [ ] **Step 1: Create**

```astro
---
// src/components/Hero.astro
---
<section class="relative overflow-hidden py-16 md:py-24">
  <svg class="absolute -top-10 -right-10 w-[420px] h-[420px] opacity-40 pointer-events-none" viewBox="0 0 200 200">
    <defs>
      <linearGradient id="blob" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#00897B" stop-opacity="0.35" />
        <stop offset="100%" stop-color="#FFA000" stop-opacity="0.25" />
      </linearGradient>
    </defs>
    <path fill="url(#blob)" d="M47.6,-57.3C61.1,-47,71.1,-31.4,73.9,-14.8C76.7,1.8,72.2,19.5,62.5,32.7C52.7,45.9,37.6,54.7,21.2,61.3C4.8,67.8,-12.9,72.1,-27.3,66.7C-41.7,61.3,-52.8,46.2,-60.6,30.1C-68.3,14,-72.7,-3,-68.3,-17.6C-63.9,-32.2,-50.7,-44.3,-36.3,-54.1C-21.9,-63.9,-6.4,-71.4,7.8,-70.3C22,-69.2,34.1,-67.6,47.6,-57.3Z" transform="translate(100 100)" />
  </svg>
  <div class="relative mx-auto max-w-5xl px-4">
    <h1 class="text-4xl md:text-5xl font-bold tracking-tight">안녕하세요, 유병우(Ben) 입니다.</h1>
    <p class="mt-3 text-lg text-ink-muted max-w-prose">지속 가능한 코드와 이해하기 쉬운 설계에 대해 씁니다.</p>
  </div>
</section>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Hero.astro
git commit -m "feat: Hero with SVG blob background"
```

---

### Task 20: Home page

**Files:**
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Replace contents**

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../layouts/BaseLayout.astro';
import Hero from '../components/Hero.astro';
import PostList from '../components/PostList.astro';

const posts = await getCollection('posts');
---
<BaseLayout title="Ben'space">
  <Hero />
  <div class="mx-auto max-w-5xl px-4 pb-16">
    <PostList posts={posts} />
  </div>
</BaseLayout>
```

- [ ] **Step 2: Verify dev**

```bash
pnpm dev
```
Open http://localhost:4321 — chronological list with all 22 posts grouped by year; hero blob visible. `Ctrl-C`.

- [ ] **Step 3: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat: home page (hero + chronological post list)"
```

---

### Task 21: Dynamic post route (URL preservation)

**Files:**
- Create: `src/pages/[...slug].astro`
- Create: `src/layouts/PostLayout.astro`
- Create: `src/components/Toc.astro`

- [ ] **Step 1: Create Toc component**

```astro
---
// src/components/Toc.astro
import type { MarkdownHeading } from 'astro';
interface Props { headings: MarkdownHeading[]; }
const { headings } = Astro.props;
const items = headings.filter((h) => h.depth === 2 || h.depth === 3);
---
<aside class="hidden xl:block sticky top-20 self-start text-sm w-56 shrink-0">
  <p class="text-ink-muted uppercase tracking-wide text-xs font-semibold mb-3">On this page</p>
  <ul class="list-none p-0 m-0 space-y-1.5">
    {items.map((h) => (
      <li class={h.depth === 3 ? 'pl-3' : ''}>
        <a href={`#${h.slug}`} class="no-underline text-ink-muted hover:text-ink">{h.text}</a>
      </li>
    ))}
  </ul>
</aside>

<details class="xl:hidden my-6 border border-border rounded p-3 text-sm">
  <summary class="cursor-pointer font-medium">On this page</summary>
  <ul class="list-none mt-2 space-y-1">
    {items.map((h) => (
      <li class={h.depth === 3 ? 'pl-3' : ''}>
        <a href={`#${h.slug}`}>{h.text}</a>
      </li>
    ))}
  </ul>
</details>
```

- [ ] **Step 2: Create PostLayout**

```astro
---
// src/layouts/PostLayout.astro
import BaseLayout from './BaseLayout.astro';
import Prose from '../components/Prose.astro';
import Toc from '../components/Toc.astro';
import type { MarkdownHeading } from 'astro';

interface Props {
  title: string;
  date: Date;
  categories: string[];
  headings: MarkdownHeading[];
}
const { title, date, categories, headings } = Astro.props;
const fmt = date.toISOString().slice(0, 10);
---
<BaseLayout title={title}>
  <article class="mx-auto max-w-5xl px-4 py-10 flex gap-10">
    <div class="flex-1 min-w-0">
      <header class="mb-8">
        <h1 class="text-4xl font-bold leading-tight">{title}</h1>
        <div class="mt-3 flex flex-wrap gap-3 text-sm text-ink-muted">
          <time>{fmt}</time>
          <span>·</span>
          <span class="flex gap-1">
            {categories.map((c) => (
              <span class="text-secondary bg-[#E0F2F1] rounded-full px-2 py-0.5">{c}</span>
            ))}
          </span>
        </div>
      </header>
      <Prose><slot /></Prose>
    </div>
    <Toc headings={headings} />
  </article>
</BaseLayout>
```

- [ ] **Step 3: Create dynamic route**

```astro
---
// src/pages/[...slug].astro
import { getCollection, render } from 'astro:content';
import PostLayout from '../layouts/PostLayout.astro';
import { buildPostPath } from '../lib/permalink';

export async function getStaticPaths() {
  const posts = await getCollection('posts');
  return posts.map((post) => ({
    params: { slug: buildPostPath({ id: post.id, categories: post.data.categories }) },
    props: { post },
  }));
}

const { post } = Astro.props;
const { Content, headings } = await render(post);
---
<PostLayout
  title={post.data.title}
  date={post.data.date}
  categories={post.data.categories}
  headings={headings}
>
  <Content />
</PostLayout>
```

- [ ] **Step 4: Verify a known URL renders**

```bash
pnpm dev
```
Open http://localhost:4321/architecture/design-pattern/solid/ — post renders with TOC on right. `Ctrl-C`.

- [ ] **Step 5: Commit**

```bash
git add src/pages/[...slug].astro src/layouts/PostLayout.astro src/components/Toc.astro
git commit -m "feat: dynamic post route preserves Jekyll /:categories/:title/ URLs"
```

---

### Task 22: Posts list page

**Files:**
- Create: `src/pages/posts/index.astro`

- [ ] **Step 1: Create**

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import PostList from '../../components/PostList.astro';

const posts = await getCollection('posts');
---
<BaseLayout title="Posts — Ben'space">
  <div class="mx-auto max-w-5xl px-4 py-12">
    <h1 class="text-4xl font-bold mb-8">Posts</h1>
    <PostList posts={posts} />
  </div>
</BaseLayout>
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/posts/index.astro
git commit -m "feat: /posts/ list page"
```

---

### Task 23: Category page

**Files:**
- Create: `src/pages/categories/[name].astro`
- Create: `src/pages/categories/index.astro`

- [ ] **Step 1: Per-category page**

```astro
---
// src/pages/categories/[name].astro
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import PostList from '../../components/PostList.astro';

export async function getStaticPaths() {
  const posts = await getCollection('posts');
  const names = new Set<string>();
  posts.forEach((p) => p.data.categories.forEach((c) => names.add(c.toLowerCase())));
  return [...names].map((name) => ({
    params: { name },
    props: {
      name,
      posts: posts.filter((p) => p.data.categories.map((c) => c.toLowerCase()).includes(name)),
    },
  }));
}

const { name, posts } = Astro.props;
---
<BaseLayout title={`${name} — Ben'space`}>
  <div class="mx-auto max-w-5xl px-4 py-12">
    <p class="text-sm text-ink-muted uppercase tracking-wide">category</p>
    <h1 class="text-4xl font-bold mb-8">{name}</h1>
    <PostList posts={posts} />
  </div>
</BaseLayout>
```

- [ ] **Step 2: Categories index**

```astro
---
// src/pages/categories/index.astro
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';

const posts = await getCollection('posts');
const counts = new Map<string, number>();
posts.forEach((p) => p.data.categories.forEach((c) => {
  const k = c.toLowerCase();
  counts.set(k, (counts.get(k) ?? 0) + 1);
}));
const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
---
<BaseLayout title="Categories — Ben'space">
  <div class="mx-auto max-w-5xl px-4 py-12">
    <h1 class="text-4xl font-bold mb-8">Categories</h1>
    <ul class="flex flex-wrap gap-2 list-none p-0">
      {sorted.map(([name, n]) => (
        <li>
          <a href={`/categories/${name}/`} class="inline-flex items-baseline gap-1 rounded-full border border-border px-3 py-1 no-underline hover:border-secondary">
            <span>{name}</span>
            <span class="text-xs text-ink-muted">{n}</span>
          </a>
        </li>
      ))}
    </ul>
  </div>
</BaseLayout>
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/categories/
git commit -m "feat: /categories/ index and per-category pages"
```

---

### Task 24: About page

**Files:**
- Create: `src/pages/about.astro`

- [ ] **Step 1: Create**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Prose from '../components/Prose.astro';
const resumeUrl = '#'; // TODO: replace when URL provided
---
<BaseLayout title="About — Ben'space">
  <div class="mx-auto max-w-5xl px-4 py-12">
    <Prose>
      <h1>About</h1>
      <p>안녕하세요, 유병우(Ben) 입니다.<br />지속 가능한 코드와 이해하기 쉬운 설계에 관심이 많은 개발자입니다.</p>
      <p>10년 넘게 수억 명 규모의 메신저·광고 플랫폼을 만들며 배운 한 가지는,
        <strong>"지금 편하게 쓰느냐보다 나중에 고치기 쉬운가"</strong>
        가 어떤 기술을 쓰느냐보다 먼저라는 것이었습니다.</p>
      <h2>관심사</h2>
      <ul>
        <li><strong>언어·프레임워크에 구속되지 않는 설계</strong> — Go, Kotlin, Python 어느 쪽이든 Clean Architecture 와 SOLID 가 통하는 이유를 좋아합니다. 도구는 바뀌어도 원칙은 남으니까요.</li>
        <li><strong>과하지 않은 설계</strong> — 확장 가능성은 고려하지만 확장을 미리 구현하지 않습니다. KISS·YAGNI 를 실무에서 지켜내는 판단에 관심이 많습니다.</li>
        <li><strong>다음 사람이 편한 코드</strong> — 모듈 경계와 의존성 방향이 깔끔하면 대부분의 문제가 단순해집니다.</li>
        <li><strong>설계 의도를 기록으로</strong> — 이 블로그는 "왜 그렇게 만들었는지" 를 남기는 공간입니다. 툴 사용법보다 구조적 결정의 배경을 주로 씁니다.</li>
      </ul>
      <h2>주로 다루는 주제</h2>
      <p>Clean Architecture · Domain-driven design · SOLID / KISS / YAGNI · Go / Kotlin / Python · Kubernetes / OCI / ArgoCD · 테스트·품질 파이프라인</p>
      <hr />
      <p>
        <a href={resumeUrl}>Resume</a> · <a href="https://github.com/urunimi">GitHub</a> · <a href="mailto:byungwoo.yoo@datarize.ai">Email</a>
      </p>
    </Prose>
  </div>
</BaseLayout>
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/about.astro
git commit -m "feat: About page"
```

---

### Task 25: RSS feed

**Files:**
- Create: `src/pages/feed.xml.ts`

- [ ] **Step 1: Create**

```ts
// src/pages/feed.xml.ts
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { buildPostPath } from '../lib/permalink';

export const GET = async (context: { site?: URL }) => {
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
        link: `/${buildPostPath({ id: p.id, categories: p.data.categories })}/`,
        categories: p.data.categories,
      })),
    customData: '<language>ko-KR</language>',
  });
};
```

- [ ] **Step 2: Verify output**

```bash
pnpm build
head -20 dist/feed.xml
```
Expected: RSS XML with `<channel>` and `<item>` entries.

- [ ] **Step 3: Commit**

```bash
git add src/pages/feed.xml.ts
git commit -m "feat: RSS feed at /feed.xml (Jekyll path preserved)"
```

---

## Phase 5 — Content Elements & Integrations

### Task 26: Giscus comments

**Files:**
- Create: `src/components/Giscus.astro`
- Modify: `src/layouts/PostLayout.astro` (insert before `</article>`)

- [ ] **Step 1: Component with placeholder IDs**

```astro
---
// src/components/Giscus.astro
// Replace data-repo-id and data-category-id after enabling Discussions + installing Giscus app.
---
<section class="mx-auto max-w-prose mt-16 pt-8 border-t border-border">
  <script
    src="https://giscus.app/client.js"
    data-repo="urunimi/urunimi.github.io"
    data-repo-id="__REPO_ID__"
    data-category="General"
    data-category-id="__CATEGORY_ID__"
    data-mapping="pathname"
    data-strict="0"
    data-reactions-enabled="1"
    data-emit-metadata="0"
    data-input-position="bottom"
    data-theme="light"
    data-lang="ko"
    crossorigin="anonymous"
    async
  ></script>
</section>
```

- [ ] **Step 2: Mount inside PostLayout**

Add after the `<Prose>` block in `src/layouts/PostLayout.astro`:

```astro
<Giscus />
```

Add the import at top:
```ts
import Giscus from '../components/Giscus.astro';
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Giscus.astro src/layouts/PostLayout.astro
git commit -m "feat: Giscus comment widget placeholder (IDs to fill post-setup)"
```

> **Manual step after deploy:** enable Discussions on repo, install giscus.app, fill `__REPO_ID__` and `__CATEGORY_ID__` in component.

---

### Task 27: Pagefind search UI

**Files:**
- Create: `src/components/Search.astro`
- Modify: `src/layouts/BaseLayout.astro` (include Search at bottom of body)
- Modify: `package.json` scripts

- [ ] **Step 1: Add postbuild script for index generation**

Edit `package.json`, inside `"scripts"`:

```json
"build": "astro build && pagefind --site dist"
```

- [ ] **Step 2: Create Search component**

```astro
---
// src/components/Search.astro
---
<dialog id="search-dialog" class="fixed inset-0 m-auto rounded-lg border border-border bg-bg p-0 w-[min(640px,92vw)] max-h-[70vh] shadow-xl">
  <div class="p-4">
    <div id="search"></div>
  </div>
</dialog>

<script>
  import '@pagefind/default-ui/css/ui.css';

  async function init() {
    const { PagefindUI } = await import('@pagefind/default-ui');
    new PagefindUI({ element: '#search', showSubResults: true });

    const dialog = document.getElementById('search-dialog') as HTMLDialogElement;
    const trigger = document.querySelector('[data-search-trigger]');
    trigger?.addEventListener('click', () => dialog.showModal());
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        dialog.showModal();
      } else if (e.key === 'Escape') {
        dialog.close();
      }
    });
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) dialog.close();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
</script>
```

- [ ] **Step 3: Install the Pagefind default UI package**

```bash
pnpm add -D @pagefind/default-ui
```

- [ ] **Step 4: Mount in BaseLayout**

Add right before `</body>` in `src/layouts/BaseLayout.astro`:

```astro
<Search />
```

Add import:
```ts
import Search from '../components/Search.astro';
```

- [ ] **Step 5: Verify build + search**

```bash
pnpm build
pnpm preview
```
Open http://localhost:4321 — press `⌘K` → search dialog opens, typing finds posts. `Ctrl-C`.

- [ ] **Step 6: Commit**

```bash
git add src/components/Search.astro src/layouts/BaseLayout.astro package.json pnpm-lock.yaml
git commit -m "feat: Pagefind search (⌘K modal)"
```

---

### Task 28: Motion One scroll fade-in

**Files:**
- Create: `src/components/FadeInOnScroll.astro`
- Modify: `src/components/PostList.astro` (wrap `data-fade` items already in place)

- [ ] **Step 1: Create**

```astro
---
// src/components/FadeInOnScroll.astro — attaches IntersectionObserver to [data-fade] items
---
<script>
  import { animate } from 'motion';
  const items = document.querySelectorAll<HTMLElement>('[data-fade]');
  if (items.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          animate(entry.target, { opacity: [0, 1], transform: ['translateY(8px)', 'translateY(0)'] }, { duration: 0.4, easing: 'ease-out' });
          io.unobserve(entry.target);
        }
      }
    }, { rootMargin: '0px 0px -10% 0px' });
    items.forEach((el) => {
      el.style.opacity = '0';
      io.observe(el);
    });
  }
</script>
```

- [ ] **Step 2: Mount in BaseLayout before Search**

Add to `src/layouts/BaseLayout.astro`:

```astro
<FadeInOnScroll />
```

Import:
```ts
import FadeInOnScroll from '../components/FadeInOnScroll.astro';
```

- [ ] **Step 3: Verify**

```bash
pnpm dev
```
Open home — scroll past first fold, items should fade in. `prefers-reduced-motion: reduce` (DevTools emulate) → no animation. `Ctrl-C`.

- [ ] **Step 4: Commit**

```bash
git add src/components/FadeInOnScroll.astro src/layouts/BaseLayout.astro
git commit -m "feat: scroll fade-in via Motion One"
```

---

### Task 29: Verify mermaid + admonitions render

**Files:** none (verification only)

- [ ] **Step 1: Build**

```bash
pnpm build
```
Expected: completes, downloads Chromium for `rehype-mermaid` on first run.

- [ ] **Step 2: Check mermaid on kiss-yagni post**

```bash
grep -l 'svg' dist/architecture/design-pattern/kiss-yagni/index.html | head -1
grep -c '<svg' dist/architecture/design-pattern/kiss-yagni/index.html
```
Expected: at least 1 SVG present (mermaid graph rendered).

- [ ] **Step 3: Check admonition class on SOLID post**

```bash
grep -c 'markdown-alert-tip' dist/architecture/design-pattern/solid/index.html
```
Expected: ≥ 4 (four `[!TIP]` admonitions).

- [ ] **Step 4: If either check fails**, investigate in this order:
  - `astro.config.mjs` plugin order (remark before rehype)
  - `remark-github-admonitions` package export (some versions export `.default`)
  - Playwright Chromium installed: `pnpm dlx playwright install chromium`

- [ ] **Step 5: Commit fix if needed, else move on**

---

## Phase 6 — Jekyll Cleanup + E2E

### Task 30: Delete Jekyll-only files

**Files to delete:**
- `_config.yml`, `_data/`, `_sass/`, `assets/css/`, `assets/js/`, `banner.js`
- `Gemfile`, `Rakefile`, `staticman.yml`, `feed.xml`, `sitemap.xml`
- `google6807992ff6bda66d.html`, `index.html` (top-level Jekyll stub, not the Astro page)
- `robots.txt` (Astro sitemap + default robots handle this; recreate only if specifically needed)

- [ ] **Step 1: Remove**

```bash
git rm -r _config.yml _data _sass assets/css assets/js banner.js Gemfile Rakefile staticman.yml feed.xml sitemap.xml google6807992ff6bda66d.html index.html robots.txt
```

If a path doesn't exist, drop it from the command.

- [ ] **Step 2: Verify Astro build still succeeds**

```bash
pnpm build
```
Expected: no errors.

- [ ] **Step 3: Update .gitignore**

Edit `.gitignore` to include:
```
node_modules/
dist/
.astro/
.env
.DS_Store
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove Jekyll artifacts"
```

---

### Task 31: Generate legacy URL list and write E2E test

**Files:**
- Create: `tests/e2e/url-preservation.spec.ts`
- Create: `playwright.config.ts`

- [ ] **Step 1: Install Playwright browsers**

```bash
pnpm dlx playwright install chromium
```

- [ ] **Step 2: Playwright config**

```ts
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  use: { baseURL: 'http://localhost:4321' },
  webServer: { command: 'pnpm preview', url: 'http://localhost:4321', reuseExistingServer: true, timeout: 60_000 },
  reporter: 'list',
});
```

- [ ] **Step 3: E2E test**

```ts
// tests/e2e/url-preservation.spec.ts
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import matter from 'gray-matter';
import { buildPostPath } from '../../src/lib/permalink';

const postFiles = fs.readdirSync('src/content/posts').filter((f) => /\.(md|mdx)$/.test(f));

for (const f of postFiles) {
  const src = fs.readFileSync(`src/content/posts/${f}`, 'utf8');
  const { data } = matter(src);
  const id = f.replace(/\.(md|mdx)$/, '');
  const url = `/${buildPostPath({ id, categories: data.categories })}/`;

  test(`legacy URL loads: ${url}`, async ({ page }) => {
    const response = await page.goto(url);
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toBeVisible();
  });
}

test('home loads', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
});

test('feed.xml loads', async ({ page }) => {
  const response = await page.goto('/feed.xml');
  expect(response?.status()).toBe(200);
  expect((await response!.text()).startsWith('<?xml')).toBe(true);
});

test('sitemap loads', async ({ page }) => {
  const response = await page.goto('/sitemap-index.xml');
  expect(response?.status()).toBe(200);
});
```

- [ ] **Step 4: Add test script**

Edit `package.json` scripts:
```json
"test:e2e": "pnpm build && playwright test"
```

- [ ] **Step 5: Run**

```bash
pnpm test:e2e
```
Expected: all 22+ URL tests + home/feed/sitemap PASS.

- [ ] **Step 6: Commit**

```bash
git add tests/ playwright.config.ts package.json pnpm-lock.yaml
git commit -m "test(e2e): verify every legacy Jekyll URL still resolves"
```

---

## Phase 7 — Deploy

### Task 32: GitHub Actions deploy workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Create**

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm dlx playwright install chromium
      - run: pnpm build
      - uses: actions/upload-pages-artifact@v3
        with: { path: ./dist }

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: deploy Astro to GitHub Pages via Actions"
```

---

### Task 33: Update README

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Replace contents**

```markdown
# urunimi.github.io — Ben'space

Astro-based static blog deployed to GitHub Pages.

## Develop

```
pnpm install
pnpm dev         # http://localhost:4321
```

## Build & Preview

```
pnpm build       # runs astro build + pagefind index
pnpm preview     # serves ./dist
```

## Test

```
pnpm vitest run  # unit tests (migration scripts, permalink)
pnpm test:e2e    # Playwright — crawls every legacy URL
```

## Deploy

`main` branch pushes trigger `.github/workflows/deploy.yml`.
Pages **Source** must be set to **GitHub Actions** (Settings → Pages).

## Add a post

Create `src/content/posts/YYYY-MM-DD-slug.md` with:

```yaml
---
title: "..."
date: YYYY-MM-DD
categories: [primary, secondary]
---
```

URL becomes `/primary/secondary/slug/`.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: refresh README for Astro workflow"
```

---

### Task 34: Push and open PR

**Files:** none (git ops)

- [ ] **Step 1: Final sanity check**

```bash
pnpm vitest run && pnpm build && pnpm test:e2e
```
Expected: all green.

- [ ] **Step 2: Push branch**

```bash
git push -u origin astro
```

- [ ] **Step 3: Open PR via gh**

```bash
gh pr create --title "Redesign: Jekyll → Astro" --body "$(cat <<'EOF'
## Summary
- Migrate from Jekyll (Minimal Mistakes "air") to Astro 5
- Light-only warm-cream palette (Blue Grey 700 / Teal 600 / Amber 700)
- Right sticky TOC, chronological home, About page copy refreshed
- Expressive Code + GitHub admonitions + static Mermaid SVG
- Giscus replaces Disqus (past Disqus threads intentionally dropped)
- Pagefind ⌘K search
- Motion One scroll fade-in (respects prefers-reduced-motion)
- Every legacy `/:categories/:title/` URL preserved (verified in E2E)

## Spec & Plan
- Spec: `docs/superpowers/specs/2026-04-21-blog-redesign-design.md`
- Plan: `docs/superpowers/plans/2026-04-21-blog-redesign.md`

## Test plan
- [ ] `pnpm vitest run` — unit tests (migration scripts, permalink)
- [ ] `pnpm build` — Astro + Pagefind index
- [ ] `pnpm test:e2e` — Playwright crawls every legacy URL
- [ ] Manual: home / a post / `/about/` / `/categories/` / `⌘K` search / mobile 375px

## Post-merge manual steps
1. Repo Settings → Pages → Source: **GitHub Actions**
2. Enable Discussions → install giscus.app → fill `__REPO_ID__` / `__CATEGORY_ID__` in `src/components/Giscus.astro`
3. Replace `resumeUrl` in `src/pages/about.astro` when CV link is ready

## Rollback
If prod looks wrong:
1. `git revert <merge-commit>` on main
2. Settings → Pages → Source back to **Deploy from branch: main / (root)**

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 4: Return the PR URL printed by `gh`**

---

## Self-Review

Running the spec-vs-plan checklist inline:

**1. Spec coverage — every spec section maps to a task:**
- §1 Goals / Non-goals → encoded in task scope (light-only, no dark toggle, no CV subpage, etc.) ✓
- §2 Tech stack → Tasks 2–4 (scaffold, integrations, config) ✓
- §3 Visual design (palette, typography, mood) → Task 5 (tokens) + Task 17 (prose) + Task 19 (hero blob) ✓
- §4 Layout: Global → Tasks 14–16; Home → Task 20; Post → Task 21; Lists → Tasks 22–23; About → Task 24 ✓
- §5 Content elements: Expressive Code → Task 4; Admonitions → Tasks 11 + 17 + 29; Mermaid → Tasks 4 + 29; Images (external) → untouched (non-goal); TOC → Task 21 ✓
- §6 Migration: URL preservation → Tasks 12–13 + 21; front matter → Tasks 8–9; callouts → Tasks 10–11; Disqus → Giscus → Task 26; feed/sitemap → Task 25 + integration in config; search → Task 27; deploy → Task 32; Jekyll cleanup → Task 30 ✓
- §7 Verification checklist → covered by E2E (Task 31) + manual items in PR template ✓
- §8 Risks → acknowledged in PR template / post-merge steps ✓
- §9 Rollback → documented in PR body ✓
- §10 Out of scope → respected; no tasks for dark mode, `/resume` page, image migration ✓
- §11 Implementation order → plan follows the spec's 19-step order, just at finer grain ✓

**2. Placeholder scan:**
- Intentional placeholders only: `__REPO_ID__` / `__CATEGORY_ID__` in Giscus (documented as manual post-deploy step), `resumeUrl = '#'` in About (flagged in PR body). No "TBD" / "implement later" in actual implementation steps.

**3. Type consistency:**
- `buildPostPath({ id, categories })` signature consistent across permalink test, PostList, dynamic route, RSS feed, and E2E test. ✓
- `categories: z.array(z.string())` consistent in schema and callers. ✓
- `headings: MarkdownHeading[]` consistent between PostLayout and Toc. ✓

No issues found — moving on.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-21-blog-redesign.md`. Two execution options:

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
