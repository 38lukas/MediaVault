'use client';

import { Alert, Box, CircularProgress, Container, Stack } from '@mui/material';
import { AuthGate } from '@/components/user/AuthGate';
import { MediaModal } from '@/components/media/MediaModal';
import { PageHeader } from '@/components/common/PageHeader';
import { FinishedStats } from '@/components/profile/FinishedStats';
import { RatingDistributionChart } from '@/components/profile/RatingDistributionChart';
import { RecentlyFinished } from '@/components/profile/RecentlyFinished';
import { useAppSelector, useRatingsEnabled } from '@/redux/hooks';
import { useGetProfileStatsQuery } from '@/redux/mediaApi';
import { getApiErrorMessage } from '@/utils/apiError';

/** Profile page
 * 
 * @returns Profile page behind AuthGate
 */
export default function ProfilePage() {
  const username = useAppSelector((state) => state.auth.username);
  const ratingsEnabled = useRatingsEnabled();
  const { data, isLoading, isError, error } = useGetProfileStatsQuery(undefined, {
    skip: !username,
  });

  const errorMessage = getApiErrorMessage(error, 'Failed to load profile stats');

  return (
    <AuthGate>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <PageHeader
          title="Profile"
          subtitle={username ? `Signed in as ${username}` : undefined}
        />
        <MediaModal />

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
            <FinishedStats finished={data.finished} />
            {ratingsEnabled && (
              <RatingDistributionChart distribution={data.rating_distribution} />
            )}
            <RecentlyFinished items={data.recently_finished} />
          </Stack>
        )}
      </Container>
    </AuthGate>
  );
}
