import { configureStore } from '@reduxjs/toolkit';
import { mediaApi } from './api/mediaApi';
import authReducer from './slices/authSlice';
import libraryUiReducer from './slices/libraryUiSlice';
import mediaModalReducer from './slices/mediaModalSlice';
import settingsReducer from './slices/settingsSlice';

/** Creates the Redux store for a Next.js client tree
 * 
 * @returns Configured store
 */
export const makeStore = () =>
  configureStore({
    reducer: {
      [mediaApi.reducerPath]: mediaApi.reducer,
      auth: authReducer,
      libraryUi: libraryUiReducer,
      mediaModal: mediaModalReducer,
      settings: settingsReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(mediaApi.middleware),
  });

// Export the types for the store, state, and dispatch.
export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>; 
export type AppDispatch = AppStore['dispatch']; 
