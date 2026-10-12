'use client';

import { useEffect, type ReactNode } from 'react';
import { Box, CircularProgress, Container } from '@mui/material';
import { LoginForm } from './LoginForm';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { AUTH_STORAGE_KEY, hydrateAuth } from '@/redux/slices/authSlice';

// Restores auth from localStorage, then shows login or children.
export function AuthGate({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const username = useAppSelector((state) => state.auth.username);
  const hydrated = useAppSelector((state) => state.auth.hydrated);

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
