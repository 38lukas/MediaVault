'use client';

import { useCallback, useDeferredValue, useMemo, useState } from 'react';
import { Alert, Box, CircularProgress, Stack, Typography } from '@mui/material';
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
import { useGetMediaEntriesQuery, useGetUserSettingsQuery } from '@/redux/api';
import {
  UNIFIED_STATUS_FILTERS,
  matchesStatusFilters,
  matchesTypeFilter,
  mediaDisplayTitle,
  RATING_FILTER_UNRATED,
  unifiedStatusLabel,
  type MediaItem,
} from '@/types/media';

// Renders filtered/sorted library sections. All entries are preloaded at startup; status sections the user
// did not mark as "expanded" in the settings start collapsed, and their covers are only drawn once expanded.
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
  const { data: settings } = useGetUserSettingsQuery(undefined, { skip: !username });
  // Status sections that start expanded; everything if never configured.
  const expandedLabels: readonly string[] = settings?.library_loaded_statuses ?? UNIFIED_STATUS_FILTERS;

  const typeFilter = useAppSelector((state) => state.libraryUi.typeFilter);
  const statusFilter = useAppSelector((state) => state.libraryUi.statusFilter);
  const ratingFilter = useAppSelector((state) => state.libraryUi.ratingFilter);
  const favoritesOnly = useAppSelector((state) => state.libraryUi.favoritesOnly);
  const sortField = useAppSelector((state) => state.libraryUi.sortField);
  const sortDirection = useAppSelector((state) => state.libraryUi.sortDirection);
  const searchQuery = useAppSelector((state) => state.libraryUi.searchQuery);

  // Defer heavy filter/sort work so toolbar clicks stay responsive.
  const deferredTypeFilter = useDeferredValue(typeFilter);
  const deferredStatusFilter = useDeferredValue(statusFilter);
  const deferredRatingFilter = useDeferredValue(ratingFilter);
  const deferredFavoritesOnly = useDeferredValue(favoritesOnly);
  const deferredSortField = useDeferredValue(sortField);
  const deferredSortDirection = useDeferredValue(sortDirection);
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const isFilterPending =
    deferredTypeFilter !== typeFilter ||
    deferredStatusFilter !== statusFilter ||
    deferredRatingFilter !== ratingFilter ||
    deferredFavoritesOnly !== favoritesOnly ||
    deferredSortField !== sortField ||
    deferredSortDirection !== sortDirection ||
    deferredSearchQuery !== searchQuery;

  const visibleItems = useMemo(() => {
    const query = deferredSearchQuery.trim().toLowerCase();
    const filtered = items.filter((item) => {
      if (!matchesTypeFilter(item.media_type, deferredTypeFilter)) return false;
      if (!matchesStatusFilters(item.status, deferredStatusFilter)) return false;
      if (
        deferredRatingFilter.length > 0 &&
        !deferredRatingFilter.some((rating) =>
          rating === RATING_FILTER_UNRATED ? item.rating == null : item.rating === rating
        )
      ) {
        return false;
      }
      if (deferredFavoritesOnly && !item.is_favorite) return false;
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
    deferredFavoritesOnly,
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

  // Searching or filtering by status/rating/favorites should show its results, so nothing stays collapsed then.
  const showEverything =
    deferredSearchQuery.trim() !== '' ||
    deferredStatusFilter.length > 0 ||
    deferredRatingFilter.length > 0 ||
    deferredFavoritesOnly;

  // The user's own expand/collapse clicks per section; sections without a click follow the default.
  const [collapseOverrides, setCollapseOverrides] = useState<ReadonlyMap<string, boolean>>(
    () => new Map()
  );

  const isCollapsed = useCallback(
    (sectionId: string, statusKey: string | null) => {
      const override = collapseOverrides.get(sectionId);
      if (override !== undefined) return override;
      if (statusKey == null || showEverything) return false;
      return !expandedLabels.includes(unifiedStatusLabel(statusKey));
    },
    [collapseOverrides, showEverything, expandedLabels]
  );

  const toggleSection = useCallback((sectionId: string, collapsedNow: boolean) => {
    setCollapseOverrides((current) => new Map(current).set(sectionId, !collapsedNow));
  }, []);

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
                {sections.map((section) => {
                  const sectionId = `${deferredSortField}:${section.key}`;
                  const collapsed = isCollapsed(sectionId, hideStatus ? section.key : null);
                  return (
                    <Box key={section.key}>
                      {section.label ? (
                        <SectionDivider
                          label={section.label}
                          rating={section.rating}
                          statusStyle={hideStatus}
                          collapsed={collapsed}
                          onLabelClick={() => toggleSection(sectionId, collapsed)}
                          endAction={
                            hideStatus ? (
                              <Typography variant="caption" color="text.secondary">
                                {section.items.length}
                              </Typography>
                            ) : undefined
                          }
                        />
                      ) : null}
                      {!collapsed && (
                        <MediaGrid items={section.items} onItemClick={handleItemClick} />
                      )}
                    </Box>
                  );
                })}
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
