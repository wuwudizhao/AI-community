import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { createHash, randomBytes } from 'node:crypto';
import {
  analyzePostContent,
  categoryDatabaseValues,
  findForumCategoryByValue,
  type PostContentError,
} from '@liftoff/shared-types';

import { PrismaService } from '../prisma/prisma.service';
import { PostImagesService } from '../post-images/post-images.service';
import type { CreatePostDto, PostsQueryDto } from './posts.dto';
import { excerpt, normalizeTags, postSlugBase } from './posts.helpers';
import { PostDeletionService, type DeleteActor } from './post-deletion.service';

const publicInclude = {
  author: { select: { id: true, username: true, displayName: true, bio: true } },
  anonymousAuthor: { select: { id: true, displayName: true } },
  tags: { include: { tag: true } },
  _count: { select: { comments: { where: { status: 'PUBLISHED' as const } } } },
} as const;

@Injectable()
export class PostsService {
  private readonly inFlightSubmissions = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly deletion: PostDeletionService,
    private readonly images: PostImagesService,
  ) {}

  async create(author: { userId: string } | { anonymousIdentityId: string }, input: CreatePostDto) {
    if (input.website?.trim()) throw new BadRequestException('无法发布帖子');

    const analyzed = analyzePostContent(input.contentMarkdown);
    if (analyzed.error) throw new BadRequestException(postContentErrorMessage(analyzed.error));
    const { title, contentMarkdown } = analyzed;
    if (input.title !== undefined && input.title.trim() !== title) {
      throw new BadRequestException('title 必须与正文第一行自动提取的标题一致');
    }
    const tags = normalizeTags(input.tags);
    const fingerprint = createHash('sha256')
      .update(title)
      .update('\0')
      .update(contentMarkdown)
      .digest('hex');
    if (this.inFlightSubmissions.has(fingerprint)) throw duplicateSubmission();
    this.inFlightSubmissions.add(fingerprint);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const duplicate = await tx.post.findFirst({
          where: {
            title,
            contentMarkdown,
            createdAt: { gte: new Date(Date.now() - 10 * 60_000) },
          },
          select: { id: true },
        });
        if (duplicate) throw duplicateSubmission();

        const base = postSlugBase(title);
        const slug = `${base}-${randomBytes(5).toString('hex')}`;
        const post = await tx.post.create({
          data: {
            title,
            slug,
            contentMarkdown,
            category: input.category,
            ...('userId' in author
              ? { authorId: author.userId }
              : { anonymousAuthorId: author.anonymousIdentityId }),
            status: 'PUBLISHED',
            publishedAt: new Date(),
            tags: {
              create: tags.map((tag) => ({
                tag: { connectOrCreate: { where: { slug: tag.slug }, create: tag } },
              })),
            },
          },
          include: publicInclude,
        });
        await this.images.assertAndAttach(tx, author, post.id, contentMarkdown);
        return mapPost(post, false);
      });
    } finally {
      this.inFlightSubmissions.delete(fingerprint);
    }
  }

  async list(query: PostsQueryDto) {
    const normalizedTag = query.tag ? normalizeTags([query.tag])[0] : undefined;
    const categoryValues = query.category ? categoryDatabaseValues(query.category) : undefined;
    const filters: Prisma.PostWhereInput[] = [];
    if (normalizedTag) filters.push({ tags: { some: { tag: { slug: normalizedTag.slug } } } });
    if (query.q) {
      filters.push({
        OR: [
          { title: { contains: query.q, mode: 'insensitive' } },
          { contentMarkdown: { contains: query.q, mode: 'insensitive' } },
          { tags: { some: { tag: { name: { contains: query.q, mode: 'insensitive' } } } } },
        ],
      });
    }
    if (categoryValues) {
      filters.push({ category: { in: [...categoryValues] } });
    }
    const where: Prisma.PostWhereInput = {
      status: 'PUBLISHED',
      ...(filters.length > 0 ? { AND: filters } : {}),
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.post.findMany({
        where,
        include: publicInclude,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.post.count({ where }),
    ]);
    assertPageExists(query, total);
    return page(
      rows.map((post) => mapPost(post, true)),
      query,
      total,
    );
  }

  async mine(authorId: string, query: PostsQueryDto) {
    const where = { authorId };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.post.findMany({
        where,
        include: publicInclude,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.post.count({ where }),
    ]);
    assertPageExists(query, total);
    return page(
      rows.map((post) => mapPost(post, true)),
      query,
      total,
    );
  }

  async detail(slug: string, actor: DeleteActor = null) {
    const post = await this.prisma.post.findFirst({
      where: { slug, status: 'PUBLISHED' },
      include: publicInclude,
    });
    if (!post) throw new NotFoundException('帖子不存在');
    return { ...mapPost(post, false), canDelete: this.deletion.canDelete(post, actor) };
  }
}

