'use client';

import { useEffect, useMemo } from 'react';
import { shallowEqual } from 'react-redux';
import { entriesEndpoints } from '@/redux/api';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import type { MediaItem } from '@/types/media';

type LabelSelector = ReturnType<typeof entriesEndpoints.endpoints.getMediaEntriesByStatus.select>;

// One stable selector per label, so the selected cache entries keep their identity between store updates.
const selectors = new Map<string, LabelSelector>();
function selectorFor(label: string): LabelSelector {
  let selector = selectors.get(label);
  if (!selector) {
    selector = entriesEndpoints.endpoints.getMediaEntriesByStatus.select(label);
    selectors.set(label, selector);
  }
  return selector;
}

export interface LabelLoadState {
  isLoading: boolean;
  isFetching: boolean;
}

interface LibraryEntries {
  items: MediaItem[];
  byLabel: Record<string, LabelLoadState>;
  isError: boolean;
  error: unknown;
}

// Loads entries for only the given unified status labels (each cached on its own) and merges them.
// A label that is added later is fetched on its own; the already loaded labels are not requested again.
export function useLibraryEntries(labels: readonly string[], skip: boolean): LibraryEntries {
  const dispatch = useAppDispatch();
  const labelKey = labels.join('|');

  useEffect(() => {
    if (skip) return;
    const subscriptions = labelKey
      ? labelKey
          .split('|')
          .map((label) => dispatch(entriesEndpoints.endpoints.getMediaEntriesByStatus.initiate(label)))
      : [];
    return () => subscriptions.forEach((subscription) => subscription.unsubscribe());
  }, [dispatch, labelKey, skip]);

  const results = useAppSelector(
    (state) => (labelKey ? labelKey.split('|').map((label) => selectorFor(label)(state)) : []),
    shallowEqual,
  );

  return useMemo(() => {
    const items: MediaItem[] = [];
    const byLabel: Record<string, LabelLoadState> = {};
    let error: unknown;
    const names = labelKey ? labelKey.split('|') : [];
    results.forEach((result, index) => {
      if (result.data) items.push(...result.data);
      if (result.error) error ??= result.error;
      byLabel[names[index]] = {
        // Nothing to show yet: never requested, or the first request is still running.
        isLoading: !skip && !result.data && !result.error,
        isFetching: result.status === 'pending',
      };
    });
    return { items, byLabel, isError: error !== undefined, error };
  }, [results, labelKey, skip]);
}
