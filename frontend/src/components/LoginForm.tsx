'use client';

import { FormEvent, useState } from 'react';
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { palette } from '@/lib/palette';
import { useAppDispatch } from '@/redux/hooks';
import { setUsername } from '@/redux/authSlice';
import { useLoginMutation } from '@/redux/mediaApi';

/** Full-page login form shown before the library is accessible.
 *  Creates the user on first successful submit if the username does not exist.
 * 
 * @returns Login form UI.
 */
export function LoginForm() {
  const dispatch = useAppDispatch();
  const [login, loginState] = useLoginMutation();
  const [username, setUsernameField] = useState('');
  const [password, setPassword] = useState('');

  const errorMessage =
    loginState.error && 'data' in loginState.error && loginState.error.data
      ? typeof loginState.error.data === 'string'
        ? loginState.error.data
        : typeof loginState.error.data === 'object' &&
            loginState.error.data !== null &&
            'detail' in loginState.error.data
          ? String((loginState.error.data as { detail: unknown }).detail)
          : 'Login failed'
      : 'Login failed';

  /** Submits credentials to the API and stores the username on success.
   * 
   * @param event - Form submit event.
   * @returns Promise that settles when login finishes.
   */
  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = username.trim();
    if (!trimmed || !password) return;

    try {
      const user = await login({ username: trimmed, password }).unwrap();
      dispatch(setUsername(user.username));
    } catch {
      // Error is surfaced via loginState.isError below.
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
      <Paper
        component="form"
        onSubmit={handleSubmit}
        sx={{
          width: '100%',
          maxWidth: 400,
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
              Sign in
            </Typography>
          </Box>

          {loginState.isError && <Alert severity="error">{errorMessage}</Alert>}

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
            autoComplete="current-password"
            fullWidth
          />

          <Button
            type="submit"
            variant="contained"
            disabled={loginState.isLoading || !username.trim() || !password}
            fullWidth
            sx={{ py: 1.25, fontWeight: 700 }}
          >
            {loginState.isLoading ? 'Signing in…' : 'Sign in'}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
