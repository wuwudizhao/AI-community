import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createReadStream } from 'node:fs';
import { access, mkdir, unlink, writeFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { randomBytes } from 'node:crypto';
import type { Request } from 'express';
import sharp from 'sharp';

import { PrismaService } from '../prisma/prisma.service';

export const MAX_POST_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_IMAGES_PER_POST = 8;
const MAX_IMAGE_PIXELS = 40_000_000;
const MAX_PENDING_IMAGES = 20;
const UPLOAD_WINDOW_MS = 10 * 60_000;
const ALLOWED_INPUT_FORMATS = new Set(['jpeg', 'png', 'webp']);

export type ImageOwner = { userId: string } | { anonymousIdentityId: string };

@Injectable()
export class PostImagesService implements OnModuleInit {
  private readonly storageDirectory: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.storageDirectory = resolve(config.getOrThrow<string>('POST_IMAGE_STORAGE_DIR'));
  }

  async onModuleInit() {
    await mkdir(this.storageDirectory, { recursive: true });
    const expired = await this.prisma.postImage.findMany({
      where: { postId: null, createdAt: { lt: new Date(Date.now() - 24 * 60 * 60_000) } },
      select: { id: true, storageKey: true },
    });
    if (expired.length === 0) return;
    await this.prisma.postImage.deleteMany({ where: { id: { in: expired.map(({ id }) => id) } } });
    await this.removeFiles(expired.map(({ storageKey }) => storageKey));
  }

  async upload(owner: ImageOwner, file: Express.Multer.File, request: Request) {
    this.assertSameSite(request);
    await this.assertUploadAvailable(owner);
    if (!file?.buffer?.length) throw new BadRequestException('请选择要上传的图片');
    if (file.size > MAX_POST_IMAGE_BYTES) throw new BadRequestException('单张图片不能超过 5MB');

    let output: Buffer;
    let width: number;
    let height: number;
    try {
      const pipeline = sharp(file.buffer, { failOn: 'error', limitInputPixels: MAX_IMAGE_PIXELS });
      const metadata = await pipeline.metadata();
      if (!metadata.format || !ALLOWED_INPUT_FORMATS.has(metadata.format)) {
        throw new BadRequestException('仅支持 JPEG、PNG 和 WebP 图片');
      }
      if (!metadata.width || !metadata.height) throw new BadRequestException('无法读取图片尺寸');
      width = metadata.width;
      height = metadata.height;
      output = await pipeline.rotate().webp({ quality: 84, effort: 4 }).toBuffer();
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('图片文件无效或已损坏');
    }

    const storageKey = `${randomBytes(24).toString('hex')}.webp`;
    const path = this.pathFor(storageKey);
    await mkdir(this.storageDirectory, { recursive: true });
    await writeFile(path, output, { flag: 'wx' });

    try {
      const image = await this.prisma.postImage.create({
        data: {
          storageKey,
          mimeType: 'image/webp',
          sizeBytes: output.length,
          width,
          height,
          ...('userId' in owner
            ? { uploaderUserId: owner.userId }
            : { anonymousIdentityId: owner.anonymousIdentityId }),
        },
        select: { id: true, width: true, height: true, sizeBytes: true },
      });
      const url = `${this.config.getOrThrow<string>('API_PUBLIC_URL').replace(/\/$/, '')}/api/post-images/${image.id}`;
      return {
        ...image,
        mimeType: 'image/webp',
        url,
        markdown: `![${safeAltText(file.originalname)}](${url})`,
      };
    } catch (error) {
      await unlink(path).catch(() => undefined);
      throw error;
    }
  }

  async open(id: string) {
    const image = await this.prisma.postImage.findUnique({
      where: { id },
      select: { storageKey: true, mimeType: true },
    });
    if (!image) throw new NotFoundException('图片不存在');
    await access(this.pathFor(image.storageKey)).catch(() => {
      throw new NotFoundException('图片文件不存在');
    });
    return { stream: createReadStream(this.pathFor(image.storageKey)), mimeType: image.mimeType };
  }

  extractImageIds(markdown: string): string[] {
    const ids = new Set<string>();
    const pattern = /\/api\/post-images\/(c[a-z0-9]{20,40})(?:[?#)\s]|$)/gi;
    for (const match of markdown.matchAll(pattern)) ids.add(match[1]);
    return [...ids];
  }

  async assertAndAttach(
    tx: Pick<PrismaService, 'postImage'>,
    owner: ImageOwner,
    postId: string,
    markdown: string,
  ) {
    const markdownImageCount = (markdown.match(/!\[[^\]]*\]\([^\n)]+\)/g) ?? []).length;
    if (markdownImageCount > MAX_IMAGES_PER_POST) {
      throw new BadRequestException(`每篇帖子最多插入 ${MAX_IMAGES_PER_POST} 张图片`);
    }
    const imageIds = this.extractImageIds(markdown);
    if (imageIds.length === 0) return;
    const ownership =
      'userId' in owner
        ? { uploaderUserId: owner.userId }
        : { anonymousIdentityId: owner.anonymousIdentityId };
    const images = await tx.postImage.findMany({
      where: { id: { in: imageIds }, postId: null, ...ownership },
      select: { id: true },
    });
    if (images.length !== imageIds.length) {
      throw new BadRequestException('正文包含无效、已使用或不属于当前作者的图片');
    }
    await tx.postImage.updateMany({ where: { id: { in: imageIds } }, data: { postId } });
  }

  async removeFiles(storageKeys: string[]) {
    await Promise.all(storageKeys.map((key) => unlink(this.pathFor(key)).catch(() => undefined)));
  }

  private async assertUploadAvailable(owner: ImageOwner) {
    const ownership =
      'userId' in owner
        ? { uploaderUserId: owner.userId }
        : { anonymousIdentityId: owner.anonymousIdentityId };
    const recent = await this.prisma.postImage.count({
      where: { ...ownership, createdAt: { gte: new Date(Date.now() - UPLOAD_WINDOW_MS) } },
    });
    const pending = await this.prisma.postImage.count({ where: { ...ownership, postId: null } });
    if (recent >= MAX_PENDING_IMAGES || pending >= MAX_PENDING_IMAGES) {
      throw new HttpException('图片上传过于频繁，请稍后再试', HttpStatus.TOO_MANY_REQUESTS);
    }
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

  private pathFor(storageKey: string) {
    return resolve(this.storageDirectory, basename(storageKey));
  }
}

function safeAltText(originalName: string): string {
  const name = basename(
    originalName,
    originalName.includes('.') ? originalName.slice(originalName.lastIndexOf('.')) : '',
  )
    .replaceAll('[', '')
    .replaceAll(']', '')
    .replace(/[()`<>]/g, '')
    .trim();
  return name.slice(0, 80) || '帖子图片';
}
