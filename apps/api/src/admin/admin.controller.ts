import { Body, Controller, Delete, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { SessionAuthGuard } from '../auth/session-auth.guard';
import { UpdatePostPinnedDto, UpdateUserRoleDto } from './admin.dto';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';

@ApiTags('admin')
@Controller('admin')
@UseGuards(SessionAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('dashboard')
  dashboard() {
    return this.admin.dashboard();
  }

  @Get('posts')
  posts() {
    return this.admin.posts();
  }

  @Delete('posts/:id')
  deletePost(@Param('id') id: string) {
    return this.admin.deletePost(id);
  }

  @Patch('posts/:id/pinned')
  setPostPinned(@Param('id') id: string, @Body() input: UpdatePostPinnedDto) {
    return this.admin.setPostPinned(id, input.pinned);
  }

  @Get('users')
  users() {
    return this.admin.users();
  }

  @Patch('users/:id/role')
  updateUserRole(@Param('id') id: string, @Body() input: UpdateUserRoleDto) {
    return this.admin.updateUserRole(id, input.role);
  }
}
