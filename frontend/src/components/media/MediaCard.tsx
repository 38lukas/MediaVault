'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import Image from 'next/image';
import ReplayIcon from '@mui/icons-material/Replay';
import { hasRewatch, mediaDisplayTitle, type MediaItem } from '@/types/media';
import { palette } from '@/lib/palette';
import { getStatusColor } from '@/utils/mediaStatus';
import { StarRating } from '@/components/common/StarRating';

export type { MediaItem };

interface MediaCardProps {
  item: MediaItem;
  onClick?: () => void;
}

// Poster card with hover overlay and status-colored outline glow.
export const MediaCard: React.FC<MediaCardProps> = ({ item, onClick }) => {
  const fallbackImage = 'https://via.placeholder.com/300x450?text=No+Cover';
  const statusStyle = getStatusColor(item.status);
  const title = mediaDisplayTitle(item);
  const showRewatchBadge = hasRewatch(item);

  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        cursor: 'pointer',
        transition: 'transform 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          '& .media-card-overlay, & .media-card-rewatch': {
            opacity: 1,
          },
        },
      }}
    >
      <Box
        sx={{
          borderRadius: 2,
          boxShadow: `
            0 0 0 1.5px ${statusStyle.color}55,
            0 0 10px ${statusStyle.color}40,
            0 0 22px ${statusStyle.color}28,
            0 4px 14px rgba(0, 0, 0, 0.35)
          `,
        }}
      >
        <Box
          sx={{
            position: 'relative',
            aspectRatio: '2 / 3',
            borderRadius: 2,
            overflow: 'hidden',
            backgroundColor: palette.paper,
          }}
        >
          <Image
            src={item.poster_path || fallbackImage}
            alt={title}
            fill
            sizes="(max-width: 600px) 50vw, (max-width: 900px) 33vw, 20vw"
            style={{ objectFit: 'cover' }}
          />

          {showRewatchBadge && (
            <Box
              className="media-card-rewatch"
              aria-label="Has rewatch days logged"
              title="Rewatched"
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                zIndex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: palette.primary,
                opacity: 0,
                transition: 'opacity 0.2s ease-in-out',
                pointerEvents: 'none',
                filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.85))',
              }}
            >
              <ReplayIcon sx={{ fontSize: 22 }} />
            </Box>
          )}

          <Box
            className="media-card-overlay"
            sx={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0) 100%)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              p: 1.5,
              opacity: 0,
              transition: 'opacity 0.2s ease-in-out',
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 'bold', color: 'white', lineHeight: 1.2 }}
            >
              {title}
            </Typography>
            <Box
              sx={{
                mt: 0.5,
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                flexWrap: 'wrap',
              }}
            >
              <Typography variant="caption" sx={{ color: 'grey.400' }}>
                {item.media_type}
              </Typography>
              <Box
                sx={{
                  py: 0.15,
                  px: 0.55,
                  borderRadius: 1,
                  backgroundColor: statusStyle.bg,
                  border: `1px solid ${statusStyle.border}`,
                  color: statusStyle.color,
                  fontWeight: 600,
                  fontSize: '0.6rem',
                  letterSpacing: '0.02em',
                  textTransform: 'capitalize',
                  lineHeight: 1.2,
                }}
              >
                {item.status}
              </Box>
            </Box>
            {item.rating != null && (
              <Box sx={{ mt: 0.75 }}>
                <StarRating value={item.rating} readOnly size="small" />
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
