'use client';

import { startTransition, useEffect, useState } from 'react';
import { PageLoader } from '@/components/common/PageLoader';
import { LibraryView } from '@/components/library/LibraryView';

// Library page listing the user's media collection.
// The (heavy) library mounts in a transition after the first paint: the page switches immediately with a
// spinner, and React renders the library in small slices so the spinner keeps animating meanwhile.
export default function LibraryPage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => startTransition(() => setReady(true)));
    return () => cancelAnimationFrame(frame);
  }, []);

  return ready ? <LibraryView /> : <PageLoader />;
}
