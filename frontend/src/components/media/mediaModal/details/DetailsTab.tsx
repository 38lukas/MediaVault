'use client';

import { Box, CircularProgress, Stack, Typography } from '@mui/material';
import { formatDisplayDate } from '@/utils/date';
import { useAppSelector } from '@/redux/hooks';
import type { MediaForm } from '@/redux/slices/mediaModalSlice';
import { getCoverProvider } from '../constants';

interface MetadataRow {
  label: string;
  value: string;
}

function formatCount(value: number | null, unit = ''): string {
  return value == null ? '' : `${value}${unit}`;
}

// Rows shown for the form's media type (IGDB fields for games, TMDB fields otherwise).
function metadataRows(form: MediaForm): MetadataRow[] {
  if (form.mediaType === 'Movie') {
    return [
      { label: 'Release date', value: formatDisplayDate(form.releaseDate) },
      { label: 'Genres', value: form.genres.join(', ') },
      { label: 'Collection', value: form.franchises.join(', ') },
      { label: 'Director', value: form.directors.join(', ') },
      { label: 'Production companies', value: form.productionCompanies.join(', ') },
      { label: 'Runtime', value: formatCount(form.runtime, ' min') },
    ];
  }
  if (form.mediaType === 'Series' || form.mediaType === 'Anime') {
    return [
      ...(form.mediaType === 'Anime'
        ? [{ label: 'Original title', value: form.originalTitle }]
        : []),
      { label: 'First aired', value: formatDisplayDate(form.releaseDate) },
      { label: 'Last aired', value: formatDisplayDate(form.lastAirDate) },
      { label: 'Genres', value: form.genres.join(', ') },
      { label: 'Created by', value: form.creators.join(', ') },
      { label: 'Production companies', value: form.productionCompanies.join(', ') },
      { label: 'Seasons', value: formatCount(form.numberOfSeasons) },
      { label: 'Episodes', value: formatCount(form.numberOfEpisodes) },
    ];
  }
  return [
    { label: 'Platforms', value: form.platforms.join(', ') },
    { label: 'Genres', value: form.genres.join(', ') },
    { label: 'Release date', value: formatDisplayDate(form.releaseDate) },
    { label: 'Developer', value: form.developers.join(', ') },
    { label: 'Publisher', value: form.publishers.join(', ') },
    { label: 'Franchises', value: form.franchises.join(', ') },
  ];
}

// Read-only IGDB / TMDB metadata panel for the media modal.
export function DetailsTab() {
  const form = useAppSelector((state) => state.mediaModal.form);
  const loading = useAppSelector(
    (state) => state.mediaModal.lookupSelected && state.mediaModal.lookupLoading,
  );
  const metadata = metadataRows(form);

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700 }}>
        {getCoverProvider(form.mediaType)} details
      </Typography>
      {loading ? (
        <CircularProgress size={18} />
      ) : (
        <Stack spacing={1.5}>
          {metadata.map(({ label, value }) => (
            <Box key={label}>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                {label}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.primary', overflowWrap: 'anywhere' }}>
                {value || '—'}
              </Typography>
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
}
