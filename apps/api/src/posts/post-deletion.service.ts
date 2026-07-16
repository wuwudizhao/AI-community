import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

import { PrismaService } from '../prisma/prisma.service';
import { PostImagesService } from '../post-images/post-images.service';

export type DeleteActor =
  { type: 'user'; id: string; role: string } | { type: 'anonymous'; id: string } | null;

const WINDOW_MS = 60_000;
const MAX_DELETES = 10;

@Injectable()
export class PostDeletionService {
  private readonly logger = new Logger(PostDeletionService.name);
  private readonly attempts = new Map<string, number[]>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly images: PostImagesService,
  ) {}

  async delete(slug: string, actor: DeleteActor, request: Request) {
    this.assertSameSite(request);
    const key = actor ? `${actor.type}:${actor.id}` : `ip:${request.ip ?? 'unknown'}`;
    this.consume(key);

    const post = await this.prisma.post.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        authorId: true,
        anonymousAuthorId: true,
        images: { select: { storageKey: true } },
      },
    });
    if (!post) {
      this.audit(slug, null, actor, 'not_found');
      throw new NotFoundException('帖子不存在或已被删除');
    }

    const allowed =
      actor?.type === 'user'
        ? actor.role === 'ADMIN' || post.authorId === actor.id
        : actor?.type === 'anonymous' && post.anonymousAuthorId === actor.id;
    if (!allowed) {
      this.audit(slug, post.id, actor, 'forbidden');
      throw new ForbiddenException('你没有权限删除这篇帖子');
    }

    await this.prisma.post.delete({ where: { id: post.id } });
    await this.images.removeFiles(post.images.map(({ storageKey }) => storageKey));
    this.audit(slug, post.id, actor, 'success');
    return { success: true, deletedSlug: slug };
  }

  canDelete(
    post: { authorId: string | null; anonymousAuthorId: string | null },
    actor: DeleteActor,
  ) {
    if (!actor) return false;
    if (actor.type === 'user') return actor.role === 'ADMIN' || post.authorId === actor.id;
    return post.anonymousAuthorId === actor.id;
  }

  private assertSameSite(request: Request) {
    const allowed = new URL(this.config.getOrThrow<string>('WEB_ORIGIN')).origin;
    const supplied = request.get('origin') ?? request.get('referer');
    let origin = '';
    try {
      origin = supplied ? new URL(supplied).origin : '';
    } catch {
      origin = '';
    }
    if (origin !== allowed) throw new ForbiddenException('无效的请求来源');
  }

  private consume(key: string) {
    const now = Date.now();
    const recent = (this.attempts.get(key) ?? []).filter((time) => time > now - WINDOW_MS);
    if (recent.length >= MAX_DELETES) {
      throw new HttpException('Too Many Requests', HttpStatus.TOO_MANY_REQUESTS);
    }
    this.attempts.set(key, [...recent, now]);
  }

  private audit(slug: string, postId: string | null, actor: DeleteActor, result: string) {
    this.logger.log(
      JSON.stringify({
        action: 'post.delete',
        postId,
        slug,
        actorType:
          actor?.type === 'user' && actor.role === 'ADMIN' ? 'admin' : (actor?.type ?? 'none'),
        actorId: actor?.id ?? null,
        timestamp: new Date().toISOString(),
        result,
      }),
    );
  }
}
