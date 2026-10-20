'use client';

import { forwardRef, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Select,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ReplayIcon from '@mui/icons-material/Replay';
import { palette } from '@/lib/palette';
import { isGameType, mediaDisplayTitle, type MediaItem } from '@/types/media';
import { buildMonthGrid, toDateKey } from '@/utils/calendar';
import { getApiErrorMessage } from '@/utils/apiError';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { useGetMediaEntriesQuery } from '@/redux/api';
import { openEditMediaModal, setMediaModalTab } from '@/redux/slices/mediaModalSlice';

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const MONTHS = Array.from({ length: 12 }, (_, month) =>
  new Date(2000, month, 1).toLocaleString('en', { month: 'long' }),
);
const YEARS_BACK = 10;
const MAX_VISIBLE_COVERS = 3;

const selectSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2,
    backgroundColor: palette.fieldBg,
  },
} as const;

type DayLog = {
  item: MediaItem;
  title: string;
  rewatch: boolean;
  started: boolean;
  finished: boolean;
};

const markerSx = {
  width: 14,
  height: 14,
  borderRadius: '50%',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  fontSize: '0.55rem',
  fontWeight: 700,
  lineHeight: 1,
  backgroundColor: palette.primary,
  color: palette.primaryContrast,
} as const;

function replayLabel(mediaType: string): string {
  if (isGameType(mediaType)) return 'Replayed';
  return mediaType === 'Book' ? 'Reread' : 'Rewatched';
}

function dateKeyOf(value: string): string {
  return value.slice(0, 10);
}

// Group every library journal day so one calendar cell can hold several entries.
function logsByDate(items: MediaItem[]): Map<string, DayLog[]> {
  const byDate = new Map<string, DayLog[]>();
  for (const item of items) {
    const rewatch = new Set((item.rewatch_dates ?? []).map(dateKeyOf));
    const title = mediaDisplayTitle(item);
    for (const raw of item.played_dates ?? []) {
      const key = dateKeyOf(raw);
      const logs = byDate.get(key);
      const log: DayLog = {
        item,
        title,
        rewatch: rewatch.has(key),
        started: dateKeyOf(item.started_at ?? '') === key,
        finished: dateKeyOf(item.finished_at ?? '') === key,
      };
      if (logs) logs.push(log);
      else byDate.set(key, [log]);
    }
  }
  for (const logs of byDate.values()) {
    logs.sort((a, b) => a.title.localeCompare(b.title));
  }
  return byDate;
}

