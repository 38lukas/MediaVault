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

/** MUI Grid column spans per card size (0 XL → 2 medium → 4 XS).
 *  Spans step evenly so each +/- changes density by ~2 cards per row.
 */
const CARD_GRID_COLS: Record<
  CardSize,
  { xs: number; sm: number; md: number; lg: number; xl: number }
> = {
  // Extra large — ~2 / 3 / 4 / 5 / 6 per row
  0: { xs: 6, sm: 4, md: 3, lg: 2.4, xl: 2 },
  // Large — ~3 / 4 / 5 / 6 / 8 per row
  1: { xs: 4, sm: 3, md: 2.4, lg: 2, xl: 1.5 },
  // Medium — ~4 / 5 / 6 / 8 / 10 per row
  2: { xs: 3, sm: 2.4, md: 2, lg: 1.5, xl: 1.2 },
  // Small — ~5 / 6 / 8 / 10 / 12 per row
  3: { xs: 2.4, sm: 2, md: 1.5, lg: 1.2, xl: 1 },
  // Extra small — ~6 / 8 / 10 / 12 / 14 per row
  4: { xs: 2, sm: 1.5, md: 1.2, lg: 1, xl: 12 / 14 },
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
    <Grid container spacing={2}>
      {items.map((item) => (
        <Grid key={item.id} size={cols}>
          <MediaCard item={item} onClick={() => onItemClick?.(item)} />
        </Grid>
      ))}
    </Grid>
  );
};
