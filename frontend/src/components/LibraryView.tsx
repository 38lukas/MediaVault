'use client';

import { useMemo } from 'react';
import { Alert, Box, CircularProgress, Stack } from '@mui/material';
import { MediaGrid } from '@/components/MediaGrid';
import { MediaList } from '@/components/MediaList';
import { SectionDivider } from '@/components/SectionDivider';
import { LibraryToolbar } from '@/components/LibraryToolbar';
import {
  finishedMonthKey,
  formatFinishedMonthLabel,
  groupConsecutive,
  statusSectionKey,
} from '@/utils/mediaGrouping';
import { sortMediaItems } from '@/utils/mediaSort';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { openEditMediaModal } from '@/redux/libraryUiSlice';
import { useGetMediaEntriesQuery } from '@/redux/mediaApi';
import { matchesTypeFilter, type MediaItem } from '@/types/media';

/**
 * Loads media entries and renders filtered/sorted card or list content.
 * @returns Library body including toolbar, loading, and media sections.
 */
export function LibraryView() {
  const dispatch = useAppDispatch();
  const username = useAppSelector((state) => state.auth.username);
  const { data: items = [], isLoading, isError, error } = useGetMediaEntriesQuery(
    undefined,
    { skip: !username }
  );
  const { viewMode, typeFilter, sortField, sortDirection } =
    useAppSelector((state) => state.libraryUi);

  const visibleItems = useMemo(() => {
    const filtered = items.filter((item) => matchesTypeFilter(item.media_type, typeFilter));

    return filtered.sort((a, b) =>
      sortMediaItems(a, b, sortField, sortDirection)
    );
  }, [items, typeFilter, sortField, sortDirection]);

  const sections = useMemo(() => {
    if (sortField === 'status') {
      return groupConsecutive(visibleItems, statusSectionKey);
    }
    if (sortField === 'months') {
      return groupConsecutive(visibleItems, finishedMonthKey, formatFinishedMonthLabel);
    }
    return null;
  }, [visibleItems, sortField]);

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
      {sections && sections.length > 0 ? (
        <Stack spacing={3}>
          {sections.map((section) => (
            <Box key={section.key}>
              <SectionDivider label={section.label} />
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
