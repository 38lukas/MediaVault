import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export const AUTH_STORAGE_KEY = 'mediavault_username';
export const AUTH_TOKEN_STORAGE_KEY = 'mediavault_token';

export interface AuthSession {
  username: string;
  token: string;
}

interface AuthState {
  username: string | null;
  token: string | null;
  viewingAs: string | null;
  hydrated: boolean;
}

const initialState: AuthState = {
  username: null,
  token: null,
  viewingAs: null,
  hydrated: false,
};

// Session username + bearer token, friend-view target, and localStorage hydration.
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    hydrateAuth(state, action: PayloadAction<AuthSession | null>) {
      state.username = action.payload?.username ?? null;
      state.token = action.payload?.token ?? null;
      state.viewingAs = null;
      state.hydrated = true;
    },

    // Called after login, sign-up, and account changes (which return a fresh token).
    setUsername(state, action: PayloadAction<AuthSession>) {
      state.username = action.payload.username;
      state.token = action.payload.token;
      state.viewingAs = null;
      state.hydrated = true;
      if (typeof window !== 'undefined') {
        localStorage.setItem(AUTH_STORAGE_KEY, action.payload.username);
        localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, action.payload.token);
      }
    },

    clearUsername(state) {
      state.username = null;
      state.token = null;
      state.viewingAs = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
      }
    },

    enterFriendView(state, action: PayloadAction<string>) {
      state.viewingAs = action.payload;
    },

    exitFriendView(state) {
      state.viewingAs = null;
    },
  },
});

export const {
  hydrateAuth,
  setUsername,
  clearUsername,
  enterFriendView,
  exitFriendView,
} = authSlice.actions;
export default authSlice.reducer;
