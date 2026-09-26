import { configureStore } from '@reduxjs/toolkit';
import { mediaApi } from './api';

export const makeStore = () =>
  configureStore({
    reducer: {
      // RTK Query reducer: cached responses, request status, and errors.
      [mediaApi.reducerPath]: mediaApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      // API middleware handles cache lifetimes, polling, and invalidation.
      getDefaultMiddleware().concat(mediaApi.middleware),
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
