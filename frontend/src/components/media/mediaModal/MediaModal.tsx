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

function partSx(activeTab: MediaModalTab, tab: MediaModalTab) {
  return {
    gridArea: '1 / 1',
    display: activeTab === 'journal' ? 'none' : 'block',
    visibility: activeTab === tab ? 'visible' : 'hidden',
  } as const;
}

// Create/edit media dialog with overview, details, and journal tabs.
export function MediaModal() {
  const dispatch = useAppDispatch();
  const viewingAs = useAppSelector((state) => state.auth.viewingAs);
  const readOnly = Boolean(viewingAs);
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

  useEffect(() => {
    if (!open) return;
    createState.reset();
    updateState.reset();
    deleteState.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item]);

  const handleClose = () => {
    if (isBusy) return;
    dispatch(closeMediaModal());
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (readOnly) return;
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
    }
  };

  const handleDelete = async () => {
    if (readOnly || !item) return;
    try {
      await deleteMediaEntry(item.id).unwrap();
      dispatch(closeMediaModal());
    } catch {
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="md"
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
            {readOnly ? 'View entry' : isEdit ? 'Edit entry' : 'New entry'}
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>
            {form.title.trim() || (readOnly ? 'Media' : isEdit ? 'Edit media' : 'Add media')}
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
          <fieldset
            disabled={readOnly}
            style={{ border: 'none', margin: 0, padding: 0, minInlineSize: 0 }}
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
                    onApply={(details) => {
                      if (!readOnly) dispatch(patchForm(details));
                    }}
                  />
                  <MediaModalTabs />
                </Box>

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
          </fieldset>
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
          {!readOnly && isEdit && item && (
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
            {readOnly ? 'Close' : 'Cancel'}
          </Button>
          {!readOnly && (
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
          )}
        </DialogActions>
      </Box>
    </Dialog>
  );
}