function duplicateSubmission() {
  return new ConflictException('相同标题和正文已在短时间内发布，请勿重复提交');
}

function postContentErrorMessage(error: PostContentError): string {
  switch (error) {
    case 'MISSING_TITLE':
      return '请在正文第一行填写帖子标题';
    case 'IMAGE_TITLE':
      return '正文第一行不能是图片 Markdown';
    case 'LINK_TITLE':
      return '正文第一行不能是纯链接';
    case 'TAG_TITLE':
      return '正文第一行不能是纯标签';
    case 'PUNCTUATION_TITLE':
      return '正文第一行不能是空白或纯标点';
    case 'TITLE_TOO_SHORT':
      return '帖子标题不能少于 3 个字符';
    case 'TITLE_TOO_LONG':
      return '帖子标题不能超过 160 个字符';
    case 'MISSING_BODY':
      return '请在标题下一行继续填写正文';
    case 'BODY_TOO_LONG':
      return '帖子正文不能超过 50000 个字符';
  }
}

type IncludedPost = Prisma.PostGetPayload<{ include: typeof publicInclude }>;

function mapPost(post: IncludedPost, summary: boolean) {
  const category = findForumCategoryByValue(post.category);
  if (!category) throw new Error(`Unknown post category: ${post.category}`);
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    ...(summary
      ? { excerpt: excerpt(post.contentMarkdown) }
      : { contentMarkdown: post.contentMarkdown }),
    author: mapAuthor(post),
    category: { key: category.key, label: category.label },
    tags: post.tags.map(({ tag }) => ({ id: tag.id, name: tag.name, slug: tag.slug })),
    status: post.status,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    publishedAt: post.publishedAt?.toISOString() ?? null,
    commentCount: post._count.comments,
  };
}

function mapAuthor(post: IncludedPost) {
  if (post.author) {
    return {
      type: 'user' as const,
      id: post.author.id,
      username: post.author.username,
      displayName: post.author.displayName,
      bio: post.author.bio,
    };
  }
  if (post.anonymousAuthor) {
    return {
      type: 'anonymous' as const,
      displayName: post.anonymousAuthor.displayName,
      anonymousLabel: anonymousLabel(post.anonymousAuthor.id),
    };
  }
  throw new Error('Post has no author identity');
}

export function anonymousLabel(identityId: string): string {
  return createHash('sha256').update(identityId).digest('hex').slice(0, 4).toUpperCase();
}

function page(items: unknown[], query: PostsQueryDto, total: number) {
  const totalPages = Math.ceil(total / query.pageSize);
  return {
    items,
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      totalItems: total,
      totalPages,
      hasPreviousPage: query.page > 1,
      hasNextPage: query.page < totalPages,
    },
  };
}

function assertPageExists(query: PostsQueryDto, total: number) {
  const totalPages = Math.ceil(total / query.pageSize);
  if (query.page > 1 && query.page > totalPages) {
    throw new NotFoundException('分页不存在');
  }
}
