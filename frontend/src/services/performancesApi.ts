import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { Performance } from '../types/video';

const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export const performancesApi = createApi({
  reducerPath: 'performancesApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/performances/`,
  }),
  tagTypes: ['Performance'],
  endpoints: (builder) => ({
    getPerformances: builder.query<{
      count: number;
      next: string | null;
      previous: string | null;
      results: Performance[];
    }, {
      search?: string;
      group?: number;
      type?: string;
      page?: number;
      page_size?: number;
    }>({
      query: (filters) => {
        const params = new URLSearchParams();
        
        if (filters.search) params.append('search', filters.search);
        if (filters.group) params.append('group', filters.group.toString());
        if (filters.type) params.append('type', filters.type);
        if (filters.page) params.append('page', filters.page.toString());
        if (filters.page_size) params.append('page_size', filters.page_size.toString());
        
        return `?${params.toString()}`;
      },
      providesTags: ['Performance'],
    }),
    
    getPerformance: builder.query<Performance, number>({
      query: (id) => `${id}/`,
      providesTags: (result, error, id) => [{ type: 'Performance', id }],
    }),
  }),
});

export const {
  useGetPerformancesQuery,
  useGetPerformanceQuery,
} = performancesApi; 