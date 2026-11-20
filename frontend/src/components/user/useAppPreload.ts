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

// Fetches and caches everything the main pages need right after login (every media entry included),
// so navigating afterwards is instant.
// The subscriptions stay open for as long as the app is mounted, which keeps the data cached.
export function useAppPreload(username: string | null): PreloadState {
  const dispatch = useAppDispatch();
  const [state, setState] = useState<PreloadState>({ ready: false, progress: 0 });

  useEffect(() => {
    if (!username) return;
    let cancelled = false;
    const subscriptions: { unsubscribe: () => void }[] = [];
    setState({ ready: false, progress: 0 });

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
              if (!cancelled) setState({ ready: false, progress: (done / total) * 100 });
            }),
        ),
      );
      if (cancelled) return;
      setState({ ready: true, progress: 100 });
    };
    void run();

    return () => {
      cancelled = true;
      subscriptions.forEach((subscription) => subscription.unsubscribe());
    };
  }, [dispatch, username]);

  return state;
}
