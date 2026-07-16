import {
  Bot,
  BriefcaseBusiness,
  ChartNoAxesColumnIncreasing,
  Compass,
  Coins,
  Layers3,
  PlugZap,
  SearchCode,
  Skull,
  Sparkles,
  UserRound,
  Wrench,
} from 'lucide-react';
import {
  FORUM_CATEGORIES,
  TECHNICAL_DISCUSSIONS_SLUG,
  findForumCategory,
  type ForumCategoryIconKey,
} from '@liftoff/shared-types';

export {
  FORUM_CATEGORIES,
  TECHNICAL_DISCUSSIONS_SLUG,
  findForumCategory,
  findForumCategoryByKey,
  findForumCategoryByValue,
  type ForumCategory,
  type ForumCategoryFilter,
  type ForumCategoryKey,
  type ForumCategorySlug,
  type PostCategoryValue,
} from '@liftoff/shared-types';

export const CATEGORY_ICONS = {
  opportunity: Coins,
  breakdown: SearchCode,
  acquisition: ChartNoAxesColumnIncreasing,
  failure: Skull,
  solo: UserRound,
  vibe: Sparkles,
  agent: Bot,
  rag: Layers3,
  mcp: PlugZap,
  fde: BriefcaseBusiness,
  opc: Compass,
  tools: Wrench,
} satisfies Record<ForumCategoryIconKey, typeof Sparkles>;

export const BUSINESS_CATEGORIES = FORUM_CATEGORIES.filter(({ group }) => group === 'business');
export const TECHNICAL_CATEGORIES = FORUM_CATEGORIES.filter(({ group }) => group === 'technical');

export function categoryHref(slug: string) {
  return `/categories/${slug}`;
}

export const TECHNICAL_DISCUSSIONS = {
  slug: TECHNICAL_DISCUSSIONS_SLUG,
  label: '技术讨论',
  description: '聚合 Vibe Coding、Agent、RAG、MCP、FDE、OPC 方法论和工具资源。',
  icon: Sparkles,
} as const;

export function categoryForPathname(pathname: string) {
  const prefix = '/categories/';
  return pathname.startsWith(prefix) ? findForumCategory(pathname.slice(prefix.length)) : undefined;
}
