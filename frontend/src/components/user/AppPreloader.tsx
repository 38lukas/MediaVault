'use client';

import type { ReactNode } from 'react';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { useAppPreload } from './useAppPreload';

// Shows a loading screen while the app's data is fetched and cached, then renders the app.
export function AppPreloader({
  username,
  viewingAs,
  children,
}: {
  username: string;
  viewingAs: string | null;
  children: ReactNode;
}) {
  const { ready, progress } = useAppPreload(username, viewingAs);

  if (!ready) {
    return (
      <LoadingScreen
        message={viewingAs ? `Loading ${viewingAs}'s library…` : 'Loading your library…'}
        progress={progress}
      />
    );
  }
  return <>{children}</>;
}
