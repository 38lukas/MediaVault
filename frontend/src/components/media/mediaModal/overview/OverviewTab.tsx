'use client';

import { useCallback, type KeyboardEvent, type ReactNode } from 'react';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import {
  Box,
  FormControl,
  IconButton,
  MenuItem,
  OutlinedInput,
  Select,
  InputLabel,
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
  selectMenuProps,
  parseTmdbShowId,
  sanitizeIntegerInput,
} from '../constants';
import { coverFetchErrorMessage } from '../coverFetchError';
import { DateField } from './DateField';
import { OptionSelect } from './OptionSelect';
import { IgdbGameSearch } from './IgdbGameSearch';
import { OpenLibraryBookSearch } from './OpenLibraryBookSearch';
import { TmdbSeasonSelect } from './TmdbSeasonSelect';
import { TmdbTitleSearch } from './TmdbTitleSearch';

const blockNonIntegerKeys = (event: KeyboardEvent) => {
  if (['e', 'E', '+', '-', '.', ','].includes(event.key)) event.preventDefault();
};

// Two equal columns that collapse to one on narrow screens; every row shares this grid.
const rowSx = {
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
  gap: 2,
  alignItems: 'start',
};

// Small caption above a control, same spacing everywhere in the tab.
function FieldLabel({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography
        variant="caption"
        sx={{ color: 'text.secondary', mb: 1, display: 'block', fontWeight: 600 }}
      >
        {label}
      </Typography>
      {children}
    </Box>
  );
}

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

      <Box sx={rowSx}>
        <OptionSelect
          label="Media type"
          options={MEDIA_TYPES}
          value={form.mediaType}
          onChange={(type) => dispatch(setMediaType(type))}
        />
        <OptionSelect
          label="Status"
          options={STATUSES_BY_TYPE[form.mediaType]}
          value={form.status}
          onChange={(status) => dispatch(patchForm({ status }))}
          getOptionColors={getStatusColor}
        />
      </Box>

      {supportsPlaytime && (
        <Box sx={rowSx}>
          <Stack direction="row" spacing={1} useFlexGap>
            <TextField
              label="Playtime (hrs)"
              size="small"
              fullWidth
              value={form.playtimeHours}
              onKeyDown={blockNonIntegerKeys}
              onChange={(e) =>
                dispatch(patchForm({ playtimeHours: sanitizeIntegerInput(e.target.value) }))
              }
              slotProps={{
                inputLabel: { shrink: true },
                htmlInput: { inputMode: 'numeric', pattern: '[0-9]*' },
              }}
              sx={fieldSx}
            />
            <TextField
              label="Playtime (mins)"
              size="small"
              fullWidth
              value={form.playtimeMinutes}
              onKeyDown={blockNonIntegerKeys}
              onChange={(e) =>
                dispatch(patchForm({ playtimeMinutes: sanitizeIntegerInput(e.target.value) }))
              }
              slotProps={{
                inputLabel: { shrink: true },
                htmlInput: { inputMode: 'numeric', pattern: '[0-9]*' },
              }}
              sx={fieldSx}
            />
          </Stack>
          <FormControl size="small" fullWidth sx={fieldSx} disabled={form.platforms.length === 0}>
            <InputLabel id="played-on-label" shrink>
              Played on
            </InputLabel>
            <Select
              labelId="played-on-label"
              input={<OutlinedInput label="Played on" notched />}
              value={form.platformPlayedOn}
              displayEmpty
              onChange={(e) => dispatch(patchForm({ platformPlayedOn: e.target.value }))}
              MenuProps={selectMenuProps}
            >
              <MenuItem value="">
                <em>{form.platforms.length ? 'Not selected' : 'No platforms available'}</em>
              </MenuItem>
              {form.platforms.map((platform) => (
                <MenuItem key={platform} value={platform}>
                  {platform}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}

      <Box sx={rowSx}>
        <FieldLabel label="Rating">
          <StarRating
            value={form.rating}
            onChange={(stars) => dispatch(patchForm({ rating: toDbRating(stars) }))}
          />
        </FieldLabel>
        {showRewatches && (
          <FieldLabel label="Rewatches">
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
          </FieldLabel>
        )}
      </Box>

      <Box sx={rowSx}>
        <DateField
          label="Started at"
          value={form.startedAt}
          onChange={(startedAt) => dispatch(patchForm({ startedAt }))}
        />
        <DateField
          label="Finished at"
          value={form.finishedAt}
          onChange={(finishedAt) => dispatch(patchForm({ finishedAt }))}
        />
      </Box>
    </Stack>
  );
}
