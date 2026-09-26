'use client';

import React from 'react';
import { Grid, Typography, Box } from '@mui/material';
import { MediaCard, MediaItem } from './MediaCard';

interface MediaGridProps {
  items: MediaItem[];
  onItemClick?: (item: MediaItem) => void;
}

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
    <Grid container spacing={2}>
      {items.map((item) => (
        <Grid
          key={item.id}
          size={{ xs: 6, sm: 4, md: 3, lg: 2.4, xl: 2 }}
        >
          <MediaCard item={item} onClick={() => onItemClick?.(item)} />
        </Grid>
      ))}
    </Grid>
  );
};