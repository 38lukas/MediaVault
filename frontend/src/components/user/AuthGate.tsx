'use client';

import { useEffect, type ReactNode } from 'react';
import { Box, CircularProgress, Container } from '@mui/material';
import { LoginForm } from './LoginForm';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { AUTH_STORAGE_KEY, hydrateAuth } from '@/redux/authSlice';

/** Restores auth from localStorage, shows a spinner until hydrated, then
 *  either the login form or the authenticated children.
 * 
 * @param props.children Content shown when a username is present.
 * @returns Spinner, login form, or authenticated children.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const username = useAppSelector((state) => state.auth.username);
  const hydrated = useAppSelector((state) => state.auth.hydrated);

  // Restore session from localStorage after mount.
  useEffect(() => {
    dispatch(hydrateAuth(localStorage.getItem(AUTH_STORAGE_KEY)));
  }, [dispatch]);

  if (!hydrated) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!username) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <LoginForm />
      </Container>
    );
  }

  return <>{children}</>;
}
