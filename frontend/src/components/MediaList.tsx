'use client';

import React from 'react';
import {
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import Image from 'next/image';
import type { MediaItem } from '@/types/media';
import { getStatusColor } from '@/lib/mediaStatus';
import { palette } from '@/lib/palette';
import { formatDisplayDate } from '@/lib/dateUtils';

interface MediaListProps {
  items: MediaItem[];
  onItemClick?: (item: MediaItem) => void;
}

/**
 * Spreadsheet-style table layout for the library.
 * @param props.items - Media entries to display.
 * @param props.onItemClick - Optional row click handler.
 * @returns Table of media rows, or an empty state.
 */
export const MediaList: React.FC<MediaListProps> = ({ items, onItemClick }) => {
  if (items.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary">
          Keine Medien gefunden.
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        overflowX: 'auto',
      }}
    >
      <Table size="small" sx={{ minWidth: 720 }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: 72 }}>Cover</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Started</TableCell>
            <TableCell>Finished</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item) => {
            const statusStyle = getStatusColor(item.status);
            return (
              <TableRow
                key={item.id}
                hover
                onClick={() => onItemClick?.(item)}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell>
                  <Box
                    sx={{
                      position: 'relative',
                      width: 40,
                      height: 60,
                      borderRadius: 1,
                      overflow: 'hidden',
                      backgroundColor: palette.paper,
                    }}
                  >
                    <Image
                      src={
                        item.poster_path ||
                        'https://via.placeholder.com/300x450?text=No+Cover'
                      }
                      alt={item.title}
                      fill
                      sizes="40px"
                      style={{ objectFit: 'cover' }}
                    />
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {item.title}
                  </Typography>
                </TableCell>
                <TableCell>{item.media_type}</TableCell>
                <TableCell>
                  <Chip
                    label={item.status}
                    size="small"
                    sx={{
                      backgroundColor: statusStyle.bg,
                      border: `1px solid ${statusStyle.border}`,
                      color: statusStyle.color,
                      fontWeight: 600,
                      fontSize: '0.7rem',
                      height: 22,
                      borderRadius: '6px',
                      textTransform: 'capitalize',
                    }}
                  />
                </TableCell>
                <TableCell>{formatDisplayDate(item.started_at)}</TableCell>
                <TableCell>{formatDisplayDate(item.finished_at)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
