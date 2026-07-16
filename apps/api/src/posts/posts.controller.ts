import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';

import {
  OptionalSessionAuthGuard,
  type OptionalAuthenticatedRequest,
} from '../auth/optional-session-auth.guard';
import { SessionAuthGuard, type AuthenticatedRequest } from '../auth/session-auth.guard';
import { AnonymousIdentityService } from './anonymous-identity.service';
import { PostSubmissionProtectionService } from './post-submission-protection.service';
import { PostDeletionService, type DeleteActor } from './post-deletion.service';
import { CreatePostDto, PostsQueryDto } from './posts.dto';
import { PostsService } from './posts.service';

@ApiTags('posts')
@Controller('posts')
export class PostsController {
  constructor(
    private readonly posts: PostsService,
    private readonly config: ConfigService,
    private readonly anonymousIdentities: AnonymousIdentityService,
    private readonly protection: PostSubmissionProtectionService,
    private readonly deletion: PostDeletionService,
  ) {}

  @Post()
  @UseGuards(OptionalSessionAuthGuard)
  async create(
    @Req() request: OptionalAuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
    @Body() input: CreatePostDto,
  ) {
    const ip = request.ip ?? request.socket.remoteAddress ?? 'unknown';
    if (request.user) {
      this.protection.consume(`user:${request.user.id}`, ip);
      return this.posts.create({ userId: request.user.id }, input);
    }
    if (!this.config.get<boolean>('ALLOW_GUEST_POSTING')) {
      throw new UnauthorizedException('未登录');
    }

    const anonymousIdentity = await this.anonymousIdentities.getOrCreate(request, response);
    this.protection.consume(`anonymous:${anonymousIdentity.id}`, ip);
    return this.posts.create({ anonymousIdentityId: anonymousIdentity.id }, input);
  }

  @Get()
  list(@Query() query: PostsQueryDto) {
    return this.posts.list(query);
  }

  @Get('mine')
  @UseGuards(SessionAuthGuard)
  mine(@Req() request: AuthenticatedRequest, @Query() query: PostsQueryDto) {
    return this.posts.mine(request.user.id, query);
  }

  @Delete(':slug')
  @UseGuards(OptionalSessionAuthGuard)
  async delete(@Param('slug') slug: string, @Req() request: OptionalAuthenticatedRequest) {
    const actor = await this.resolveActor(request);
    return this.deletion.delete(slug, actor, request);
  }

  @Get(':slug')
  @UseGuards(OptionalSessionAuthGuard)
  async detail(@Param('slug') slug: string, @Req() request: OptionalAuthenticatedRequest) {
    return this.posts.detail(slug, await this.resolveActor(request));
  }

  private async resolveActor(request: OptionalAuthenticatedRequest): Promise<DeleteActor> {
    if (request.user) return { type: 'user', id: request.user.id, role: request.user.role };
    const anonymous = await this.anonymousIdentities.findExisting(request);
    return anonymous ? { type: 'anonymous', id: anonymous.id } : null;
  }
}
