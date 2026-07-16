import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import type { PublicUser } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';
import type { CommentsQueryDto, CreateCommentDto } from './comments.dto';
import { canDeleteComment, notificationPreview } from './comments.helpers';

const authorSelect = { id: true, username: true, displayName: true } as const;
const include = {
  author: { select: authorSelect },
  replyToUser: { select: authorSelect },
} as const;

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(postSlug: string, user: PublicUser, input: CreateCommentDto) {
    return this.prisma.$transaction(async (tx) => {
      const post = await tx.post.findFirst({ where: { slug: postSlug, status: 'PUBLISHED' } });
      if (!post) throw new NotFoundException('帖子不存在');
      let parentId: string | null = null;
      let replyToUserId: string | null = null;
      if (input.replyToCommentId) {
        const target = await tx.comment.findUnique({ where: { id: input.replyToCommentId } });
        if (!target || target.postId !== post.id || target.status !== 'PUBLISHED')
          throw new NotFoundException('回复目标不存在');
        parentId = target.parentId ?? target.id;
        replyToUserId = target.authorId;
      }
      const comment = await tx.comment.create({
        data: {
          postId: post.id,
          authorId: user.id,
          parentId,
          replyToUserId,
          content: input.content,
        },
        include,
      });
      const recipientId = replyToUserId ?? post.authorId;
      if (recipientId && recipientId !== user.id) {
        await tx.notification.create({
          data: {
            recipientId,
            actorId: user.id,
            type: replyToUserId ? 'COMMENT_REPLIED' : 'POST_COMMENTED',
            postId: post.id,
            commentId: comment.id,
            data: { preview: notificationPreview(comment.content) },
          },
        });
      }
      return mapComment(comment, user);
    });
  }

  async list(postSlug: string, query: CommentsQueryDto, viewer?: PublicUser) {
    const post = await this.prisma.post.findFirst({
      where: { slug: postSlug, status: 'PUBLISHED' },
    });
    if (!post) throw new NotFoundException('帖子不存在');
    const where = { postId: post.id, parentId: null, status: { not: 'HIDDEN' as const } };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.comment.findMany({
        where,
        include: {
          ...include,
          replies: {
            where: { status: { not: 'HIDDEN' } },
            include,
            orderBy: { createdAt: 'asc' },
            take: 100,
          },
        },
        orderBy: { createdAt: query.sort === 'oldest' ? 'asc' : 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.comment.count({ where }),
    ]);
    return {
      items: rows.map((row) => ({
        ...mapComment(row, viewer),
        replyCount: row.replies.length,
        replies: row.replies.map((reply) => mapComment(reply, viewer)),
      })),
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize),
      },
    };
  }

  async mine(user: PublicUser, query: CommentsQueryDto) {
    const where = { authorId: user.id };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.comment.findMany({
        where,
        include: { ...include, post: { select: { slug: true, title: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.comment.count({ where }),
    ]);
    return {
      items: rows.map((row) => ({ ...mapComment(row, user), post: row.post })),
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize),
      },
    };
  }

  async remove(id: string, user: PublicUser) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment || !canDeleteComment(user.id, user.role, comment.authorId))
      throw new NotFoundException('评论不存在');
    if (comment.status === 'DELETED') return { message: '评论已删除' };
    await this.prisma.comment.update({
      where: { id },
      data: { status: 'DELETED', deletedAt: new Date(), deletedById: user.id },
    });
    return { message: '评论已删除' };
  }
}

type Included = Prisma.CommentGetPayload<{ include: typeof include }>;
function mapComment(comment: Included, viewer?: PublicUser) {
  const deleted = comment.status === 'DELETED';
  return {
    id: comment.id,
    content: deleted ? null : comment.content,
    placeholder: deleted ? '该评论已删除' : null,
    status: comment.status,
    author: comment.author,
    parentId: comment.parentId,
    replyToUser: comment.replyToUser,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
    canDelete: viewer ? canDeleteComment(viewer.id, viewer.role, comment.authorId) : false,
  };
}
