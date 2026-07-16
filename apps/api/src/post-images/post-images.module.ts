import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { AnonymousIdentityService } from '../posts/anonymous-identity.service';
import { PostImagesController } from './post-images.controller';
import { PostImagesService } from './post-images.service';

@Module({
  imports: [AuthModule],
  controllers: [PostImagesController],
  providers: [PostImagesService, AnonymousIdentityService],
  exports: [PostImagesService],
})
export class PostImagesModule {}
