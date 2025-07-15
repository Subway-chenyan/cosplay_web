import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { Tag } from '../types/video';

const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export const tagsApi = createApi({
  reducerPath: 'tagsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/tags/`,
  }),
  tagTypes: ['Tag'],
  endpoints: (builder) => ({
    getTags: builder.query<{
      count: number;
      next: string | null;
      previous: string | null;
      results: Tag[];
    }, {
      search?: string;
      category?: string;
      page?: number;
      page_size?: number;
    }>({
      query: (filters) => {
        const params = new URLSearchParams();
        
        if (filters.search) params.append('search', filters.search);
        if (filters.category) params.append('category', filters.category);
        if (filters.page) params.append('page', filters.page.toString());
        if (filters.page_size) params.append('page_size', filters.page_size.toString());
        
        return `?${params.toString()}`;
      },
      providesTags: ['Tag'],
    }),
    
    getTag: builder.query<Tag, number>({
      query: (id) => `${id}/`,
      providesTags: (result, error, id) => [{ type: 'Tag', id }],
    }),
    
    getTagCategories: builder.query<string[], void>({
      query: () => 'categories/',
      providesTags: ['Tag'],
    }),
    
    getPopularTags: builder.query<Tag[], void>({
      query: () => 'popular/',
      providesTags: ['Tag'],
    }),
  }),
});

export const {
  useGetTagsQuery,
  useGetTagQuery,
  useGetTagCategoriesQuery,
  useGetPopularTagsQuery,
} = tagsApi; 