// Combined journal: one month calendar of every logged media day.
export function JournalPage() {
  const dispatch = useAppDispatch();
  const username = useAppSelector((state) => state.auth.username);
  const { data: items = [], isLoading, isError, error } = useGetMediaEntriesQuery(undefined, {
    skip: !username,
  });
  const today = new Date();
  const todayKey = toDateKey(today);
  const [view, setView] = useState(() => ({
    year: today.getFullYear(),
    month: today.getMonth(),
  }));

  const byDate = useMemo(() => logsByDate(items), [items]);
  const monthPrefix = `${view.year}-${String(view.month + 1).padStart(2, '0')}`;
  let thisMonthLogs = 0;
  let thisMonthDays = 0;
  for (const [key, logs] of byDate) {
    if (!key.startsWith(monthPrefix)) continue;
    thisMonthDays += 1;
    thisMonthLogs += logs.length;
  }
  const isCurrentMonth = view.year === today.getFullYear() && view.month === today.getMonth();
  const firstYear = Math.min(view.year, today.getFullYear() - YEARS_BACK);
  const years = Array.from(
    { length: today.getFullYear() - firstYear + 1 },
    (_, i) => firstYear + i,
  );

  const shiftMonth = (delta: number) => {
    const date = new Date(view.year, view.month + delta, 1);
    setView({ year: date.getFullYear(), month: date.getMonth() });
  };

  const openEntry = (item: MediaItem) => {
    dispatch(openEditMediaModal(item));
    dispatch(setMediaModalTab('journal'));
  };

  return (
    <Stack spacing={2}>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: palette.primary }}>
        Journal
      </Typography>

      {isError && (
        <Alert severity="error">{getApiErrorMessage(error, 'Failed to fetch media entries')}</Alert>
      )}

      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
        <Select
          size="small"
          value={view.month}
          onChange={(e) => setView((prev) => ({ ...prev, month: Number(e.target.value) }))}
          sx={{ ...selectSx, minWidth: 160 }}
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
          sx={{ ...selectSx, minWidth: 110 }}
        >
          {years.map((year) => (
            <MenuItem key={year} value={year}>
              {year}
            </MenuItem>
          ))}
        </Select>
        <Button
          variant="contained"
          onClick={() => setView({ year: today.getFullYear(), month: today.getMonth() })}
          disabled={isCurrentMonth}
          sx={{ borderRadius: 2 }}
        >
          Today
        </Button>
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

      <Box sx={{ position: 'relative', minHeight: isLoading ? 480 : undefined }}>
        {isLoading && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1,
            }}
          >
            <CircularProgress />
          </Box>
        )}

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
            border: `1px solid ${palette.borderMuted}`,
            borderRadius: 2,
            overflow: 'hidden',
            opacity: isLoading ? 0.4 : 1,
          }}
        >
          {WEEKDAYS.map((weekday, i) => (
            <Box
              key={weekday}
              sx={{
                py: 1,
                textAlign: 'center',
                fontSize: '0.85rem',
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
            const logs = byDate.get(key) ?? [];
            const cell = (
              <DayCell
                key={key}
                date={date}
                inMonth={date.getMonth() === view.month}
                isFuture={key > todayKey}
                isToday={key === todayKey}
                column={i % 7}
                rowEnd={i >= 35}
                logs={logs}
                onOpen={openEntry}
              />
            );
            if (logs.length === 0) return cell;
            return (
              <Tooltip
                key={key}
                arrow
                placement="top"
                enterDelay={200}
                title={<DayTooltip logs={logs} />}
                slotProps={{
                  tooltip: {
                    sx: {
                      backgroundColor: palette.surfaceElevated,
                      border: `1px solid ${palette.border}`,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
                      maxWidth: 280,
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
                {cell}
              </Tooltip>
            );
          })}
        </Box>
      </Box>

      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        {thisMonthLogs} {thisMonthLogs === 1 ? 'entry' : 'entries'} logged in {MONTHS[view.month]}
        {' · '}
        {thisMonthDays} {thisMonthDays === 1 ? 'day' : 'days'}
      </Typography>
    </Stack>
  );
}

function DayTooltip({ logs }: { logs: DayLog[] }) {
  return (
    <Stack spacing={0.25} sx={{ py: 0.25, px: 0.25 }}>
      {logs.map((log) => (
        <Typography key={log.item.id} variant="body2" sx={{ color: palette.textOnDark, lineHeight: 1.35 }}>
          {log.title}
        </Typography>
      ))}
    </Stack>
  );
}

const DayCell = forwardRef<
  HTMLDivElement,
  {
    date: Date;
    inMonth: boolean;
    isFuture: boolean;
    isToday: boolean;
    column: number;
    rowEnd: boolean;
    logs: DayLog[];
    onOpen: (item: MediaItem) => void;
  }
>(function DayCell(
  { date, inMonth, isFuture, isToday, column, rowEnd, logs, onOpen, ...props },
  ref,
) {
  const titles = logs.map((log) => log.title).join(', ');
  const visibleLogs = logs.slice(0, MAX_VISIBLE_COVERS);
  const hasMore = logs.length > MAX_VISIBLE_COVERS;
  return (
    <Box
      ref={ref}
      {...props}
      aria-label={titles ? `${date.toDateString()}, ${titles}` : date.toDateString()}
      sx={{
        minHeight: { xs: 72, sm: 96 },
        p: 0.75,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.5,
        borderRight: column < 6 ? `1px solid ${palette.borderMuted}` : 'none',
        borderBottom: rowEnd ? 'none' : `1px solid ${palette.borderMuted}`,
        backgroundColor: isToday ? palette.selectedBg : 'transparent',
        color: inMonth && !isFuture ? 'text.primary' : palette.textDisabled,
        height: '100%',
      }}
    >
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          justifyContent: 'flex-end',
          fontSize: { xs: '0.75rem', sm: '0.95rem' },
          fontWeight: isToday ? 700 : 500,
          lineHeight: 1.2,
        }}
      >
        {date.getDate()}
      </Box>
      {visibleLogs.length > 0 && (
        <Box sx={{ display: 'flex', gap: 0.5, width: '100%' }}>
          {visibleLogs.map((log, index) => {
            const showMore = hasMore && index === visibleLogs.length - 1;
            return (
              <Box
                key={log.item.id}
                component="button"
                type="button"
                aria-label={[
                  `Open ${log.title}`,
                  log.started ? 'Started' : '',
                  log.finished ? 'Finished' : '',
                  log.rewatch ? replayLabel(log.item.media_type) : '',
                  showMore ? 'more entries logged' : '',
                ]
                  .filter(Boolean)
                  .join(', ')}
                onClick={() => onOpen(log.item)}
                sx={{
                  position: 'relative',
                  // Always one third of the day, so one cover matches three.
                  flex: '0 0 calc((100% - 8px) / 3)',
                  width: 'calc((100% - 8px) / 3)',
                  aspectRatio: '2 / 3',
                  p: 0,
                  border: 'none',
                  borderRadius: 0.75,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  backgroundColor: palette.paper,
                  opacity: inMonth ? 1 : 0.55,
                  fontFamily: 'inherit',
                  '&:hover': { outline: `2px solid ${palette.primary}`, outlineOffset: 1 },
                  '&:focus-visible': { outline: `2px solid ${palette.primary}`, outlineOffset: 1 },
                }}
              >
                {log.item.poster_path ? (
                  <Box
                    component="img"
                    src={log.item.poster_path}
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
                      fontSize: '1rem',
                      fontWeight: 700,
                      color: palette.textOnDark,
                    }}
                  >
                    {log.title.slice(0, 1)}
                  </Box>
                )}
                {(log.started || log.finished || log.rewatch) && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 2,
                      left: 2,
                      right: 2,
                      zIndex: 2,
                      display: 'flex',
                      gap: 0.25,
                      pointerEvents: 'none',
                    }}
                  >
                    {log.started && (
                      <Box component="span" title="Started" sx={markerSx}>
                        S
                      </Box>
                    )}
                    {log.finished && (
                      <Box component="span" title="Finished" sx={markerSx}>
                        F
                      </Box>
                    )}
                    {log.rewatch && (
                      <Box component="span" title={replayLabel(log.item.media_type)} sx={markerSx}>
                        <ReplayIcon sx={{ fontSize: '0.7rem' }} />
                      </Box>
                    )}
                  </Box>
                )}
                {showMore && (
                  <Box
                    aria-hidden
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      zIndex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(0,0,0,0.55)',
                      color: palette.textOnDark,
                    }}
                  >
                    <AddIcon sx={{ fontSize: '1.25rem' }} />
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
});
