export interface PublicUserAuthor {
  type: 'user';
  id: string;
  username: string;
  displayName: string;
  bio: string | null;
}
export interface PublicAnonymousAuthor {
  type: 'anonymous';
  displayName: string;
  anonymousLabel: string;
}
export type PublicAuthor = PublicUserAuthor | PublicAnonymousAuthor;
export interface PostTag {
  id: string;
  name: string;
  slug: string;
}
export interface PostCategorySummary {
  key: ForumCategoryKey;
  label: string;
}
export interface PostSummary {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  author: PublicAuthor;
  category: PostCategorySummary;
  tags: PostTag[];
  status: 'DRAFT' | 'PUBLISHED';
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  commentCount: number;
}
export interface PostDetail extends Omit<PostSummary, 'excerpt'> {
  contentMarkdown: string;
  canDelete: boolean;
}
export interface PostsPage {
  items: PostSummary[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
}
import type { ForumCategoryKey } from '@liftoff/shared-types';
