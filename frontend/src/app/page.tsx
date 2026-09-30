'use client';

import { Container } from '@mui/material';
import { AuthGate } from '@/components/user/AuthGate';
import { MediaModal } from '@/components/media/MediaModal';
import { LibraryHeader } from '@/components/library/LibraryHeader';
import { LibraryView } from '@/components/library/LibraryView';

/**
 * Home library page: auth gate, then header, filters, and media grid/list.
 * @returns Library page composition behind AuthGate.
 */
export default function HomePage() {
  return (
    <AuthGate>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <LibraryHeader />
        <MediaModal />
        <LibraryView />
      </Container>
    </AuthGate>
  );
}
