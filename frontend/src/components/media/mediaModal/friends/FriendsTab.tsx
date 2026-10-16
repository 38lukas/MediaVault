'use client';

import { Alert, Box, CircularProgress, Stack, Typography } from '@mui/material';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import { StarRating } from '@/components/common/StarRating';
import { palette } from '@/lib/palette';
import { useGetFriendEntriesQuery, type FriendEntry } from '@/redux/api';
import { useAppSelector } from '@/redux/hooks';
import { getApiErrorMessage } from '@/utils/apiError';
import { formatDisplayDate } from '@/utils/date';
import { getStatusColor } from '@/utils/mediaStatus';
import { isMatchableExternalId } from '../constants';

const AVATAR_SIZE = 40;

function FriendAvatar({ src }: { src: string | null }) {
  if (src) {
    return (
      <Box
        component="img"
        src={src}
        alt=""
        draggable={false}
        sx={{
          width: AVATAR_SIZE,
          height: AVATAR_SIZE,
          borderRadius: '50%',
          objectFit: 'cover',
          display: 'block',
          flexShrink: 0,
        }}
      />
    );
  }
  return (
    <Box
      sx={{
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        backgroundColor: palette.surfaceElevated,
        border: `1px solid ${palette.border}`,
        color: palette.primary,
      }}
    >
      <PersonOutlinedIcon fontSize="small" />
    </Box>
  );
}

function FriendEntryRow({ entry }: { entry: FriendEntry }) {
  const statusStyle = getStatusColor(entry.status);
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        p: 1.5,
        borderRadius: 2,
        border: `1px solid ${palette.border}`,
        backgroundColor: palette.surface,
      }}
    >
      <FriendAvatar src={entry.avatar_path} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="body2" sx={{ fontWeight: 700, overflowWrap: 'anywhere' }}>
            {entry.username}
          </Typography>
          <Box
            sx={{
              py: 0.15,
              px: 0.75,
              borderRadius: 1,
              backgroundColor: statusStyle.bg,
              border: `1px solid ${statusStyle.border}`,
              color: statusStyle.color,
              fontWeight: 600,
              fontSize: '0.7rem',
              lineHeight: 1.4,
            }}
          >
            {entry.status}
          </Box>
        </Box>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.25 }}>
          Finished: {formatDisplayDate(entry.finished_at)}
        </Typography>
      </Box>
      {entry.rating != null ? (
        <StarRating value={entry.rating} readOnly size="small" />
      ) : (
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Unrated
        </Typography>
      )}
    </Box>
  );
}

// Friends who logged the same media (matched by external id), with their status, rating, and finish date.
export function FriendsTab() {
  const externalId = useAppSelector((state) => state.mediaModal.form.externalId.trim());
  const matchable = isMatchableExternalId(externalId);
  const { data: entries = [], isFetching, isError, error } = useGetFriendEntriesQuery(
    externalId,
    { skip: !matchable },
  );

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700 }}>
        Friends
      </Typography>
      {!matchable ? (
        <Typography variant="body2" color="text.secondary">
          Pick a title from the search to see which friends logged it.
        </Typography>
      ) : isFetching ? (
        <CircularProgress size={18} />
      ) : isError ? (
        <Alert severity="error">
          {getApiErrorMessage(error, 'Failed to load friends’ entries')}
        </Alert>
      ) : entries.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          None of your friends have logged this yet.
        </Typography>
      ) : (
        <Stack spacing={1}>
          {entries.map((entry, index) => (
            <FriendEntryRow key={`${entry.username}:${index}`} entry={entry} />
          ))}
        </Stack>
      )}
    </Box>
  );
}
