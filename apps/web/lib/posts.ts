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
  pinned?: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  commentCount: number;
  likeCount?: number;
  viewerHasLiked?: boolean;
}
export interface PostDetail extends Omit<PostSummary, 'excerpt'> {
  contentMarkdown: string;
  canDelete: boolean;
  viewerHasBookmarked?: boolean;
}
export interface BookmarkedPost extends PostSummary {
  bookmarkedAt: string;
}
export interface LikedPost extends PostSummary {
  likedAt: string;
}
export interface ViewedPost extends PostSummary {
  lastViewedAt: string;
  viewCount: number;
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
export interface BookmarksPage extends Omit<PostsPage, 'items'> {
  items: BookmarkedPost[];
}
export interface LikesPage extends Omit<PostsPage, 'items'> {
  items: LikedPost[];
}
export interface HistoryPage extends Omit<PostsPage, 'items'> {
  items: ViewedPost[];
}
import type { ForumCategoryKey } from '@liftoff/shared-types';
