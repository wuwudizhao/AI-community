import { Injectable, NotFoundException } from '@nestjs/common';

import { PostImagesService } from '../post-images/post-images.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly images: PostImagesService,
  ) {}

  async dashboard() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [users, posts, usersToday, postsToday] = await this.prisma.$transaction([
      this.prisma.user.count(),
      this.prisma.post.count(),
      this.prisma.user.count({ where: { createdAt: { gte: today } } }),
      this.prisma.post.count({ where: { createdAt: { gte: today } } }),
    ]);

    return { users, posts, usersToday, postsToday };
  }

  async posts() {
    const posts = await this.prisma.post.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        pinned: true,
        createdAt: true,
        publishedAt: true,
        author: { select: { username: true, displayName: true } },
        anonymousAuthor: { select: { displayName: true } },
      },
      orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
    });

    return posts.map((post) => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      status: post.status,
      pinned: post.pinned,
      createdAt: post.createdAt.toISOString(),
      publishedAt: post.publishedAt?.toISOString() ?? null,
      author:
        post.author?.displayName ??
        post.author?.username ??
        post.anonymousAuthor?.displayName ??
        '匿名用户',
    }));
  }

  async deletePost(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      select: { id: true, images: { select: { storageKey: true } } },
    });
    if (!post) throw new NotFoundException('帖子不存在或已被删除');

    await this.prisma.post.delete({ where: { id } });
    await this.images.removeFiles(post.images.map(({ storageKey }) => storageKey));
    return { success: true, deletedId: id };
  }

  async setPostPinned(id: string, pinned: boolean) {
    const result = await this.prisma.post.updateMany({ where: { id }, data: { pinned } });
    if (result.count === 0) throw new NotFoundException('帖子不存在');
    return { id, pinned };
  }

  async users() {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });

    return users.map((user) => ({ ...user, createdAt: user.createdAt.toISOString() }));
  }

  async updateUserRole(id: string, role: 'USER' | 'ADMIN') {
    const result = await this.prisma.user.updateMany({ where: { id }, data: { role } });
    if (result.count === 0) throw new NotFoundException('用户不存在');
    return { id, role };
  }
}
