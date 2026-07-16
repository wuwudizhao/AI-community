export function notificationPreview(value: string, max = 100): string {
  const text = value.replace(/\s+/g, ' ').trim();
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

export function notificationTargetUrl(postSlug: string, commentId: string): string {
  return `/posts/${encodeURIComponent(postSlug)}#comment-${encodeURIComponent(commentId)}`;
}

export function canDeleteComment(userId: string, role: string, authorId: string): boolean {
  return userId === authorId || role === 'ADMIN';
}
