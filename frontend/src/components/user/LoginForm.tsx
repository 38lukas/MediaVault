'use client';

import { FormEvent, useState } from 'react';
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { palette } from '@/lib/palette';
import { useAppDispatch } from '@/redux/hooks';
import { setUsername } from '@/redux/slices/authSlice';
import { useLoginMutation, useRegisterMutation } from '@/redux/api';
import { getApiErrorMessage } from '@/utils/apiError';

const MIN_PASSWORD_LENGTH = 8; // Must match MIN_PASSWORD_LENGTH in backend app/core/security.py.

// Full-page sign-in / sign-up form shown before the library is accessible.
export function LoginForm() {
  const dispatch = useAppDispatch();
  const [login, loginState] = useLoginMutation();
  const [register, registerState] = useRegisterMutation();
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [username, setUsernameField] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const isSignUp = mode === 'signUp';
  const activeState = isSignUp ? registerState : loginState;
  const errorMessage = getApiErrorMessage(
    activeState.error,
    isSignUp ? 'Sign-up failed' : 'Login failed',
  );
  const passwordTooShort = isSignUp && password.length > 0 && password.length < MIN_PASSWORD_LENGTH;
  const passwordsMismatch = isSignUp && confirmPassword.length > 0 && confirmPassword !== password;
  const canSubmit =
    Boolean(username.trim()) &&
    Boolean(password) &&
    (!isSignUp || (password.length >= MIN_PASSWORD_LENGTH && confirmPassword === password));

  const switchMode = () => {
    setMode(isSignUp ? 'signIn' : 'signUp');
    setConfirmPassword('');
    loginState.reset();
    registerState.reset();
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = username.trim();
    if (!canSubmit) return;

    try {
      const submit = isSignUp ? register : login;
      const user = await submit({ username: trimmed, password }).unwrap();
      dispatch(setUsername(user.username));
    } catch {
    }
  };

  return (
    <Box
      sx={{
        minHeight: '70vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Stack spacing={3} sx={{ width: '100%', maxWidth: 400, alignItems: 'center' }}>
        <Typography
          variant="h3"
          component="h1"
          sx={{
            fontWeight: 800,
            color: palette.primary,
            textAlign: 'center',
            letterSpacing: 0.5,
          }}
        >
          MediaVault
        </Typography>

        <Paper
          component="form"
          onSubmit={handleSubmit}
          sx={{
            width: '100%',
            p: 4,
            borderRadius: 3,
            backgroundImage: 'none',
            backgroundColor: palette.surface,
            border: `1px solid ${palette.border}`,
          }}
        >
          <Stack spacing={2.5}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {isSignUp ? 'Create account' : 'Sign in'}
              </Typography>
            </Box>

            {activeState.isError && <Alert severity="error">{errorMessage}</Alert>}

            <TextField
              required
              label="Username"
              value={username}
              onChange={(e) => setUsernameField(e.target.value)}
              autoComplete="username"
              autoFocus
              fullWidth
            />
            <TextField
              required
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              error={passwordTooShort}
              helperText={
                passwordTooShort ? `At least ${MIN_PASSWORD_LENGTH} characters` : undefined
              }
              fullWidth
            />
            {isSignUp && (
              <TextField
                required
                label="Confirm password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                error={passwordsMismatch}
                helperText={passwordsMismatch ? 'Passwords do not match' : undefined}
                fullWidth
              />
            )}

            <Button
              type="submit"
              variant="contained"
              disabled={activeState.isLoading || !canSubmit}
              fullWidth
              sx={{ py: 1.25, fontWeight: 700 }}
            >
              {isSignUp
                ? registerState.isLoading
                  ? 'Creating account…'
                  : 'Create account'
                : loginState.isLoading
                  ? 'Signing in…'
                  : 'Sign in'}
            </Button>
            <Button variant="text" onClick={switchMode} sx={{ textTransform: 'none' }}>
              {isSignUp ? 'Already have an account? Sign in' : 'New here? Create an account'}
            </Button>
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
}
