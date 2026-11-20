'use client';

import { Box, CircularProgress, LinearProgress, Typography } from '@mui/material';
import { palette } from '@/lib/palette';

interface LoadingScreenProps {
  message: string;
  detail?: string;
  // 0-100; omit for an indeterminate wait.
  progress?: number;
}

// Full-screen loading state shown while the backend wakes up or the app preloads its data.
export function LoadingScreen({ message, detail, progress }: LoadingScreenProps) {
  return (
    <Box
      role="status"
      aria-live="polite"
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2.5,
        px: 3,
        textAlign: 'center',
      }}
    >
      <Typography variant="h4" sx={{ fontWeight: 'bold', color: palette.primary }}>
        MediaVault
      </Typography>
      <CircularProgress />
      <Box>
        <Typography sx={{ fontWeight: 600 }}>{message}</Typography>
        {detail && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {detail}
          </Typography>
        )}
      </Box>
      {progress != null && (
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{ width: 220, height: 4, borderRadius: 2 }}
        />
      )}
    </Box>
  );
}
