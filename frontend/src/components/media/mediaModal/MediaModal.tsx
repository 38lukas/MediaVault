'use client';

import { FormEvent, useEffect } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Stack,
  Typography,
} from '@mui/material';
import { CoverDetails } from './CoverDetails';
import { MediaModalTabs } from './MediaModalTabs';
import { getCoverProvider, fieldSx } from './constants';
import { useCoverAutoFetch } from './useCoverAutoFetch';
import { OverviewTab } from './overview/OverviewTab';
import { DetailsTab } from './details/DetailsTab';
import { JournalTab } from './journal/JournalTab';
import { palette } from '@/lib/palette';
import { isGameType } from '@/types/media';
import { getApiErrorMessage } from '@/utils/apiError';
import { toIsoDateOrNull } from '@/utils/date';
import { getStatusColor } from '@/utils/mediaStatus';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { closeMediaModal, patchForm, type MediaModalTab } from '@/redux/slices/mediaModalSlice';
import {
  useCreateMediaEntryMutation,
  useDeleteMediaEntryMutation,
  useUpdateMediaEntryMutation,
} from '@/redux/api/mediaApi';

/** Overview / Details panel: hidden but still sized while the other one is shown, removed on Journal. */
function partSx(activeTab: MediaModalTab, tab: MediaModalTab) {
  return {
    gridArea: '1 / 1',
    display: activeTab === 'journal' ? 'none' : 'block',
    visibility: activeTab === tab ? 'visible' : 'hidden',
  } as const;
}

/**
 * Create/edit media dialog with Overview / Details / Journal parts.
 * Open state, active part and the form draft live in mediaModalSlice.
 * @returns Media entry dialog bound to Redux + RTK Query mutations.
 */
export function MediaModal() {
  const dispatch = useAppDispatch();
  const { isOpen: open, editingItem: item, activeTab, form, igdbLoading, fetchError } =
    useAppSelector((state) => state.mediaModal);
  const isEdit = item != null;
  const [createMediaEntry, createState] = useCreateMediaEntryMutation();
  const [updateMediaEntry, updateState] = useUpdateMediaEntryMutation();
  const [deleteMediaEntry, deleteState] = useDeleteMediaEntryMutation();
  const isFetchingCover = useCoverAutoFetch() || igdbLoading;
  const usesIgdb = isGameType(form.mediaType);
  const statusStyle = getStatusColor(form.status);
  const partKey = `${open}:${item?.id ?? 'new'}`;

  const isBusy =
    createState.isLoading || updateState.isLoading || deleteState.isLoading || isFetchingCover;
  const isError =
    (isEdit ? updateState.isError : createState.isError) || deleteState.isError;
  const error = deleteState.isError
    ? deleteState.error
    : isEdit
      ? updateState.error
      : createState.error;
  const errorMessage = getApiErrorMessage(
    error,
    deleteState.isError
      ? 'Failed to delete media entry'
      : isEdit
        ? 'Failed to update media entry'
        : 'Failed to create media entry'
  );

  // Clear previous mutation errors when the dialog opens for another entry.
  useEffect(() => {
    if (!open) return;
    createState.reset();
    updateState.reset();
    deleteState.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item]);

  /**
   * Closes the dialog via Redux when no request is in flight.
   * @returns void
   */
  const handleClose = () => {
    if (isBusy) return;
    dispatch(closeMediaModal());
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
      playtime:
        usesIgdb && (form.playtimeHours !== '' || form.playtimeMinutes !== '')
          ? Number(form.playtimeHours || 0) * 60 + Number(form.playtimeMinutes || 0)
          : null,
      external_id: form.externalId.trim() || `manual_${Date.now()}`,
      poster_path: form.posterUrl.trim() || null,
      started_at: toIsoDateOrNull(form.startedAt),
      finished_at: toIsoDateOrNull(form.finishedAt),
      rating: form.rating,
      release_date: usesIgdb ? form.releaseDate || null : null,
      platforms: usesIgdb ? form.platforms : null,
      franchises: usesIgdb ? form.franchises : null,
      genres: usesIgdb ? form.genres : null,
      developers: usesIgdb ? form.developers : null,
      publishers: usesIgdb ? form.publishers : null,
      platform_played_on: usesIgdb ? form.platformPlayedOn || null : null,
      played_dates: form.playedDates,
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
      // Pinned to the top so a taller part only grows the dialog downward.
      sx={{ '& .MuiDialog-container': { alignItems: 'flex-start' } }}
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
            mt: '5vh',
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
          flex: 1,
          minHeight: 0,
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
          <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>
            {form.title.trim() || (isEdit ? 'Edit media' : 'Add media')}
          </Typography>
        </Box>

        <DialogContent
          sx={{
            px: 3,
            py: 3,
            flex: '1 1 auto',
            minHeight: 0,
            overflowY: 'auto',
            scrollbarGutter: 'stable',
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
              <Box sx={{ width: { xs: '100%', md: 220 }, flexShrink: 0 }}>
                <CoverDetails
                  key={partKey}
                  posterUrl={form.posterUrl}
                  title={form.title}
                  externalId={form.externalId}
                  coverProvider={getCoverProvider(form.mediaType)}
                  statusBorder={statusStyle.border}
                  statusShadow={statusStyle.bg}
                  fieldSx={fieldSx}
                  onApply={(details) => dispatch(patchForm(details))}
                />
                <MediaModalTabs />
              </Box>

              {/* Parts stay mounted so IGDB search state and the journal month survive switching.
                  Overview and Details share one grid cell, so the dialog keeps the same height for both. */}
              <Box sx={{ flex: 1, minWidth: 0, display: 'grid' }}>
                <Box sx={partSx(activeTab, 'overview')}>
                  <OverviewTab isFetchingCover={isFetchingCover} />
                </Box>
                <Box sx={partSx(activeTab, 'details')}>
                  <DetailsTab />
                </Box>
                <Box sx={{ gridArea: '1 / 1', display: activeTab === 'journal' ? 'block' : 'none' }}>
                  <JournalTab key={partKey} />
                </Box>
              </Box>
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
