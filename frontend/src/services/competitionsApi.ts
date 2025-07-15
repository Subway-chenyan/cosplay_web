import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { Competition } from '../types/video';

const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export const competitionsApi = createApi({
  reducerPath: 'competitionsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/competitions/`,
  }),
  tagTypes: ['Competition'],
  endpoints: (builder) => ({
    getCompetitions: builder.query<{
      count: number;
      next: string | null;
      previous: string | null;
      results: Competition[];
    }, {
      search?: string;
      year?: number;
      page?: number;
      page_size?: number;
    }>({
      query: (filters) => {
        const params = new URLSearchParams();
        
        if (filters.search) params.append('search', filters.search);
        if (filters.year) params.append('year', filters.year.toString());
        if (filters.page) params.append('page', filters.page.toString());
        if (filters.page_size) params.append('page_size', filters.page_size.toString());
        
        return `?${params.toString()}`;
      },
      providesTags: ['Competition'],
    }),
    
    getCompetition: builder.query<Competition, number>({
      query: (id) => `${id}/`,
      providesTags: (result, error, id) => [{ type: 'Competition', id }],
    }),
  }),
});

export const {
  useGetCompetitionsQuery,
  useGetCompetitionQuery,
} = competitionsApi; 