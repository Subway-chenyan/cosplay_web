import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { Award, AwardRecord } from '../types/video';

const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export const awardsApi = createApi({
  reducerPath: 'awardsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/awards/`,
  }),
  tagTypes: ['Award', 'AwardRecord'],
  endpoints: (builder) => ({
    getAwards: builder.query<{
      count: number;
      next: string | null;
      previous: string | null;
      results: Award[];
    }, {
      search?: string;
      competition?: number;
      page?: number;
      page_size?: number;
    }>({
      query: (filters) => {
        const params = new URLSearchParams();
        
        if (filters.search) params.append('search', filters.search);
        if (filters.competition) params.append('competition', filters.competition.toString());
        if (filters.page) params.append('page', filters.page.toString());
        if (filters.page_size) params.append('page_size', filters.page_size.toString());
        
        return `?${params.toString()}`;
      },
      providesTags: ['Award'],
    }),
    
    getAward: builder.query<Award, number>({
      query: (id) => `${id}/`,
      providesTags: (result, error, id) => [{ type: 'Award', id }],
    }),
    
    getAwardRecords: builder.query<{
      count: number;
      next: string | null;
      previous: string | null;
      results: AwardRecord[];
    }, {
      award?: number;
      year?: number;
      group?: number;
      page?: number;
      page_size?: number;
    }>({
      query: (filters) => {
        const params = new URLSearchParams();
        
        if (filters.award) params.append('award', filters.award.toString());
        if (filters.year) params.append('year', filters.year.toString());
        if (filters.group) params.append('group', filters.group.toString());
        if (filters.page) params.append('page', filters.page.toString());
        if (filters.page_size) params.append('page_size', filters.page_size.toString());
        
        return `award-records/?${params.toString()}`;
      },
      providesTags: ['AwardRecord'],
    }),
  }),
});

export const {
  useGetAwardsQuery,
  useGetAwardQuery,
  useGetAwardRecordsQuery,
} = awardsApi; 