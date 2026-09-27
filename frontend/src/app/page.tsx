'use client';

import { Container } from '@mui/material';
import { AddMediaModal } from '@/components/AddMediaModal';
import { LibraryHeader } from '@/components/LibraryHeader';
import { LibraryView } from '@/components/LibraryView';

/**
 * Home library page: header, filters, and media grid/list.
 * @returns Library page composition.
 */
export default function HomePage() {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <LibraryHeader />
      <AddMediaModal />
      <LibraryView />
    </Container>
  );
}
