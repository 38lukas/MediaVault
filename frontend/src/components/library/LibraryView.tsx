'use client';

import { useMemo } from 'react';
import { Alert, Box, CircularProgress, Stack } from '@mui/material';
import { MediaGrid } from '@/components/media/MediaGrid';
import { SectionDivider } from '@/components/common/SectionDivider';
import { LibraryToolbar } from '@/components/library/LibraryToolbar';
import {
  finishedMonthKey,
  formatFinishedMonthLabel,
  formatLastPlayedLabel,
  formatRatingLabel,
  groupConsecutive,
  lastPlayedSectionKey,
  ratingSectionKey,
  statusSectionKey,
} from '@/utils/mediaGrouping';
import { getApiErrorMessage } from '@/utils/apiError';
import { sortMediaItems } from '@/utils/mediaSort';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { openEditMediaModal } from '@/redux/slices/mediaModalSlice';
import { useGetMediaEntriesQuery } from '@/redux/api';
import { matchesTypeFilter, type MediaItem } from '@/types/media';

// Loads media entries and renders filtered/sorted library sections.
export function LibraryView() {
  const dispatch = useAppDispatch();
  const username = useAppSelector((state) => state.auth.username);
  const { data: items = [], isLoading, isError, error } = useGetMediaEntriesQuery(
    undefined,
    { skip: !username }
  );
  const { typeFilter, sortField, sortDirection, searchQuery } =
    useAppSelector((state) => state.libraryUi);

  const visibleItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const filtered = items.filter((item) => {
      if (!matchesTypeFilter(item.media_type, typeFilter)) return false;
      if (query && !item.title.toLowerCase().includes(query)) return false;
      if (sortField === 'months' && !item.finished_at) return false;
      return true;
    });

    return filtered.sort((a, b) =>
      sortMediaItems(a, b, sortField, sortDirection)
    );
  }, [items, typeFilter, searchQuery, sortField, sortDirection]);

  const sections = useMemo(() => {
    if (sortField === 'status') {
      return groupConsecutive(visibleItems, (item) => statusSectionKey(item, typeFilter));
    }
    if (sortField === 'months') {
      return groupConsecutive(visibleItems, finishedMonthKey, formatFinishedMonthLabel);
    }
    if (sortField === 'rating') {
      return groupConsecutive(visibleItems, ratingSectionKey, formatRatingLabel, (item) => item.rating);
    }
    if (sortField === 'last_played') {
      return groupConsecutive(visibleItems, lastPlayedSectionKey, formatLastPlayedLabel);
    }
    return null;
  }, [visibleItems, sortField, typeFilter]);

  const errorMessage = getApiErrorMessage(error, 'Failed to fetch media entries');

  const hideStatus = sortField === 'status';

  const handleItemClick = (item: MediaItem) => {
    dispatch(openEditMediaModal(item));
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {errorMessage}
      </Alert>
    );
  }

  return (
    <>
      <LibraryToolbar />
      {sections && sections.length > 0 ? (
        <Stack spacing={3}>
          {sections.map((section) => (
            <Box key={section.key}>
              {section.label ? (
                <SectionDivider
                  label={section.label}
                  rating={section.rating}
                  statusStyle={hideStatus}
                />
              ) : null}
              <MediaGrid items={section.items} onItemClick={handleItemClick} />
            </Box>
          ))}
        </Stack>
      ) : (
        <MediaGrid items={visibleItems} onItemClick={handleItemClick} />
      )}
    </>
  );
}
