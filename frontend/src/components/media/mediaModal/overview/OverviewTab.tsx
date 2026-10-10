'use client';

import { useCallback, type KeyboardEvent } from 'react';
import {
  Box,
  CircularProgress,
  FormControl,
  InputAdornment,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { StarRating } from '@/components/common/StarRating';
import { palette } from '@/lib/palette';
import { MEDIA_TYPES, STATUSES_BY_TYPE, isGameType } from '@/types/media';
import { getStatusColor } from '@/utils/mediaStatus';
import { toDbRating } from '@/utils/rating';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import {
  igdbGameLoaded,
  igdbSelectionChanged,
  igdbTitleChanged,
  patchForm,
  setFetchError,
  setMediaType,
} from '@/redux/slices/mediaModalSlice';
import { fieldSx, sanitizeIntegerInput } from '../constants';
import { coverFetchErrorMessage } from '../useCoverAutoFetch';
import { ChipPicker } from './ChipPicker';
import { IgdbGameSearch } from './IgdbGameSearch';

const blockNonIntegerKeys = (event: KeyboardEvent) => {
  if (['e', 'E', '+', '-', '.', ','].includes(event.key)) event.preventDefault();
};

const MEDIA_TYPE_SELECTED_COLORS = {
  bg: palette.primary,
  border: palette.primary,
  color: palette.primaryContrast,
};

interface OverviewTabProps {
  isFetchingCover: boolean;
}

/** Editable core fields of a media entry (title, type, status, rating, dates).
 *
 * @param props - Whether a cover lookup is in flight (title spinner).
 * @returns Overview part bound to the media modal form.
 */
export function OverviewTab({ isFetchingCover }: OverviewTabProps) {
  const dispatch = useAppDispatch();
  const open = useAppSelector((state) => state.mediaModal.isOpen);
  const item = useAppSelector((state) => state.mediaModal.editingItem);
  const form = useAppSelector((state) => state.mediaModal.form);
  const supportsPlaytime = isGameType(form.mediaType);

  const handleIgdbSearchError = useCallback(
    (err: unknown) => dispatch(setFetchError(coverFetchErrorMessage(err, 'IGDB'))),
    [dispatch],
  );

  return (
    <Stack spacing={2.25}>
      {supportsPlaytime ? (
        <IgdbGameSearch
          key={`${open}:${item?.id ?? 'new'}:${form.mediaType}`}
          open={open}
          title={form.title}
          skipSearchForTitle={item && isGameType(item.media_type) ? item.title : undefined}
          fieldSx={fieldSx}
          onTitleChange={(title, hadSelection) =>
            dispatch(igdbTitleChanged({ title, hadSelection }))
          }
          onSelectionChange={(game, loading) =>
            dispatch(igdbSelectionChanged({ name: game?.name ?? null, loading }))
          }
          onGameLoaded={(game) => dispatch(igdbGameLoaded(game))}
          onError={handleIgdbSearchError}
        />
      ) : (
        <TextField
          required
          label="Title"
          value={form.title}
          onChange={(e) => dispatch(patchForm({ title: e.target.value }))}
          fullWidth
          sx={fieldSx}
          slotProps={{
            input: {
              endAdornment: isFetchingCover ? (
                <InputAdornment position="end">
                  <CircularProgress size={16} thickness={5} color="inherit" />
                </InputAdornment>
              ) : null,
            },
          }}
        />
      )}

      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2, flexWrap: 'wrap' }}>
        <ChipPicker
          label="Media type"
          options={MEDIA_TYPES}
          value={form.mediaType}
          onChange={(type) => dispatch(setMediaType(type))}
          getSelectedColors={() => MEDIA_TYPE_SELECTED_COLORS}
          sx={{ flex: 1, minWidth: 220 }}
        />

        {supportsPlaytime && (
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', mb: 1, display: 'block', fontWeight: 600 }}
            >
              Playtime
            </Typography>
            <Stack direction="row" spacing={1} useFlexGap sx={{ alignItems: 'center' }}>
              <TextField
                label="hrs"
                size="small"
                value={form.playtimeHours}
                onKeyDown={blockNonIntegerKeys}
                onChange={(e) =>
                  dispatch(patchForm({ playtimeHours: sanitizeIntegerInput(e.target.value) }))
                }
                slotProps={{ htmlInput: { inputMode: 'numeric', pattern: '[0-9]*' } }}
                sx={{ ...fieldSx, width: 96 }}
              />
              <TextField
                label="mins"
                size="small"
                value={form.playtimeMinutes}
                onKeyDown={blockNonIntegerKeys}
                onChange={(e) =>
                  dispatch(patchForm({ playtimeMinutes: sanitizeIntegerInput(e.target.value) }))
                }
                slotProps={{ htmlInput: { inputMode: 'numeric', pattern: '[0-9]*' } }}
                sx={{ ...fieldSx, width: 96 }}
              />
            </Stack>
          </Box>
        )}
      </Box>

      <ChipPicker
        label="Status"
        options={STATUSES_BY_TYPE[form.mediaType]}
        value={form.status}
        onChange={(status) => dispatch(patchForm({ status }))}
        getSelectedColors={getStatusColor}
      />

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ alignItems: 'flex-start', flexWrap: 'wrap' }}
      >
        <Box>
          <Typography
            variant="caption"
            sx={{ color: 'text.secondary', mb: 1.5, display: 'block', fontWeight: 600 }}
          >
            Rating
          </Typography>
          <StarRating
            value={form.rating}
            onChange={(stars) => dispatch(patchForm({ rating: toDbRating(stars) }))}
          />
        </Box>
        {supportsPlaytime && (
          <Box sx={{ minWidth: 180 }}>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', mb: 1, display: 'block', fontWeight: 600 }}
            >
              Played on:
            </Typography>
            <FormControl size="small" fullWidth>
              <Select
                value={form.platformPlayedOn}
                displayEmpty
                inputProps={{ 'aria-label': 'Played on platform' }}
                disabled={form.platforms.length === 0}
                onChange={(e) => dispatch(patchForm({ platformPlayedOn: e.target.value }))}
                sx={{ ...fieldSx, fontSize: '0.8rem' }}
              >
                <MenuItem value="" sx={{ fontSize: '0.8rem' }}>
                  <em>{form.platforms.length ? 'Not selected' : 'No platforms available'}</em>
                </MenuItem>
                {form.platforms.map((platform) => (
                  <MenuItem key={platform} value={platform} sx={{ fontSize: '0.8rem' }}>
                    {platform}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField
          label="Started at"
          type="date"
          value={form.startedAt}
          onChange={(e) => dispatch(patchForm({ startedAt: e.target.value }))}
          fullWidth
          slotProps={{ inputLabel: { shrink: true } }}
          sx={fieldSx}
        />
        <TextField
          label="Finished at"
          type="date"
          value={form.finishedAt}
          onChange={(e) => dispatch(patchForm({ finishedAt: e.target.value }))}
          fullWidth
          slotProps={{ inputLabel: { shrink: true } }}
          sx={fieldSx}
        />
      </Stack>
    </Stack>
  );
}
