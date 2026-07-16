import type { PublicUserAuthor } from './posts';
export interface CommentItem {
  id: string;
  content: string | null;
  placeholder: string | null;
  status: 'PUBLISHED' | 'DELETED' | 'HIDDEN';
  author: PublicUserAuthor;
  parentId: string | null;
  replyToUser: PublicUserAuthor | null;
  createdAt: string;
  updatedAt: string;
  canDelete: boolean;
  replyCount?: number;
  replies?: CommentItem[];
}
export interface CommentPage {
  items: CommentItem[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}
export interface NotificationItem {
  id: string;
  type: 'POST_COMMENTED' | 'COMMENT_REPLIED' | 'SYSTEM';
  actor: PublicUserAuthor | null;
  post: { slug: string; title: string } | null;
  commentId: string | null;
  preview: string;
  readAt: string | null;
  createdAt: string;
  targetUrl: string;
}
export interface NotificationPage {
  items: NotificationItem[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}
