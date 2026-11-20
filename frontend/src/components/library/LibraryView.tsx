'use client';

import { useCallback, useDeferredValue, useMemo, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Stack, Typography } from '@mui/material';
import { MediaGrid } from '@/components/media/MediaGrid';
import { SectionDivider } from '@/components/common/SectionDivider';
import { LibraryToolbar } from '@/components/library/LibraryToolbar';
import { useLibraryEntries } from '@/components/library/useLibraryEntries';
import {
  finishedMonthKey,
  formatFinishedMonthLabel,
  formatLastPlayedLabel,
  formatRatingLabel,
  groupConsecutive,
  lastPlayedSectionKey,
  ratingSectionKey,
  statusSectionKey,
  type LibrarySection,
} from '@/utils/mediaGrouping';
import { getApiErrorMessage } from '@/utils/apiError';
import { getStatusRank, sortMediaItems } from '@/utils/mediaSort';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { openEditMediaModal } from '@/redux/slices/mediaModalSlice';
import { useGetEntryStatusCountsQuery, useGetUserSettingsQuery } from '@/redux/api';
import {
  UNIFIED_STATUS_FILTERS,
  matchesStatusFilter,
  matchesTypeFilter,
  mediaDisplayTitle,
  RATING_FILTER_UNRATED,
  unifiedStatusLabel,
  type MediaItem,
} from '@/types/media';

const ALL_LABELS: readonly string[] = UNIFIED_STATUS_FILTERS;

// A status section as rendered: real entries, or a collapsed placeholder that is loaded on expand.
interface DisplaySection extends LibrarySection {
  // Entries are not loaded (yet); `count` is known from the counts endpoint.
  pending: boolean;
  count: number | null;
}

