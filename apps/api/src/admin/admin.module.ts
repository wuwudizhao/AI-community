import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PostImagesModule } from '../post-images/post-images.module';
import { AdminController } from './admin.controller';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';

@Module({
  imports: [AuthModule, PostImagesModule],
  controllers: [AdminController],
  providers: [AdminService, AdminGuard],
})
export class AdminModule {}
