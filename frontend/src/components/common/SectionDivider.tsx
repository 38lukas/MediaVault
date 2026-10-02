'use client';

import { Box, Typography } from '@mui/material';
import { StarRating } from '@/components/common/StarRating';
import { palette } from '@/lib/palette';
import { getStatusColor } from '@/utils/mediaStatus';

interface SectionDividerProps {
  label: string; 
  rating?: number | null;
  statusStyle?: boolean; 
}

/** Shared section divider used by the library and profile pages.
 *
 * @param props.label - Section title
 * @param props.rating - Optional DB rating for star icons next to the label
 * @param props.statusStyle - Styles the label (used when sorting by status)
 * @returns Divider row with label and horizontal rule
 */
export function SectionDivider({ label, rating, statusStyle = false }: SectionDividerProps) {
  const colors = statusStyle ? getStatusColor(label) : null;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, mt: 1 }}>
      {rating != null && <StarRating value={rating} readOnly size="small" />}
      {colors ? (
        <Box
          sx={{
            py: 0.55,
            px: 1.25,
            borderRadius: 1.5,
            backgroundColor: colors.bg,
            border: `1px solid ${colors.border}`,
            color: colors.color,
            fontWeight: 700,
            fontSize: '0.75rem',
            letterSpacing: '0.02em',
            textTransform: 'capitalize',
            lineHeight: 1.2,
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </Box>
      ) : (
        <Typography
          variant="subtitle2"
          sx={{ fontWeight: 700, letterSpacing: 0.4, whiteSpace: 'nowrap' }}
        >
          {label}
        </Typography>
      )}
      <Box sx={{ flex: 1, height: '1px', backgroundColor: palette.borderStrong }} />
    </Box>
  );
}
