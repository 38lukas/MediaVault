'use client';

import React from 'react';
import { Grid, Typography, Box } from '@mui/material';
import { MediaCard } from './MediaCard';
import { useAppSelector } from '@/redux/hooks';
import type { CardSize, MediaItem } from '@/types/media';

interface MediaGridProps {
  items: MediaItem[];
  onItemClick?: (item: MediaItem) => void;
}

/** MUI Grid column spans per card size (0 = largest, 3 = densest). */
const CARD_GRID_COLS: Record<
  CardSize,
  { xs: number; sm: number; md: number; lg: number; xl: number }
> = {
  0: { xs: 6, sm: 4, md: 3, lg: 2.4, xl: 2 },
  1: { xs: 4, sm: 3, md: 2.4, lg: 2, xl: 1.5 },
  2: { xs: 4, sm: 3, md: 2, lg: 1.5, xl: 1.2 },
  3: { xs: 3, sm: 2, md: 1.5, lg: 1.2, xl: 1 },
};

/**
 * Responsive card grid for the library.
 * @param props.items - Media entries to display.
 * @param props.onItemClick - Optional per-item click handler.
 * @returns Grid of MediaCard components, or an empty state.
 */
export const MediaGrid: React.FC<MediaGridProps> = ({ items, onItemClick }) => {
  const cardSize = useAppSelector((state) => state.libraryUi.cardSize);

  if (items.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary">
          Keine Medien gefunden.
        </Typography>
      </Box>
    );
  }

  const cols = CARD_GRID_COLS[cardSize];

  return (
    <Grid container spacing={1.5}>
      {items.map((item) => (
        <Grid key={item.id} size={cols}>
          <MediaCard item={item} onClick={() => onItemClick?.(item)} />
        </Grid>
      ))}
    </Grid>
  );
};
