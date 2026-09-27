import { configureStore } from '@reduxjs/toolkit';
import { mediaApi } from './mediaApi';
import libraryUiReducer from './libraryUiSlice';

/**
 * Creates the Redux store for a Next.js client tree.
 * @returns Configured store with RTK Query + library UI slice.
 */
export const makeStore = () =>
  configureStore({
    reducer: {
      [mediaApi.reducerPath]: mediaApi.reducer,
      libraryUi: libraryUiReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(mediaApi.middleware),
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
