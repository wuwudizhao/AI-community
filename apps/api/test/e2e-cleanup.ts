import type { PrismaService } from '../src/prisma/prisma.service';

export async function cleanTestUsers(prisma: PrismaService, emails: readonly string[]) {
  const emailNormalized = emails.map((email) => email.trim().toLowerCase());
  const users = await prisma.user.findMany({
    where: { emailNormalized: { in: emailNormalized } },
    select: { id: true },
  });
  const userIds = users.map(({ id }) => id);
  if (userIds.length === 0) return;

  const posts = await prisma.post.findMany({
    where: { authorId: { in: userIds } },
    select: { id: true },
  });
  const postIds = posts.map(({ id }) => id);
  await prisma.postLike.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.postBookmark.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.postViewHistory.deleteMany({ where: { userId: { in: userIds } } });
  const comments = await prisma.comment.findMany({
    where: {
      OR: [
        { authorId: { in: userIds } },
        { replyToUserId: { in: userIds } },
        { deletedById: { in: userIds } },
        ...(postIds.length > 0 ? [{ postId: { in: postIds } }] : []),
      ],
    },
    select: { id: true },
  });
  const commentIds = comments.map(({ id }) => id);

  await prisma.notification.deleteMany({
    where: {
      OR: [
        { recipientId: { in: userIds } },
        { actorId: { in: userIds } },
        ...(postIds.length > 0 ? [{ postId: { in: postIds } }] : []),
        ...(commentIds.length > 0 ? [{ commentId: { in: commentIds } }] : []),
      ],
    },
  });
  if (commentIds.length > 0) {
    await prisma.comment.deleteMany({ where: { id: { in: commentIds } } });
  }
  if (postIds.length > 0) {
    await prisma.postTag.deleteMany({ where: { postId: { in: postIds } } });
    await prisma.post.deleteMany({ where: { id: { in: postIds } } });
  }
  await prisma.userSession.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.emailVerificationToken.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
}
