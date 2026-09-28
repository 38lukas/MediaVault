import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export const AUTH_STORAGE_KEY = 'mediavault_username';

interface AuthState {
  username: string | null;
  /** False until localStorage has been read on the client. */
  hydrated: boolean;
}

const initialState: AuthState = {
  username: null,
  hydrated: false,
};

/** Auth slice: logged-in username, persisted in localStorage. */
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /**
     * Loads the stored username after the client mounts (avoids SSR mismatch).
     * @param state - Current auth state.
     * @param action - Username from localStorage, or null.
     */
    hydrateAuth(state, action: PayloadAction<string | null>) {
      state.username = action.payload;
      state.hydrated = true;
    },
    /**
     * Stores the authenticated username in Redux and localStorage.
     * @param state - Current auth state.
     * @param action - Username returned by the login endpoint.
     */
    setUsername(state, action: PayloadAction<string>) {
      state.username = action.payload;
      state.hydrated = true;
      if (typeof window !== 'undefined') {
        localStorage.setItem(AUTH_STORAGE_KEY, action.payload);
      }
    },
    /**
     * Clears the authenticated username from Redux and localStorage.
     * @param state - Current auth state.
     */
    clearUsername(state) {
      state.username = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    },
  },
});

export const { hydrateAuth, setUsername, clearUsername } = authSlice.actions;
export default authSlice.reducer;
