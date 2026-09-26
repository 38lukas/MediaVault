'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material';
import type { MediaItem } from '@/components/MediaCard';
import {
  useCreateMediaEntryMutation,
  useDeleteMediaEntryMutation,
  useLazyFetchIgdbCoverQuery,
  useUpdateMediaEntryMutation,
} from '@/redux/api';

const MEDIA_TYPES = ['Game', 'Movie', 'Series', 'Anime'] as const;

/** Statuses allowed per media type (mirrors backend ALLOWED_STATUSES). */
const STATUSES_BY_TYPE: Record<(typeof MEDIA_TYPES)[number], string[]> = {
  Game: ['Playing', 'Finished', 'Dropped', 'Shelved', 'Backlog', 'Wishlist'],
  Movie: ['Watching', 'Finished', 'Dropped', 'Watchlist'],
  Series: ['Watching', 'Finished', 'Dropped', 'Watchlist'],
  Anime: ['Watching', 'Finished', 'Dropped', 'Watchlist'],
};

type MediaType = (typeof MEDIA_TYPES)[number];

const INITIAL_FORM = {
  title: '',
  mediaType: 'Game' as MediaType,
  status: 'Playing',
  externalId: '',
  posterUrl: '',
};

function isMediaType(value: string): value is MediaType {
  return (MEDIA_TYPES as readonly string[]).includes(value);
}

interface AddMediaModalProps {
  open: boolean;
  onClose: () => void;
  /** When set, the dialog edits this entry instead of creating a new one. */
  item?: MediaItem | null;
}

export function AddMediaModal({ open, onClose, item = null }: AddMediaModalProps) {
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

  // Prefill form when opening create vs edit.
  useEffect(() => {
    if (!open) return;

    if (item) {
      const mediaType = isMediaType(item.type) ? item.type : 'Game';
      const statuses = STATUSES_BY_TYPE[mediaType];
      setForm({
        title: item.title,
        mediaType,
        status: statuses.includes(item.status) ? item.status : statuses[0],
        externalId: item.external_id ?? '',
        posterUrl: item.cover_url ?? '',
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

  const statuses = useMemo(() => STATUSES_BY_TYPE[form.mediaType], [form.mediaType]);

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

  const handleClose = () => {
    if (isBusy) return;
    onClose();
  };

  /** Resolve poster + IGDB external id from the current game title. */
  const handleFetchCover = async () => {
    const title = form.title.trim();
    if (!title || form.mediaType !== 'Game') return;

    setFetchError(null);
    try {
      const result = await fetchIgdbCover(title).unwrap();
      setForm((prev) => ({
        ...prev,
        posterUrl: result.cover_url,
        // Prefer the IGDB id when the field is empty or still a manual fallback.
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

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const payload = {
      title: form.title.trim(),
      media_type: form.mediaType,
      status: form.status,
      // Backend requires external_id; generate a unique fallback if left blank.
      external_id: form.externalId.trim() || `manual_${Date.now()}`,
      poster_path: form.posterUrl.trim() || null,
    };

    try {
      if (isEdit && item) {
        await updateMediaEntry({ id: item.id, body: payload }).unwrap();
      } else {
        await createMediaEntry(payload).unwrap();
      }
      onClose();
    } catch {
      // Mutation error is surfaced via isError below.
    }
  };

  /** Delete the open entry from the database, then close the dialog. */
  const handleDelete = async () => {
    if (!item) return;
    try {
      await deleteMediaEntry(item.id).unwrap();
      onClose();
    } catch {
      // Mutation error is surfaced via isError below.
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <form onSubmit={handleSubmit}>
        <DialogTitle>{isEdit ? 'Edit media' : 'Add media'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {isError && <Alert severity="error">{errorMessage}</Alert>}
            {fetchError && <Alert severity="error">{fetchError}</Alert>}

            <TextField
              required
              label="Title"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              fullWidth
            />

            <FormControl fullWidth>
              <InputLabel id="media-type-label">Media Type</InputLabel>
              <Select
                labelId="media-type-label"
                label="Media Type"
                value={form.mediaType}
                onChange={(e) => {
                  const mediaType = e.target.value as MediaType;
                  const nextStatuses = STATUSES_BY_TYPE[mediaType];
                  setForm((prev) => ({
                    ...prev,
                    mediaType,
                    // Keep current status only if it is valid for the new type.
                    status: nextStatuses.includes(prev.status) ? prev.status : nextStatuses[0],
                  }));
                }}
              >
                {MEDIA_TYPES.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel id="status-label">Status</InputLabel>
              <Select
                labelId="status-label"
                label="Status"
                value={form.status}
                onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
              >
                {statuses.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="External ID"
              helperText="Optional. Filled by IGDB Fetch, or generated on save."
              value={form.externalId}
              onChange={(e) => setForm((prev) => ({ ...prev, externalId: e.target.value }))}
              fullWidth
            />

            <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
              <TextField
                label="Poster URL"
                value={form.posterUrl}
                onChange={(e) => setForm((prev) => ({ ...prev, posterUrl: e.target.value }))}
                fullWidth
                helperText={
                  form.mediaType === 'Game'
                    ? 'Use Fetch to pull the cover from IGDB by title.'
                    : undefined
                }
              />
              <Button
                variant="outlined"
                onClick={handleFetchCover}
                disabled={
                  form.mediaType !== 'Game' ||
                  !form.title.trim() ||
                  igdbState.isFetching ||
                  isBusy
                }
                sx={{ mt: 0.5, whiteSpace: 'nowrap', minWidth: 88 }}
              >
                {igdbState.isFetching ? '…' : 'Fetch'}
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          {isEdit && item && (
            <Button
              color="error"
              onClick={handleDelete}
              disabled={isBusy}
              sx={{ mr: 'auto' }}
            >
              {deleteState.isLoading ? 'Removing…' : 'Remove'}
            </Button>
          )}
          <Button onClick={handleClose} disabled={isBusy}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isBusy || !form.title.trim()}
          >
            {createState.isLoading || updateState.isLoading ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
