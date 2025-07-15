import { configureStore } from '@reduxjs/toolkit';
import { videosApi } from '../services/videosApi';
import { groupsApi } from '../services/groupsApi';
import { competitionsApi } from '../services/competitionsApi';
import { performancesApi } from '../services/performancesApi';
import { tagsApi } from '../services/tagsApi';
import { awardsApi } from '../services/awardsApi';

export const store = configureStore({
  reducer: {
    [videosApi.reducerPath]: videosApi.reducer,
    [groupsApi.reducerPath]: groupsApi.reducer,
    [competitionsApi.reducerPath]: competitionsApi.reducer,
    [performancesApi.reducerPath]: performancesApi.reducer,
    [tagsApi.reducerPath]: tagsApi.reducer,
    [awardsApi.reducerPath]: awardsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(videosApi.middleware)
      .concat(groupsApi.middleware)
      .concat(competitionsApi.middleware)
      .concat(performancesApi.middleware)
      .concat(tagsApi.middleware)
      .concat(awardsApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 