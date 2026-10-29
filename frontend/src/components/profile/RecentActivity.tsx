'use client';

import Link from 'next/link';
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';
import { Box, IconButton } from '@mui/material';
import { SectionDivider } from '@/components/common/SectionDivider';
import { MediaGrid } from '@/components/media/MediaGrid';
import { palette } from '@/lib/palette';
import { useAppDispatch } from '@/redux/hooks';
import { openEditMediaModal } from '@/redux/slices/mediaModalSlice';
import type { MediaItem } from '@/types/media';

interface RecentActivityProps {
  items: MediaItem[];
}

// Recent activity section with a compact media card grid.
export function RecentActivity({ items }: RecentActivityProps) {
  const dispatch = useAppDispatch();

  return (
    <Box>
      <SectionDivider
        label="Recent Activities"
        endAction={
          <IconButton
            component={Link}
            href="/activity"
            size="small"
            aria-label="Show all recent activity"
            sx={{
              p: 0,
              color: palette.textOnDark,
              '&:hover': { backgroundColor: 'transparent', color: palette.textOnDark },
            }}
          >
            <ArrowRightAltIcon sx={{ fontSize: '1.75rem' }} />
          </IconButton>
        }
      />
      <MediaGrid
        items={items}
        cardSize={1}
        emptyMessage="No recent activity yet."
        onItemClick={(item) => dispatch(openEditMediaModal(item))}
      />
    </Box>
  );
}
