'use client';

import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import Image from 'next/image';

export interface MediaItem {
  id: number;
  title: string;
  type: string; 
  status: string; 
  cover_url?: string;
  rating?: number;
}

interface MediaCardProps {
  item: MediaItem;
  onClick?: () => void;
}
export const MediaCard: React.FC<MediaCardProps> = ({ item, onClick }) => {
  const fallbackImage = 'https://via.placeholder.com/300x450?text=No+Cover';

  // Function to determine the background and text color based on the status
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {

      case 'watching':
      case 'playing':
        return { bg: '#0288d1', color: '#ffffff' };

      case 'finished':
        return { bg: '#2e7d32', color: '#ffffff' };

      case 'dropped':
        return { bg: '#d32f2f', color: '#ffffff' };

      case 'shelved':
        return { bg: '#ed6c02', color: '#ffffff' };

      case 'backlog':
      case 'wishlist':
      case 'watchlist':
        return { bg: '#424242', color: '#ffffff' };

      default:
        return { bg: '#616161', color: '#ffffff' };
    }
  };

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
      {/* 1. Poster Container */}
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
          src={item.cover_url || fallbackImage}
          alt={item.title}
          fill
          sizes="(max-width: 600px) 50vw, (max-width: 900px) 33vw, 20vw"
          style={{ objectFit: 'cover' }}
        />

        {/* Hover-Overlay: Titel & Typ */}
        <Box
          className="media-card-overlay"
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0) 100%)',
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
            {item.type}
          </Typography>
        </Box>
      </Box>

      {/* 2. Dauerhaft sichtbarer Status direkt UNTER der Karte */}
      <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center' }}>
        <Chip
          label={item.status}
          size="small"
          sx={{
            backgroundColor: statusStyle.bg,
            color: statusStyle.color,
            fontWeight: 600,
            fontSize: '0.7rem',
            height: 22,
            borderRadius: '6px',
            textTransform: 'capitalize',
          }}
        />
      </Box>
    </Box>
  );
};