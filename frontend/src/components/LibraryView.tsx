'use client';

import { useMemo } from 'react';
import { Alert, Box, CircularProgress, Stack } from '@mui/material';
import { MediaGrid } from '@/components/MediaGrid';
import { MediaList } from '@/components/MediaList';
import { MonthDivider } from '@/components/MonthDivider';
import { LibraryToolbar } from '@/components/LibraryToolbar';
import { groupByFinishedMonth } from '@/lib/mediaGrouping';
import { compareMediaItems } from '@/lib/mediaSort';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { openEditMediaModal } from '@/redux/libraryUiSlice';
import { useGetMediaEntriesQuery } from '@/redux/mediaApi';
import type { MediaItem } from '@/types/media';

/**
 * Loads media entries and renders filtered/sorted card or list content.
 * @returns Library body including toolbar, loading, and media sections.
 */
export function LibraryView() {
  const dispatch = useAppDispatch();
  const { data: items = [], isLoading, isError, error } = useGetMediaEntriesQuery();
  const { viewMode, typeFilter, sortField, sortDirection, groupByFinishedMonth: groupMonths } =
    useAppSelector((state) => state.libraryUi);

  const visibleItems = useMemo(() => {
    const filtered =
      typeFilter === 'All'
        ? [...items]
        : items.filter((item) => item.media_type === typeFilter);

    return filtered.sort((a, b) =>
      compareMediaItems(a, b, sortField, sortDirection)
    );
  }, [items, typeFilter, sortField, sortDirection]);

  const monthSections = useMemo(
    () => (groupMonths ? groupByFinishedMonth(visibleItems) : null),
    [visibleItems, groupMonths]
  );

  const errorMessage =
    error && 'status' in error
      ? `Request failed (${String(error.status)})`
      : error && 'message' in error && error.message
        ? error.message
        : 'Failed to fetch media entries';

  /**
   * Opens the edit modal for a selected media item.
   * @param item - Clicked library entry.
   */
  const handleItemClick = (item: MediaItem) => {
    dispatch(openEditMediaModal(item));
  };

  /**
   * Renders the active layout for a list of items.
   * @param sectionItems - Items for one section (or the full library).
   * @returns Card grid or table list.
   */
  const renderLibrary = (sectionItems: MediaItem[]) =>
    viewMode === 'cards' ? (
      <MediaGrid items={sectionItems} onItemClick={handleItemClick} />
    ) : (
      <MediaList items={sectionItems} onItemClick={handleItemClick} />
    );

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
      {monthSections && monthSections.length > 0 ? (
        <Stack spacing={3}>
          {monthSections.map((section) => (
            <Box key={section.key}>
              <MonthDivider label={section.label} />
              {renderLibrary(section.items)}
            </Box>
          ))}
        </Stack>
      ) : (
        renderLibrary(visibleItems)
      )}
    </>
  );
}
