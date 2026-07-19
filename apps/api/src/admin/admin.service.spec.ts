import type { PostImagesService } from '../post-images/post-images.service';
import type { PrismaService } from '../prisma/prisma.service';
import { AdminService } from './admin.service';

describe('AdminService mutations', () => {
  it('deletes a post and its stored image files', async () => {
    const prisma = {
      post: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'post-id',
          images: [{ storageKey: 'image.webp' }],
        }),
        delete: jest.fn().mockResolvedValue({ id: 'post-id' }),
      },
    };
    const images = { removeFiles: jest.fn().mockResolvedValue(undefined) };
    const service = new AdminService(
      prisma as unknown as PrismaService,
      images as unknown as PostImagesService,
    );

    await expect(service.deletePost('post-id')).resolves.toEqual({
      success: true,
      deletedId: 'post-id',
    });
    expect(prisma.post.delete).toHaveBeenCalledWith({ where: { id: 'post-id' } });
    expect(images.removeFiles).toHaveBeenCalledWith(['image.webp']);
  });

  it('updates USER to ADMIN', async () => {
    const prisma = { user: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) } };
    const service = new AdminService(prisma as unknown as PrismaService, {} as PostImagesService);

    await expect(service.updateUserRole('user-id', 'ADMIN')).resolves.toEqual({
      id: 'user-id',
      role: 'ADMIN',
    });
    expect(prisma.user.updateMany).toHaveBeenCalledWith({
      where: { id: 'user-id' },
      data: { role: 'ADMIN' },
    });
  });
});
