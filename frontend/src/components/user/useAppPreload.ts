'use client';

import { useEffect, useState } from 'react';
import { entriesEndpoints } from '@/redux/api/entriesEndpoints';
import { friendsEndpoints } from '@/redux/api/friendsEndpoints';
import { listsEndpoints } from '@/redux/api/listsEndpoints';
import { profileEndpoints } from '@/redux/api/profileEndpoints';
import { userEndpoints } from '@/redux/api/userEndpoints';
import { useAppDispatch } from '@/redux/hooks';

interface PreloadState {
  ready: boolean;
  progress: number;
}

// The preload result belongs to one viewed library; a different key means it is stale.
interface KeyedPreloadState extends PreloadState {
  key: string;
}

// Fetches and caches everything the main pages need right after login (every media entry included),
// so navigating afterwards is instant.
// The subscriptions stay open for as long as the app is mounted, which keeps the data cached.
// Runs again whenever the viewed library changes (a friend's library, or back to your own), because the
// API cache is reset on those switches.
export function useAppPreload(username: string | null, viewingAs: string | null): PreloadState {
  const dispatch = useAppDispatch();
  const key = `${username ?? ''}|${viewingAs ?? ''}`;
  const [state, setState] = useState<KeyedPreloadState>({ key, ready: false, progress: 0 });

  useEffect(() => {
    if (!username) return;
    let cancelled = false;
    const subscriptions: { unsubscribe: () => void }[] = [];

    const run = async () => {
      const tasks = [
        dispatch(userEndpoints.endpoints.getUserSettings.initiate()),
        dispatch(entriesEndpoints.endpoints.getMediaEntries.initiate()),
        dispatch(profileEndpoints.endpoints.getProfileStats.initiate()),
        dispatch(listsEndpoints.endpoints.getMediaLists.initiate()),
        dispatch(friendsEndpoints.endpoints.getFriends.initiate()),
      ];
      subscriptions.push(...tasks);

      let done = 0;
      const total = tasks.length;
      await Promise.all(
        tasks.map((task) =>
          task
            .then(
              () => undefined,
              () => undefined,
            )
            .then(() => {
              done += 1;
              if (!cancelled) setState({ key, ready: false, progress: (done / total) * 100 });
            }),
        ),
      );
      if (cancelled) return;
      setState({ key, ready: true, progress: 100 });
    };
    void run();

    return () => {
      cancelled = true;
      subscriptions.forEach((subscription) => subscription.unsubscribe());
    };
  }, [dispatch, username, viewingAs, key]);

  // Right after the viewed library changes, the old result must not count as ready.
  return state.key === key ? state : { ready: false, progress: 0 };
}
