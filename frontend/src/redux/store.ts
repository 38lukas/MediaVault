import { configureStore } from '@reduxjs/toolkit';
import { mediaApi } from './mediaApi';
import authReducer from './authSlice';
import libraryUiReducer from './libraryUiSlice';

/** Creates the Redux store for a Next.js client tree
 * 
 * @returns Configured store with RTK Query + auth + library UI slice
 */
export const makeStore = () =>
  configureStore({
    reducer: {
      [mediaApi.reducerPath]: mediaApi.reducer,
      auth: authReducer,
      libraryUi: libraryUiReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(mediaApi.middleware),
  });

// Export the types for the store, state, and dispatch.
export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>; 
export type AppDispatch = AppStore['dispatch']; 
