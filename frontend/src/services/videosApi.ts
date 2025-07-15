import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { Video, VideoFilters, VideoDetail } from '../types/video';

const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export const videosApi = createApi({
  reducerPath: 'videosApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/videos/`,
  }),
  tagTypes: ['Video'],
  endpoints: (builder) => ({
    getVideos: builder.query<{
      count: number;
      next: string | null;
      previous: string | null;
      results: Video[];
    }, VideoFilters>({
      query: (filters) => {
        const params = new URLSearchParams();
        
        if (filters.search) params.append('search', filters.search);
        if (filters.tags?.length) params.append('tags', filters.tags.join(','));
        if (filters.groups?.length) params.append('groups', filters.groups.join(','));
        if (filters.performances?.length) params.append('performances', filters.performances.join(','));
        if (filters.year) params.append('year', filters.year.toString());
        if (filters.ordering) params.append('ordering', filters.ordering);
        if (filters.page) params.append('page', filters.page.toString());
        if (filters.page_size) params.append('page_size', filters.page_size.toString());
        
        return `?${params.toString()}`;
      },
      providesTags: ['Video'],
    }),
    
    getVideo: builder.query<VideoDetail, number>({
      query: (id) => `${id}/`,
      providesTags: (result, error, id) => [{ type: 'Video', id }],
    }),
    
    getVideosByGroup: builder.query<Video[], number>({
      query: (groupId) => `?groups=${groupId}`,
      providesTags: ['Video'],
    }),
    
    getVideosByPerformance: builder.query<Video[], number>({
      query: (performanceId) => `?performances=${performanceId}`,
      providesTags: ['Video'],
    }),
    
    getVideosByTag: builder.query<Video[], number>({
      query: (tagId) => `?tags=${tagId}`,
      providesTags: ['Video'],
    }),
  }),
});

export const {
  useGetVideosQuery,
  useGetVideoQuery,
  useGetVideosByGroupQuery,
  useGetVideosByPerformanceQuery,
  useGetVideosByTagQuery,
} = videosApi; 