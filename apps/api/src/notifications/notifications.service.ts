import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { notificationTargetUrl } from '../comments/comments.helpers';
import type { NotificationsQueryDto } from './notifications.dto';

const include = {
  actor: { select: { id: true, username: true, displayName: true } },
  post: { select: { slug: true, title: true } },
} as const;
@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}
  async list(recipientId: string, query: NotificationsQueryDto) {
    const where = { recipientId, ...(query.unreadOnly ? { readAt: null } : {}) };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        include,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.notification.count({ where }),
    ]);
    return {
      items: rows.map(mapNotification),
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize),
      },
    };
  }
  async unreadCount(recipientId: string) {
    return {
      count: await this.prisma.notification.count({ where: { recipientId, readAt: null } }),
    };
  }
  async read(id: string, recipientId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { id, recipientId, readAt: null },
      data: { readAt: new Date() },
    });
    if (!result.count) {
      const existing = await this.prisma.notification.findFirst({ where: { id, recipientId } });
      if (!existing) throw new NotFoundException('通知不存在');
    }
    return { message: '通知已读' };
  }
  async readAll(recipientId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { recipientId, readAt: null },
      data: { readAt: new Date() },
    });
    return { updated: result.count };
  }
}
type Included = Prisma.NotificationGetPayload<{ include: typeof include }>;
function mapNotification(item: Included) {
  const data =
    item.data && typeof item.data === 'object' && !Array.isArray(item.data)
      ? (item.data as Record<string, unknown>)
      : {};
  return {
    id: item.id,
    type: item.type,
    actor: item.actor,
    post: item.post,
    commentId: item.commentId,
    preview: typeof data.preview === 'string' ? data.preview : '',
    readAt: item.readAt?.toISOString() ?? null,
    createdAt: item.createdAt.toISOString(),
    targetUrl:
      item.post && item.commentId ? notificationTargetUrl(item.post.slug, item.commentId) : '/',
  };
}