// Loads only the configured statuses up front; other statuses load when their section is expanded.
export function LibraryView() {
  const dispatch = useAppDispatch();
  const username = useAppSelector((state) => state.auth.username);

  const { data: settings, isLoading: settingsLoading } = useGetUserSettingsQuery(undefined, {
    skip: !username,
  });
  const { data: statusCounts = [], isLoading: countsLoading } = useGetEntryStatusCountsQuery(undefined, {
    skip: !username,
  });

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

  // Statuses (unified labels) the user wants loaded when the library opens; everything if never configured.
  const loadedLabels = useMemo(
    () => ALL_LABELS.filter((label) => (settings?.library_loaded_statuses ?? ALL_LABELS).includes(label)),
    [settings?.library_loaded_statuses],
  );
  // Statuses the user expanded in this visit.
  const [expandedLabels, setExpandedLabels] = useState<ReadonlySet<string>>(() => new Set());

  // Labels that must be loaded regardless of the setting: searching and rating filters need every entry,
  // and an explicit status filter needs that status.
  const forcedLabels = useMemo(() => {
    if (deferredSearchQuery.trim() || deferredRatingFilter != null) return new Set(ALL_LABELS);
    return new Set(deferredStatusFilter ? [unifiedStatusLabel(deferredStatusFilter)] : []);
  }, [deferredSearchQuery, deferredRatingFilter, deferredStatusFilter]);

  const neededLabels = useMemo(
    () =>
      ALL_LABELS.filter(
        (label) => loadedLabels.includes(label) || expandedLabels.has(label) || forcedLabels.has(label),
      ),
    [loadedLabels, expandedLabels, forcedLabels],
  );

  const entries = useLibraryEntries(neededLabels, !username || settingsLoading);
  const items = entries.items;
  const isError = entries.isError;
  const isLoading =
    settingsLoading || countsLoading || loadedLabels.some((label) => entries.byLabel[label]?.isLoading);
  // Sections the user expanded show their own spinner, so only the other labels dim the whole library.
  const isFetching = neededLabels.some(
    (label) => entries.byLabel[label]?.isFetching && !expandedLabels.has(label),
  );

  const visibleItems = useMemo(() => {
    const query = deferredSearchQuery.trim().toLowerCase();
    const filtered = items.filter((item) => {
      if (!matchesTypeFilter(item.media_type, deferredTypeFilter)) return false;
      if (!matchesStatusFilter(item.status, deferredStatusFilter)) return false;
      if (deferredRatingFilter === RATING_FILTER_UNRATED) {
        if (item.rating != null) return false;
      } else if (deferredRatingFilter != null && item.rating !== deferredRatingFilter) {
        return false;
      }
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

  const sectionKeyOfStatus = useCallback(
    (status: string) => (deferredTypeFilter === 'All' ? unifiedStatusLabel(status) : status),
    [deferredTypeFilter],
  );

  // Entry counts per status section for the current type/status filter, known without loading entries.
  const countsByKey = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of statusCounts) {
      if (!matchesTypeFilter(row.media_type, deferredTypeFilter)) continue;
      if (!matchesStatusFilter(row.status, deferredStatusFilter)) continue;
      const key = sectionKeyOfStatus(row.status);
      counts.set(key, (counts.get(key) ?? 0) + row.count);
    }
    return counts;
  }, [statusCounts, deferredTypeFilter, deferredStatusFilter, sectionKeyOfStatus]);

  const neededSet = useMemo(() => new Set(neededLabels), [neededLabels]);

  const sections = useMemo((): DisplaySection[] | null => {
    const plain = (list: LibrarySection[]): DisplaySection[] =>
      list.map((section) => ({ ...section, pending: false, count: null }));

    if (deferredSortField === 'status') {
      const loaded = new Map(
        groupConsecutive(visibleItems, (item) => statusSectionKey(item, deferredTypeFilter)).map(
          (section) => [section.key, section] as const,
        ),
      );
      const keys = new Set<string>([...loaded.keys(), ...countsByKey.keys()]);
      const result: DisplaySection[] = [];
      for (const key of keys) {
        const label = unifiedStatusLabel(key);
        const section = loaded.get(key);
        if (section) {
          result.push({ ...section, pending: false, count: countsByKey.get(key) ?? section.items.length });
        } else if (!neededSet.has(label) || entries.byLabel[label]?.isLoading) {
          // Not loaded (collapsed placeholder) or still loading after being expanded.
          result.push({ key, label: key, items: [], pending: true, count: countsByKey.get(key) ?? null });
        }
      }
      return result.sort((a, b) => {
        const diff = getStatusRank(a.key) - getStatusRank(b.key);
        if (diff !== 0) return deferredSortDirection === 'asc' ? diff : -diff;
        return a.key.localeCompare(b.key);
      });
    }
    if (deferredSortField === 'months') {
      return plain(groupConsecutive(visibleItems, finishedMonthKey, formatFinishedMonthLabel));
    }
    if (deferredSortField === 'rating') {
      return plain(
        groupConsecutive(visibleItems, ratingSectionKey, formatRatingLabel, (item) => item.rating),
      );
    }
    if (deferredSortField === 'last_played') {
      return plain(groupConsecutive(visibleItems, lastPlayedSectionKey, formatLastPlayedLabel));
    }
    return null;
  }, [
    visibleItems,
    deferredSortField,
    deferredSortDirection,
    deferredTypeFilter,
    countsByKey,
    neededSet,
    entries.byLabel,
  ]);

  // Entries of statuses that are not loaded, shown as a hint when the library is not grouped by status.
  const unloadedCount = useMemo(() => {
    let total = 0;
    for (const row of statusCounts) {
      if (!matchesTypeFilter(row.media_type, deferredTypeFilter)) continue;
      if (!neededSet.has(unifiedStatusLabel(row.status))) total += row.count;
    }
    return total;
  }, [statusCounts, deferredTypeFilter, neededSet]);

  const errorMessage = getApiErrorMessage(entries.error, 'Failed to fetch media entries');
  const hideStatus = deferredSortField === 'status';
  const showBusy = isLoading || isFetching || isFilterPending;
  const [collapsedSections, setCollapsedSections] = useState<ReadonlySet<string>>(() => new Set());

  const toggleSection = useCallback(
    (id: string, statusKey: string | null) => {
      const label = statusKey == null ? null : unifiedStatusLabel(statusKey);
      const toggleCollapsed = () =>
        setCollapsedSections((current) => {
          const next = new Set(current);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
        });

      if (label == null) return toggleCollapsed();
      if (!neededSet.has(label)) {
        // Not loaded yet: expanding loads just this status.
        return setExpandedLabels((current) => new Set(current).add(label));
      }
      if (expandedLabels.has(label) && !loadedLabels.includes(label) && !forcedLabels.has(label)) {
        // Expanded by hand: collapsing hides it again.
        return setExpandedLabels((current) => {
          const next = new Set(current);
          next.delete(label);
          return next;
        });
      }
      toggleCollapsed();
    },
    [neededSet, expandedLabels, loadedLabels, forcedLabels],
  );

  const loadAll = useCallback(() => setExpandedLabels(new Set(ALL_LABELS)), []);

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

      {!isLoading && !isError && !hideStatus && unloadedCount > 0 && (
        <Alert
          severity="info"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={loadAll}>
              Load all
            </Button>
          }
        >
          {unloadedCount} {unloadedCount === 1 ? 'entry is' : 'entries are'} not loaded because{' '}
          {unloadedCount === 1 ? 'its' : 'their'} status is not set to load automatically.
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
                  const collapsed = section.pending
                    ? !neededSet.has(unifiedStatusLabel(section.key))
                    : collapsedSections.has(sectionId);
                  const loadingEntries =
                    section.pending && entries.byLabel[unifiedStatusLabel(section.key)]?.isLoading;
                  return (
                    <Box key={section.key}>
                      {section.label ? (
                        <SectionDivider
                          label={section.label}
                          rating={section.rating}
                          statusStyle={hideStatus}
                          collapsed={collapsed}
                          onLabelClick={() =>
                            toggleSection(sectionId, hideStatus ? section.key : null)
                          }
                          endAction={
                            hideStatus && section.count != null ? (
                              <Typography variant="caption" color="text.secondary">
                                {section.count}
                              </Typography>
                            ) : undefined
                          }
                        />
                      ) : null}
                      {loadingEntries && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                          <CircularProgress size={28} />
                        </Box>
                      )}
                      {!collapsed && !section.pending && (
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
