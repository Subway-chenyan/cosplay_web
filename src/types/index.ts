export interface Video {
  id: string
  bv_number: string
  title: string
  description: string
  url: string
  thumbnail: string
  duration?: string
  resolution?: string
  file_size?: number
  view_count: number
  like_count: number
  share_count: number
  upload_date?: string
  performance_date?: string
  status: 'draft' | 'published' | 'private' | 'deleted'
  is_featured: boolean
  is_original: boolean
  uploaded_by?: User
  created_at: string
  updated_at: string
  groups: Group[]
  competitions: Competition[]
  tags: Tag[]
}

export interface Group {
  id: string
  name: string
  description: string
  logo?: string
  founded_date?: string
  location?: string
  website?: string
  email?: string
  phone?: string
  weibo?: string
  wechat?: string
  qq_group?: string
  bilibili?: string
  is_active: boolean
  is_verified: boolean
  member_count: number
  video_count: number
  created_at: string
  updated_at: string
}

export interface Competition {
  id: string
  name: string
  year: number
  description: string
  created_at: string
  updated_at: string
}

export interface Tag {
  id: string
  name: string
  category: '游戏IP' | '动漫IP' | '年份' | '类型' | '风格' | '地区' | '其他'
  description: string
  color: string
  usage_count: number
  is_active: boolean
  is_featured: boolean
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  username: string
  email: string
  first_name: string
  last_name: string
  is_active: boolean
  date_joined: string
}

export interface VideoFilters {
  groups: string[]
  competitions: string[]
  tags: string[]
  year?: number
  search?: string
}

export interface Award {
  id: string
  name: string
  description: string
  competition: string
  year: number
  level: 'gold' | 'silver' | 'bronze' | 'special' | 'participation'
  group_id: string
  video_id: string
  created_at: string
  updated_at: string
}

export interface PaginatedResponse<T> {
  count: number
  next?: string
  previous?: string
  results: T[]
} 