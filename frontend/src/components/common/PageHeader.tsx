'use client';

import Link from 'next/link';
import { Box, IconButton, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { palette } from '@/lib/palette';

interface PageHeaderProps {
  title: string;
  /** Optional text shown in parentheses next to the title. */
  subtitle?: string;
}

/**
 * Shared subpage header with a back link to the library and a page title.
 * @param props.title - Heading shown next to the back button.
 * @param props.subtitle - Optional parenthetical next to the title.
 * @returns Header row used by Settings, Profile, and similar pages.
 */
export function PageHeader({ title, subtitle }: PageHeaderProps) {
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
        {title}
        {subtitle && (
          <Typography
            component="span"
            variant="body2"
            sx={{ fontWeight: 400, color: 'text.secondary', ml: 1 }}
          >
            ({subtitle})
          </Typography>
        )}
      </Typography>
    </Box>
  );
}
