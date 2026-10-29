'use client';

import { Alert, Box, CircularProgress } from '@mui/material';
import { SectionDivider } from '@/components/common/SectionDivider';
import { ActivityLogList } from '@/components/profile/ActivityLogList';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { useGetMediaEntriesQuery } from '@/redux/api';
import { openEditMediaModal } from '@/redux/slices/mediaModalSlice';
import { getApiErrorMessage } from '@/utils/apiError';

// Full recent-activity list, one row per logged title.
export default function ActivityPage() {
  const dispatch = useAppDispatch();
  const username = useAppSelector((state) => state.auth.username);
  const { data, isLoading, isError, error } = useGetMediaEntriesQuery(undefined, {
    skip: !username,
  });

  return (
    <>
      <SectionDivider label="Recent Activities" />
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}
      {isError && (
        <Alert severity="error">{getApiErrorMessage(error, 'Failed to load recent activity')}</Alert>
      )}
      {data && (
        <ActivityLogList
          items={data}
          onItemClick={(item) => dispatch(openEditMediaModal(item))}
        />
      )}
    </>
  );
}
