'use client';

import { useEffect, type ReactNode } from 'react';
import { Container } from '@mui/material';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { AppPreloader } from './AppPreloader';
import { BackendGate } from './BackendGate';
import { LoginForm } from './LoginForm';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { AUTH_STORAGE_KEY, hydrateAuth } from '@/redux/slices/authSlice';

// Restores auth from localStorage, then shows login or children.
export function AuthGate({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const username = useAppSelector((state) => state.auth.username);
  const viewingAs = useAppSelector((state) => state.auth.viewingAs);
  const hydrated = useAppSelector((state) => state.auth.hydrated);

  useEffect(() => {
    dispatch(hydrateAuth(localStorage.getItem(AUTH_STORAGE_KEY)));
  }, [dispatch]);

  if (!hydrated) return <LoadingScreen message="Connecting…" />;

  return (
    <BackendGate>
      {username ? (
        <AppPreloader username={username} viewingAs={viewingAs}>
          {children}
        </AppPreloader>
      ) : (
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <LoginForm />
        </Container>
      )}
    </BackendGate>
  );
}
