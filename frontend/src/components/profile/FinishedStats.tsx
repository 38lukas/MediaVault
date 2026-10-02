'use client';

import { Box, Typography } from '@mui/material';
import { SectionDivider } from '@/components/common/SectionDivider';
import { palette } from '@/lib/palette';
import type { FinishedCounts } from '@/types/profile';

// Rows of finished media types
const TYPE_ROWS: { key: keyof Omit<FinishedCounts, 'total'>; label: string }[] = [
  { key: 'game', label: 'Games' },
  { key: 'dlc', label: 'DLC' },
  { key: 'movie', label: 'Movies' },
  { key: 'series', label: 'Series' },
  { key: 'anime', label: 'Anime' },
  { key: 'book', label: 'Books' },
];

interface FinishedStatsProps {
  finished: FinishedCounts;
}

/** All-time finished media counts: total plus per media type
 * 
 * @param props.finished - Aggregated finished counts from profile stats
 * @returns Compact finished stats section
 */ 
export function FinishedStats({ finished }: FinishedStatsProps) {
  return (
    <Box>
      <SectionDivider label="All-time finished" />

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'baseline',
            gap: 1,
            px: 2,
            py: 1.25,
            borderRadius: 1.5,
            border: `1px solid ${palette.border}`,
            backgroundColor: palette.surface,
          }}
        >
          <Typography
            variant="h5"
            component="span"
            sx={{ fontWeight: 700, color: palette.primary, lineHeight: 1.2 }}
          >
            {finished.total}
          </Typography>
          <Typography
            variant="h5"
            component="span"
            sx={{ fontWeight: 400, color: palette.primary, lineHeight: 1.2 }}
          >
            Total
          </Typography>
        </Box>

        {TYPE_ROWS.map(({ key, label }) => (
          <Box
            key={key}
            sx={{
              display: 'inline-flex',
              alignItems: 'baseline',
              gap: 0.6,
              px: 1.1,
              py: 0.65,
              borderRadius: 1.5,
              border: `1px solid ${palette.borderSubtle}`,
              backgroundColor: palette.fieldBg,
            }}
          >
            <Typography
              variant="body1"
              component="span"
              sx={{ fontWeight: 600, color: palette.textOnDark, lineHeight: 1.2 }}
            >
              {finished[key]}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
