'use client';

import { useCallback, useState, type KeyboardEvent, type ReactNode } from 'react';
import { AddIcon, EditOutlinedIcon, FavoriteBorderIcon, FavoriteIcon, RemoveIcon } from '@/lib/icons';
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
  getCoverProvider,
  parseTmdbShowId,
  sanitizeIntegerInput,
} from '../constants';
import { coverFetchErrorMessage } from '../coverFetchError';
import { DateField } from './DateField';
import { FieldAction, fieldActionPaddingSx } from './FieldAction';
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
  // Rename mode: the title becomes a plain text field, so editing it neither searches nor clears
  // cover, details or ids. Keyed by searchKey so it resets whenever the modal or media type changes.
  const [renameKey, setRenameKey] = useState<string | null>(null);
  const [resumeSkip, setResumeSkip] = useState<{ key: string; title: string } | null>(null);
  const renaming = renameKey === searchKey;
  const toggleRename = () => {
    if (renaming) {
      // Back to search: don't auto-search for the name we just typed; only searching on further edits.
      setResumeSkip({ key: searchKey, title: form.title });
      setRenameKey(null);
    } else {
      setRenameKey(searchKey);
    }
  };
  const skipTitle = (fallback: string | undefined) =>
    resumeSkip?.key === searchKey ? resumeSkip.title : fallback;
  const renameButton = (
    <FieldAction>
    <IconButton
      size="small"
      edge="end"
      aria-label={renaming ? 'Rename only: click to search again' : 'Rename without searching'}
      aria-pressed={renaming}
      title={renaming ? 'Rename only (click to search again)' : 'Rename without searching'}
      onClick={toggleRename}
      sx={{ color: renaming ? palette.primary : 'text.secondary' }}
    >
      <EditOutlinedIcon fontSize="small" />
    </IconButton>
    </FieldAction>
  );
  const titleFieldSx = fieldActionPaddingSx;
  const handleTitleChange = (title: string, hadSelection: boolean) =>
    dispatch(lookupTitleChanged({ title, hadSelection }));
  const handleSelectionChange = (result: { name: string } | null, loading: boolean) =>
    dispatch(lookupSelectionChanged({ name: result?.name ?? null, loading }));

  return (
    <Stack spacing={2.25}>
      {renaming ? (
        <TextField
          label="Title"
          required
          size="small"
          fullWidth
          autoFocus
          value={form.title}
          onChange={(e) => dispatch(patchForm({ title: e.target.value }))}
          sx={fieldActionPaddingSx}
          slotProps={{ input: { endAdornment: renameButton } }}
        />
      ) : provider === 'IGDB' ? (
        <IgdbGameSearch
          key={searchKey}
          open={open}
          title={form.title}
          skipSearchForTitle={skipTitle(item && isGameType(item.media_type) ? item.title : undefined)}
          fieldSx={titleFieldSx}
          onTitleChange={handleTitleChange}
          onSelectionChange={handleSelectionChange}
          onGameLoaded={(game) => dispatch(igdbGameLoaded(game))}
          onError={handleIgdbSearchError}
          titleAction={renameButton}
        />
      ) : provider === 'TMDB' ? (
        <TmdbTitleSearch
          key={searchKey}
          open={open}
          title={form.title}
          mediaType={form.mediaType as TmdbMediaType}
          skipSearchForTitle={skipTitle(item?.media_type === form.mediaType ? item.title : undefined)}
          fieldSx={titleFieldSx}
          onTitleChange={handleTitleChange}
          onSelectionChange={handleSelectionChange}
          onTitleLoaded={(result) => dispatch(tmdbTitleLoaded(result))}
          onError={handleTmdbSearchError}
          titleAction={renameButton}
        />
      ) : (
        <OpenLibraryBookSearch
          key={searchKey}
          open={open}
          title={form.title}
          skipSearchForTitle={skipTitle(item?.media_type === form.mediaType ? item.title : undefined)}
          fieldSx={titleFieldSx}
          onTitleChange={handleTitleChange}
          onSelectionChange={handleSelectionChange}
          onBookLoaded={(book) => dispatch(openLibraryBookLoaded(book))}
          onError={handleOpenLibrarySearchError}
          titleAction={renameButton}
        />
      )}

      {isTv && (
        <TmdbSeasonSelect
          key={`${searchKey}:${tmdbShowId ?? 'none'}`}
          showId={tmdbShowId}
          mediaType={form.mediaType as TmdbMediaType}
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
          statusOptions
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
            />
          </Stack>
          <FormControl fullWidth disabled={form.platforms.length === 0}>
            <InputLabel id="played-on-label" shrink>
              Played on
            </InputLabel>
            <Select
              labelId="played-on-label"
              input={<OutlinedInput label="Played on" notched />}
              value={form.platformPlayedOn}
              displayEmpty
              onChange={(e) => dispatch(patchForm({ platformPlayedOn: e.target.value }))}
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
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <StarRating
              value={form.rating}
              onChange={(stars) => dispatch(patchForm({ rating: toDbRating(stars) }))}
            />
            <IconButton
              aria-label={form.isFavorite ? 'Remove from favorites' : 'Mark as favorite'}
              aria-pressed={form.isFavorite}
              title={form.isFavorite ? 'Favorite' : 'Mark as favorite'}
              onClick={() => dispatch(patchForm({ isFavorite: !form.isFavorite }))}
              sx={{ p: 0.5, color: form.isFavorite ? palette.primary : 'grey.600' }}
            >
              {form.isFavorite ? (
                <FavoriteIcon sx={{ fontSize: '1.6rem' }} />
              ) : (
                <FavoriteBorderIcon sx={{ fontSize: '1.6rem' }} />
              )}
            </IconButton>
          </Stack>
        </FieldLabel>
        {showRewatches && (
          <FieldLabel label={supportsPlaytime ? 'Replays' : 'Rewatches'}>
            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
              <IconButton
                size="small"
                aria-label={supportsPlaytime ? 'Decrease replays' : 'Decrease rewatches'}
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
                aria-label={supportsPlaytime ? 'Increase replays' : 'Increase rewatches'}
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
