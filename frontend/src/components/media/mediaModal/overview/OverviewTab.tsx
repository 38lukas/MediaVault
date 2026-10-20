'use client';

import { useCallback, type KeyboardEvent } from 'react';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import {
  Box,
  FormControl,
  IconButton,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { StarRating } from '@/components/common/StarRating';
import { palette } from '@/lib/palette';
import { MEDIA_TYPES, STATUSES_BY_TYPE, isGameType, supportsRewatches } from '@/types/media';
import { getStatusColor } from '@/utils/mediaStatus';
import { toDbRating } from '@/utils/rating';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import type { TmdbMediaType } from '@/redux/api';
import {
  igdbGameLoaded,
  lookupSelectionChanged,
  lookupTitleChanged,
  openLibraryBookLoaded,
  patchForm,
  setFetchError,
  setMediaType,
  tmdbTitleLoaded,
} from '@/redux/slices/mediaModalSlice';
import {
  fieldSx,
  getCoverProvider,
  parseTmdbShowId,
  sanitizeIntegerInput,
} from '../constants';
import { coverFetchErrorMessage } from '../coverFetchError';
import { ChipPicker } from './ChipPicker';
import { IgdbGameSearch } from './IgdbGameSearch';
import { OpenLibraryBookSearch } from './OpenLibraryBookSearch';
import { TmdbSeasonSelect } from './TmdbSeasonSelect';
import { TmdbTitleSearch } from './TmdbTitleSearch';

const blockNonIntegerKeys = (event: KeyboardEvent) => {
  if (['e', 'E', '+', '-', '.', ','].includes(event.key)) event.preventDefault();
};

// Selected-chip colors for the media type picker.
const MEDIA_TYPE_SELECTED_COLORS = {
  bg: palette.primary,
  border: palette.primary,
  color: palette.primaryContrast,
};

// Editable core fields of a media entry in the modal overview tab.
export function OverviewTab() {
  const dispatch = useAppDispatch();
  const open = useAppSelector((state) => state.mediaModal.isOpen);
  const item = useAppSelector((state) => state.mediaModal.editingItem);
  const form = useAppSelector((state) => state.mediaModal.form);
  const supportsPlaytime = isGameType(form.mediaType);
  const showRewatches = supportsRewatches(form.mediaType);
  const provider = getCoverProvider(form.mediaType);
  const searchKey = `${open}:${item?.id ?? 'new'}:${form.mediaType}`;
  const isTv = form.mediaType === 'Series' || form.mediaType === 'Anime';
  const tmdbShowId = isTv ? parseTmdbShowId(form.externalId) : null;

  const handleIgdbSearchError = useCallback(
    (err: unknown) => dispatch(setFetchError(coverFetchErrorMessage(err, 'IGDB'))),
    [dispatch],
  );
  const handleTmdbSearchError = useCallback(
    (err: unknown) => dispatch(setFetchError(coverFetchErrorMessage(err, 'TMDB'))),
    [dispatch],
  );
  const handleOpenLibrarySearchError = useCallback(
    (err: unknown) => dispatch(setFetchError(coverFetchErrorMessage(err, 'Open Library'))),
    [dispatch],
  );
  const handleTitleChange = (title: string, hadSelection: boolean) =>
    dispatch(lookupTitleChanged({ title, hadSelection }));
  const handleSelectionChange = (result: { name: string } | null, loading: boolean) =>
    dispatch(lookupSelectionChanged({ name: result?.name ?? null, loading }));

  return (
    <Stack spacing={2.25}>
      {provider === 'IGDB' ? (
        <IgdbGameSearch
          key={searchKey}
          open={open}
          title={form.title}
          skipSearchForTitle={item && isGameType(item.media_type) ? item.title : undefined}
          fieldSx={fieldSx}
          onTitleChange={handleTitleChange}
          onSelectionChange={handleSelectionChange}
          onGameLoaded={(game) => dispatch(igdbGameLoaded(game))}
          onError={handleIgdbSearchError}
        />
      ) : provider === 'TMDB' ? (
        <TmdbTitleSearch
          key={searchKey}
          open={open}
          title={form.title}
          mediaType={form.mediaType as TmdbMediaType}
          skipSearchForTitle={item?.media_type === form.mediaType ? item.title : undefined}
          fieldSx={fieldSx}
          onTitleChange={handleTitleChange}
          onSelectionChange={handleSelectionChange}
          onTitleLoaded={(result) => dispatch(tmdbTitleLoaded(result))}
          onError={handleTmdbSearchError}
        />
      ) : (
        <OpenLibraryBookSearch
          key={searchKey}
          open={open}
          title={form.title}
          skipSearchForTitle={item?.media_type === form.mediaType ? item.title : undefined}
          fieldSx={fieldSx}
          onTitleChange={handleTitleChange}
          onSelectionChange={handleSelectionChange}
          onBookLoaded={(book) => dispatch(openLibraryBookLoaded(book))}
          onError={handleOpenLibrarySearchError}
        />
      )}

      {isTv && (
        <TmdbSeasonSelect
          key={`${searchKey}:${tmdbShowId ?? 'none'}`}
          showId={tmdbShowId}
          mediaType={form.mediaType as TmdbMediaType}
          fieldSx={fieldSx}
          onError={handleTmdbSearchError}
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

        {showRewatches && (
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', mb: 1, display: 'block', fontWeight: 600 }}
            >
              Rewatches
            </Typography>
            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
              <IconButton
                size="small"
                aria-label="Decrease rewatches"
                disabled={form.rewatchCount <= 0}
                onClick={() => dispatch(patchForm({ rewatchCount: Math.max(0, form.rewatchCount - 1) }))}
                sx={{ border: `1px solid ${palette.borderMuted}`, borderRadius: 2 }}
              >
                <RemoveIcon fontSize="small" />
              </IconButton>
              <Typography
                sx={{ minWidth: 28, textAlign: 'center', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}
              >
                {form.rewatchCount}
              </Typography>
              <IconButton
                size="small"
                aria-label="Increase rewatches"
                onClick={() => dispatch(patchForm({ rewatchCount: form.rewatchCount + 1 }))}
                sx={{ border: `1px solid ${palette.borderMuted}`, borderRadius: 2 }}
              >
                <AddIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Box>
        )}

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
