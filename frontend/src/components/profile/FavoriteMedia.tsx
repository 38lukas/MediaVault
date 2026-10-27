'use client';

import { useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import SearchIcon from '@mui/icons-material/Search';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { palette } from '@/lib/palette';
import { useLazyFetchIgdbGameQuery, useUpdateFavoriteSlotMutation, type TmdbMediaType } from '@/redux/api';
import { CARD_GRID_COLS } from '@/components/media/MediaGrid';
import { ChipPicker } from '@/components/media/mediaModal/overview/ChipPicker';
import { IgdbGameSearch } from '@/components/media/mediaModal/overview/IgdbGameSearch';
import { OpenLibraryBookSearch } from '@/components/media/mediaModal/overview/OpenLibraryBookSearch';
import { TmdbTitleSearch } from '@/components/media/mediaModal/overview/TmdbTitleSearch';
import {
  fieldSx,
  getCoverProvider,
  parseIgdbExternalId,
  type CoverProvider,
} from '@/components/media/mediaModal/constants';
import { coverFetchErrorMessage } from '@/components/media/mediaModal/coverFetchError';
import type { FavoriteCategory, FavoriteGroup, FavoriteSlot } from '@/types/profile';
import { MEDIA_TYPES, isMediaType, type MediaType } from '@/types/media';
import { getApiErrorMessage } from '@/utils/apiError';

const SLOT_COUNT = 5;
const FALLBACK_POSTER = 'https://via.placeholder.com/300x450?text=No+Cover';
const CROWN_YELLOW = '#f5c518';

const LIST_OPTIONS: { value: FavoriteCategory; label: string }[] = [
  { value: 'All', label: 'All media' },
  { value: 'Game', label: 'Games' },
  { value: 'Movie', label: 'Movies' },
  { value: 'Series', label: 'Series' },
  { value: 'Anime', label: 'Anime' },
  { value: 'Book', label: 'Books' },
];

const MEDIA_TYPE_SELECTED_COLORS = {
  bg: palette.primary,
  border: palette.primary,
  color: palette.primaryContrast,
};

interface FavoriteMediaProps {
  favorites: FavoriteGroup[] | undefined;
  readOnly: boolean;
}

function emptySlot(slot: number): FavoriteSlot {
  return {
    slot,
    title: null,
    media_type: null,
    external_id: null,
    poster_path: null,
    is_number_one: false,
  };
}

function slotsFor(favorites: FavoriteGroup[] | undefined, category: FavoriteCategory): FavoriteSlot[] {
  const group = favorites?.find((item) => item.category === category);
  return Array.from({ length: SLOT_COUNT }, (_, slot) => {
    return group?.slots.find((item) => item.slot === slot) ?? emptySlot(slot);
  });
}

function CrownMark() {
  return (
    <Box
      component="svg"
      viewBox="0 0 24 24"
      aria-hidden
      sx={{ width: 34, height: 34, display: 'block' }}
    >
      <path
        fill="currentColor"
        d="M3.2 17.2 5.4 8.4 9.5 12.1 12 4.2l2.5 7.9 4.1-3.7 2.2 8.8H3.2Zm1.4 1.5h14.8v1.7H4.6v-1.7Z"
      />
    </Box>
  );
}

// Five favorite covers for the selected list, searched from IGDB, TMDB, or Open Library.
export function FavoriteMedia({ favorites, readOnly }: FavoriteMediaProps) {
  const [category, setCategory] = useState<FavoriteCategory>('All');
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updateFavorite, updateState] = useUpdateFavoriteSlotMutation();
  const slots = slotsFor(favorites, category);

  async function save(
    slot: number,
    pick: {
      title: string;
      mediaType: string;
      externalId: string;
      posterUrl: string;
    } | null,
    isNumberOne: boolean,
  ) {
    try {
      await updateFavorite({
        slot,
        category,
        title: pick?.title.trim() || null,
        media_type: pick?.mediaType ?? null,
        external_id: pick ? pick.externalId.trim() || `manual_${Date.now()}` : null,
        poster_path: pick?.posterUrl.trim() || null,
        is_number_one: pick == null ? false : isNumberOne,
      }).unwrap();
      setError(null);
      setActiveSlot(null);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not update favorites'));
    }
  }

  const active = activeSlot == null ? null : slots[activeSlot];

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, mt: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, letterSpacing: 0.4, whiteSpace: 'nowrap' }}>
          Favorites
        </Typography>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="favorite-list-label">List</InputLabel>
          <Select
            labelId="favorite-list-label"
            label="List"
            value={category}
            onChange={(event) => setCategory(event.target.value as FavoriteCategory)}
          >
            {LIST_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Box sx={{ flex: 1, height: '1px', backgroundColor: palette.borderStrong }} />
      </Box>

      {error && activeSlot == null && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2}>
        {slots.map((slot) => {
          const title = slot.title;
          return (
            <Grid
              key={slot.slot}
              size={CARD_GRID_COLS[0]}
              sx={{
                minWidth: 0,
                '&:hover .promote-crown, &:focus-within .promote-crown': { opacity: 1 },
                '@media (hover: none)': {
                  '& .promote-crown': { opacity: 0.45 },
                },
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'center', height: 42 }}>
                {title && slot.is_number_one && (
                  <IconButton
                    size="small"
                    aria-label={
                      readOnly
                        ? `${title} is the number one favorite`
                        : `Clear number one favorite from ${title}`
                    }
                    disabled={readOnly || updateState.isLoading}
                    onClick={() => {
                      if (!readOnly) {
                        save(
                          slot.slot,
                          {
                            title,
                            mediaType: slot.media_type ?? 'Game',
                            externalId: slot.external_id ?? '',
                            posterUrl: slot.poster_path ?? '',
                          },
                          false,
                        );
                      }
                    }}
                    title="Number one favorite"
                    sx={{
                      color: CROWN_YELLOW,
                      p: 0.25,
                      filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.65))',
                      '&.Mui-disabled': { color: CROWN_YELLOW },
                    }}
                  >
                    <CrownMark />
                  </IconButton>
                )}
                {title && !slot.is_number_one && !readOnly && (
                  <IconButton
                    className="promote-crown"
                    size="small"
                    aria-label={`Mark ${title} as number one favorite`}
                    disabled={updateState.isLoading}
                    onClick={() =>
                      save(
                        slot.slot,
                        {
                          title,
                          mediaType: slot.media_type ?? 'Game',
                          externalId: slot.external_id ?? '',
                          posterUrl: slot.poster_path ?? '',
                        },
                        true,
                      )
                    }
                    title="Mark as #1"
                    sx={{ color: CROWN_YELLOW, p: 0.25, opacity: 0, transition: 'opacity 0.15s ease' }}
                  >
                    <CrownMark />
                  </IconButton>
                )}
              </Box>

              {title ? (
                <Box
                  sx={{
                    position: 'relative',
                    '&:hover .favorite-actions, &:focus-within .favorite-actions': { opacity: 1 },
                    '@media (hover: none)': {
                      '& .favorite-actions': { opacity: 1 },
                    },
                  }}
                >
                  <Box
                    role={readOnly ? undefined : 'button'}
                    tabIndex={readOnly ? undefined : 0}
                    aria-label={readOnly ? title : `Edit ${title}`}
                    onClick={() => {
                      if (!readOnly) setActiveSlot(slot.slot);
                    }}
                    onKeyDown={(event) => {
                      if (readOnly) return;
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setActiveSlot(slot.slot);
                      }
                    }}
                    sx={{
                      aspectRatio: '2 / 3',
                      borderRadius: 1.5,
                      overflow: 'hidden',
                      cursor: readOnly ? 'default' : 'pointer',
                      border: `1px solid ${slot.is_number_one ? CROWN_YELLOW : palette.border}`,
                      boxShadow: slot.is_number_one
                        ? '0 0 0 1px rgba(245, 197, 24, 0.45), 0 8px 18px rgba(0,0,0,0.35)'
                        : '0 8px 18px rgba(0,0,0,0.28)',
                      backgroundColor: palette.paper,
                    }}
                  >
                    <Box
                      component="img"
                      src={slot.poster_path || FALLBACK_POSTER}
                      alt={title}
                      draggable={false}
                      sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  </Box>
                  {!readOnly && (
                    <Box
                      className="favorite-actions"
                      sx={{
                        position: 'absolute',
                        top: 6,
                        right: 6,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 0.5,
                        opacity: 0,
                        transition: 'opacity 0.15s ease',
                      }}
                    >
                      <IconButton
                        size="small"
                        aria-label={`Change favorite ${slot.slot + 1}`}
                        disabled={updateState.isLoading}
                        onClick={() => setActiveSlot(slot.slot)}
                        sx={actionButtonSx}
                      >
                        <SearchIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                      <IconButton
                        size="small"
                        aria-label={`Remove ${title} from favorites`}
                        disabled={updateState.isLoading}
                        onClick={() => save(slot.slot, null, false)}
                        sx={actionButtonSx}
                      >
                        <CloseIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>
                  )}
                </Box>
              ) : (
                <Box
                  component="button"
                  type="button"
                  aria-label={`Add favorite ${slot.slot + 1}`}
                  disabled={readOnly || updateState.isLoading}
                  onClick={() => setActiveSlot(slot.slot)}
                  sx={{
                    width: '100%',
                    aspectRatio: '2 / 3',
                    borderRadius: 1.5,
                    border: `1px dashed ${palette.borderStrong}`,
                    backgroundColor: palette.fieldBg,
                    color: palette.primary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: readOnly ? 'default' : 'pointer',
                    font: 'inherit',
                    p: 0,
                    '&:hover': readOnly
                      ? undefined
                      : { backgroundColor: palette.selectedBg, borderColor: palette.primary },
                    '&:disabled': { cursor: 'default' },
                  }}
                >
                  {!readOnly && <AddIcon sx={{ fontSize: 52 }} />}
                </Box>
              )}
            </Grid>
          );
        })}
      </Grid>

      {active != null && !readOnly && (
        <FavoritePickerDialog
          key={`${category}:${active.slot}:${active.external_id ?? 'empty'}`}
          category={category}
          slot={active}
          pending={updateState.isLoading}
          error={error}
          onClose={() => {
            if (!updateState.isLoading) {
              setError(null);
              setActiveSlot(null);
            }
          }}
          onSave={(pick) => save(active.slot, pick, active.is_number_one)}
        />
      )}
    </Box>
  );
}

