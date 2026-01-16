export interface ForumCategory {
  id: number
  name: string
  slug: string
  description: string
  icon: string
  order: number
}

export interface Comment {
  id: number
  post: number
  author: string
  author_name: string
  author_avatar: string | null
  content: string
  parent: number | null
  created_at: string
  replies: Comment[]
}

export interface Post {
  id: number
  title: string
  author: string
  author_name: string
  category: number
  category_name: string
  view_count: number
  comment_count: number
  created_at: string
}

export interface PostDetail extends Post {
  content: string
  author_avatar: string | null
  updated_at: string
  comments: Comment[]
}

export interface PostFilters {
  category?: number
  author?: string | number
  search?: string
  ordering?: string
}
