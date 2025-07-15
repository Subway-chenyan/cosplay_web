import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { Group } from '../types/video';

const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export const groupsApi = createApi({
  reducerPath: 'groupsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/groups/`,
  }),
  tagTypes: ['Group'],
  endpoints: (builder) => ({
    getGroups: builder.query<{
      count: number;
      next: string | null;
      previous: string | null;
      results: Group[];
    }, {
      search?: string;
      page?: number;
      page_size?: number;
    }>({
      query: (filters) => {
        const params = new URLSearchParams();
        
        if (filters.search) params.append('search', filters.search);
        if (filters.page) params.append('page', filters.page.toString());
        if (filters.page_size) params.append('page_size', filters.page_size.toString());
        
        return `?${params.toString()}`;
      },
      providesTags: ['Group'],
    }),
    
    getGroup: builder.query<Group, number>({
      query: (id) => `${id}/`,
      providesTags: (result, error, id) => [{ type: 'Group', id }],
    }),
  }),
});

export const {
  useGetGroupsQuery,
  useGetGroupQuery,
} = groupsApi; 