'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { palette } from '@/lib/palette';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { clearUsername, setUsername } from '@/redux/authSlice';
import {
  cancelEditingPassword,
  cancelEditingUsername,
  initAccountDrafts,
  resetAccountDrafts,
  setConfirmPasswordDraft,
  setCurrentPasswordDraft,
  setNewPasswordDraft,
  setUsernameDraft,
  startEditingPassword,
  startEditingUsername,
} from '@/redux/settingsSlice';
import {
  mediaApi,
  useGetUserSettingsQuery,
  useUpdateAccountMutation,
} from '@/redux/mediaApi';

const PASSWORD_MASK = '******';

/** Extracts a readable message from an RTK Query mutation error.
 *
 * @param error - Unknown mutation error value.
 * @returns Human-readable error string.
 */
function accountErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'data' in error && error.data) {
    const data = error.data;
    if (typeof data === 'string') return data;
    if (typeof data === 'object' && data !== null && 'detail' in data) {
      return String((data as { detail: unknown }).detail);
    }
  }
  return 'Account update failed';
}

/**
 * Account settings: rename, change password, and log out.
 * @returns Account form bound to settingsSlice drafts and updateAccount.
 */
export function AccountSection() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const username = useAppSelector((state) => state.auth.username);
  const usernameDraft = useAppSelector((state) => state.settings.usernameDraft);
  const currentPasswordDraft = useAppSelector((state) => state.settings.currentPasswordDraft);
  const newPasswordDraft = useAppSelector((state) => state.settings.newPasswordDraft);
  const confirmPasswordDraft = useAppSelector((state) => state.settings.confirmPasswordDraft);
  const editingUsername = useAppSelector((state) => state.settings.editingUsername);
  const editingPassword = useAppSelector((state) => state.settings.editingPassword);

  const { data: settings, isLoading: settingsLoading } = useGetUserSettingsQuery(undefined, {
    skip: !username,
  });
  const [updateAccount, updateState] = useUpdateAccountMutation();

  const currentName = settings?.username ?? username ?? '';

  // Seed the username field once settings (or auth username) are known.
  useEffect(() => {
    if (settings?.username) {
      dispatch(initAccountDrafts(settings.username));
    } else if (username) {
      dispatch(initAccountDrafts(username));
    }
  }, [dispatch, settings?.username, username]);

  const passwordsMatch =
    !newPasswordDraft || newPasswordDraft === confirmPasswordDraft;
  const usernameChanged = usernameDraft.trim() !== currentName;
  const isEditing = editingUsername || editingPassword;
  const canSaveUsername = editingUsername && usernameChanged;
  const canSavePassword =
    editingPassword &&
    Boolean(currentPasswordDraft) &&
    Boolean(newPasswordDraft) &&
    passwordsMatch;
  const canSave = canSaveUsername || canSavePassword;

  /**
   * Submits rename and/or password change via updateAccount.
   * @returns Promise that settles when the mutation finishes.
   */
  const handleSave = async () => {
    if (!canSave) return;

    const trimmedUsername = usernameDraft.trim();
    try {
      const result = await updateAccount({
        ...(canSaveUsername ? { new_username: trimmedUsername } : {}),
        ...(canSavePassword
          ? {
              current_password: currentPasswordDraft,
              new_password: newPasswordDraft,
            }
          : {}),
      }).unwrap();

      // X-Username headers read auth.username; keep it in sync after rename.
      dispatch(setUsername(result.username));
      dispatch(resetAccountDrafts());
    } catch {
      // Error is surfaced via updateState.isError below.
    }
  };

  /**
   * Clears the session and returns to the library (login gate).
   */
  const handleLogout = () => {
    dispatch(clearUsername());
    dispatch(mediaApi.util.resetApiState());
    router.push('/');
  };

  /**
   * Toggles username edit mode; cancel restores the saved username.
   */
  const handleUsernameEditToggle = () => {
    if (editingUsername) {
      dispatch(cancelEditingUsername(currentName));
    } else {
      dispatch(startEditingUsername());
    }
  };

  /**
   * Toggles password edit mode; start clears the mask so the user can type.
   */
  const handlePasswordEditToggle = () => {
    if (editingPassword) {
      dispatch(cancelEditingPassword());
    } else {
      dispatch(startEditingPassword());
    }
  };

  if (settingsLoading && !settings) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  const joinedLabel = settings?.joined_date
    ? new Date(settings.joined_date).toLocaleDateString()
    : '—';

  return (
    <Stack spacing={3} sx={{ flex: 1, minWidth: 0 }}>
      <Box>
        <Typography variant="h6" sx={{ color: palette.textOnDark, mb: 0.5 }}>
          Account
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Signed in as {settings?.username ?? username} · Joined {joinedLabel}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
        <TextField
          label="Username"
          value={usernameDraft}
          onChange={(e) => dispatch(setUsernameDraft(e.target.value))}
          fullWidth
          disabled={!editingUsername}
          autoComplete="username"
        />
        <Button
          variant="contained"
          onClick={handleUsernameEditToggle}
          sx={{ mt: 1, flexShrink: 0, minWidth: 88 }}
        >
          {editingUsername ? 'Cancel' : 'Edit'}
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
        <TextField
          label="Current password"
          type="password"
          value={editingPassword ? currentPasswordDraft : PASSWORD_MASK}
          onChange={(e) => dispatch(setCurrentPasswordDraft(e.target.value))}
          fullWidth
          disabled={!editingPassword}
          required={editingPassword}
          autoComplete="current-password"
        />
        <Button
          variant="contained"
          onClick={handlePasswordEditToggle}
          sx={{ mt: 1, flexShrink: 0, minWidth: 88 }}
        >
          {editingPassword ? 'Cancel' : 'Edit'}
        </Button>
      </Box>

      {editingPassword && (
        <>
          <TextField
            label="New password"
            type="password"
            value={newPasswordDraft}
            onChange={(e) => dispatch(setNewPasswordDraft(e.target.value))}
            fullWidth
            autoComplete="new-password"
          />
          <TextField
            label="Confirm new password"
            type="password"
            value={confirmPasswordDraft}
            onChange={(e) => dispatch(setConfirmPasswordDraft(e.target.value))}
            fullWidth
            error={Boolean(newPasswordDraft) && !passwordsMatch}
            helperText={
              newPasswordDraft && !passwordsMatch ? 'Passwords do not match' : undefined
            }
            autoComplete="new-password"
          />
        </>
      )}

      {updateState.isError && (
        <Alert severity="error">{accountErrorMessage(updateState.error)}</Alert>
      )}
      {updateState.isSuccess && (
        <Alert severity="success">Account updated successfully.</Alert>
      )}

      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
        {isEditing && (
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!canSave || updateState.isLoading}
          >
            {updateState.isLoading ? 'Saving…' : 'Save'}
          </Button>
        )}
        <Button variant="outlined" color="inherit" onClick={handleLogout}>
          Log out
        </Button>
      </Box>
    </Stack>
  );
}
