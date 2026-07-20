import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
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
  @UseGuards(OptionalSessionAuthGuard)
  list(@Query() query: PostsQueryDto, @Req() request: OptionalAuthenticatedRequest) {
    return this.posts.list(query, request.user?.id);
  }

  @Get('mine')
  @UseGuards(SessionAuthGuard)
  mine(@Req() request: AuthenticatedRequest, @Query() query: PostsQueryDto) {
    return this.posts.mine(request.user.id, query);
  }

  @Get('bookmarks')
  @UseGuards(SessionAuthGuard)
  bookmarks(@Req() request: AuthenticatedRequest, @Query() query: PostsQueryDto) {
    return this.posts.bookmarks(request.user.id, query);
  }

  @Get('history')
  @UseGuards(SessionAuthGuard)
  history(@Req() request: AuthenticatedRequest, @Query() query: PostsQueryDto) {
    return this.posts.history(request.user.id, query);
  }

  @Delete('history')
  @UseGuards(SessionAuthGuard)
  clearHistory(@Req() request: AuthenticatedRequest) {
    return this.posts.clearHistory(request.user.id);
  }

  @Delete('history/:postId')
  @UseGuards(SessionAuthGuard)
  removeHistory(@Req() request: AuthenticatedRequest, @Param('postId') postId: string) {
    return this.posts.removeHistory(request.user.id, postId);
  }

  @Put(':slug/like')
  @UseGuards(SessionAuthGuard)
  like(@Req() request: AuthenticatedRequest, @Param('slug') slug: string) {
    return this.posts.setLike(request.user.id, slug, true);
  }

  @Delete(':slug/like')
  @UseGuards(SessionAuthGuard)
  unlike(@Req() request: AuthenticatedRequest, @Param('slug') slug: string) {
    return this.posts.setLike(request.user.id, slug, false);
  }

  @Put(':slug/bookmark')
  @UseGuards(SessionAuthGuard)
  bookmark(@Req() request: AuthenticatedRequest, @Param('slug') slug: string) {
    return this.posts.setBookmark(request.user.id, slug, true);
  }

  @Delete(':slug/bookmark')
  @UseGuards(SessionAuthGuard)
  unbookmark(@Req() request: AuthenticatedRequest, @Param('slug') slug: string) {
    return this.posts.setBookmark(request.user.id, slug, false);
  }

  @Post(':slug/view-history')
  @UseGuards(SessionAuthGuard)
  recordView(@Req() request: AuthenticatedRequest, @Param('slug') slug: string) {
    return this.posts.recordView(request.user.id, slug);
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
