'use client';

import { Box, Typography } from '@mui/material';

interface SectionDividerProps {
  label: string;
}

/**
 * Section divider above grouped library items.
 * @param props.label - Section title (e.g. status or month).
 * @returns Divider row with label and horizontal rule.
 */
export function SectionDivider({ label }: SectionDividerProps) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, mt: 1 }}>
      <Typography
        variant="subtitle2"
        sx={{ fontWeight: 700, letterSpacing: 0.4, whiteSpace: 'nowrap' }}
      >
        {label}
      </Typography>
      <Box sx={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.16)' }} />
    </Box>
  );
}
