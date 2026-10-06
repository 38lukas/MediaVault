'use client';

import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import { DEFAULT_PRIMARY_COLOR } from '@/lib/palette';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setPrimaryColor } from '@/redux/settingsSlice';

export function AppearanceSection() {
  const dispatch = useAppDispatch();
  const primaryColor = useAppSelector((state) => state.settings.primaryColor);

  return (
    <Stack spacing={2.5} sx={{ minWidth: 0 }}>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Primary color
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Choose the accent color used throughout the site.
        </Typography>
      </Box>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          label="Select color"
          type="color"
          value={primaryColor}
          onChange={(event) => dispatch(setPrimaryColor(event.target.value))}
          slotProps={{
            inputLabel: { shrink: true },
            htmlInput: {
              'aria-label': 'Select primary color',
              sx: { width: 76, height: 52, p: 0.5, cursor: 'pointer' },
            },
          }}
          sx={{ width: 140 }}
        />
        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
          {primaryColor.toUpperCase()}
        </Typography>
        <Button
          variant="text"
          onClick={() => dispatch(setPrimaryColor(DEFAULT_PRIMARY_COLOR))}
          disabled={primaryColor.toLowerCase() === DEFAULT_PRIMARY_COLOR}
        >
          Reset
        </Button>
      </Stack>
    </Stack>
  );
}
