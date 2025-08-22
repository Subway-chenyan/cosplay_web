export interface Video {
  id: string
  bv_number: string
  title: string
  description: string
  url: string
  thumbnail: string
  year?: number
  uploaded_by?: string
  uploaded_by_username?: string
  group?: string
  group_name?: string
  competition?: string
  competition_name?: string
  created_at: string
  updated_at: string
  tags: Tag[]
}

export interface Group {
  id: string
  name: string
  description: string
  logo?: string
  founded_date?: string
  province?: string
  city?: string
  location?: string
  website?: string
  email?: string
  phone?: string
  weibo?: string
  wechat?: string
  qq_group?: string
  bilibili?: string
  is_active: boolean
  video_count: number
  award_count: number
  created_at: string
  updated_at: string
}

export interface ProvinceStats {
  province: string
  count: number
}

export interface CityStats {
  province: string
  city: string
  count: number
}

export interface Competition {
  id: string
  name: string
  description: string
  website?: string
  created_at: string
  updated_at: string
}

export interface Tag {
  id: string
  name: string
  category: 'IP' | '风格' | '其他'
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
  tags: string[]
  styleTag?: string // 风格标签，单选
  ipTag?: string // IP标签，单选
  groups?: string[]
  competitions?: string[]
  year?: number
  search?: string
}

export interface Award {
  id: string
  name: string
  competition: string
  created_at: string
  updated_at: string
}

export interface CompetitionYear {
  id: string
  competition: string
  year: number
  created_at: string
  updated_at: string
}

export interface AwardRecord {
  id: string
  award: string
  video?: string
  group?: string
  competition_year: string
  competition_year_detail?: CompetitionYear
  description: string
  drama_name?: string
  award_name?: string
  award_level?: string
  competition_name?: string
  video_title?: string
  group_name?: string
  created_at: string
  updated_at: string
}

export interface PaginatedResponse<T> {
  count: number
  next?: string
  previous?: string
  results: T[]
}
