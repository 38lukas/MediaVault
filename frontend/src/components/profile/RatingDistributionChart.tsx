'use client';

import { useState, type KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Tooltip, Typography } from '@mui/material';
import { StarRating } from '@/components/common/StarRating';
import { palette } from '@/lib/palette';
import { useAppDispatch } from '@/redux/hooks';
import { showOnlyRating, showOnlyUnrated } from '@/redux/slices/libraryUiSlice';
import type { RatingBucket } from '@/types/profile';
import { RATING_SECTION_LABELS, UNRATED_SECTION_LABEL, toStars } from '@/utils/rating';

interface RatingDistributionChartProps {
  distribution: RatingBucket[];
  unratedCount: number;
}

function RatingBar({
  count,
  maxCount,
  clickable,
  ariaLabel,
  tooltipLabel,
  onActivate,
  barColor,
}: {
  count: number;
  maxCount: number;
  clickable: boolean;
  ariaLabel: string;
  tooltipLabel: string;
  onActivate: () => void;
  barColor: string;
}) {
  const heightPct = maxCount === 0 ? 0 : (count / maxCount) * 100;

  return (
    <Tooltip
      arrow
      placement="top"
      enterDelay={80}
      title={
        <Typography
          variant="caption"
          sx={{ color: palette.textOnDark, lineHeight: 1.2 }}
        >
          {count} · {tooltipLabel}
        </Typography>
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
        {...(clickable && {
          role: 'button',
          tabIndex: 0,
          'aria-label': ariaLabel,
          onClick: onActivate,
          onKeyDown: (event: KeyboardEvent) => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            onActivate();
          },
        })}
        sx={{
          width: 32,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-end',
          height: '100%',
          cursor: clickable ? 'pointer' : 'default',
          outline: 'none',
          '&:hover .rating-bar, &:focus-visible .rating-bar': clickable
            ? {
                filter: 'brightness(1.15)',
                transform: 'scaleX(1.2) scaleY(1.04)',
              }
            : undefined,
        }}
      >
        <Box
          className="rating-bar"
          sx={{
            width: 24,
            height: `${Math.max(heightPct, count > 0 ? 6 : 2)}%`,
            minHeight: count > 0 ? 6 : 2,
            borderRadius: '3px 3px 1px 1px',
            backgroundColor: count > 0 ? barColor : palette.borderMuted,
            transformOrigin: 'bottom center',
            transition: 'height 0.2s ease, filter 0.15s ease, transform 0.15s ease',
          }}
        />
      </Box>
    </Tooltip>
  );
}

// Interactive bar chart of rating distribution (DB ratings 1–10).
export function RatingDistributionChart({
  distribution,
  unratedCount,
}: RatingDistributionChartProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [showUnrated, setShowUnrated] = useState(false);

  const openLibraryForRating = (rating: number) => {
    dispatch(showOnlyRating(rating));
    router.push('/library');
  };

  const openLibraryForUnrated = () => {
    dispatch(showOnlyUnrated());
    router.push('/library');
  };

  const ratedMax = Math.max(0, ...distribution.map((bucket) => bucket.count));
  const hasRated = ratedMax > 0;
  const hasUnrated = unratedCount > 0;

  if (!hasRated && !hasUnrated) {
    return (
      <Typography variant="body2" color="text.secondary">
        No ratings yet.
      </Typography>
    );
  }

  const maxCount = Math.max(ratedMax, showUnrated ? unratedCount : 0);

  return (
    <Box sx={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start' }}>
      {hasUnrated && (
        <Typography
          component="button"
          type="button"
          variant="caption"
          onClick={() => setShowUnrated((visible) => !visible)}
          sx={{
            mb: 0.75,
            ml: 0.5,
            p: 0,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            color: 'text.secondary',
            textDecoration: 'none',
            font: 'inherit',
            '&:hover': { color: 'text.primary' },
          }}
        >
          {showUnrated ? 'hide unrated' : 'show unrated'}
        </Typography>
      )}

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
        {showUnrated && hasUnrated && (
          <RatingBar
            count={unratedCount}
            maxCount={maxCount}
            clickable={unratedCount > 0}
            ariaLabel="Show unrated media in the library"
            tooltipLabel={UNRATED_SECTION_LABEL}
            onActivate={openLibraryForUnrated}
            barColor="rgba(255,255,255,0.45)"
          />
        )}

        {distribution.map((bucket) => {
          const stars = toStars(bucket.rating) ?? 0;
          const label = RATING_SECTION_LABELS[stars] ?? `${stars} stars`;
          const clickable = bucket.count > 0;

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
                {...(clickable && {
                  role: 'button',
                  tabIndex: 0,
                  'aria-label': `Show media rated ${stars} stars in the library`,
                  onClick: () => openLibraryForRating(bucket.rating),
                  onKeyDown: (event: KeyboardEvent) => {
                    if (event.key !== 'Enter' && event.key !== ' ') return;
                    event.preventDefault();
                    openLibraryForRating(bucket.rating);
                  },
                })}
                sx={{
                  width: 32,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  height: '100%',
                  cursor: clickable ? 'pointer' : 'default',
                  outline: 'none',
                  '&:hover .rating-bar, &:focus-visible .rating-bar': {
                    filter: 'brightness(1.15)',
                    transform: 'scaleX(1.2) scaleY(1.04)',
                  },
                }}
              >
                <Box
                  className="rating-bar"
                  sx={{
                    width: 24,
                    height: `${Math.max(
                      maxCount === 0 ? 0 : (bucket.count / maxCount) * 100,
                      bucket.count > 0 ? 6 : 2
                    )}%`,
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
    </Box>
  );
}
