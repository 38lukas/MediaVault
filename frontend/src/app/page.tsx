'use client';

import { Container, Typography, Box, CircularProgress, Alert } from '@mui/material';
import { MediaGrid } from '@/components/MediaGrid';
import { MediaItem } from '@/components/MediaCard';
import { useGetMediaEntriesQuery } from '@/redux/api';

export default function HomePage() {
  // Hook auto-fetches on mount and exposes cache status (no useEffect/dispatch).
  const { data: items = [], isLoading, isError, error } = useGetMediaEntriesQuery();

  const handleItemClick = (item: MediaItem) => {
    console.log('Klick auf Medium:', item.title);
  };

  const errorMessage =
    error && 'status' in error
      ? `Request failed (${String(error.status)})`
      : error && 'message' in error && error.message
        ? error.message
        : 'Failed to fetch media entries';

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Meine Bibliothek
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Verwalte deine Filme, Serien, Animes und Games an einem Ort.
        </Typography>
      </Box>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMessage}
        </Alert>
      )}

      {!isLoading && !isError && (
        <MediaGrid items={items} onItemClick={handleItemClick} />
      )}
    </Container>
  );
}
