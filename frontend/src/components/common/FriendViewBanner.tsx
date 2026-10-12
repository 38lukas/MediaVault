'use client';

import { useRouter } from 'next/navigation';
import { Box, Button, Typography } from '@mui/material';
import { palette } from '@/lib/palette';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { exitFriendView } from '@/redux/slices/authSlice';
import { mediaApi } from '@/redux/api';

// Banner shown while viewing a friend's library in read-only mode.
export function FriendViewBanner() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const viewingAs = useAppSelector((state) => state.auth.viewingAs);

  if (!viewingAs) return null;

  const handleExit = () => {
    dispatch(exitFriendView());
    dispatch(mediaApi.util.resetApiState());
    router.push('/');
  };

  return (
    <Box
      sx={{
        mb: 3,
        px: 2,
        py: 1.25,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        flexWrap: 'wrap',
        borderRadius: 2,
        border: `1px solid ${palette.border}`,
        backgroundColor: palette.selectedBg,
      }}
    >
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        Viewing{' '}
        <Box component="span" sx={{ color: palette.primary }}>
          {viewingAs}
        </Box>
        {' '}
        (read-only)
      </Typography>
      <Button variant="contained" size="small" onClick={handleExit}>
        Exit
      </Button>
    </Box>
  );
}
