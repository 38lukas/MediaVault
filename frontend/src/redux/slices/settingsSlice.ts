import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { SettingsSection } from '@/types/media';
import { DEFAULT_PRIMARY_COLOR } from '@/lib/palette';
import { clearUsername } from './authSlice';

interface SettingsState {
  activeSection: SettingsSection;
  usernameDraft: string;
  currentPasswordDraft: string;
  newPasswordDraft: string;
  confirmPasswordDraft: string;
  editingUsername: boolean;
  editingPassword: boolean;
  primaryColor: string;
}

const initialState: SettingsState = {
  activeSection: 'account',
  usernameDraft: '',
  currentPasswordDraft: '',
  newPasswordDraft: '',
  confirmPasswordDraft: '',
  editingUsername: false,
  editingPassword: false,
  primaryColor: DEFAULT_PRIMARY_COLOR,
};

// Settings page UI: active section, account drafts, and primary color.
const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setActiveSection(state, action: PayloadAction<SettingsSection>) {
      state.activeSection = action.payload;
    },
    setPrimaryColor(state, action: PayloadAction<string>) {
      state.primaryColor = action.payload;
    },
    setUsernameDraft(state, action: PayloadAction<string>) {
      state.usernameDraft = action.payload;
    },
    setCurrentPasswordDraft(state, action: PayloadAction<string>) {
      state.currentPasswordDraft = action.payload;
    },
    setNewPasswordDraft(state, action: PayloadAction<string>) {
      state.newPasswordDraft = action.payload;
    },
    setConfirmPasswordDraft(state, action: PayloadAction<string>) {
      state.confirmPasswordDraft = action.payload;
    },
    initAccountDrafts(state, action: PayloadAction<string>) {
      state.usernameDraft = action.payload;
      state.currentPasswordDraft = '';
      state.newPasswordDraft = '';
      state.confirmPasswordDraft = '';
      state.editingUsername = false;
      state.editingPassword = false;
    },
    resetAccountDrafts(state) {
      state.currentPasswordDraft = '';
      state.newPasswordDraft = '';
      state.confirmPasswordDraft = '';
      state.editingUsername = false;
      state.editingPassword = false;
    },
    startEditingUsername(state) {
      state.editingUsername = true;
    },
    cancelEditingUsername(state, action: PayloadAction<string>) {
      state.editingUsername = false;
      state.usernameDraft = action.payload;
    },
    startEditingPassword(state) {
      state.editingPassword = true;
      state.currentPasswordDraft = '';
      state.newPasswordDraft = '';
      state.confirmPasswordDraft = '';
    },
    cancelEditingPassword(state) {
      state.editingPassword = false;
      state.currentPasswordDraft = '';
      state.newPasswordDraft = '';
      state.confirmPasswordDraft = '';
    },
  },
  extraReducers: (builder) => {
    builder.addCase(clearUsername, (state) => ({
      ...initialState,
      primaryColor: state.primaryColor,
    }));
  },
});

export const {
  setActiveSection,
  setPrimaryColor,
  setUsernameDraft,
  setCurrentPasswordDraft,
  setNewPasswordDraft,
  setConfirmPasswordDraft,
  initAccountDrafts,
  resetAccountDrafts,
  startEditingUsername,
  cancelEditingUsername,
  startEditingPassword,
  cancelEditingPassword,
} = settingsSlice.actions;

export default settingsSlice.reducer;
