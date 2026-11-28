'use client';

import { Box } from '@mui/material';
import { getStatusColor } from '@/utils/mediaStatus';

// Status as plain text with a small dot in the status color (status dropdown and filter).
export function StatusLabel({ status }: { status: string }) {
  const { color } = getStatusColor(status);
  return (
    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
      <Box
        component="span"
        aria-hidden
        sx={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          backgroundColor: color,
          flexShrink: 0,
          // Soft glow in the dot's own color.
          boxShadow: `0 0 6px 1px color-mix(in srgb, ${color} 70%, transparent)`,
        }}
      />
      <Box component="span" sx={{ textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
        {status}
      </Box>
    </Box>
  );
}
