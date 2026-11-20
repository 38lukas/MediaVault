'use client';

import { memo } from 'react';
import { Grid, Typography, Box } from '@mui/material';
import { LazyMount } from '@/components/common/LazyMount';
import { MediaCard } from './MediaCard';
import { useAppSelector } from '@/redux/hooks';
import type { CardSize, MediaItem } from '@/types/media';

interface MediaGridProps {
  items: MediaItem[];
  onItemClick?: (item: MediaItem) => void;
  cardSize?: CardSize;
  emptyMessage?: string;
}

// Cards beyond the first screenful are only built once they scroll near the viewport.
const EAGER_CARD_COUNT = 24;

export const CARD_GRID_COLS: Record<
  CardSize,
  { xs: number; sm: number; md: number; lg: number; xl: number }
> = {
  0: { xs: 6, sm: 4, md: 3, lg: 2.4, xl: 2 },
  1: { xs: 4, sm: 3, md: 2.4, lg: 2, xl: 1.5 },
  2: { xs: 3, sm: 2.4, md: 2, lg: 1.5, xl: 1.2 },
  3: { xs: 2.4, sm: 2, md: 1.5, lg: 1.2, xl: 1 },
  4: { xs: 2, sm: 1.5, md: 1.2, lg: 1, xl: 12 / 14 },
};

// Responsive card grid for library and profile media lists.
export const MediaGrid = memo(function MediaGrid({
  items,
  onItemClick,
  cardSize: cardSizeProp,
  emptyMessage = 'Keine Medien gefunden.',
}: MediaGridProps) {
  const libraryCardSize = useAppSelector((state) => state.libraryUi.cardSize);
  const cardSize = cardSizeProp ?? libraryCardSize;

  if (items.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary">
          {emptyMessage}
        </Typography>
      </Box>
    );
  }

  const cols = CARD_GRID_COLS[cardSize];

  return (
    <Grid container spacing={2}>
      {items.map((item, index) => (
        <Grid key={item.id} size={cols}>
          <LazyMount eager={index < EAGER_CARD_COUNT}>
            <MediaCard item={item} onSelect={onItemClick} />
          </LazyMount>
        </Grid>
      ))}
    </Grid>
  );
});
