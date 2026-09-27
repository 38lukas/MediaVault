'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import Image from 'next/image';
import type { MediaItem } from '@/types/media';
import { getStatusColor } from '@/lib/mediaStatus';

export type { MediaItem };

interface MediaCardProps {
  item: MediaItem;
  onClick?: () => void;
}

/**
 * Poster card with hover overlay and full-width status bar.
 * @param props.item - Media entry to render.
 * @param props.onClick - Optional click handler (opens edit modal).
 * @returns Interactive media card.
 */
export const MediaCard: React.FC<MediaCardProps> = ({ item, onClick }) => {
  const fallbackImage = 'https://via.placeholder.com/300x450?text=No+Cover';
  const statusStyle = getStatusColor(item.status);

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
          '& .media-card-overlay': {
            opacity: 1,
          },
        },
      }}
    >
      <Box
        sx={{
          position: 'relative',
          aspectRatio: '2 / 3',
          borderRadius: 2,
          overflow: 'hidden',
          boxShadow: 3,
          backgroundColor: '#1e1e1e',
        }}
      >
        <Image
          src={item.poster_path || fallbackImage}
          alt={item.title}
          fill
          sizes="(max-width: 600px) 50vw, (max-width: 900px) 33vw, 20vw"
          style={{ objectFit: 'cover' }}
        />

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
            {item.title}
          </Typography>
          <Typography variant="caption" sx={{ color: 'grey.400', mt: 0.5 }}>
            {item.media_type}
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          mt: 1,
          width: '100%',
          py: 0.6,
          px: 1,
          borderRadius: 1.5,
          backgroundColor: statusStyle.bg,
          border: `1px solid ${statusStyle.border}`,
          color: statusStyle.color,
          textAlign: 'center',
          fontWeight: 600,
          fontSize: '0.7rem',
          letterSpacing: '0.02em',
          textTransform: 'capitalize',
          lineHeight: 1.2,
        }}
      >
        {item.status}
      </Box>
    </Box>
  );
};
