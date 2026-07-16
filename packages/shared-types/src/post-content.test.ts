import { describe, expect, it } from 'vitest';
import { analyzePostContent } from './index';

describe('analyzePostContent', () => {
  it.each([
    ['普通标题\n\n正文内容', '普通标题'],
    ['## Markdown 标题\n\n正文内容', 'Markdown 标题'],
    ['\n\n  前置空行标题  \n\n正文内容', '前置空行标题'],
  ])('extracts and removes the first non-empty title line', (raw, expectedTitle) => {
    expect(analyzePostContent(raw)).toEqual({
      title: expectedTitle,
      contentMarkdown: '正文内容',
      titleValid: true,
      bodyValid: true,
      error: null,
    });
  });

  it.each([
    ['![图片](https://example.com/a.png)\n\n正文', 'IMAGE_TITLE'],
    ['https://example.com\n\n正文', 'LINK_TITLE'],
    ['[链接](https://example.com)\n\n正文', 'LINK_TITLE'],
    ['#AI\n\n正文', 'TAG_TITLE'],
    ['……!!!\n\n正文', 'PUNCTUATION_TITLE'],
    ['短\n\n正文', 'TITLE_TOO_SHORT'],
    [`${'长'.repeat(161)}\n\n正文`, 'TITLE_TOO_LONG'],
    ['有效标题\n\n   ', 'MISSING_BODY'],
  ])('rejects invalid title or body input', (raw, expectedError) => {
    expect(analyzePostContent(raw).error).toBe(expectedError);
  });

  it('keeps later Markdown headings in the remaining body', () => {
    const result = analyzePostContent('我的帖子标题\n\n## 第一部分\n\n正文内容');
    expect(result.title).toBe('我的帖子标题');
    expect(result.contentMarkdown).toBe('## 第一部分\n\n正文内容');
  });
});
