import { configureStore } from '@reduxjs/toolkit'
import videosReducer from './slices/videosSlice'
import groupsReducer from './slices/groupsSlice'
import competitionsReducer from './slices/competitionsSlice'
import tagsReducer from './slices/tagsSlice'
import awardsReducer from './slices/awardsSlice'
import dataImportReducer from './slices/dataImportSlice'

export const store = configureStore({
  reducer: {
    videos: videosReducer,
    groups: groupsReducer,
    competitions: competitionsReducer,
    tags: tagsReducer,
    awards: awardsReducer,
    dataImport: dataImportReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch 