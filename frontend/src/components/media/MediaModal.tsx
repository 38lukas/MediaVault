'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Image from 'next/image';
import { StarRating } from '@/components/common/StarRating';
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
  useLazyFetchIgdbCoverQuery,
  useLazyFetchOpenLibraryCoverQuery,
  useLazyFetchTmdbCoverQuery,
  useUpdateMediaEntryMutation,
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
  Series: ['Watching', 'Watched', 'Dropped', 'Watchlist'],
  Anime: ['Watching', 'Watched', 'Dropped', 'Watchlist'],
  Book: ['Reading', 'Read', 'Dropped', 'Backlog']
};

type MediaType = (typeof MEDIA_TYPES)[number];

const INITIAL_FORM = {
  title: '',
  mediaType: 'Game' as MediaType,
  status: 'Playing',
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
};

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

  if (status === 404) return `No ${provider} cover found`;
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
  const [fetchIgdbCover, igdbState] = useLazyFetchIgdbCoverQuery();
  const [fetchOpenLibraryCover, openLibraryState] = useLazyFetchOpenLibraryCoverQuery();
  const [fetchTmdbCover, tmdbState] = useLazyFetchTmdbCoverQuery();
  const [form, setForm] = useState(INITIAL_FORM);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [moreOptionsOpen, setMoreOptionsOpen] = useState(false);
  // Skip repeat auto-fetches for the same title + media type.
  const lastCoverQueryKeyRef = useRef<string | null>(null);

  const isFetchingCover =
    igdbState.isFetching || tmdbState.isFetching || openLibraryState.isFetching;
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
      setForm({
        title: item.title,
        mediaType,
        status: nextStatuses.includes(item.status) ? item.status : nextStatuses[0],
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
    setFetchError(null);
    setMoreOptionsOpen(false);
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
    const igdb = mediaType === 'Game' || mediaType === 'DLC';
    const tmdb =
      mediaType === 'Movie' || mediaType === 'Series' || mediaType === 'Anime';
    const openLibrary = mediaType === 'Book';
    const provider = igdb ? 'IGDB' : tmdb ? 'TMDB' : openLibrary ? 'Open Library' : null;

    if (!title || !provider) return;

    const queryKey = coverQueryKey(title, mediaType);
    setFetchError(null);

    try {
      const result = igdb
        ? await fetchIgdbCover(title, preferCacheValue).unwrap()
        : tmdb
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
    if (!open || !supportsCoverFetch || !coverProvider) return;

    const title = form.title.trim();
    if (title.length < AUTO_FETCH_MIN_TITLE_LENGTH) {
      setFetchError(null);
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
  }, [open, form.title, form.mediaType, supportsCoverFetch, coverProvider]);

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
      external_id: form.externalId.trim() || `manual_${Date.now()}`,
      poster_path: form.posterUrl.trim() || null,
      started_at: toIsoDateOrNull(form.startedAt),
      finished_at: toIsoDateOrNull(form.finishedAt),
      rating: form.rating,
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
                  width: { xs: 120, md: 148 },
                  flexShrink: 0,
                  alignSelf: { xs: 'center', md: 'flex-start' },
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
              </Box>

              <Stack spacing={2.25} sx={{ flex: 1, minWidth: 0 }}>
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

                <Box>
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
                            setForm((prev) => ({
                              ...prev,
                              mediaType: type,
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

                <Box>
                  <Typography
                    variant="caption"
                    sx={{ color: 'text.secondary', mb: 1, display: 'block', fontWeight: 600 }}
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

                <Box>
                  <Button
                    type="button"
                    onClick={() => setMoreOptionsOpen((prev) => !prev)}
                    endIcon={
                      <ExpandMoreIcon
                        sx={{
                          transform: moreOptionsOpen ? 'rotate(180deg)' : 'none',
                          transition: 'transform 0.2s ease',
                        }}
                      />
                    }
                    sx={{
                      color: 'text.secondary',
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      textTransform: 'none',
                      px: 0,
                      minWidth: 0,
                      '&:hover': {
                        backgroundColor: 'transparent',
                        color: 'text.primary',
                      },
                    }}
                  >
                    More Options
                  </Button>
                  <Collapse in={moreOptionsOpen}>
                    <Stack spacing={2} sx={{ pt: 1.5 }}>
                      <TextField
                        label="External ID"
                        helperText={
                          coverProvider
                            ? `Optional. Filled by ${coverProvider} Fetch, or generated on save.`
                            : 'Optional. Generated on save if empty.'
                        }
                        value={form.externalId}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, externalId: e.target.value }))
                        }
                        fullWidth
                        sx={fieldSx}
                      />

                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{ alignItems: 'flex-start' }}
                      >
                        <TextField
                          label="Poster URL"
                          value={form.posterUrl}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, posterUrl: e.target.value }))
                          }
                          fullWidth
                          helperText={
                            coverProvider
                              ? `Auto-fetches from ${coverProvider} after you finish the title.`
                              : undefined
                          }
                          sx={fieldSx}
                        />
                        <Button
                          variant="outlined"
                          color="primary"
                          onClick={() => void handleFetchCover()}
                          disabled={
                            !supportsCoverFetch ||
                            !form.title.trim() ||
                            isFetchingCover ||
                            isBusy
                          }
                          sx={{
                            mt: 0.5,
                            whiteSpace: 'nowrap',
                            minWidth: 96,
                            borderRadius: 2,
                          }}
                        >
                          {isFetchingCover ? '…' : 'Fetch'}
                        </Button>
                      </Stack>
                    </Stack>
                  </Collapse>
                </Box>
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
    </Dialog>
  );
}
