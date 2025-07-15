export interface Video {
  id: number;
  bv_number: string;
  title: string;
  url: string;
  thumbnail?: string;
  description?: string;
  upload_date?: string;
  view_count: number;
  performance_date?: string;
  created_at: string;
  updated_at: string;
}

export interface VideoDetail extends Video {
  groups: Group[];
  performances: Performance[];
  tags: Tag[];
  awards: AwardRecord[];
  average_rating?: number;
  rating_count?: number;
  is_favorited?: boolean;
  user_rating?: number;
}

export interface VideoFilters {
  search?: string;
  tags?: number[];
  groups?: number[];
  performances?: number[];
  competitions?: number[];
  awards?: number[];
  year?: number;
  ordering?: string;
  page?: number;
  page_size?: number;
}

export interface Group {
  id: number;
  name: string;
  logo?: string;
  founded_date?: string;
  description?: string;
  website?: string;
  created_at: string;
  updated_at: string;
}

export interface Performance {
  id: number;
  title: string;
  group_id?: number;
  group?: Group;
  original_work?: string;
  description?: string;
  type?: string;
  debut_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: number;
  name: string;
  category?: string;
  created_at: string;
  updated_at: string;
}

export interface Competition {
  id: number;
  name: string;
  year?: number;
  location?: string;
  website?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Award {
  id: number;
  competition_id: number;
  competition?: Competition;
  name: string;
  description?: string;
  rank?: number;
  created_at: string;
  updated_at: string;
}

export interface AwardRecord {
  id: number;
  award_id: number;
  award?: Award;
  video_id?: number;
  video?: Video;
  performance_id?: number;
  performance?: Performance;
  group_id?: number;
  group?: Group;
  year: number;
  description?: string;
  created_at: string;
  updated_at: string;
} 