'use client';

import { useState } from 'react';
import {
  Box,
  Button,
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

interface CoverDetailsProps {
  posterUrl: string;
  title: string;
  externalId: string;
  coverProvider: string | null;
  statusBorder: string;
  statusShadow: string;
  fieldSx: object;
  onApply: (details: { externalId: string; posterUrl: string }) => void;
}

/**
 * Clickable cover preview and nested dialog for editing external id / poster URL.
 *
 * @param props - Current cover values and apply handler from MediaModal.
 * @returns Cover preview button plus cover-details dialog.
 */
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
  const [open, setOpen] = useState(false);
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

  const handleApply = () => {
    onApply({
      externalId: draft.externalId,
      posterUrl: draft.posterUrl,
    });
    setOpen(false);
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
        onClose={() => setOpen(false)}
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
              value={draft.externalId}
              onChange={(event) =>
                setDraft((prev) => ({
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
              value={draft.posterUrl}
              onChange={(event) =>
                setDraft((prev) => ({
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
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleApply}>
            Apply
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
