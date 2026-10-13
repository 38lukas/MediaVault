'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import Image from 'next/image';
import { palette } from '@/lib/palette';
import { useAppDispatch } from '@/redux/hooks';
import { useLazyFetchIgdbGameQuery } from '@/redux/api';
import {
  igdbGameLoaded,
  lookupSelectionChanged,
  patchForm,
  setFetchError,
} from '@/redux/slices/mediaModalSlice';
import { parseIgdbExternalId, type CoverProvider } from './constants';
import { coverFetchErrorMessage } from './useCoverAutoFetch';

interface CoverDetailsProps {
  posterUrl: string;
  title: string;
  externalId: string;
  coverProvider: CoverProvider | null;
  statusBorder: string;
  statusShadow: string;
  fieldSx: object;
  onApply: (details: { externalId: string; posterUrl: string }) => void;
}

// Clickable cover preview with dialog to edit external id and poster URL.
export function CoverDetails({
  posterUrl,
  title,
  externalId,
  coverProvider,
  statusBorder,
  statusShadow,
  fieldSx,
  onApply,
}: CoverDetailsProps) {
  const dispatch = useAppDispatch();
  const [fetchIgdbGame] = useLazyFetchIgdbGameQuery();
  const [open, setOpen] = useState(false);
  const [applying, setApplying] = useState(false);
  const [draft, setDraft] = useState({
    externalId: '',
    posterUrl: '',
  });

  const handleOpen = () => {
    setDraft({
      externalId,
      posterUrl,
    });
    setOpen(true);
  };

  const handleApply = async () => {
    const nextExternalId = draft.externalId.trim();
    const nextPosterUrl = draft.posterUrl.trim();
    const igdbId =
      coverProvider === 'IGDB' ? parseIgdbExternalId(nextExternalId) : null;

    if (igdbId == null) {
      onApply({
        externalId: nextExternalId,
        posterUrl: nextPosterUrl,
      });
      setOpen(false);
      return;
    }

    setApplying(true);
    dispatch(setFetchError(null));
    dispatch(lookupSelectionChanged({ name: title.trim() || null, loading: true }));
    try {
      const result = await fetchIgdbGame(igdbId).unwrap();
      dispatch(igdbGameLoaded(result));
      dispatch(
        patchForm({
          externalId: result.external_id,
          ...(nextPosterUrl ? { posterUrl: nextPosterUrl } : {}),
        }),
      );
      dispatch(lookupSelectionChanged({ name: result.name, loading: false }));
      setOpen(false);
    } catch (err) {
      dispatch(lookupSelectionChanged({ name: null, loading: false }));
      dispatch(setFetchError(coverFetchErrorMessage(err, 'IGDB')));
      onApply({
        externalId: nextExternalId,
        posterUrl: nextPosterUrl,
      });
      setOpen(false);
    } finally {
      setApplying(false);
    }
  };

  return (
    <>
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
          onClick={handleOpen}
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
              border: `1px solid ${statusBorder}`,
              boxShadow: `0 12px 32px ${statusShadow}`,
            }}
          >
            {posterUrl.trim() ? (
              <Image
                src={posterUrl.trim()}
                alt={title || 'Cover preview'}
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

      <Dialog
        open={open}
        onClose={() => {
          if (!applying) setOpen(false);
        }}
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
                coverProvider === 'IGDB'
                  ? 'Enter an IGDB id to fetch cover and details on Apply.'
                  : coverProvider
                    ? `Optional. Filled by ${coverProvider}, or generated on save.`
                    : 'Optional. Generated on save if empty.'
              }
              value={draft.externalId}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  externalId: event.target.value,
                }))
              }
              disabled={applying}
              fullWidth
              sx={fieldSx}
            />
            <TextField
              label="Poster URL"
              helperText={coverProvider ? `Cover source: ${coverProvider}` : undefined}
              value={draft.posterUrl}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  posterUrl: event.target.value,
                }))
              }
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
