export type ServiceState = 'up' | 'down';

export interface DatabaseHealth {
  status: ServiceState;
  latencyMs: number | null;
  message?: string;
}

export interface HealthResponse {
  status: 'ok' | 'degraded';
  service: 'liftoff-api';
  timestamp: string;
  uptimeSeconds: number;
  database: DatabaseHealth;
}

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  bio: string | null;
  role: 'USER' | 'MODERATOR' | 'ADMIN';
  status: 'ACTIVE' | 'PENDING_VERIFICATION' | 'SUSPENDED' | 'BANNED';
  emailVerifiedAt: string | null;
  adminVerifiedUntil: string | null;
}

export type ForumCategoryGroup = 'business' | 'technical';

export type ForumCategoryIconKey =
  | 'opportunity'
  | 'breakdown'
  | 'acquisition'
  | 'failure'
  | 'solo'
  | 'vibe'
  | 'agent'
  | 'rag'
  | 'mcp'
  | 'fde'
  | 'opc'
  | 'tools';

export type PostCategoryValue =
  | 'MONEY_OPPORTUNITY'
  | 'PROJECT_BREAKDOWN'
  | 'TUTORIAL_PRACTICE'
  | 'FAILURE_REVIEW'
  | 'SOLO_COMPANY'
  | 'VIBE_CODING'
  | 'AGENT'
  | 'RAG'
  | 'MCP'
  | 'FDE'
  | 'OPC_METHODOLOGY'
  | 'TOOLS_RESOURCES';

export type ForumCategory = {
  readonly key: string;
  readonly dbValue: PostCategoryValue;
  readonly slug: string;
  readonly label: string;
  readonly description: string;
  readonly group: ForumCategoryGroup;
  readonly iconKey: ForumCategoryIconKey;
  readonly enabled: true;
};

export const FORUM_CATEGORIES = [
  {
    key: 'money-opportunity',
    dbValue: 'MONEY_OPPORTUNITY',
    slug: 'money-opportunities',
    label: '赚钱机会',
    description: '发现值得验证的商业机会，讨论需求、付费意愿和第一步测试方法。',
    group: 'business',
    iconKey: 'opportunity',
    enabled: true,
  },
  {
    key: 'project-breakdown',
    dbValue: 'PROJECT_BREAKDOWN',
    slug: 'project-breakdowns',
    label: '项目拆解',
    description: '从需求、产品、获客和交付角度分析一个项目如何运转。',
    group: 'business',
    iconKey: 'breakdown',
    enabled: true,
  },
  {
    key: 'tutorial-practice',
    dbValue: 'TUTORIAL_PRACTICE',
    slug: 'tutorials',
    label: '教程与实践',
    description: '记录可复现的实践过程、操作步骤和踩坑经验。',
    group: 'business',
    iconKey: 'acquisition',
    enabled: true,
  },
  {
    key: 'failure-review',
    dbValue: 'FAILURE_REVIEW',
    slug: 'failure-reviews',
    label: '失败复盘',
    description: '诚实复盘没有奏效的尝试，以及下一次可以怎样调整。',
    group: 'business',
    iconKey: 'failure',
    enabled: true,
  },
  {
    key: 'solo-company',
    dbValue: 'SOLO_COMPANY',
    slug: 'solo-company',
    label: '一人公司',
    description: '讨论个人如何借助工具完成产品、运营、销售和交付。',
    group: 'business',
    iconKey: 'solo',
    enabled: true,
  },
  {
    key: 'vibe-coding',
    dbValue: 'VIBE_CODING',
    slug: 'vibe-coding',
    label: 'Vibe Coding',
    description: '交流自然语言驱动开发的工作流、工具选择和工程边界。',
    group: 'technical',
    iconKey: 'vibe',
    enabled: true,
  },
  {
    key: 'agent',
    dbValue: 'AGENT',
    slug: 'agent',
    label: 'Agent',
    description: '讨论 Agent 的设计、编排、工具调用和真实应用经验。',
    group: 'technical',
    iconKey: 'agent',
    enabled: true,
  },
  {
    key: 'rag',
    dbValue: 'RAG',
    slug: 'rag',
    label: 'RAG',
    description: '交流检索增强生成中的数据、召回、评估和上线实践。',
    group: 'technical',
    iconKey: 'rag',
    enabled: true,
  },
  {
    key: 'mcp',
    dbValue: 'MCP',
    slug: 'mcp',
    label: 'MCP',
    description: '分享 MCP 服务、客户端集成、安全边界和调试经验。',
    group: 'technical',
    iconKey: 'mcp',
    enabled: true,
  },
  {
    key: 'fde',
    dbValue: 'FDE',
    slug: 'fde',
    label: 'FDE',
    description: '讨论面向客户的一线工程、解决方案落地和交付协作。',
    group: 'technical',
    iconKey: 'fde',
    enabled: true,
  },
  {
    key: 'opc-methodology',
    dbValue: 'OPC_METHODOLOGY',
    slug: 'opc-methodology',
    label: 'OPC 方法论',
    description: '交流一人公司方法论、流程设计和持续经营经验。',
    group: 'technical',
    iconKey: 'opc',
    enabled: true,
  },
  {
    key: 'tools-resources',
    dbValue: 'TOOLS_RESOURCES',
    slug: 'tools-resources',
    label: '工具与资源',
    description: '分享真正解决问题的工具、开源项目和学习资源。',
    group: 'technical',
    iconKey: 'tools',
    enabled: true,
  },
] as const satisfies readonly ForumCategory[];

