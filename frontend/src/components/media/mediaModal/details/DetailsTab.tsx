'use client';

import { Box, CircularProgress, Stack, Typography } from '@mui/material';
import { formatDisplayDate } from '@/utils/date';
import { useAppSelector } from '@/redux/hooks';

/** Read-only IGDB metadata for the entry in the media modal.
 *
 * @returns Details part bound to the media modal form.
 */
export function DetailsTab() {
  const form = useAppSelector((state) => state.mediaModal.form);
  const loading = useAppSelector(
    (state) => state.mediaModal.igdbSelected && state.mediaModal.igdbLoading,
  );
  const metadata = [
    { label: 'Platforms', value: form.platforms.join(', ') },
    { label: 'Genres', value: form.genres.join(', ') },
    { label: 'Release date', value: formatDisplayDate(form.releaseDate) },
    { label: 'Developer', value: form.developers.join(', ') },
    { label: 'Publisher', value: form.publishers.join(', ') },
    { label: 'Franchises', value: form.franchises.join(', ') },
  ];

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700 }}>
        IGDB details
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
