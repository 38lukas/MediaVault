'use client';

import {
  Checkbox,
  ClickAwayListener,
  Divider,
  FormControlLabel,
  Paper,
  Popper,
  Stack,
  Typography,
} from '@mui/material';
import { palette } from '@/lib/palette';
import { isGameType } from '@/types/media';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { patchForm, togglePlayedDate } from '@/redux/slices/mediaModalSlice';

interface JournalDayPopoverProps {
  dateKey: string | null;
  anchorEl: HTMLElement | null;
  onClose: () => void;
}

/** Type-aware labels for the day popover actions. */
function dayLabels(mediaType: string) {
  if (isGameType(mediaType)) {
    return {
      log: 'Played',
      started: 'Started',
      finished: 'Finished',
    };
  }
  if (mediaType === 'Book') {
    return {
      log: 'Read',
      started: 'Started',
      finished: 'Finished',
    };
  }
  return {
    log: 'Watched',
    started: 'Started',
    finished: 'Finished',
  };
}

/** Formats YYYY-MM-DD for the popover heading. */
function formatDayHeading(dateKey: string): string {
  return new Date(`${dateKey}T00:00:00`).toLocaleDateString('en', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Small non-modal popup to log a calendar day and optionally set start / finish.
 *
 * Uses Popper (not Popover/Modal) so no backdrop blocks the calendar inside the dialog.
 *
 * @returns Anchored day menu, or null when closed.
 */
export function JournalDayPopover({ dateKey, anchorEl, onClose }: JournalDayPopoverProps) {
  const dispatch = useAppDispatch();
  const mediaType = useAppSelector((state) => state.mediaModal.form.mediaType);
  const playedDates = useAppSelector((state) => state.mediaModal.form.playedDates);
  const startedAt = useAppSelector((state) => state.mediaModal.form.startedAt);
  const finishedAt = useAppSelector((state) => state.mediaModal.form.finishedAt);

  const open = Boolean(anchorEl && dateKey);
  if (!open || !dateKey) return null;

  const labels = dayLabels(mediaType);
  const isLogged = playedDates.includes(dateKey);
  const isStarted = startedAt === dateKey;
  const isFinished = finishedAt === dateKey;

  /** Ensures the day is in playedDates (no-op if already logged). */
  const ensureLogged = () => {
    if (!playedDates.includes(dateKey)) dispatch(togglePlayedDate(dateKey));
  };

  return (
    <Popper
      open={open}
      anchorEl={anchorEl}
      placement="bottom-start"
      style={{ zIndex: 1400 }}
      modifiers={[{ name: 'offset', options: { offset: [0, 4] } }]}
    >
      <ClickAwayListener onClickAway={onClose}>
        <Paper
          elevation={0}
          sx={{
            px: 1.5,
            py: 1.25,
            minWidth: 220,
            borderRadius: 2,
            backgroundImage: 'none',
            backgroundColor: palette.surfaceElevated,
            border: `1px solid ${palette.border}`,
          }}
        >
          <Stack spacing={0.5}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, px: 0.5, pb: 0.25 }}>
              {formatDayHeading(dateKey)}
            </Typography>
            <Divider sx={{ borderColor: palette.borderMuted }} />
            <FormControlLabel
              sx={{ mx: 0, px: 0.5 }}
              control={
                <Checkbox
                  size="small"
                  checked={isLogged}
                  onChange={() => {
                    if (isLogged && (isStarted || isFinished)) {
                      dispatch(
                        patchForm({
                          ...(isStarted ? { startedAt: '' } : {}),
                          ...(isFinished ? { finishedAt: '' } : {}),
                        }),
                      );
                    }
                    dispatch(togglePlayedDate(dateKey));
                  }}
                />
              }
              label={labels.log}
            />
            <FormControlLabel
              sx={{ mx: 0, px: 0.5 }}
              control={
                <Checkbox
                  size="small"
                  checked={isStarted}
                  onChange={(_, checked) => {
                    dispatch(patchForm({ startedAt: checked ? dateKey : '' }));
                    if (checked) ensureLogged();
                  }}
                />
              }
              label={labels.started}
            />
            <FormControlLabel
              sx={{ mx: 0, px: 0.5 }}
              control={
                <Checkbox
                  size="small"
                  checked={isFinished}
                  onChange={(_, checked) => {
                    dispatch(patchForm({ finishedAt: checked ? dateKey : '' }));
                    if (checked) ensureLogged();
                  }}
                />
              }
              label={labels.finished}
            />
          </Stack>
        </Paper>
      </ClickAwayListener>
    </Popper>
  );
}
