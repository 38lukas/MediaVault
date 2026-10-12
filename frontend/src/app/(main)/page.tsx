'use client';

import { Alert, Box, CircularProgress, Stack, Typography } from '@mui/material';
import { SectionDivider } from '@/components/common/SectionDivider';
import { FinishedStats } from '@/components/profile/FinishedStats';
import { Avatar } from '@/components/profile/Avatar';
import { RatingDistributionChart } from '@/components/profile/RatingDistributionChart';
import { RecentActivity } from '@/components/profile/RecentActivity';
import { palette } from '@/lib/palette';
import { useAppSelector } from '@/redux/hooks';
import { useGetProfileStatsQuery } from '@/redux/api/mediaApi';
import { getApiErrorMessage } from '@/utils/apiError';

// Home/profile page with stats, avatar, and recent activity
export default function ProfilePage() {
  const username = useAppSelector((state) => state.auth.username);
  const viewingAs = useAppSelector((state) => state.auth.viewingAs);
  const displayName = viewingAs ?? username;
  const { data, isLoading, isError, error } = useGetProfileStatsQuery(undefined, {
    skip: !username,
  });
  const errorMessage = getApiErrorMessage(error, 'Failed to load profile stats');

  return (
    <>
      <SectionDivider label="Profile" />

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMessage}
        </Alert>
      )}

      {data && (
        <Stack spacing={5}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              flexWrap: 'wrap',
            }}
          >
            <Avatar username={displayName} readOnly={Boolean(viewingAs)} />
            {displayName && (
              <Typography
                variant="h3"
                component="h1"
                sx={{
                  fontWeight: 700,
                  color: palette.primary,
                  lineHeight: 1.15,
                }}
              >
                {displayName}
              </Typography>
            )}
            <RatingDistributionChart distribution={data.rating_distribution} />
          </Box>
          <FinishedStats finished={data.finished} />
          <RecentActivity items={data.recent_activity} />
        </Stack>
      )}
    </>
  );
}
