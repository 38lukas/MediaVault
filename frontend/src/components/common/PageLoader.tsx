'use client';

import { Box, CircularProgress } from '@mui/material';

// Centered spinner shown while a page is loading or mounting; same look as the other pages' loaders.
export function PageLoader() {
  return (
    <Box role="status" aria-label="Loading" sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
      <CircularProgress />
    </Box>
  );
}
