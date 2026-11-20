'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Box } from '@mui/material';
import { palette } from '@/lib/palette';

// Start building content this far before it scrolls into view, so scrolling never shows empty slots.
const ROOT_MARGIN = '900px 0px';

// One observer shared by every LazyMount instead of one per card.
const callbacks = new WeakMap<Element, () => void>();
let sharedObserver: IntersectionObserver | null = null;

function getObserver(): IntersectionObserver {
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          callbacks.get(entry.target)?.();
          callbacks.delete(entry.target);
          sharedObserver?.unobserve(entry.target);
        }
      },
      { rootMargin: ROOT_MARGIN },
    );
  }
  return sharedObserver;
}

interface LazyMountProps {
  children: ReactNode;
  // Render immediately (first screenful) instead of waiting for the observer.
  eager?: boolean;
  // Placeholder width / height ratio, so the layout does not jump when the content mounts.
  aspectRatio?: string;
}

// Renders its children only once they are near the viewport; until then a same-sized placeholder keeps the
// layout. Once mounted, the content stays mounted.
export function LazyMount({ children, eager = false, aspectRatio = '2 / 3' }: LazyMountProps) {
  const [visible, setVisible] = useState(eager || typeof IntersectionObserver === 'undefined');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visible) return;
    const element = ref.current;
    if (!element) return;
    const observer = getObserver();
    callbacks.set(element, () => setVisible(true));
    observer.observe(element);
    return () => {
      observer.unobserve(element);
      callbacks.delete(element);
    };
  }, [visible]);

  if (visible) return <>{children}</>;
  return (
    <Box
      ref={ref}
      sx={{ width: '100%', aspectRatio, borderRadius: 2, backgroundColor: palette.paper, opacity: 0.4 }}
    />
  );
}
