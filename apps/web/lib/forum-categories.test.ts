import { describe, expect, it } from 'vitest';
import { FORUM_CATEGORIES } from './forum-categories';

describe('forum category configuration', () => {
  it('contains 12 enabled categories with unique stable identifiers', () => {
    expect(FORUM_CATEGORIES).toHaveLength(12);
    expect(FORUM_CATEGORIES.every(({ enabled }) => enabled)).toBe(true);

    for (const field of ['key', 'dbValue', 'slug', 'label'] as const) {
      const values = FORUM_CATEGORIES.map((category) => category[field]);
      expect(new Set(values).size).toBe(values.length);
    }
  });

  it('uses stable database values and non-Chinese category keys', () => {
    expect(FORUM_CATEGORIES.every(({ key }) => /^[a-z0-9-]+$/.test(key))).toBe(true);
    expect(FORUM_CATEGORIES.every(({ dbValue }) => /^[A-Z_]+$/.test(dbValue))).toBe(true);
    expect(FORUM_CATEGORIES.map(({ label }) => label)).not.toEqual(
      expect.arrayContaining(['副业项目', '收入案例']),
    );
  });
});
