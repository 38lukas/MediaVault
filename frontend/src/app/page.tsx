'use client';

import { useState } from 'react';
import { Container, Typography, Box, CircularProgress, Alert, Button, SvgIcon } from '@mui/material';
import { MediaGrid } from '@/components/MediaGrid';
import { MediaItem } from '@/components/MediaCard';
import { AddMediaModal } from '@/components/AddMediaModal';
import { useGetMediaEntriesQuery } from '@/redux/api';

export default function HomePage() {
  const { data: items = [], isLoading, isError, error } = useGetMediaEntriesQuery();
  const [isModalOpen, setIsModalOpen] = useState(false);
  // null = create mode; set item = edit mode.
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null);

  const handleItemClick = (item: MediaItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const errorMessage =
    error && 'status' in error
      ? `Request failed (${String(error.status)})`
      : error && 'message' in error && error.message
        ? error.message
        : 'Failed to fetch media entries';

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box
        sx={{
          mb: 4,
          display: 'flex',
          alignItems: { xs: 'stretch', sm: 'flex-start' },
          justifyContent: 'space-between',
          gap: 2,
          flexDirection: { xs: 'column', sm: 'row' },
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            Meine Bibliothek
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Verwalte deine Filme, Serien, Animes und Games an einem Ort.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={
            <SvgIcon fontSize="small">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </SvgIcon>
          }
          onClick={() => {
            setEditingItem(null);
            setIsModalOpen(true);
          }}
          sx={{ alignSelf: { xs: 'stretch', sm: 'center' }, whiteSpace: 'nowrap' }}
        >
          Add Game / Media
        </Button>
      </Box>

      <AddMediaModal
        open={isModalOpen}
        onClose={handleCloseModal}
        item={editingItem}
      />

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
