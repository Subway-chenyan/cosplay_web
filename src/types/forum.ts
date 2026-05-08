export interface ForumCategory {
  id: number
  name: string
  slug: string
  description: string
  icon: string
  order: number
  is_active: boolean
  post_count: number
  comment_count: number
  allowed_roles: string[]
}

export interface ForumTag {
  id: number
  name: string
  slug: string
  color: string
}

export interface Comment {
  id: number
  post: number
  author: string
  author_name: string
  author_avatar: string | null
  content: string
  parent: number | null
  status: 'published' | 'hidden' | 'deleted'
  like_count: number
  report_count: number
  created_at: string
  updated_at: string
  edited_at: string | null
  replies: Comment[]
  can_edit: boolean
  can_moderate: boolean
}

export interface Post {
  id: number
  title: string
  excerpt: string
  author: string
  author_name: string
  author_avatar: string | null
  category: number
  category_name: string
  tags: ForumTag[]
  status: 'draft' | 'published' | 'pending' | 'hidden' | 'deleted'
  view_count: number
  reply_count: number
  like_count: number
  report_count: number
  is_pinned: boolean
  is_featured: boolean
  is_locked: boolean
  created_at: string
  updated_at: string
  last_commented_at: string | null
  can_edit: boolean
  can_moderate: boolean
}

export interface PostDetail extends Post {
  content: string
  content_json: unknown | null
  published_at: string
  edited_at: string | null
  updated_at: string
  comments: Comment[]
}

export interface PostFilters {
  category?: number
  author?: string | number
  search?: string
  ordering?: string
  status?: string
  is_pinned?: boolean
  is_featured?: boolean
  is_locked?: boolean
}

export interface ModerationPayload {
  is_pinned?: boolean
  is_featured?: boolean
  is_locked?: boolean
  status?: Post['status']
  reason?: string
}

export interface ForumReportPayload {
  post?: number
  comment?: number
  reason: 'spam' | 'abuse' | 'copyright' | 'other'
  description?: string
}
