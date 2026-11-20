'use client';

import { Alert, Box, CircularProgress, Stack, Typography } from '@mui/material';
import { SectionDivider } from '@/components/common/SectionDivider';
import { Achievements } from '@/components/profile/Achievements';
import { FavoriteMedia } from '@/components/profile/FavoriteMedia';
import { FinishedStats } from '@/components/profile/FinishedStats';
import { Avatar } from '@/components/profile/Avatar';
import { RatingDistributionChart } from '@/components/profile/RatingDistributionChart';
import { RecentActivity } from '@/components/profile/RecentActivity';
import { palette } from '@/lib/palette';
import { useAppSelector } from '@/redux/hooks';
import { useGetProfileStatsQuery } from '@/redux/api';
import { getApiErrorMessage } from '@/utils/apiError';
import { averageStars } from '@/utils/rating';
import type { ProfileSectionId } from '@/types/profile';

// Home/profile page with stats, avatar, and recent activity
export default function ProfilePage() {
  const username = useAppSelector((state) => state.auth.username);
  const viewingAs = useAppSelector((state) => state.auth.viewingAs);
  const displayName = viewingAs ?? username;
  const { data, isLoading, isError, error } = useGetProfileStatsQuery(undefined, {
    skip: !username,
  });
  // The profile owner's choice of hidden elements comes with the stats, so anyone who opens this profile
  // (a friend too) sees it as the owner configured it.
  const hiddenSections = data?.hidden_sections ?? [];
  const show = (id: ProfileSectionId) => !hiddenSections.includes(id);
  const errorMessage = getApiErrorMessage(error, 'Failed to load profile stats');
  const averageRating = data ? averageStars(data.rating_distribution) : null;

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
          {(show('avatar') || show('rating') || show('achievements')) && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                flexWrap: 'wrap',
              }}
            >
              {show('avatar') && <Avatar username={displayName} readOnly={Boolean(viewingAs)} />}
              {show('avatar') && displayName && (
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
              {show('rating') && (
                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                  <RatingDistributionChart
                    distribution={data.rating_distribution}
                    unratedCount={data.unrated_count}
                  />
                  {averageRating != null && (
                    <Typography
                      variant="h6"
                      component="p"
                      sx={{
                        position: 'absolute',
                        top: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        mt: 1,
                        mb: 0,
                        fontWeight: 500,
                        lineHeight: 1.2,
                        color: palette.primary,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Average Rating: {averageRating.toFixed(1)}
                    </Typography>
                  )}
                </Box>
              )}
              {show('achievements') && <Achievements achievements={data.achievements} />}
            </Box>
          )}
          {(show('finished_all_time') || show('finished_year')) && (
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'flex-start',
                gap: 4,
              }}
            >
              {show('finished_all_time') && (
                <FinishedStats label="All-time finished" finished={data.finished} />
              )}
              {show('finished_year') && (
                <FinishedStats
                  label={`Finished in ${data.finished_year}`}
                  finished={data.finished_this_year}
                />
              )}
            </Box>
          )}
          {show('favorites') && (
            <FavoriteMedia favorites={data.favorites} readOnly={Boolean(viewingAs)} />
          )}
          {show('recent_activity') && <RecentActivity items={data.recent_activity} />}
        </Stack>
      )}
    </>
  );
}
