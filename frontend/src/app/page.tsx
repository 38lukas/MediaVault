'use client';

import { useEffect } from 'react';
import { Box, CircularProgress, Container } from '@mui/material';
import { AddMediaModal } from '@/components/AddMediaModal';
import { LibraryHeader } from '@/components/LibraryHeader';
import { LibraryView } from '@/components/LibraryView';
import { LoginForm } from '@/components/LoginForm';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { AUTH_STORAGE_KEY, hydrateAuth } from '@/redux/authSlice';

/**
 * Home library page: login gate, then header, filters, and media grid/list.
 * @returns Login form or library page composition.
 */
export default function HomePage() {
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

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <LibraryHeader />
      <AddMediaModal />
      <LibraryView />
    </Container>
  );
}
