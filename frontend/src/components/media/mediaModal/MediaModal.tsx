'use client';

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  InputAdornment,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import Image from 'next/image';
import { StarRating } from '@/components/common/StarRating';
import { Details } from './Details';
import { IgdbGameSearch } from './IgdbGameSearch';
import { palette } from '@/lib/palette';
import { getApiErrorMessage } from '@/utils/apiError';
import { toDateInputValue, toIsoDateOrNull } from '@/utils/date';
import { getStatusColor } from '@/utils/mediaStatus';
import { toDbRating } from '@/utils/rating';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { closeMediaModal } from '@/redux/libraryUiSlice';
import {
  useCreateMediaEntryMutation,
  useDeleteMediaEntryMutation,
  useLazyFetchOpenLibraryCoverQuery,
  useLazyFetchTmdbCoverQuery,
  useUpdateMediaEntryMutation,
  type IgdbGameLookup,
  type IgdbGameSearchResult,
} from '@/redux/mediaApi';

const MEDIA_TYPES = ['Game', 'DLC', 'Movie', 'Series', 'Anime', 'Book'] as const;

/** Wait for typing to settle before auto-fetching a cover. */
const AUTO_FETCH_DEBOUNCE_MS = 650;
/** Ignore short / incomplete titles for auto-fetch. */
const AUTO_FETCH_MIN_TITLE_LENGTH = 3;

/** Statuses allowed per media type (mirrors backend ALLOWED_STATUSES). */
const STATUSES_BY_TYPE: Record<(typeof MEDIA_TYPES)[number], string[]> = {
  Game: ['Playing', 'Finished', 'Played', 'Dropped', 'Shelved', 'Backlog', 'Wishlist'],
  DLC: ['Playing', 'Finished', 'Played', 'Dropped', 'Shelved', 'Backlog', 'Wishlist'],
  Movie: ['Watching', 'Watched', 'Dropped', 'Watchlist'],
  Series: ['Watching', 'Watched', 'Shelved', 'Dropped', 'Watchlist'],
  Anime: ['Watching', 'Watched', 'Shelved', 'Dropped', 'Watchlist'],
  Book: ['Reading', 'Read', 'Dropped', 'Backlog']
};

type MediaType = (typeof MEDIA_TYPES)[number];

const INITIAL_FORM = {
  title: '',
  mediaType: 'Game' as MediaType,
  status: 'Playing',
  playtimeHours: '',
  playtimeMinutes: '',
  releaseDate: '',
  platforms: [] as string[],
  franchise: '',
  genres: [] as string[],
  developers: [] as string[],
  publishers: [] as string[],
  platformPlayedOn: '',
  externalId: '',
  posterUrl: '',
  startedAt: '',
  finishedAt: '',
  rating: null as number | null, // DB 1–10, or null when unrated
};

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2,
    backgroundColor: palette.fieldBg,
  },
  '& .MuiInputBase-input[type="number"]': {
    MozAppearance: 'textfield',
    '&::-webkit-outer-spin-button': {
      WebkitAppearance: 'none',
      margin: 0,
    },
    '&::-webkit-inner-spin-button': {
      WebkitAppearance: 'none',
      margin: 0,
    },
  },
};

const sanitizeIntegerInput = (value: string) => value.replace(/\D/g, '');

function isMediaType(value: string): value is MediaType {
  return (MEDIA_TYPES as readonly string[]).includes(value);
}

/**
 * Builds a short cover-fetch error from an RTK / HTTP failure.
 *
 * @param err - Error thrown by a lazy query unwrap.
 * @param provider - IGDB or TMDB label for the message.
 * @returns Short user-facing error text.
 */
function coverFetchErrorMessage(err: unknown, provider: string): string {
  const status: number | string | null =
    err && typeof err === 'object' && 'status' in err
      ? ((err as { status: number | string }).status ?? null)
      : null;

  if (status === 404) {
    return provider === 'IGDB' ? 'No IGDB game found' : `No ${provider} cover found`;
  }
  if (status === 400) {
    return provider === 'Open Library'
      ? `${provider} rejected the request`
      : `${provider} is not configured`;
  }
  if (status === 502) return `${provider} unavailable`;

  const detail = getApiErrorMessage(err, '');
  if (detail && detail.length <= 80) return detail;

  return `${provider} cover fetch failed`;
}

