'use client';

import { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { StarRating } from '@/components/common/StarRating';
import { palette } from '@/lib/palette';
import { isGameType, mediaDisplayTitle, type MediaItem } from '@/types/media';

interface ActivityLogListProps {
  items: MediaItem[];
  onItemClick: (item: MediaItem) => void;
}

interface ActivityRow {
  item: MediaItem;
  dateKey: string;
  day: number;
  label: string;
}

interface ActivityMonth {
  key: string;
  label: string;
  rows: ActivityRow[];
}

function dateKeyOf(value: string | null | undefined): string | null {
  if (!value) return null;
  const key = value.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(key) ? key : null;
}

function lastLoggedDay(item: MediaItem): string | null {
  let latest: string | null = null;
  const consider = (key: string | null) => {
    if (key && (latest == null || key > latest)) latest = key;
  };
  for (const raw of item.played_dates ?? []) consider(dateKeyOf(raw));
  consider(dateKeyOf(item.started_at));
  consider(dateKeyOf(item.finished_at));
  return latest;
}

function replayWord(mediaType: string): string {
  if (isGameType(mediaType)) return 'Replayed';
  return mediaType === 'Book' ? 'Reread' : 'Rewatched';
}

function simpleLogWord(mediaType: string): string {
  if (isGameType(mediaType)) return 'Played';
  return mediaType === 'Book' ? 'Read' : 'Watched';
}

function logLabel(item: MediaItem, day: string): string {
  const parts: string[] = [];
  if (dateKeyOf(item.started_at) === day) parts.push('Started');
  if (dateKeyOf(item.finished_at) === day) parts.push('Finished');
  if ((item.rewatch_dates ?? []).some((raw) => dateKeyOf(raw) === day)) {
    parts.push(replayWord(item.media_type));
  }
  return parts.length > 0 ? parts.join(' · ') : simpleLogWord(item.media_type);
}

function monthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleString('en', {
    month: 'long',
    year: 'numeric',
  });
}

function formatPlaytime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours && rest) return `${hours}h ${rest}m`;
  if (hours) return `${hours}h`;
  return `${rest}m`;
}

function groupByMonth(items: MediaItem[]): ActivityMonth[] {
  const rows: ActivityRow[] = [];
  for (const item of items) {
    const dateKey = lastLoggedDay(item);
    if (!dateKey) continue;
    rows.push({
      item,
      dateKey,
      day: Number(dateKey.slice(8, 10)),
      label: logLabel(item, dateKey),
    });
  }
  rows.sort(
    (a, b) =>
      b.dateKey.localeCompare(a.dateKey) ||
      mediaDisplayTitle(a.item).localeCompare(mediaDisplayTitle(b.item)),
  );

  const months: ActivityMonth[] = [];
  for (const row of rows) {
    const key = row.dateKey.slice(0, 7);
    const current = months[months.length - 1];
    if (current?.key === key) current.rows.push(row);
    else months.push({ key, label: monthLabel(key), rows: [row] });
  }
  return months;
}

// Full activity history: one row per title, grouped by the month it was last logged.
export function ActivityLogList({ items, onItemClick }: ActivityLogListProps) {
  const months = useMemo(() => groupByMonth(items), [items]);

  if (months.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ py: 2 }}>
        No recent activity yet.
      </Typography>
    );
  }

  return (
    <Box>
      {months.map((month, index) => (
        <Box key={month.key} sx={{ mt: index === 0 ? 0 : 2.5 }}>
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 700, letterSpacing: 0.3, mb: 0.5 }}
          >
            {month.label}
          </Typography>
          {month.rows.map((row) => {
            const title = mediaDisplayTitle(row.item);
            const game = isGameType(row.item.media_type);
            const platform = game ? row.item.platform_played_on : null;
            const playtime =
              game && row.item.playtime != null ? formatPlaytime(row.item.playtime) : null;
            return (
              <Box
                key={row.item.id}
                onClick={() => onItemClick(row.item)}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '28px 36px minmax(0, 1fr) 13rem 6.5rem 18rem',
                  columnGap: 2,
                  alignItems: 'center',
                  width: '100%',
                  px: 0.5,
                  py: 0.85,
                  borderBottom: `1px solid ${palette.borderMuted}`,
                  cursor: 'pointer',
                  '&:hover': { backgroundColor: palette.selectedBg },
                }}
              >
                <Typography
                  component="span"
                  sx={{
                    width: 28,
                    flexShrink: 0,
                    textAlign: 'right',
                    fontWeight: 700,
                    fontVariantNumeric: 'tabular-nums',
                    color: 'text.secondary',
                  }}
                >
                  {row.day}
                </Typography>
                <Box
                  sx={{
                    width: 36,
                    height: 54,
                    flexShrink: 0,
                    borderRadius: 0.75,
                    overflow: 'hidden',
                    backgroundColor: palette.paper,
                  }}
                >
                  {row.item.poster_path ? (
                    <Box
                      component="img"
                      src={row.item.poster_path}
                      alt=""
                      draggable={false}
                      sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                      }}
                    >
                      {title.slice(0, 1)}
                    </Box>
                  )}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography noWrap sx={{ fontWeight: 600, lineHeight: 1.3 }}>
                    {title}
                  </Typography>
                  <Box sx={{ mt: 0.25, minHeight: 20 }}>
                    {row.item.rating != null ? (
                      <StarRating value={row.item.rating} readOnly size="small" />
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        Unrated
                      </Typography>
                    )}
                  </Box>
                </Box>
                <Typography variant="body2" sx={{ pl: 1 }}>
                  {platform}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {playtime}
                </Typography>
                <Typography
                  component="span"
                  sx={{
                    textAlign: 'right',
                    whiteSpace: 'nowrap',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    color: palette.primary,
                  }}
                >
                  {row.label}
                </Typography>
              </Box>
            );
          })}
        </Box>
      ))}
    </Box>
  );
}
