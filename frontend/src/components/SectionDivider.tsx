'use client';

import { Box, Typography } from '@mui/material';
import { StarRating } from '@/components/StarRating';
import { palette } from '@/lib/palette';

interface SectionDividerProps {
  label: string;
  /** DB rating 1–10; when set, shows read-only star icons before the label. */
  rating?: number | null;
}

/** Section divider above grouped library items.
 *
 * @param props.label - Section title (e.g. status, month, or custom rating text).
 * @param props.rating - Optional DB rating for star icons next to the label.
 * @returns Divider row with label and horizontal rule.
 */
export function SectionDivider({ label, rating }: SectionDividerProps) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, mt: 1 }}>
      {rating != null && <StarRating value={rating} readOnly size="small" />}
      <Typography
        variant="subtitle2"
        sx={{ fontWeight: 700, letterSpacing: 0.4, whiteSpace: 'nowrap' }}
      >
        {label}
      </Typography>
      <Box sx={{ flex: 1, height: '1px', backgroundColor: palette.borderStrong }} />
    </Box>
  );
}
