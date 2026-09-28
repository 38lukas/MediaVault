'use client';

import { Box, Button, SvgIcon, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { palette } from '@/lib/palette';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { clearUsername } from '@/redux/authSlice';
import { openCreateMediaModal, setViewMode } from '@/redux/libraryUiSlice';
import { mediaApi } from '@/redux/mediaApi';
import type { ViewMode } from '@/types/media';

/**
 * Library page header with title, layout toggle, add button, and logout.
 * @returns Header toolbar bound to Redux library UI + auth state.
 */
export function LibraryHeader() {
  const dispatch = useAppDispatch();
  const viewMode = useAppSelector((state) => state.libraryUi.viewMode);
  const username = useAppSelector((state) => state.auth.username);

  /**
   * Clears the session and drops cached media entries for the next login.
   */
  const handleLogout = () => {
    dispatch(clearUsername());
    dispatch(mediaApi.util.resetApiState());
  };

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
        <Typography
          variant="h4"
          component="h1"
          sx={{ fontWeight: 'bold', color: palette.primary }}
        >
          MediaVault
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {username
            ? `Signed in as ${username}`
            : 'Manage your movies, series, anime and games in one place.'}
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
          sx={{
            gap: 0.75,
            '& .MuiToggleButtonGroup-grouped': {
              border: `1px solid ${palette.borderMuted} !important`,
              borderRadius: '10px !important',
              margin: 0,
              px: 1.5,
              py: 1.1,
              backgroundColor: 'transparent',
              transition: 'background-color 0.15s ease',
              '&:hover': {
                backgroundColor: palette.fieldBg,
              },
              '&:active': {
                backgroundColor: 'transparent',
              },
              '&.Mui-selected': {
                backgroundColor: 'transparent',
                borderColor: `${palette.primary} !important`,
                '&:hover': {
                  backgroundColor: palette.fieldBg,
                },
                '&:active': {
                  backgroundColor: 'transparent',
                },
              },
            },
          }}
        >
          <ToggleButton value="cards" aria-label="Card view" disableRipple>
            <Box
              sx={{
                width: 28,
                height: 28,
                backgroundColor: palette.primary,
                maskImage: 'url(/card_layout.png)',
                maskSize: 'contain',
                maskRepeat: 'no-repeat',
                maskPosition: 'center',
                WebkitMaskImage: 'url(/card_layout.png)',
                WebkitMaskSize: 'contain',
                WebkitMaskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center',
              }}
            />
          </ToggleButton>
          <ToggleButton value="list" aria-label="List view" disableRipple>
            <Box
              sx={{
                width: 28,
                height: 28,
                backgroundColor: palette.primary,
                maskImage: 'url(/list_layout.png)',
                maskSize: 'contain',
                maskRepeat: 'no-repeat',
                maskPosition: 'center',
                WebkitMaskImage: 'url(/list_layout.png)',
                WebkitMaskSize: 'contain',
                WebkitMaskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center',
              }}
            />
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

        <Button variant="outlined" onClick={handleLogout} sx={{ whiteSpace: 'nowrap' }}>
          Log out
        </Button>
      </Box>
    </Box>
  );
}
