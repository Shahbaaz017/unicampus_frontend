// src/types/community.ts

export interface Author {
  id: string; // Primary ID used in frontend, critical for ownership checks
  _id?: string;
  name: string;
  usn?: string;
  avatarUrl?: string;
}

// Community types (assuming these are already well-defined from previous steps)
interface CommunityApiSnakeCase { /* ... */ }
export interface CommunityBase extends CommunityApiSnakeCase { /* ... id, name, etc. ... */
  id: string;
  _id?: string;
  name: string;
  description: string;
  slug?: string;
  icon?: string;
  bannerImage?: string;
  memberCount: number;
  postCount?: number | null;
  is_member?: boolean;
  tags?: string[];
  rules?: string[];
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string; // Should be Author or at least user ID string
}
export interface CommunitySummary extends CommunityBase {}
export interface CommunityDetail extends CommunityBase {}

// Post types
interface PostApiSnakeCase { /* ... */ }
export interface Post extends PostApiSnakeCase {
  id: string; // Critical for API calls
  _id?: string;
  title: string;
  contentType: 'text' | 'image' | 'link';
  contentText?: string;
  contentPreview?: string;
  imageUrl?: string;
  linkUrl?: string;
  tags?: string[];
  author: Author; // Critical: must have author.id for ownership checks
  communityId: string;
  communityName?: string;
  communitySlug?: string;
  communityIcon?: string;
  community?: CommunitySummary;
  createdAt: string;
  updatedAt?: string;
  upvotes: number;
  downvotes: number;
  commentCount: number;
  userVote: 'up' | 'down' | null;
  lastActivityAt?: string;
}

// Comment types
export interface Comment {
  id: string; // Critical
  _id?: string;
  postId: string;
  author: Author; // Critical: must have author.id for ownership checks
  text: string;
  parentId?: string | null;
  replyCount: number;
  upvotes: number;
  downvotes: number;
  createdAt: string;
  updatedAt?: string;
  userVote: 'up' | 'down' | null;
  // Allow potential snake_case fields from API before normalization
  created_at?: string;
  updated_at?: string;
  parent_id?: string | null;
  reply_count?: number;
  user_vote?: 'up' | 'down' | null;
}

// --- API Response Structures ---
export interface CommunityDetailApiResponse { status: string; data: { community: CommunityDetail; }; }
export interface VoteApiResponse { status: string; data: { upvotes: number; downvotes: number; user_vote: 'up' | 'down' | null; }; }
export interface JoinLeaveApiResponse { status: string; message?: string; data?: { community: CommunityDetail; }; }
export interface CreatePostApiResponse { status: string; data: { post: Post; }; }
export interface PostDetailApiResponse { status: string; data: { post: Post; }; }
export interface CreateCommentApiResponse { status: string; data: { comment: Comment; }; }
export interface DeleteApiResponse { status: string; message?: string; } // Generic for delete operations