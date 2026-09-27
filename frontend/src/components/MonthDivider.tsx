'use client';

import { Box, Typography } from '@mui/material';

interface MonthDividerProps {
  label: string;
}

/**
 * Renders a month section divider above grouped library items.
 * @param props.label - Month title (e.g. "September 2025").
 * @returns Divider row with label and horizontal rule.
 */
export function MonthDivider({ label }: MonthDividerProps) {
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
