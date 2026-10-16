'use client';

import { useCallback, useDeferredValue, useMemo } from 'react';
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
import {
  matchesStatusFilter,
  matchesTypeFilter,
  mediaDisplayTitle,
  type MediaItem,
} from '@/types/media';

// Loads media entries and renders filtered/sorted library sections.
export function LibraryView() {
  const dispatch = useAppDispatch();
  const username = useAppSelector((state) => state.auth.username);
  const {
    data: items = [],
    isLoading,
    isFetching,
    isError,
    error,
  } = useGetMediaEntriesQuery(undefined, { skip: !username });

  const typeFilter = useAppSelector((state) => state.libraryUi.typeFilter);
  const statusFilter = useAppSelector((state) => state.libraryUi.statusFilter);
  const ratingFilter = useAppSelector((state) => state.libraryUi.ratingFilter);
  const sortField = useAppSelector((state) => state.libraryUi.sortField);
  const sortDirection = useAppSelector((state) => state.libraryUi.sortDirection);
  const searchQuery = useAppSelector((state) => state.libraryUi.searchQuery);

  // Defer heavy filter/sort work so toolbar clicks stay responsive.
  const deferredTypeFilter = useDeferredValue(typeFilter);
  const deferredStatusFilter = useDeferredValue(statusFilter);
  const deferredRatingFilter = useDeferredValue(ratingFilter);
  const deferredSortField = useDeferredValue(sortField);
  const deferredSortDirection = useDeferredValue(sortDirection);
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const isFilterPending =
    deferredTypeFilter !== typeFilter ||
    deferredStatusFilter !== statusFilter ||
    deferredRatingFilter !== ratingFilter ||
    deferredSortField !== sortField ||
    deferredSortDirection !== sortDirection ||
    deferredSearchQuery !== searchQuery;

  const visibleItems = useMemo(() => {
    const query = deferredSearchQuery.trim().toLowerCase();
    const filtered = items.filter((item) => {
      if (!matchesTypeFilter(item.media_type, deferredTypeFilter)) return false;
      if (!matchesStatusFilter(item.status, deferredStatusFilter)) return false;
      if (deferredRatingFilter != null && item.rating !== deferredRatingFilter) return false;
      if (query && !mediaDisplayTitle(item).toLowerCase().includes(query)) return false;
      if (deferredSortField === 'months' && !item.finished_at) return false;
      return true;
    });

    return filtered.sort((a, b) =>
      sortMediaItems(a, b, deferredSortField, deferredSortDirection)
    );
  }, [
    items,
    deferredTypeFilter,
    deferredStatusFilter,
    deferredRatingFilter,
    deferredSearchQuery,
    deferredSortField,
    deferredSortDirection,
  ]);

  const sections = useMemo(() => {
    if (deferredSortField === 'status') {
      return groupConsecutive(visibleItems, (item) =>
        statusSectionKey(item, deferredTypeFilter)
      );
    }
    if (deferredSortField === 'months') {
      return groupConsecutive(visibleItems, finishedMonthKey, formatFinishedMonthLabel);
    }
    if (deferredSortField === 'rating') {
      return groupConsecutive(
        visibleItems,
        ratingSectionKey,
        formatRatingLabel,
        (item) => item.rating
      );
    }
    if (deferredSortField === 'last_played') {
      return groupConsecutive(visibleItems, lastPlayedSectionKey, formatLastPlayedLabel);
    }
    return null;
  }, [visibleItems, deferredSortField, deferredTypeFilter]);

  const errorMessage = getApiErrorMessage(error, 'Failed to fetch media entries');
  const hideStatus = deferredSortField === 'status';
  const showBusy = isLoading || isFetching || isFilterPending;

  const handleItemClick = useCallback(
    (item: MediaItem) => {
      dispatch(openEditMediaModal(item));
    },
    [dispatch]
  );

  return (
    <>
      <LibraryToolbar />

      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMessage}
        </Alert>
      )}

      <Box sx={{ position: 'relative', minHeight: isLoading ? 240 : undefined }}>
        {showBusy && (
          <Box
            sx={{
              position: isLoading ? 'relative' : 'absolute',
              inset: isLoading ? undefined : 0,
              zIndex: 2,
              display: 'flex',
              justifyContent: 'center',
              alignItems: isLoading ? 'center' : 'flex-start',
              pt: isLoading ? 0 : 3,
              py: isLoading ? 8 : undefined,
              pointerEvents: 'none',
              backgroundColor: isLoading
                ? 'transparent'
                : 'rgba(0, 0, 0, 0.18)',
              borderRadius: 2,
            }}
          >
            <CircularProgress size={isLoading ? 40 : 28} />
          </Box>
        )}

        {!isLoading && !isError && (
          <Box
            sx={{
              opacity: isFilterPending || isFetching ? 0.55 : 1,
              transition: 'opacity 0.15s ease',
            }}
          >
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
          </Box>
        )}
      </Box>
    </>
  );
}
