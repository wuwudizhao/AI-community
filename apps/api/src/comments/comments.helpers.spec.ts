import { canDeleteComment, notificationPreview, notificationTargetUrl } from './comments.helpers';
describe('comment helpers', () => {
  it('creates bounded previews and safe relative targets', () => {
    expect(notificationPreview('  hello   world  ')).toBe('hello world');
    expect(notificationPreview('x'.repeat(120))).toHaveLength(100);
    expect(notificationTargetUrl('post slug', 'comment/id')).toBe(
      '/posts/post%20slug#comment-comment%2Fid',
    );
  });
  it('limits deletion to author or ADMIN', () => {
    expect(canDeleteComment('a', 'USER', 'a')).toBe(true);
    expect(canDeleteComment('b', 'ADMIN', 'a')).toBe(true);
    expect(canDeleteComment('b', 'MODERATOR', 'a')).toBe(false);
  });
});
