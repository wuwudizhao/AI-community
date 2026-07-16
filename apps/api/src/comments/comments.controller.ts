import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SessionAuthGuard, type AuthenticatedRequest } from '../auth/session-auth.guard';
import { CommentsService } from './comments.service';
import { CommentsQueryDto, CreateCommentDto } from './comments.dto';

@ApiTags('comments')
@Controller()
export class CommentsController {
  constructor(private readonly comments: CommentsService) {}
  @Post('posts/:slug/comments')
  @UseGuards(SessionAuthGuard)
  create(
    @Param('slug') slug: string,
    @Req() req: AuthenticatedRequest,
    @Body() input: CreateCommentDto,
  ) {
    return this.comments.create(slug, req.user, input);
  }
  @Get('posts/:slug/comments')
  list(@Param('slug') slug: string, @Query() query: CommentsQueryDto) {
    return this.comments.list(slug, query);
  }
  @Delete('comments/:id')
  @UseGuards(SessionAuthGuard)
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.comments.remove(id, req.user);
  }
  @Get('comments/mine')
  @UseGuards(SessionAuthGuard)
  mine(@Req() req: AuthenticatedRequest, @Query() query: CommentsQueryDto) {
    return this.comments.mine(req.user, query);
  }
}
