import { createHash } from 'node:crypto';

export function normalizeTags(tags: string[]): Array<{ name: string; slug: string }> {
  const unique = new Map<string, string>();
  for (const raw of tags) {
    const name = raw.trim().replace(/\s+/g, ' ');
    const key = name.toLocaleLowerCase('zh-CN');
    if (name && !unique.has(key)) unique.set(key, name);
  }
  return [...unique.entries()].map(([key, name]) => ({ name, slug: stableSlug(key, 'tag') }));
}

export function postSlugBase(title: string): string {
  return stableSlug(title.toLocaleLowerCase('zh-CN'), 'post');
}

export function excerpt(markdown: string, max = 180): string {
  const plain = markdown
    .replace(/```[\s\S]*?```/g, ' [代码] ')
    .replace(/[`#>*_~()!-]/g, ' ')
    .replace(/[[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return plain.length <= max ? plain : `${plain.slice(0, max - 1)}…`;
}

function stableSlug(value: string, fallback: string): string {
  const ascii = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
  const hash = createHash('sha256').update(value).digest('hex').slice(0, 8);
  return `${ascii || fallback}-${hash}`;
}
