'use client';

import { Box } from '@mui/material';
import { SectionDivider } from '@/components/common/SectionDivider';
import { MediaGrid } from '@/components/media/MediaGrid';
import { useAppDispatch } from '@/redux/hooks';
import { openEditMediaModal } from '@/redux/libraryUiSlice';
import type { MediaItem } from '@/types/media';

interface RecentlyFinishedProps {
  items: MediaItem[];
}

/** Up to eight recently finished media cards
 * 
 * @param props.items - Recently finished entries from profile stats
 * @returns Recently finished section with MediaGrid
 */ 
export function RecentlyFinished({ items }: RecentlyFinishedProps) {
  const dispatch = useAppDispatch();

  return (
    <Box>
      <SectionDivider label="Recently finished" />
      <MediaGrid
        items={items}
        cardSize={1}
        emptyMessage="No recently finished media yet."
        onItemClick={(item) => dispatch(openEditMediaModal(item))}
      />
    </Box>
  );
}
