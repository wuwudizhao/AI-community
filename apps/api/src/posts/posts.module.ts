import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PostImagesModule } from '../post-images/post-images.module';
import { AnonymousIdentityService } from './anonymous-identity.service';
import { PostsController } from './posts.controller';
import { PostSubmissionProtectionService } from './post-submission-protection.service';
import { PostDeletionService } from './post-deletion.service';
import { PostsService } from './posts.service';

@Module({
  imports: [AuthModule, PostImagesModule],
  controllers: [PostsController],
  providers: [
    PostsService,
    AnonymousIdentityService,
    PostSubmissionProtectionService,
    PostDeletionService,
  ],
})
export class PostsModule {}
