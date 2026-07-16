import { excerpt, normalizeTags, postSlugBase } from './posts.helpers';

describe('post helpers', () => {
  it('creates stable URL-safe bases and unique-ready Chinese fallbacks', () => {
    expect(postSlugBase('Reliable RAG')).toMatch(/^reliable-rag-[a-f0-9]{8}$/);
    expect(postSlugBase('中文标题')).toMatch(/^post-[a-f0-9]{8}$/);
  });

  it('normalizes and deduplicates tags case-insensitively', () => {
    expect(normalizeTags([' RAG ', 'rag', '检索 增强'])).toHaveLength(2);
  });

  it('creates deterministic bounded excerpts', () => {
    expect(excerpt('# Hello **world**', 20)).toBe('Hello world');
  });
});