const actionButtonSx = {
  width: 26,
  height: 26,
  color: '#fff',
  backgroundColor: 'rgba(0,0,0,0.62)',
  '&:hover': { backgroundColor: 'rgba(0,0,0,0.82)' },
} as const;

function FavoritePickerDialog({
  category,
  slot,
  pending,
  error,
  onClose,
  onSave,
}: {
  category: FavoriteCategory;
  slot: FavoriteSlot;
  pending: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (pick: { title: string; mediaType: MediaType; externalId: string; posterUrl: string }) => void;
}) {
  const typeChoices: readonly MediaType[] | null =
    category === 'All' ? MEDIA_TYPES : category === 'Game' ? ['Game', 'DLC'] : null;
  const initialType: MediaType =
    category === 'Game'
      ? slot.media_type === 'DLC'
        ? 'DLC'
        : 'Game'
      : category === 'All' && isMediaType(slot.media_type ?? '')
        ? (slot.media_type as MediaType)
        : category === 'All'
          ? 'Game'
          : category;
  const [mediaType, setMediaType] = useState<MediaType>(initialType);
  const [title, setTitle] = useState(slot.title ?? '');
  const [externalId, setExternalId] = useState(slot.external_id ?? '');
  const [posterUrl, setPosterUrl] = useState(slot.poster_path ?? '');
  const [detailLoading, setDetailLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const provider = getCoverProvider(mediaType);
  const skipSearchForTitle = slot.title ?? undefined;

  const handleTypeChange = (next: MediaType) => {
    setMediaType(next);
    setTitle('');
    setExternalId('');
    setPosterUrl('');
    setSearchError(null);
  };

  return (
    <Dialog open onClose={pending ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Favorite {slot.slot + 1}</DialogTitle>
      <DialogContent>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} sx={{ pt: 1 }}>
          <FavoriteCoverEditor
            title={title}
            externalId={externalId}
            posterUrl={posterUrl}
            provider={provider}
            disabled={pending}
            onApply={(next) => {
              setExternalId(next.externalId);
              setPosterUrl(next.posterUrl);
              if (next.title) setTitle(next.title);
            }}
            onError={(message) => setSearchError(message)}
          />
          <Stack spacing={2} sx={{ flex: 1, minWidth: 0 }}>
            {typeChoices != null ? (
              <ChipPicker
                label="Media type"
                options={typeChoices}
                value={mediaType}
                onChange={handleTypeChange}
                getSelectedColors={() => MEDIA_TYPE_SELECTED_COLORS}
              />
            ) : (
              <Typography variant="body2" color="text.secondary">
                Searching {provider}
              </Typography>
            )}
            {provider === 'IGDB' ? (
              <IgdbGameSearch
                key={mediaType}
                open
                title={title}
                skipSearchForTitle={skipSearchForTitle}
                fieldSx={fieldSx}
                onTitleChange={(value, hadSelection) => {
                  setTitle(value);
                  if (hadSelection) {
                    setExternalId('');
                    setPosterUrl('');
                  }
                }}
                onSelectionChange={(_game, loading) => setDetailLoading(loading)}
                onGameLoaded={(game) => {
                  setTitle(game.name);
                  setExternalId(game.external_id);
                  setPosterUrl(game.poster_path ?? '');
                  setSearchError(null);
                }}
                onError={(err) => setSearchError(coverFetchErrorMessage(err, 'IGDB'))}
              />
            ) : provider === 'TMDB' ? (
              <TmdbTitleSearch
                key={mediaType}
                open
                title={title}
                mediaType={mediaType as TmdbMediaType}
                skipSearchForTitle={skipSearchForTitle}
                fieldSx={fieldSx}
                onTitleChange={(value, hadSelection) => {
                  setTitle(value);
                  if (hadSelection) {
                    setExternalId('');
                    setPosterUrl('');
                  }
                }}
                onSelectionChange={(_result, loading) => setDetailLoading(loading)}
                onTitleLoaded={(result) => {
                  setTitle(result.name);
                  setExternalId(result.external_id);
                  setPosterUrl(result.poster_path ?? '');
                  setSearchError(null);
                }}
                onError={(err) => setSearchError(coverFetchErrorMessage(err, 'TMDB'))}
              />
            ) : (
              <OpenLibraryBookSearch
                key={mediaType}
                open
                title={title}
                skipSearchForTitle={skipSearchForTitle}
                fieldSx={fieldSx}
                onTitleChange={(value, hadSelection) => {
                  setTitle(value);
                  if (hadSelection) {
                    setExternalId('');
                    setPosterUrl('');
                  }
                }}
                onSelectionChange={(_book, loading) => setDetailLoading(loading)}
                onBookLoaded={(book) => {
                  setTitle(book.name);
                  setExternalId(book.external_id);
                  setPosterUrl(book.poster_path ?? '');
                  setSearchError(null);
                }}
                onError={(err) => setSearchError(coverFetchErrorMessage(err, 'Open Library'))}
              />
            )}
          </Stack>
        </Stack>
        {(searchError || error) && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {searchError || error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={pending}>
          Cancel
        </Button>
        <Button
          variant="contained"
          disabled={pending || detailLoading || !title.trim()}
          onClick={() =>
            onSave({
              title: title.trim(),
              mediaType,
              externalId,
              posterUrl,
            })
          }
        >
          {pending ? 'Saving…' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function FavoriteCoverEditor({
  title,
  externalId,
  posterUrl,
  provider,
  disabled,
  onApply,
  onError,
}: {
  title: string;
  externalId: string;
  posterUrl: string;
  provider: CoverProvider;
  disabled: boolean;
  onApply: (details: { externalId: string; posterUrl: string; title?: string }) => void;
  onError: (message: string) => void;
}) {
  const [fetchIgdbGame] = useLazyFetchIgdbGameQuery();
  const [open, setOpen] = useState(false);
  const [applying, setApplying] = useState(false);
  const [draft, setDraft] = useState({ externalId: '', posterUrl: '' });

  const handleOpen = () => {
    setDraft({ externalId, posterUrl });
    setOpen(true);
  };

  const handleApply = async () => {
    const nextExternalId = draft.externalId.trim();
    const nextPosterUrl = draft.posterUrl.trim();
    const igdbId = provider === 'IGDB' ? parseIgdbExternalId(nextExternalId) : null;

    if (igdbId == null) {
      onApply({ externalId: nextExternalId, posterUrl: nextPosterUrl });
      setOpen(false);
      return;
    }

    setApplying(true);
    try {
      const result = await fetchIgdbGame(igdbId).unwrap();
      onApply({
        title: result.name,
        externalId: result.external_id,
        posterUrl: nextPosterUrl || result.poster_path || '',
      });
      setOpen(false);
    } catch (err) {
      onError(coverFetchErrorMessage(err, 'IGDB'));
      onApply({ externalId: nextExternalId, posterUrl: nextPosterUrl });
      setOpen(false);
    } finally {
      setApplying(false);
    }
  };

  return (
    <>
      <Box
        component="button"
        type="button"
        onClick={handleOpen}
        disabled={disabled}
        aria-label="Edit cover details"
        sx={{
          position: 'relative',
          width: 148,
          flexShrink: 0,
          alignSelf: { xs: 'center', sm: 'flex-start' },
          p: 0,
          border: 'none',
          borderRadius: 2,
          background: 'none',
          cursor: 'pointer',
          lineHeight: 0,
          '&:hover .cover-edit-overlay, &:focus-visible .cover-edit-overlay': { opacity: 1 },
        }}
      >
        <Box
          sx={{
            aspectRatio: '2 / 3',
            borderRadius: 2,
            overflow: 'hidden',
            backgroundColor: palette.paper,
            border: `1px solid ${palette.border}`,
          }}
        >
          {posterUrl.trim() ? (
            <Box
              component="img"
              src={posterUrl.trim()}
              alt={title || 'Cover preview'}
              sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : null}
        </Box>
        <Box
          className="cover-edit-overlay"
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 2,
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            opacity: 0,
            transition: 'opacity 0.15s ease',
            color: palette.textOnDark,
          }}
        >
          <EditOutlinedIcon sx={{ fontSize: 32 }} />
        </Box>
      </Box>

      <Dialog open={open} onClose={applying ? undefined : () => setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Cover details</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="External ID"
              helperText={
                provider === 'IGDB'
                  ? 'Enter an IGDB id to fetch cover and details on Apply.'
                  : `Optional. Filled by ${provider}, or generated on save.`
              }
              value={draft.externalId}
              onChange={(event) => setDraft((prev) => ({ ...prev, externalId: event.target.value }))}
              disabled={applying}
              fullWidth
              sx={fieldSx}
            />
            <TextField
              label="Poster URL"
              helperText={`Cover source: ${provider}. Paste a URL to use a custom cover.`}
              value={draft.posterUrl}
              onChange={(event) => setDraft((prev) => ({ ...prev, posterUrl: event.target.value }))}
              disabled={applying}
              fullWidth
              sx={fieldSx}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)} disabled={applying}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => void handleApply()}
            disabled={applying}
            startIcon={applying ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            Apply
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
