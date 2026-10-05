'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Collapse,
  Stack,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

interface DetailsProps {
  showIgdbDetails: boolean;
  loading: boolean;
  platforms: string[];
  genres: string[];
  releaseDate: string;
  developers: string[];
  publishers: string[];
  franchise: string;
}

function formatReleaseDate(value: string): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function Details({
  showIgdbDetails,
  loading,
  platforms,
  genres,
  releaseDate,
  developers,
  publishers,
  franchise,
}: DetailsProps) {
  const [open, setOpen] = useState(false);
  const metadata = [
    { label: 'Platforms', value: platforms.join(', ') },
    { label: 'Genres', value: genres.join(', ') },
    { label: 'Release date', value: formatReleaseDate(releaseDate) },
    { label: 'Developer', value: developers.join(', ') },
    { label: 'Publisher', value: publishers.join(', ') },
    { label: 'Franchise', value: franchise },
  ];

  return (
    <Box>
      <Button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        endIcon={
          <ExpandMoreIcon
            sx={{
              transform: open ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s ease',
            }}
          />
        }
        sx={{
          color: 'text.secondary',
          fontWeight: 600,
          fontSize: '0.8rem',
          textTransform: 'none',
          px: 0,
          minWidth: 0,
          '&:hover': {
            backgroundColor: 'transparent',
            color: 'text.primary',
          },
        }}
      >
        Details
      </Button>
      <Collapse in={open}>
        <Stack spacing={2} sx={{ pt: 1.5 }}>
          {showIgdbDetails && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
                IGDB details
              </Typography>
              {loading ? (
                <CircularProgress size={18} />
              ) : (
                <Stack spacing={1}>
                  {metadata.map(({ label, value }) => (
                    <Box key={label}>
                      <Typography
                        variant="caption"
                        sx={{ color: 'text.secondary', display: 'block' }}
                      >
                        {label}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: 'text.primary', overflowWrap: 'anywhere' }}
                      >
                        {value || '—'}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>
          )}
        </Stack>
      </Collapse>
    </Box>
  );
}