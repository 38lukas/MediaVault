'use client';

import Link from 'next/link';
import { Box, Button, IconButton, SvgIcon, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import SettingsIcon from '@mui/icons-material/Settings';
import { palette } from '@/lib/palette';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { openCreateMediaModal, setCardSize, setViewMode } from '@/redux/libraryUiSlice';
import type { CardSize, ViewMode } from '@/types/media';
import { CARD_SIZE_MAX, CARD_SIZE_MIN } from '@/types/media';

const SIZE_BUTTON_SX = {
  border: `1px solid ${palette.borderMuted}`,
  borderRadius: '10px',
  width: 44,
  height: 44,
  color: palette.primary,
  backgroundColor: 'transparent',
  transition: 'background-color 0.15s ease',
  '&:hover': {
    backgroundColor: palette.fieldBg,
  },
  '&.Mui-disabled': {
    color: palette.textDisabled,
    borderColor: palette.borderMuted,
  },
} as const;

/**
 * Library page header with title, layout toggle, add button, and settings link.
 * @returns Header toolbar bound to Redux library UI + auth state.
 */
export function LibraryHeader() {
  const dispatch = useAppDispatch();
  const viewMode = useAppSelector((state) => state.libraryUi.viewMode);
  const cardSize = useAppSelector((state) => state.libraryUi.cardSize);
  const username = useAppSelector((state) => state.auth.username);
  const showCardSizeControls = viewMode === 'cards';

  /**
   * Steps card size toward denser or larger cards.
   * @param delta - −1 to enlarge, +1 to shrink.
   */
  const adjustCardSize = (delta: -1 | 1) => {
    const next = Math.min(CARD_SIZE_MAX, Math.max(CARD_SIZE_MIN, cardSize + delta)) as CardSize;
    if (next !== cardSize) dispatch(setCardSize(next));
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
        {showCardSizeControls && (
          <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center' }}>
            <IconButton
              aria-label="Larger cards"
              disableRipple
              disabled={cardSize <= CARD_SIZE_MIN}
              onClick={() => adjustCardSize(-1)}
              sx={SIZE_BUTTON_SX}
            >
              <AddIcon fontSize="small" />
            </IconButton>
            <IconButton
              aria-label="Smaller cards"
              disableRipple
              disabled={cardSize >= CARD_SIZE_MAX}
              onClick={() => adjustCardSize(1)}
              sx={SIZE_BUTTON_SX}
            >
              <RemoveIcon fontSize="small" />
            </IconButton>
          </Box>
        )}

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

        <Button
          variant="outlined"
          component={Link}
          href="/settings"
          startIcon={<SettingsIcon />}
          sx={{ whiteSpace: 'nowrap' }}
        >
          Settings
        </Button>
      </Box>
    </Box>
  );
}
