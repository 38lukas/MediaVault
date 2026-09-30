'use client';

import Link from 'next/link';
import { Box, IconButton, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { palette } from '@/lib/palette';

/**
 * Settings page header with a back link to the library and the page title.
 * @returns Header row styled like LibraryHeader.
 */
export function SettingsHeader() {
  return (
    <Box
      sx={{
        mb: 4,
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
      }}
    >
      <IconButton
        component={Link}
        href="/"
        aria-label="Back to library"
        sx={{
          color: palette.primary,
          border: `1px solid ${palette.borderMuted}`,
          borderRadius: '10px',
          width: 44,
          height: 44,
          '&:hover': {
            backgroundColor: palette.fieldBg,
          },
        }}
      >
        <ArrowBackIcon />
      </IconButton>
      <Typography
        variant="h4"
        component="h1"
        sx={{ fontWeight: 'bold', color: palette.primary }}
      >
        Settings
      </Typography>
    </Box>
  );
}
