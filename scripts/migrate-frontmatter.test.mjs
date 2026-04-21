import { describe, it, expect } from 'vitest';
import { transformFrontmatter } from './migrate-frontmatter.mjs';

describe('transformFrontmatter', () => {
  it('removes toc and layout lines while preserving the rest verbatim', () => {
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
    expect(out).toContain('title: "SOLID 원칙"');
    expect(out).toContain('date: 2023-05-06');
    expect(out).toContain('categories: [ architecture, design-pattern ]');
    expect(out).toContain('# body');
  });

  it('is a no-op when toc and layout are already absent', () => {
    const input = `---
title: "A"
date: 2020-01-01
categories: [x]
---

body`;
    expect(transformFrontmatter(input)).toBe(input);
  });

  it('leaves files without front matter unchanged', () => {
    const input = 'no front matter here';
    expect(transformFrontmatter(input)).toBe(input);
  });

  it('is idempotent', () => {
    const input = `---
toc: true
title: x
date: 2020-01-01
categories: [y]
---

body`;
    const once = transformFrontmatter(input);
    const twice = transformFrontmatter(once);
    expect(twice).toBe(once);
  });
});
