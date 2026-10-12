import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export const AUTH_STORAGE_KEY = 'mediavault_username';

interface AuthState {
  username: string | null;
  viewingAs: string | null;
  hydrated: boolean;
}

const initialState: AuthState = {
  username: null,
  viewingAs: null,
  hydrated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    hydrateAuth(state, action: PayloadAction<string | null>) {
      state.username = action.payload;
      state.viewingAs = null;
      state.hydrated = true;
    },

    setUsername(state, action: PayloadAction<string>) {
      state.username = action.payload;
      state.viewingAs = null;
      state.hydrated = true;
      if (typeof window !== 'undefined') {
        localStorage.setItem(AUTH_STORAGE_KEY, action.payload);
      }
    },

    clearUsername(state) {
      state.username = null;
      state.viewingAs = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem(AUTH_STORAGE_KEY);
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
