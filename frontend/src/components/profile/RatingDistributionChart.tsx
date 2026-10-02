'use client';

import { Box, Tooltip, Typography } from '@mui/material';
import { SectionDivider } from '@/components/common/SectionDivider';
import { StarRating } from '@/components/common/StarRating';
import { palette } from '@/lib/palette';
import type { RatingBucket } from '@/types/profile';
import { RATING_SECTION_LABELS, toStars } from '@/utils/rating';

interface RatingDistributionChartProps {
  distribution: RatingBucket[];
}

/** Interactive bar chart of rating distribution (DB ratings 1–10)
 * 
 * @param props.distribution - Histogram buckets from profile stats
 * @returns Compact vertical bar chart section
 */
export function RatingDistributionChart({
  distribution,
}: RatingDistributionChartProps) {

  // Find the maximum count of ratings
  const maxCount = Math.max(0, ...distribution.map((bucket) => bucket.count));
  const hasAny = maxCount > 0;

  return (
    <Box>
      <SectionDivider label="Rating distribution" />

      {!hasAny ? (
        <Typography variant="body2" color="text.secondary">
          No ratings yet.
        </Typography>
      ) : (
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'flex-end',
            gap: '2px',
            height: 160,
            px: 1.25,
            pt: 1,
            pb: 1,
            borderRadius: 2,
            border: `1px solid ${palette.border}`,
            backgroundColor: palette.surface,
          }}
        >
          
          {/* Render a bar for each rating bucket */}
          {distribution.map((bucket) => {
            const stars = toStars(bucket.rating) ?? 0;
            const label = RATING_SECTION_LABELS[stars] ?? `${stars} stars`;
            const heightPct = maxCount === 0 ? 0 : (bucket.count / maxCount) * 100;

            // Render a tooltip for the rating and count
            return (
              <Tooltip
                key={bucket.rating}
                arrow
                placement="top"
                enterDelay={80}
                title={
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 0.5,
                      py: 0.25,
                      px: 0.5,
                    }}
                  >
                    <StarRating value={bucket.rating} readOnly size="small" />
                    <Typography
                      variant="caption"
                      sx={{ color: palette.textOnDark, lineHeight: 1.2 }}
                    >
                      {bucket.count} · {label}
                    </Typography>
                  </Box>
                }
                slotProps={{
                  tooltip: {
                    sx: {
                      backgroundColor: palette.surfaceElevated,
                      border: `1px solid ${palette.border}`,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
                      maxWidth: 'none',
                    },
                  },
                  arrow: {
                    sx: {
                      color: palette.surfaceElevated,
                      '&::before': {
                        border: `1px solid ${palette.border}`,
                        backgroundColor: palette.surfaceElevated,
                        boxSizing: 'border-box',
                      },
                    },
                  },
                }}
              >
                <Box
                  sx={{
                    width: 32,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    height: '100%',
                    cursor: 'pointer',
                    '&:hover .rating-bar': {
                      filter: 'brightness(1.15)',
                      transform: 'scaleX(1.2) scaleY(1.04)',
                    },
                  }}
                >
                  <Box
                    className="rating-bar"
                    sx={{
                      width: 24,
                      height: `${Math.max(heightPct, bucket.count > 0 ? 6 : 2)}%`,
                      minHeight: bucket.count > 0 ? 6 : 2,
                      borderRadius: '3px 3px 1px 1px',
                      backgroundColor:
                        bucket.count > 0 ? palette.primary : palette.borderMuted,
                      transformOrigin: 'bottom center',
                      transition: 'height 0.2s ease, filter 0.15s ease, transform 0.15s ease',
                    }}
                  />
                </Box>
              </Tooltip>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
