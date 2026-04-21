# urunimi.github.io — Ben'space

Astro-based static blog deployed to GitHub Pages.

## Develop

```bash
pnpm install
pnpm dev          # http://localhost:4321
```

## Build & Preview

```bash
pnpm build        # astro build + pagefind search index
pnpm preview      # serves ./dist on :4321
```

## Test

```bash
pnpm test         # unit tests (migration scripts, permalink builder)
pnpm test:e2e     # Playwright — verifies every legacy URL still resolves
```

## Deploy

Pushes to `main` trigger `.github/workflows/deploy.yml` which builds with
Astro + Pagefind, installs Chromium for `rehype-mermaid` static SVG rendering,
and publishes via `actions/deploy-pages`.

**One-time repo setting:** Settings → Pages → **Source: GitHub Actions**.

## Add a post

Create `src/content/posts/YYYY-MM-DD-slug.md`:

```yaml
---
title: "포스트 제목"
date: YYYY-MM-DD
categories: [primary, secondary]
---

본문...
```

URL becomes `/primary/secondary/slug/` (lowercase categories).

## Rollback

If production breaks:

1. `git revert <merge-commit>` on main
2. Settings → Pages → Source back to **Deploy from branch: main / (root)** to
   fall back to Jekyll auto-build. (Only needed if reverting past the redesign.)
