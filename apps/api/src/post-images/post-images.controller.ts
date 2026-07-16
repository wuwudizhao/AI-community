import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  StreamableFile,
  UnauthorizedException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';

import {
  OptionalSessionAuthGuard,
  type OptionalAuthenticatedRequest,
} from '../auth/optional-session-auth.guard';
import { AnonymousIdentityService } from '../posts/anonymous-identity.service';
import { MAX_POST_IMAGE_BYTES, PostImagesService } from './post-images.service';

@Controller('post-images')
export class PostImagesController {
  constructor(
    private readonly images: PostImagesService,
    private readonly config: ConfigService,
    private readonly anonymousIdentities: AnonymousIdentityService,
  ) {}

  @Post()
  @Throttle({ default: { limit: 20, ttl: 10 * 60_000 } })
  @UseGuards(OptionalSessionAuthGuard)
  @UseInterceptors(
    FileInterceptor('image', { limits: { fileSize: MAX_POST_IMAGE_BYTES, files: 1 } }),
  )
  async upload(
    @Req() request: OptionalAuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('请选择要上传的图片');
    if (request.user) return this.images.upload({ userId: request.user.id }, file, request);
    if (!this.config.get<boolean>('ALLOW_GUEST_POSTING')) throw new UnauthorizedException('未登录');
    const anonymous = await this.anonymousIdentities.getOrCreate(request, response);
    return this.images.upload({ anonymousIdentityId: anonymous.id }, file, request);
  }

  @Get(':id')
  async get(@Param('id') id: string, @Res({ passthrough: true }) response: Response) {
    const image = await this.images.open(id);
    response.set({
      'Content-Type': image.mimeType,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    });
    return new StreamableFile(image.stream);
  }
}
