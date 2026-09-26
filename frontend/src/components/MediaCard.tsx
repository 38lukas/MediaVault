'use client';

import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import Image from 'next/image';

// Typ-Definition für das Medium (an dein Backend angepasst)
export interface MediaItem {
  id: number;
  title: string;
  type: string; // Movie, Series, Anime
  status: string; // Completed, Watching, Backlog
  cover_url?: string; // URL zum Poster/Cover-Bild
  rating?: number; // 1-5
}

interface MediaCardProps {
  item: MediaItem;
  onClick?: () => void;
}

export const MediaCard: React.FC<MediaCardProps> = ({ item, onClick }) => {
  // Fallback, falls mal kein Cover hinterlegt ist
  const fallbackImage = 'https://via.placeholder.com/300x450?text=No+Cover';

  return (
    <Paper
      elevation={3}
      onClick={onClick}
      sx={{
        position: 'relative',
        aspectRatio: '2 / 3', // Klassisches Poster-Seitenverhältnis
        borderRadius: 2,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: 'scale(1.04)',
          boxShadow: 8,
          '& .media-card-overlay': {
            opacity: 1,
          },
        },
      }}
    >
      {/* Poster Bild */}
      <Image
        src={item.cover_url || fallbackImage}
        alt={item.title}
        fill
        sizes="(max-width: 600px) 50vw, (max-width: 900px) 33vw, 20vw"
        style={{ objectFit: 'cover' }}
      />

      {/* Hover Overlay mit Titel & Infos */}
      <Box
        className="media-card-overlay"
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          top: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0) 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          p: 1.5,
          opacity: 0,
          transition: 'opacity 0.2s ease-in-out',
          color: 'white',
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>
          {item.title}
        </Typography>
        <Typography variant="caption" sx={{ color: 'grey.400', mt: 0.5 }}>
          {item.type} • {item.status}
        </Typography>
      </Box>
    </Paper>
  );
};