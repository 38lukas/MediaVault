'use client';

import { useState } from 'react';
import { Box, Button, MenuItem, Select, Stack, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { palette } from '@/lib/palette';
import { isGameType } from '@/types/media';
import { buildMonthGrid, toDateKey } from '@/utils/calendar';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { togglePlayedDate } from '@/redux/slices/mediaModalSlice';
import { fieldSx } from '../constants';

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const MONTHS = Array.from({ length: 12 }, (_, month) =>
  new Date(2000, month, 1).toLocaleString('en', { month: 'long' }),
);
const YEARS_BACK = 10;

const markerSx = {
  width: 16,
  height: 16,
  borderRadius: '50%',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.6rem',
  fontWeight: 700,
  backgroundColor: palette.primary,
  color: palette.primaryContrast,
};

/** Played label for the entry's media type. */
function loggedLabel(mediaType: string): string {
  if (isGameType(mediaType)) return 'Played';
  return mediaType === 'Book' ? 'Read' : 'Watched';
}

/** Month calendar for logging the days an entry was played / watched / read.
 *
 * @returns Journal part bound to the media modal form's played dates.
 */
export function JournalTab() {
  const dispatch = useAppDispatch();
  const playedDates = useAppSelector((state) => state.mediaModal.form.playedDates);
  const mediaType = useAppSelector((state) => state.mediaModal.form.mediaType);
  const startedAt = useAppSelector((state) => state.mediaModal.form.startedAt);
  const finishedAt = useAppSelector((state) => state.mediaModal.form.finishedAt);
  const today = new Date();
  const todayKey = toDateKey(today);
  // Open on the most recent logged day, or the current month.
  const [view, setView] = useState(() => {
    const latest = playedDates.at(-1);
    const date = latest ? new Date(`${latest}T00:00:00`) : today;
    return { year: date.getFullYear(), month: date.getMonth() };
  });

  const played = new Set(playedDates);
  const label = loggedLabel(mediaType);
  const monthPrefix = `${view.year}-${String(view.month + 1).padStart(2, '0')}`;
  const thisMonthCount = playedDates.filter((key) => key.startsWith(monthPrefix)).length;
  const isCurrentMonth =
    view.year === today.getFullYear() && view.month === today.getMonth();
  const firstYear = Math.min(view.year, today.getFullYear() - YEARS_BACK);
  const years = Array.from(
    { length: today.getFullYear() - firstYear + 1 },
    (_, i) => firstYear + i,
  );

  const shiftMonth = (delta: number) => {
    const date = new Date(view.year, view.month + delta, 1);
    setView({ year: date.getFullYear(), month: date.getMonth() });
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
        <Select
          size="small"
          value={view.month}
          onChange={(e) => setView((prev) => ({ ...prev, month: Number(e.target.value) }))}
          sx={{ ...fieldSx, minWidth: 140 }}
        >
          {MONTHS.map((name, month) => (
            <MenuItem
              key={name}
              value={month}
              disabled={view.year === today.getFullYear() && month > today.getMonth()}
            >
              {name}
            </MenuItem>
          ))}
        </Select>
        <Select
          size="small"
          value={view.year}
          onChange={(e) => {
            const year = Number(e.target.value);
            const maxMonth = year === today.getFullYear() ? today.getMonth() : 11;
            setView((prev) => ({ year, month: Math.min(prev.month, maxMonth) }));
          }}
          sx={{ ...fieldSx, minWidth: 100 }}
        >
          {years.map((year) => (
            <MenuItem key={year} value={year}>
              {year}
            </MenuItem>
          ))}
        </Select>
        <Box sx={{ flex: 1 }} />
        <Button
          variant="contained"
          aria-label="Previous month"
          onClick={() => shiftMonth(-1)}
          sx={{ minWidth: 48, borderRadius: 2 }}
        >
          <ArrowBackIcon fontSize="small" />
        </Button>
        <Button
          variant="contained"
          aria-label="Next month"
          onClick={() => shiftMonth(1)}
          disabled={isCurrentMonth}
          sx={{ minWidth: 48, borderRadius: 2 }}
        >
          <ArrowForwardIcon fontSize="small" />
        </Button>
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          border: `1px solid ${palette.borderMuted}`,
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        {WEEKDAYS.map((weekday, i) => (
          <Box
            key={weekday}
            sx={{
              py: 0.75,
              textAlign: 'center',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'text.secondary',
              backgroundColor: palette.surfaceElevated,
              borderBottom: `1px solid ${palette.borderMuted}`,
              borderRight: i < 6 ? `1px solid ${palette.borderMuted}` : 'none',
            }}
          >
            {weekday}
          </Box>
        ))}
        {buildMonthGrid(view.year, view.month).map((date, i) => {
          const key = toDateKey(date);
          const inMonth = date.getMonth() === view.month;
          const isFuture = key > todayKey;
          const isPlayed = played.has(key);
          return (
            <Box
              key={key}
              component="button"
              type="button"
              disabled={isFuture}
              aria-pressed={isPlayed}
              aria-label={`${date.toDateString()}${isPlayed ? `, ${label}` : ''}`}
              onClick={() => dispatch(togglePlayedDate(key))}
              sx={{
                minHeight: 64,
                p: 0.75,
                display: 'flex',
                flexDirection: 'column',
                gap: 0.5,
                border: 'none',
                borderRight: i % 7 < 6 ? `1px solid ${palette.borderMuted}` : 'none',
                borderBottom: i < 35 ? `1px solid ${palette.borderMuted}` : 'none',
                backgroundColor: key === todayKey ? palette.selectedBg : 'transparent',
                color: inMonth && !isFuture ? 'text.primary' : palette.textDisabled,
                fontFamily: 'inherit',
                fontSize: '0.9rem',
                cursor: isFuture ? 'default' : 'pointer',
                transition: 'background-color 0.15s ease',
                '&:hover:not(:disabled)': { backgroundColor: palette.borderMuted },
                '&:focus-visible': { outline: `2px solid ${palette.primary}`, outlineOffset: -2 },
              }}
            >
              <Box
                sx={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  gap: 0.5,
                }}
              >
                {key === startedAt && (
                  <Box component="span" title="Started" sx={markerSx}>
                    S
                  </Box>
                )}
                {key === finishedAt && (
                  <Box component="span" title="Finished" sx={markerSx}>
                    F
                  </Box>
                )}
                {date.getDate()}
              </Box>
              {isPlayed && (
                <Box
                  component="span"
                  sx={{
                    width: '100%',
                    px: 0.5,
                    borderRadius: 1,
                    textAlign: 'left',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    backgroundColor: palette.primary,
                    color: palette.primaryContrast,
                    opacity: inMonth ? 1 : 0.5,
                  }}
                >
                  {label}
                </Box>
              )}
            </Box>
          );
        })}
      </Box>

      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        {playedDates.length} {playedDates.length === 1 ? 'day' : 'days'} {label.toLowerCase()}
        {' · '}
        {thisMonthCount} in {MONTHS[view.month]}
      </Typography>
    </Stack>
  );
}
