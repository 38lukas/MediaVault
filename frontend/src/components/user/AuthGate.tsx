'use client';

import { useEffect, type ReactNode } from 'react';
import { Container } from '@mui/material';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { AppPreloader } from './AppPreloader';
import { LoginForm } from './LoginForm';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { AUTH_STORAGE_KEY, AUTH_TOKEN_STORAGE_KEY, hydrateAuth } from '@/redux/slices/authSlice';

// Restores auth from localStorage, then shows login or children.
export function AuthGate({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const username = useAppSelector((state) => state.auth.username);
  const viewingAs = useAppSelector((state) => state.auth.viewingAs);
  const hydrated = useAppSelector((state) => state.auth.hydrated);

  useEffect(() => {
    const storedUsername = localStorage.getItem(AUTH_STORAGE_KEY);
    const storedToken = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    if (storedUsername && storedToken) {
      dispatch(hydrateAuth({ username: storedUsername, token: storedToken }));
    } else {
      // Sessions from before login tokens only stored a username: log in again.
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
      dispatch(hydrateAuth(null));
    }
  }, [dispatch]);

  if (!hydrated) return <LoadingScreen message="Connecting…" />;

  if (username) {
    return (
      <AppPreloader username={username} viewingAs={viewingAs}>
        {children}
      </AppPreloader>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <LoginForm />
    </Container>
  );
}
