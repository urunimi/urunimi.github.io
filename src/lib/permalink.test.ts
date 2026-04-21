import { describe, it, expect } from 'vitest';
import { buildPostPath } from './permalink';

describe('buildPostPath', () => {
  it('strips YYYY-MM-DD date prefix and joins categories', () => {
    expect(
      buildPostPath({ id: '2023-05-16-solid', categories: ['architecture', 'design-pattern'] }),
    ).toBe('architecture/design-pattern/solid');
  });

  it('handles single category', () => {
    expect(buildPostPath({ id: '2018-08-24-intro-myself', categories: ['intro'] })).toBe(
      'intro/intro-myself',
    );
  });

  it('strips .md/.mdx extension if present', () => {
    expect(buildPostPath({ id: '2020-03-31-clean-arch.md', categories: ['architecture'] })).toBe(
      'architecture/clean-arch',
    );
  });

  it('lowercases categories', () => {
    expect(buildPostPath({ id: '2024-08-21-mypy', categories: ['Python'] })).toBe('python/mypy');
  });
});
