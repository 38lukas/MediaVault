'use client';

import React from 'react';
import { Grid, Typography, Box } from '@mui/material';
import { MediaCard } from './MediaCard';
import type { MediaItem } from '@/types/media';

interface MediaGridProps {
  items: MediaItem[];
  onItemClick?: (item: MediaItem) => void;
}

/**
 * Responsive card grid for the library.
 * @param props.items - Media entries to display.
 * @param props.onItemClick - Optional per-item click handler.
 * @returns Grid of MediaCard components, or an empty state.
 */
export const MediaGrid: React.FC<MediaGridProps> = ({ items, onItemClick }) => {
  if (items.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary">
          Keine Medien gefunden.
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={1.5}>
      {items.map((item) => (
        <Grid key={item.id} size={{ xs: 4, sm: 3, md: 2.4, lg: 2, xl: 1.5 }}>
          <MediaCard item={item} onClick={() => onItemClick?.(item)} />
        </Grid>
      ))}
    </Grid>
  );
};
