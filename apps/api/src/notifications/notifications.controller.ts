import { Controller, Get, Param, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SessionAuthGuard, type AuthenticatedRequest } from '../auth/session-auth.guard';
import { NotificationsQueryDto } from './notifications.dto';
import { NotificationsService } from './notifications.service';
@ApiTags('notifications')
@Controller('notifications')
@UseGuards(SessionAuthGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}
  @Get() list(@Req() req: AuthenticatedRequest, @Query() query: NotificationsQueryDto) {
    return this.notifications.list(req.user.id, query);
  }
  @Get('unread-count') count(@Req() req: AuthenticatedRequest) {
    return this.notifications.unreadCount(req.user.id);
  }
  @Patch('read-all') readAll(@Req() req: AuthenticatedRequest) {
    return this.notifications.readAll(req.user.id);
  }
  @Patch(':id/read') read(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.notifications.read(id, req.user.id);
  }
}
