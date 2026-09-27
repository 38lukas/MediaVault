'use client';

import { Box, Button, SvgIcon, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { openCreateMediaModal, setViewMode } from '@/redux/libraryUiSlice';
import type { ViewMode } from '@/types/media';

/**
 * Library page header with title, layout toggle, and add button.
 * @returns Header toolbar bound to Redux library UI state.
 */
export function LibraryHeader() {
  const dispatch = useAppDispatch();
  const viewMode = useAppSelector((state) => state.libraryUi.viewMode);

  return (
    <Box
      sx={{
        mb: 4,
        display: 'flex',
        alignItems: { xs: 'stretch', sm: 'flex-start' },
        justifyContent: 'space-between',
        gap: 2,
        flexDirection: { xs: 'column', sm: 'row' },
      }}
    >
      <Box>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          MediaVault
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage your movies, series, anime and games in one place.
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'flex',
          gap: 1.5,
          alignItems: 'center',
          flexWrap: 'wrap',
          justifyContent: { xs: 'stretch', sm: 'flex-end' },
        }}
      >
        <ToggleButtonGroup
          exclusive
          size="small"
          value={viewMode}
          onChange={(_, next: ViewMode | null) => {
            if (next) dispatch(setViewMode(next));
          }}
          aria-label="Library layout"
        >
          <ToggleButton value="cards" aria-label="Card view">
            Cards
          </ToggleButton>
          <ToggleButton value="list" aria-label="List view">
            List
          </ToggleButton>
        </ToggleButtonGroup>

        <Button
          variant="contained"
          startIcon={
            <SvgIcon fontSize="small">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </SvgIcon>
          }
          onClick={() => dispatch(openCreateMediaModal())}
          sx={{ whiteSpace: 'nowrap' }}
        >
          Add Game / Media
        </Button>
      </Box>
    </Box>
  );
}