/** Cache key for a title + media-type cover lookup. */
function coverQueryKey(title: string, mediaType: MediaType): string {
  return `${mediaType}:${title.trim().toLowerCase()}`;
}

/**
 * Create/edit media dialog.
 * Open state and editing item come from Redux; form fields stay local.
 * @returns Media entry dialog bound to library UI + RTK Query mutations.
 */
export function MediaModal() {
  const dispatch = useAppDispatch();
  const open = useAppSelector((state) => state.libraryUi.isMediaModalOpen);
  const item = useAppSelector((state) => state.libraryUi.editingItem);
  const isEdit = item != null;
  const [createMediaEntry, createState] = useCreateMediaEntryMutation();
  const [updateMediaEntry, updateState] = useUpdateMediaEntryMutation();
  const [deleteMediaEntry, deleteState] = useDeleteMediaEntryMutation();
  const [fetchOpenLibraryCover, openLibraryState] = useLazyFetchOpenLibraryCoverQuery();
  const [fetchTmdbCover, tmdbState] = useLazyFetchTmdbCoverQuery();
  const [form, setForm] = useState(INITIAL_FORM);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [coverDetailsOpen, setCoverDetailsOpen] = useState(false);
  const [coverDetailsDraft, setCoverDetailsDraft] = useState({
    externalId: '',
    posterUrl: '',
  });
  const [selectedIgdbGame, setSelectedIgdbGame] = useState<IgdbGameSearchResult | null>(null);
  const [isFetchingIgdbDetails, setIsFetchingIgdbDetails] = useState(false);
  const supportsPlaytime = form.mediaType === 'Game' || form.mediaType === 'DLC';
  // Skip repeat auto-fetches for the same title + media type.
  const lastCoverQueryKeyRef = useRef<string | null>(null);

  const isFetchingCover =
    isFetchingIgdbDetails || tmdbState.isFetching || openLibraryState.isFetching;
  const isBusy =
    createState.isLoading ||
    updateState.isLoading ||
    deleteState.isLoading ||
    isFetchingCover;
  const isError =
    (isEdit ? updateState.isError : createState.isError) || deleteState.isError;
  const error = deleteState.isError
    ? deleteState.error
    : isEdit
      ? updateState.error
      : createState.error;

  // Cover provider by media type: IGDB for games, TMDB for film/TV, Open Library for books.
  const usesIgdb = form.mediaType === 'Game' || form.mediaType === 'DLC';
  const usesTmdb =
    form.mediaType === 'Movie' ||
    form.mediaType === 'Series' ||
    form.mediaType === 'Anime';
  const usesOpenLibrary = form.mediaType === 'Book';
  const supportsCoverFetch = usesIgdb || usesTmdb || usesOpenLibrary;
  const coverProvider = usesIgdb
    ? 'IGDB'
    : usesTmdb
      ? 'TMDB'
      : usesOpenLibrary
        ? 'Open Library'
        : null;
  const statusStyle = getStatusColor(form.status);
  const statuses = useMemo(() => STATUSES_BY_TYPE[form.mediaType], [form.mediaType]);
  // Prefill form when opening create vs edit.
  useEffect(() => {
    if (!open) return;

    if (item) {
      const mediaType = isMediaType(item.media_type) ? item.media_type : 'Game';
      const nextStatuses = STATUSES_BY_TYPE[mediaType];
      // The form is intentionally reseeded when Redux opens an existing item.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        title: item.title,
        mediaType,
        status: nextStatuses.includes(item.status) ? item.status : nextStatuses[0],
        playtimeHours:
          item.playtime == null ? '' : String(Math.floor(item.playtime / 60)),
        playtimeMinutes:
          item.playtime == null ? '' : String(item.playtime % 60),
        releaseDate: item.release_date ?? '',
        platforms: item.platforms ?? [],
        franchise: item.franchise ?? '',
        genres: item.genres ?? [],
        developers: item.developers ?? [],
        publishers: item.publishers ?? [],
        platformPlayedOn: item.platform_played_on ?? '',
        externalId: item.external_id ?? '',
        posterUrl: item.poster_path ?? '',
        startedAt: toDateInputValue(item.started_at),
        finishedAt: toDateInputValue(item.finished_at),
        rating: item.rating ?? null,
      });
      // Editing: do not auto-refetch the cover already on the entry.
      lastCoverQueryKeyRef.current = coverQueryKey(item.title, mediaType);
      updateState.reset();
      deleteState.reset();
    } else {
      setForm(INITIAL_FORM);
      lastCoverQueryKeyRef.current = null;
      createState.reset();
    }
    setSelectedIgdbGame(null);
    setIsFetchingIgdbDetails(false);
    setFetchError(null);
    setCoverDetailsOpen(false);
    // Only re-seed when the dialog opens or the edited item changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item]);

  const errorMessage = getApiErrorMessage(
    error,
    deleteState.isError
      ? 'Failed to delete media entry'
      : isEdit
        ? 'Failed to update media entry'
        : 'Failed to create media entry'
  );

  /**
   * Closes the dialog via Redux when no request is in flight.
   * @returns void
   */
  const handleClose = () => {
    if (isBusy) return;
    dispatch(closeMediaModal());
  };

  const handleOpenCoverDetails = () => {
    setCoverDetailsDraft({
      externalId: form.externalId,
      posterUrl: form.posterUrl,
    });
    setCoverDetailsOpen(true);
  };

  const handleApplyCoverDetails = () => {
    setForm((prev) => ({
      ...prev,
      externalId: coverDetailsDraft.externalId,
      posterUrl: coverDetailsDraft.posterUrl,
    }));
    setCoverDetailsOpen(false);
  };

  const handleIgdbTitleChange = (title: string, hadSelection: boolean) => {
    setSelectedIgdbGame(null);
    setIsFetchingIgdbDetails(false);
    setFetchError(null);
    lastCoverQueryKeyRef.current = null;
    setForm((prev) => ({
      ...prev,
      title,
      ...(hadSelection
        ? {
            posterUrl: '',
            externalId: prev.externalId.startsWith('igdb_') ? '' : prev.externalId,
          }
        : {}),
      releaseDate: '',
      platforms: [],
      franchise: '',
      genres: [],
      developers: [],
      publishers: [],
      platformPlayedOn: '',
    }));
  };

  const handleIgdbSelectionChange = (
    game: IgdbGameSearchResult | null,
    loading: boolean,
  ) => {
    setSelectedIgdbGame(game);
    setIsFetchingIgdbDetails(loading);
    if (game) {
      lastCoverQueryKeyRef.current = coverQueryKey(game.name, form.mediaType);
      setForm((prev) => ({ ...prev, title: game.name }));
    }
  };

  const handleIgdbGameLoaded = (result: IgdbGameLookup) => {
    setForm((prev) => ({
      ...prev,
      title: result.name,
      posterUrl: result.poster_path ?? '',
      releaseDate:
        result.first_release_date == null
          ? ''
          : new Date(result.first_release_date * 1000).toISOString(),
      platforms: result.platforms,
      franchise: result.franchise ?? '',
      genres: result.genres,
      developers: result.developers,
      publishers: result.publishers,
      externalId:
        !prev.externalId.trim() || prev.externalId.startsWith('manual_')
          ? result.external_id
          : prev.externalId,
    }));
  };

  const handleIgdbSearchError = useCallback((err: unknown) => {
    setFetchError(coverFetchErrorMessage(err, 'IGDB'));
  }, []);

  /**
  * Resolves poster URL + external id from the title via the matching provider.
   *
   * @param options - Optional overrides for auto-fetch (title, media type, cache).
   * @returns Promise that settles when the cover lookup finishes.
   */
  const handleFetchCover = async (options?: {
    title?: string;
    mediaType?: MediaType;
    preferCacheValue?: boolean;
  }) => {
    const title = (options?.title ?? form.title).trim();
    const mediaType = options?.mediaType ?? form.mediaType;
    const preferCacheValue = options?.preferCacheValue ?? false;
    const tmdb =
      mediaType === 'Movie' || mediaType === 'Series' || mediaType === 'Anime';
    const openLibrary = mediaType === 'Book';
    const provider = tmdb ? 'TMDB' : openLibrary ? 'Open Library' : null;

    if (!title || !provider) return;

    const queryKey = coverQueryKey(title, mediaType);
    setFetchError(null);

    try {
      const result = tmdb
        ? await fetchTmdbCover(
              { name: title, mediaType: mediaType as 'Movie' | 'Series' | 'Anime' },
              preferCacheValue,
            ).unwrap()
          : await fetchOpenLibraryCover(title, preferCacheValue).unwrap();

      lastCoverQueryKeyRef.current = queryKey;
      setForm((prev) => {
        // Drop stale responses if the user kept typing or changed type.
        if (
          prev.title.trim().toLowerCase() !== title.toLowerCase() ||
          prev.mediaType !== mediaType
        ) {
          return prev;
        }
        return {
          ...prev,
          posterUrl: result.poster_path,
          externalId:
            !prev.externalId.trim() || prev.externalId.startsWith('manual_')
              ? result.external_id
              : prev.externalId,
        };
      });
    } catch (err) {
      // Ignore aborted / superseded lazy requests.
      if (
        err &&
        typeof err === 'object' &&
        'name' in err &&
        (err as { name: string }).name === 'AbortError'
      ) {
        return;
      }
      setFetchError(coverFetchErrorMessage(err, provider));
    }
  };

  // Debounced auto-fetch when the title looks complete for the selected type.
  useEffect(() => {
    if (!open || !supportsCoverFetch || !coverProvider || usesIgdb) return;

    const title = form.title.trim();
    if (title.length < AUTO_FETCH_MIN_TITLE_LENGTH) {
      return;
    }

    const queryKey = coverQueryKey(title, form.mediaType);
    if (queryKey === lastCoverQueryKeyRef.current) return;

    const timer = window.setTimeout(() => {
      void handleFetchCover({
        title,
        mediaType: form.mediaType,
        preferCacheValue: true,
      });
    }, AUTO_FETCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
    // handleFetchCover closes over latest lazy triggers; deps are the inputs that matter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, form.title, form.mediaType, supportsCoverFetch, coverProvider, usesIgdb]);

  /**
   * Creates or updates the entry, then closes the modal.
   * @param event - Form submit event.
   * @returns Promise that settles when the mutation finishes.
   */
  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const payload = {
      title: form.title.trim(),
      media_type: form.mediaType,
      status: form.status,
      playtime:
        supportsPlaytime &&
        (form.playtimeHours !== '' || form.playtimeMinutes !== '')
          ? Number(form.playtimeHours || 0) * 60 + Number(form.playtimeMinutes || 0)
          : null,
      external_id: form.externalId.trim() || `manual_${Date.now()}`,
      poster_path: form.posterUrl.trim() || null,
      started_at: toIsoDateOrNull(form.startedAt),
      finished_at: toIsoDateOrNull(form.finishedAt),
      rating: form.rating,
      release_date: usesIgdb ? form.releaseDate || null : null,
      platforms: usesIgdb ? form.platforms : null,
      franchise: usesIgdb ? form.franchise || null : null,
      genres: usesIgdb ? form.genres : null,
      developers: usesIgdb ? form.developers : null,
      publishers: usesIgdb ? form.publishers : null,
      platform_played_on: supportsPlaytime ? form.platformPlayedOn || null : null,
    };

    try {
      if (isEdit && item) {
        await updateMediaEntry({ id: item.id, body: payload }).unwrap();
      } else {
        await createMediaEntry(payload).unwrap();
      }
      dispatch(closeMediaModal());
    } catch {
      // Mutation error is surfaced via isError below.
    }
  };

  /**
   * Deletes the open entry from the database, then closes the dialog.
   * @returns Promise that settles when the delete mutation finishes.
   */
  const handleDelete = async () => {
    if (!item) return;
    try {
      await deleteMediaEntry(item.id).unwrap();
      dispatch(closeMediaModal());
    } catch {
      // Mutation error is surfaced via isError below.
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="md"
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            backgroundImage: 'none',
            backgroundColor: palette.surface,
            border: `1px solid ${palette.border}`,
          },
        },
      }}
    >
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          maxHeight: '90vh',
          overflow: 'hidden',
        }}
      >
        {/* Dark header — status colors stay on chips / cover only */}
        <Box
          sx={{
            px: 3,
            pt: 2.5,
            pb: 2,
            flexShrink: 0,
            borderBottom: `1px solid ${palette.borderSubtle}`,
            backgroundColor: palette.surface,
          }}
        >
          <Typography variant="overline" sx={{ color: 'text.secondary', letterSpacing: 1.2 }}>
            {isEdit ? 'Edit entry' : 'New entry'}
          </Typography>
          <Stack
            direction="row"
            spacing={1.5}
            sx={{ alignItems: 'center', flexWrap: 'wrap', mt: 0.5 }}
          >
            <Typography variant="h5" sx={{ fontWeight: 700, flex: 1, minWidth: 0 }}>
              {form.title.trim() || (isEdit ? 'Edit media' : 'Add media')}
            </Typography>
          </Stack>
        </Box>

        <DialogContent
          sx={{
            px: 3,
            py: 3,
            flex: '1 1 auto',
            minHeight: 0,
            overflowY: 'auto',
          }}
        >
          <Stack spacing={2.5}>
            {isError && <Alert severity="error">{errorMessage}</Alert>}
            {fetchError && <Alert severity="error">{fetchError}</Alert>}

            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={3}
              sx={{ alignItems: { md: 'flex-start' } }}
            >
              {/* Live poster preview */}
              <Box
                sx={{
                  width: { xs: '100%', md: 220 },
                  flexShrink: 0,
                  alignSelf: { xs: 'center', md: 'flex-start' },
                }}
              >
                <Box
                  component="button"
                  type="button"
                  onClick={handleOpenCoverDetails}
                  aria-label="Edit cover details"
                  sx={{
                    position: 'relative',
                    display: 'block',
                    width: { xs: 120, md: 148 },
                    mx: { xs: 'auto', md: 0 },
                    p: 0,
                    border: 'none',
                    borderRadius: 2.5,
                    background: 'none',
                    cursor: 'pointer',
                    lineHeight: 0,
                    '&:hover .cover-edit-overlay, &:focus-visible .cover-edit-overlay': {
                      opacity: 1,
                    },
                    '&:focus-visible': {
                      outline: `2px solid ${palette.primary}`,
                      outlineOffset: 2,
                    },
                  }}
                >
                  <Box
                    sx={{
                      position: 'relative',
                      aspectRatio: '2 / 3',
                      borderRadius: 2.5,
                      overflow: 'hidden',
                      backgroundColor: palette.surfaceElevated,
                      border: `1px solid ${statusStyle.border}`,
                      boxShadow: `0 12px 32px ${statusStyle.bg}`,
                    }}
                  >
                    {form.posterUrl.trim() ? (
                      <Image
                        src={form.posterUrl.trim()}
                        alt={form.title || 'Cover preview'}
                        fill
                        sizes="148px"
                        style={{ objectFit: 'cover' }}
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
                      borderRadius: 2.5,
                      backgroundColor: 'rgba(0, 0, 0, 0.55)',
                      opacity: 0,
                      transition: 'opacity 0.15s ease',
                      color: palette.textOnDark,
                    }}
                  >
                    <EditOutlinedIcon sx={{ fontSize: 36 }} />
                  </Box>
                </Box>
              </Box>

              <Stack spacing={2.25} sx={{ flex: 1, minWidth: 0 }}>
                {usesIgdb ? (
                  <IgdbGameSearch
                    key={`${open}:${item?.id ?? 'new'}:${form.mediaType}`}
                    open={open}
                    title={form.title}
                    skipSearchForTitle={
                      isEdit && item &&
                      (item.media_type === 'Game' || item.media_type === 'DLC')
                        ? item.title
                        : undefined
                    }
                    fieldSx={fieldSx}
                    onTitleChange={handleIgdbTitleChange}
                    onSelectionChange={handleIgdbSelectionChange}
                    onGameLoaded={handleIgdbGameLoaded}
                    onError={handleIgdbSearchError}
                  />
                ) : (
                  <TextField
                    required
                    label="Title"
                    value={form.title}
                    onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
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

                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: 2,
                    flexWrap: 'wrap',
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 220 }}>
                    <Typography
                      variant="caption"
                      sx={{ color: 'text.secondary', mb: 1, display: 'block', fontWeight: 600 }}
                    >
                      Media type
                    </Typography>
                    <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                      {MEDIA_TYPES.map((type) => {
                        const selected = form.mediaType === type;
                        return (
                          <Box
                            key={type}
                            component="button"
                            type="button"
                            onClick={() => {
                              const nextStatuses = STATUSES_BY_TYPE[type];
                              if (type !== form.mediaType) {
                                setSelectedIgdbGame(null);
                                setIsFetchingIgdbDetails(false);
                                lastCoverQueryKeyRef.current = null;
                              }
                              setForm((prev) => ({
                                ...prev,
                                mediaType: type,
                                playtimeHours:
                                  type === 'Game' || type === 'DLC'
                                    ? prev.playtimeHours
                                    : '',
                                playtimeMinutes:
                                  type === 'Game' || type === 'DLC'
                                    ? prev.playtimeMinutes
                                    : '',
                                ...(type !== form.mediaType
                                  ? {
                                      releaseDate: '',
                                      platforms: [],
                                      franchise: '',
                                      genres: [],
                                      developers: [],
                                      publishers: [],
                                      platformPlayedOn: '',
                                    }
                                  : {}),
                                status: nextStatuses.includes(prev.status)
                                  ? prev.status
                                  : nextStatuses[0],
                              }));
                            }}
                            sx={{
                              cursor: 'pointer',
                              border: selected
                                ? `1px solid ${palette.primary}`
                                : `1px solid ${palette.borderMuted}`,
                              backgroundColor: selected
                                ? palette.primary
                                : palette.fieldBg,
                              color: selected ? palette.primaryContrast : 'text.secondary',
                              borderRadius: 999,
                              px: 1.5,
                              py: 0.6,
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              fontFamily: 'inherit',
                            }}
                          >
                            {type}
                          </Box>
                        );
                      })}
                    </Stack>
                  </Box>

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
                          type="text"
                          size="small"
                          value={form.playtimeHours}
                          onKeyDown={(event) => {
                            if (['e', 'E', '+', '-', '.', ','].includes(event.key)) {
                              event.preventDefault();
                            }
                          }}
                          onChange={(event) => {
                            const nextValue = sanitizeIntegerInput(event.target.value);
                            setForm((prev) => ({
                              ...prev,
                              playtimeHours: nextValue,
                            }));
                          }}
                          slotProps={{
                            htmlInput: {
                              inputMode: 'numeric',
                              pattern: '[0-9]*',
                              min: 0,
                              step: 1,
                            },
                          }}
                          sx={{ ...fieldSx, width: 96 }}
                        />
                        <TextField
                          label="mins"
                          type="text"
                          size="small"
                          value={form.playtimeMinutes}
                          onKeyDown={(event) => {
                            if (['e', 'E', '+', '-', '.', ','].includes(event.key)) {
                              event.preventDefault();
                            }
                          }}
                          onChange={(event) => {
                            const nextValue = sanitizeIntegerInput(event.target.value);
                            setForm((prev) => ({
                              ...prev,
                              playtimeMinutes: nextValue,
                            }));
                          }}
                          slotProps={{
                            htmlInput: {
                              inputMode: 'numeric',
                              pattern: '[0-9]*',
                              min: 0,
                              max: 59,
                              step: 1,
                            },
                          }}
                          sx={{ ...fieldSx, width: 96 }}
                        />
                      </Stack>
                    </Box>
                  )}
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    sx={{ color: 'text.secondary', mb: 1, display: 'block', fontWeight: 600 }}
                  >
                    Status
                  </Typography>
                  <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                    {statuses.map((status) => {
                      const colors = getStatusColor(status);
                      const selected = form.status === status;
                      return (
                        <Box
                          key={status}
                          component="button"
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, status }))}
                          sx={{
                            cursor: 'pointer',
                            border: `1px solid ${selected ? colors.border : palette.border}`,
                            backgroundColor: selected ? colors.bg : palette.fieldBg,
                            color: selected ? colors.color : 'text.secondary',
                            borderRadius: 999,
                            px: 1.5,
                            py: 0.6,
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            fontFamily: 'inherit',
                            textTransform: 'capitalize',
                            transition: 'background-color 0.15s ease, border-color 0.15s ease',
                          }}
                        >
                          {status}
                        </Box>
                      );
                    })}
                  </Stack>
                </Box>

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
                      onChange={(stars) =>
                        setForm((prev) => ({ ...prev, rating: toDbRating(stars) }))
                      }
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
                          onChange={(event) =>
                            setForm((prev) => ({
                              ...prev,
                              platformPlayedOn: event.target.value,
                            }))
                          }
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
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, startedAt: e.target.value }))
                    }
                    fullWidth
                    slotProps={{ inputLabel: { shrink: true } }}
                    sx={fieldSx}
                  />
                  <TextField
                    label="Finished at"
                    type="date"
                    value={form.finishedAt}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, finishedAt: e.target.value }))
                    }
                    fullWidth
                    slotProps={{ inputLabel: { shrink: true } }}
                    sx={fieldSx}
                  />
                </Stack>

                {usesIgdb && (
                  <Details
                    key={`${open}:${item?.id ?? 'new'}`}
                    showIgdbDetails={isEdit || selectedIgdbGame != null}
                    loading={selectedIgdbGame != null && isFetchingIgdbDetails}
                    platforms={form.platforms}
                    genres={form.genres}
                    releaseDate={form.releaseDate}
                    developers={form.developers}
                    publishers={form.publishers}
                    franchise={form.franchise}
                  />
                )}
              </Stack>
            </Stack>
          </Stack>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            py: 2,
            flexShrink: 0,
            borderTop: `1px solid ${palette.borderSubtle}`,
            backgroundColor: palette.footerBg,
          }}
        >
          {isEdit && item && (
            <Button
              color="error"
              variant="text"
              onClick={handleDelete}
              disabled={isBusy}
              sx={{ mr: 'auto', borderRadius: 2 }}
            >
              {deleteState.isLoading ? 'Removing…' : 'Remove'}
            </Button>
          )}
          <Button onClick={handleClose} disabled={isBusy} sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={isBusy || !form.title.trim()}
            sx={{
              borderRadius: 2,
              px: 2.5,
              fontWeight: 700,
            }}
          >
            {createState.isLoading || updateState.isLoading ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Box>
      <Dialog
        open={coverDetailsOpen}
        onClose={() => setCoverDetailsOpen(false)}
        fullWidth
        maxWidth="xs"
        slotProps={{
          paper: {
            sx: {
              borderRadius: 2,
              backgroundColor: palette.surface,
              border: `1px solid ${palette.border}`,
              backgroundImage: 'none',
            },
          },
        }}
      >
        <DialogTitle>Cover details</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="External ID"
              helperText={
                coverProvider
                  ? `Optional. Filled by ${coverProvider}, or generated on save.`
                  : 'Optional. Generated on save if empty.'
              }
              value={coverDetailsDraft.externalId}
              onChange={(event) =>
                setCoverDetailsDraft((prev) => ({
                  ...prev,
                  externalId: event.target.value,
                }))
              }
              fullWidth
              sx={fieldSx}
            />
            <TextField
              label="Poster URL"
              helperText={coverProvider ? `Cover source: ${coverProvider}` : undefined}
              value={coverDetailsDraft.posterUrl}
              onChange={(event) =>
                setCoverDetailsDraft((prev) => ({
                  ...prev,
                  posterUrl: event.target.value,
                }))
              }
              fullWidth
              sx={fieldSx}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCoverDetailsOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleApplyCoverDetails}>
            Apply
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
}
