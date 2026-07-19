/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { NotFoundException } from '@nestjs/common';
import type { PublicUser } from '../auth/auth.service';
import type { PrismaService } from '../prisma/prisma.service';
import { CommentsService } from './comments.service';

const user: PublicUser = {
  id: 'actor',
  email: 'actor@example.test',
  username: 'actor',
  displayName: 'Actor',
  bio: null,
  role: 'USER',
  status: 'ACTIVE',
  emailVerifiedAt: new Date().toISOString(),
  adminVerifiedUntil: null,
};

describe('CommentsService.create', () => {
  it('creates a root comment and its post notification in one transaction', async () => {
    const tx = transaction();
    const service = serviceFor(tx);
    const result = await service.create('post', user, { content: 'hello' });
    expect(result.parentId).toBeNull();
    expect(tx.comment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ authorId: 'actor', parentId: null }),
      }),
    );
    expect(tx.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ recipientId: 'post-author', type: 'POST_COMMENTED' }),
      }),
    );
  });

  it('normalizes a reply-to-reply onto the root and notifies only the target author', async () => {
    const tx = transaction({
      id: 'reply',
      postId: 'post-id',
      authorId: 'target',
      parentId: 'root',
      status: 'PUBLISHED',
    });
    const service = serviceFor(tx);
    const result = await service.create('post', user, {
      content: 'nested',
      replyToCommentId: 'reply',
    });
    expect(result.parentId).toBe('root');
    expect(tx.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ recipientId: 'target', type: 'COMMENT_REPLIED' }),
      }),
    );
  });

  it('rejects reply targets from another post', async () => {
    const tx = transaction({
      id: 'other',
      postId: 'other-post',
      authorId: 'target',
      parentId: null,
      status: 'PUBLISHED',
    });
    await expect(
      serviceFor(tx).create('post', user, { content: 'bad', replyToCommentId: 'other' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('does not create a self notification', async () => {
    const tx = transaction({
      id: 'root',
      postId: 'post-id',
      authorId: 'actor',
      parentId: null,
      status: 'PUBLISHED',
    });
    await serviceFor(tx).create('post', user, { content: 'self', replyToCommentId: 'root' });
    expect(tx.notification.create).not.toHaveBeenCalled();
  });
});

function serviceFor(tx: ReturnType<typeof transaction>) {
  const prisma = {
    $transaction: jest.fn((callback: (value: typeof tx) => unknown) => callback(tx)),
  };
  return new CommentsService(prisma as unknown as PrismaService);
}

function transaction(target?: {
  id: string;
  postId: string;
  authorId: string;
  parentId: string | null;
  status: 'PUBLISHED';
}) {
  const created = {
    id: 'new',
    postId: 'post-id',
    authorId: 'actor',
    parentId: target ? (target.parentId ?? target.id) : null,
    replyToUserId: target?.authorId ?? null,
    content: 'hello',
    status: 'PUBLISHED',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    deletedById: null,
    author: { id: 'actor', username: 'actor', displayName: 'Actor' },
    replyToUser: target ? { id: target.authorId, username: 'target', displayName: 'Target' } : null,
  };
  return {
    post: { findFirst: jest.fn().mockResolvedValue({ id: 'post-id', authorId: 'post-author' }) },
    comment: {
      findUnique: jest.fn().mockResolvedValue(target),
      create: jest.fn().mockResolvedValue(created),
    },
    notification: { create: jest.fn().mockResolvedValue({ id: 'notification' }) },
  };
}