export type ForumCategorySlug = (typeof FORUM_CATEGORIES)[number]['slug'];
export type ForumCategoryKey = (typeof FORUM_CATEGORIES)[number]['key'];

export const TECHNICAL_DISCUSSIONS_SLUG = 'technical-discussions' as const;
export type ForumCategoryFilter = ForumCategoryKey | typeof TECHNICAL_DISCUSSIONS_SLUG;

export const FORUM_CATEGORY_FILTERS: readonly ForumCategoryFilter[] = [
  ...FORUM_CATEGORIES.map(({ key }) => key),
  TECHNICAL_DISCUSSIONS_SLUG,
];

export function findForumCategory(slug: string) {
  return FORUM_CATEGORIES.find((category) => category.slug === slug);
}

export function findForumCategoryByKey(key: string) {
  return FORUM_CATEGORIES.find((category) => category.key === key);
}

export function findForumCategoryByValue(value: string) {
  return FORUM_CATEGORIES.find((category) => category.dbValue === value);
}

export const POST_CATEGORY_VALUES: readonly PostCategoryValue[] = FORUM_CATEGORIES.map(
  ({ dbValue }) => dbValue,
);

export function categoryDatabaseValues(filter: ForumCategoryFilter): readonly PostCategoryValue[] {
  if (filter === TECHNICAL_DISCUSSIONS_SLUG) {
    return FORUM_CATEGORIES.filter(({ group }) => group === 'technical').map(
      ({ dbValue }) => dbValue,
    );
  }
  const category = findForumCategoryByKey(filter);
  return category ? [category.dbValue] : [];
}

export type PostContentError =
  | 'MISSING_TITLE'
  | 'IMAGE_TITLE'
  | 'LINK_TITLE'
  | 'TAG_TITLE'
  | 'PUNCTUATION_TITLE'
  | 'TITLE_TOO_SHORT'
  | 'TITLE_TOO_LONG'
  | 'MISSING_BODY'
  | 'BODY_TOO_LONG';

export type PostContentAnalysis = {
  title: string;
  contentMarkdown: string;
  titleValid: boolean;
  bodyValid: boolean;
  error: PostContentError | null;
};

const visibleContent = /[^\s\u200B-\u200D\uFEFF]/;
const markdownImage = /!\[[^\]]*\]\([^\n)]*\)/;
const markdownLinkOnly = /^\[[^\]]+\]\([^\n)]+\)$/;
const plainLinkOnly = /^(?:(?:[a-z][a-z0-9+.-]*):\/\/|mailto:|www\.)\S+$/i;
const angleLinkOnly = /^<[a-z][a-z0-9+.-]*:[^>]+>$/i;
const hashtagOnly = /^#[^\s#]+(?:\s+#[^\s#]+)*$/u;
const letterOrNumber = /[\p{L}\p{N}]/u;

export function analyzePostContent(rawContent: string): PostContentAnalysis {
  const lines = rawContent.replace(/^\uFEFF/, '').split(/\r?\n/);
  const titleLineIndex = lines.findIndex((line) => visibleContent.test(line));
  if (titleLineIndex < 0) return invalidContent('MISSING_TITLE');

  const rawTitleLine = lines[titleLineIndex].trim();
  const bodyLines = lines.slice(titleLineIndex + 1);
  while (bodyLines[0]?.trim() === '') bodyLines.shift();
  const contentMarkdown = bodyLines.join('\n').trim();

  if (markdownImage.test(rawTitleLine)) {
    return invalidContent('IMAGE_TITLE', '', contentMarkdown);
  }
  if (
    markdownLinkOnly.test(rawTitleLine) ||
    plainLinkOnly.test(rawTitleLine) ||
    angleLinkOnly.test(rawTitleLine)
  ) {
    return invalidContent('LINK_TITLE', '', contentMarkdown);
  }
  if (hashtagOnly.test(rawTitleLine)) {
    return invalidContent('TAG_TITLE', '', contentMarkdown);
  }

  const title = rawTitleLine.replace(/^\s{0,3}#{1,6}\s*/, '').trim();
  if (markdownLinkOnly.test(title) || plainLinkOnly.test(title) || angleLinkOnly.test(title)) {
    return invalidContent('LINK_TITLE', '', contentMarkdown);
  }
  if (!letterOrNumber.test(title))
    return invalidContent('PUNCTUATION_TITLE', title, contentMarkdown);
  if (title.length < 3) return invalidContent('TITLE_TOO_SHORT', title, contentMarkdown);
  if (title.length > 160) return invalidContent('TITLE_TOO_LONG', title, contentMarkdown);

  if (!visibleContent.test(contentMarkdown)) {
    return { title, contentMarkdown, titleValid: true, bodyValid: false, error: 'MISSING_BODY' };
  }
  if (contentMarkdown.length > 50_000) {
    return { title, contentMarkdown, titleValid: true, bodyValid: false, error: 'BODY_TOO_LONG' };
  }
  return { title, contentMarkdown, titleValid: true, bodyValid: true, error: null };
}

function invalidContent(
  error: PostContentError,
  title = '',
  contentMarkdown = '',
): PostContentAnalysis {
  return { title, contentMarkdown, titleValid: false, bodyValid: false, error };
}
