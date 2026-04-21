import { describe, it, expect } from 'vitest';
import { transformCallouts } from './migrate-callouts.mjs';

describe('transformCallouts', () => {
  it('rewrites single-line > 💡 to a GitHub [!TIP] block', () => {
    const input = '> 💡 클래스의 필드를 추가할 때 Direct 필드로 적절한지 확인해보자.';
    const expected = '> [!TIP]\n> 클래스의 필드를 추가할 때 Direct 필드로 적절한지 확인해보자.';
    expect(transformCallouts(input)).toBe(expected);
  });

  it('keeps plain blockquotes without 💡 untouched', () => {
    const input = '> just a quote\n\n> 💡 tip here';
    const out = transformCallouts(input);
    expect(out).toContain('> just a quote');
    expect(out).toContain('> [!TIP]\n> tip here');
  });

  it('is idempotent', () => {
    const input = '> 💡 already a tip';
    const once = transformCallouts(input);
    const twice = transformCallouts(once);
    expect(twice).toBe(once);
    expect(once).not.toContain('💡');
  });
});
