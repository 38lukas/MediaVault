'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import Image from 'next/image';
import { getStatusColor } from '@/lib/mediaStatus';
import { palette } from '@/lib/palette';
import { toDateInputValue, toIsoDateOrNull } from '@/lib/dateUtils';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { closeMediaModal } from '@/redux/libraryUiSlice';
import {
  useCreateMediaEntryMutation,
  useDeleteMediaEntryMutation,
  useLazyFetchIgdbCoverQuery,
  useUpdateMediaEntryMutation,
} from '@/redux/mediaApi';

const MEDIA_TYPES = ['Game', 'DLC', 'Movie', 'Series', 'Anime'] as const;

/** Statuses allowed per media type (mirrors backend ALLOWED_STATUSES). */
const STATUSES_BY_TYPE: Record<(typeof MEDIA_TYPES)[number], string[]> = {
  Game: ['Playing', 'Finished', 'Dropped', 'Shelved', 'Backlog', 'Wishlist'],
  DLC: ['Playing', 'Finished', 'Dropped', 'Shelved', 'Backlog', 'Wishlist'],
  Movie: ['Watching', 'Watched', 'Dropped', 'Watchlist'],
  Series: ['Watching', 'Watched', 'Dropped', 'Watchlist'],
  Anime: ['Watching', 'Watched', 'Dropped', 'Watchlist'],
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
 * Create/edit media dialog.
 * Open state and editing item come from Redux; form fields stay local.
 * @returns Media entry dialog bound to library UI + RTK Query mutations.
 */
export function AddMediaModal() {
  const dispatch = useAppDispatch();
  const open = useAppSelector((state) => state.libraryUi.isMediaModalOpen);
  const item = useAppSelector((state) => state.libraryUi.editingItem);
  const isEdit = item != null;
  const [createMediaEntry, createState] = useCreateMediaEntryMutation();
  const [updateMediaEntry, updateState] = useUpdateMediaEntryMutation();
  const [deleteMediaEntry, deleteState] = useDeleteMediaEntryMutation();
  const [fetchIgdbCover, igdbState] = useLazyFetchIgdbCoverQuery();
  const [form, setForm] = useState(INITIAL_FORM);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const isBusy =
    createState.isLoading ||
    updateState.isLoading ||
    deleteState.isLoading ||
    igdbState.isFetching;
  const isError =
    (isEdit ? updateState.isError : createState.isError) || deleteState.isError;
  const error = deleteState.isError
    ? deleteState.error
    : isEdit
      ? updateState.error
      : createState.error;

  const supportsIgdb = form.mediaType === 'Game' || form.mediaType === 'DLC';
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
      });
      updateState.reset();
      deleteState.reset();
    } else {
      setForm(INITIAL_FORM);
      createState.reset();
    }
    setFetchError(null);
    // Only re-seed when the dialog opens or the edited item changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item]);

  const errorMessage =
    error && 'data' in error && error.data
      ? typeof error.data === 'string'
        ? error.data
        : JSON.stringify(error.data)
      : deleteState.isError
        ? 'Failed to delete media entry'
        : isEdit
          ? 'Failed to update media entry'
          : 'Failed to create media entry';

  /**
   * Closes the dialog via Redux when no request is in flight.
   * @returns void
   */
  const handleClose = () => {
    if (isBusy) return;
    dispatch(closeMediaModal());
  };

  /**
   * Resolves poster URL + IGDB external id from the current title.
   * @returns Promise that settles when the IGDB lookup finishes.
   */
  const handleFetchCover = async () => {
    const title = form.title.trim();
    if (!title || !supportsIgdb) return;

    setFetchError(null);
    try {
      const result = await fetchIgdbCover(title).unwrap();
      setForm((prev) => ({
        ...prev,
        posterUrl: result.poster_path,
        externalId:
          !prev.externalId.trim() || prev.externalId.startsWith('manual_')
            ? result.external_id
            : prev.externalId,
      }));
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'data' in err && err.data
          ? typeof err.data === 'string'
            ? err.data
            : typeof err.data === 'object' &&
                err.data !== null &&
                'detail' in err.data
              ? String((err.data as { detail: unknown }).detail)
              : 'Failed to fetch cover from IGDB'
          : 'Failed to fetch cover from IGDB';
      setFetchError(message);
    }
  };

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
            overflow: 'hidden',
            backgroundImage: 'none',
            backgroundColor: palette.surface,
            border: `1px solid ${palette.border}`,
          },
        },
      }}
    >
      <form onSubmit={handleSubmit}>
        {/* Header tinted by the currently selected status */}
        <Box
          sx={{
            px: 3,
            pt: 2.5,
            pb: 2,
            borderBottom: `1px solid ${palette.borderSubtle}`,
            background: `linear-gradient(135deg, ${statusStyle.bg} 0%, transparent 70%)`,
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
            <Box
              sx={{
                px: 1.5,
                py: 0.5,
                borderRadius: 999,
                backgroundColor: statusStyle.bg,
                border: `1px solid ${statusStyle.border}`,
                color: statusStyle.color,
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'capitalize',
              }}
            >
              {form.status}
            </Box>
          </Stack>
        </Box>

        <DialogContent sx={{ px: 3, py: 3 }}>
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
                  <Image
                    src={
                      form.posterUrl.trim() ||
                      'https://via.placeholder.com/300x450?text=No+Cover'
                    }
                    alt={form.title || 'Cover preview'}
                    fill
                    sizes="148px"
                    style={{ objectFit: 'cover' }}
                  />
                </Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', textAlign: 'center', mt: 1 }}
                >
                  Cover preview
                </Typography>
              </Box>

              <Stack spacing={2.25} sx={{ flex: 1, minWidth: 0 }}>
                <TextField
                  required
                  label="Title"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  fullWidth
                  sx={fieldSx}
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
                              ? `1px solid ${palette.borderSelected}`
                              : `1px solid ${palette.borderMuted}`,
                            backgroundColor: selected
                              ? palette.selectedBg
                              : palette.fieldBg,
                            color: selected ? palette.textOnDark : 'text.secondary',
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

                <TextField
                  label="External ID"
                  helperText="Optional. Filled by IGDB Fetch, or generated on save."
                  value={form.externalId}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, externalId: e.target.value }))
                  }
                  fullWidth
                  sx={fieldSx}
                />

                <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
                  <TextField
                    label="Poster URL"
                    value={form.posterUrl}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, posterUrl: e.target.value }))
                    }
                    fullWidth
                    helperText={
                      supportsIgdb
                        ? 'Fetch a cover from IGDB using the title.'
                        : undefined
                    }
                    sx={fieldSx}
                  />
                  <Button
                    variant="outlined"
                    onClick={handleFetchCover}
                    disabled={
                      !supportsIgdb ||
                      !form.title.trim() ||
                      igdbState.isFetching ||
                      isBusy
                    }
                    sx={{
                      mt: 0.5,
                      whiteSpace: 'nowrap',
                      minWidth: 96,
                      borderRadius: 2,
                      borderColor: statusStyle.border,
                      color: statusStyle.color,
                      '&:hover': {
                        borderColor: statusStyle.color,
                        backgroundColor: statusStyle.bg,
                      },
                    }}
                  >
                    {igdbState.isFetching ? '…' : 'Fetch'}
                  </Button>
                </Stack>
              </Stack>
            </Stack>
          </Stack>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            py: 2,
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
            disabled={isBusy || !form.title.trim()}
            sx={{
              borderRadius: 2,
              px: 2.5,
              backgroundColor: statusStyle.color,
              color: palette.primaryContrast,
              fontWeight: 700,
              '&:hover': {
                backgroundColor: statusStyle.color,
                filter: 'brightness(1.08)',
              },
              '&.Mui-disabled': {
                backgroundColor: palette.selectedBg,
                color: palette.textDisabled,
              },
            }}
          >
            {createState.isLoading || updateState.isLoading ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
