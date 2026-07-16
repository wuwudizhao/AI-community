import { describe, expect, it } from 'vitest';
import sitemap from './sitemap';

describe('sitemap', () => {
  it('includes all category pages and the technical aggregate', () => {
    const urls = sitemap().map(({ url }) => url);
    expect(urls).toHaveLength(14);
    expect(urls).toContain('http://localhost:3000/categories/money-opportunities');
    expect(urls).toContain('http://localhost:3000/categories/tools-resources');
    expect(urls).toContain('http://localhost:3000/categories/technical-discussions');
    expect(urls).not.toContain('http://localhost:3000/categories/side-projects');
    expect(urls).not.toContain('http://localhost:3000/categories/income-cases');
  });
});
