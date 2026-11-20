'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { resolveApiBaseUrl } from '@/redux/api';

const RETRY_MS = 3000;
const REQUEST_TIMEOUT_MS = 8000;
// Quick checks finish before this, so a healthy backend never flashes the notice.
const NOTICE_DELAY_MS = 600;

// The health route lives next to /api, not under it.
function healthUrl(): string {
  return `${resolveApiBaseUrl().replace(/\/api$/i, '')}/health`;
}

// Waits until the backend answers (it may be starting up) and shows "Preparing backend" meanwhile.
export function BackendGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [showNotice, setShowNotice] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let retryTimer: number | undefined;
    const noticeTimer = window.setTimeout(() => setShowNotice(true), NOTICE_DELAY_MS);

    const check = async () => {
      try {
        const response = await fetch(healthUrl(), {
          cache: 'no-store',
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
        if (response.ok) {
          if (!cancelled) setReady(true);
          return;
        }
      } catch {
        // Unreachable or still starting: retry below.
      }
      if (!cancelled) retryTimer = window.setTimeout(check, RETRY_MS);
    };
    void check();

    return () => {
      cancelled = true;
      window.clearTimeout(noticeTimer);
      window.clearTimeout(retryTimer);
    };
  }, []);

  if (ready) return <>{children}</>;
  if (!showNotice) return null;
  return (
    <LoadingScreen
      message="Preparing backend…"
      detail="The server is starting up. This can take a moment."
    />
  );
}
