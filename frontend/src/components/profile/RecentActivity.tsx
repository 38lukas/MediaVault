'use client';

import { Box } from '@mui/material';
import { SectionDivider } from '@/components/common/SectionDivider';
import { MediaGrid } from '@/components/media/MediaGrid';
import { useAppDispatch } from '@/redux/hooks';
import { openEditMediaModal } from '@/redux/slices/mediaModalSlice';
import type { MediaItem } from '@/types/media';

interface RecentActivityProps {
  items: MediaItem[];
}

/** Up to eight most recently played / watched / read media cards
 * 
 * @param props.items - Recently active entries from profile stats
 * @returns Recent activities section with MediaGrid
 */ 
export function RecentActivity({ items }: RecentActivityProps) {
  const dispatch = useAppDispatch();

  return (
    <Box>
      <SectionDivider label="Recent Activities" />
      <MediaGrid
        items={items}
        cardSize={1}
        emptyMessage="No recent activity yet."
        onItemClick={(item) => dispatch(openEditMediaModal(item))}
      />
    </Box>
  );
}
