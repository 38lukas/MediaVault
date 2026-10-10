'use client';

import {
  Box,
  Button,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  SvgIcon,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { palette } from '@/lib/palette';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { openCreateMediaModal } from '@/redux/slices/mediaModalSlice';
import {
  setCardSize,
  setSearchQuery,
  setSortDirection,
  setSortField,
  setTypeFilter,
  setViewMode,
} from '@/redux/slices/libraryUiSlice';
import {
  CARD_SIZE_MAX,
  CARD_SIZE_MIN,
  SORT_FIELD_OPTIONS,
  TYPE_FILTERS,
  type CardSize,
  type SortDirection,
  type SortField,
  type TypeFilter,
  type ViewMode,
} from '@/types/media';

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

const VIEW_TOGGLE_SX = {
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
} as const;

/** Type filter, title search, sort controls, and library layout actions.
 *
 *  @returns Toolbar bound to Redux library UI state.
 */
export function LibraryToolbar() {
  const dispatch = useAppDispatch();
  const {
    typeFilter,
    sortField,
    sortDirection,
    searchQuery,
    viewMode,
    cardSize,
  } = useAppSelector((state) => state.libraryUi);
  const showCardSizeControls = viewMode === 'cards';

  /** Steps card size toward denser or larger cards.
   *
   * @param delta - −1 to enlarge, +1 to shrink
   */
  const adjustCardSize = (delta: -1 | 1) => {
    const next = Math.min(CARD_SIZE_MAX, Math.max(CARD_SIZE_MIN, cardSize + delta)) as CardSize;
    if (next !== cardSize) dispatch(setCardSize(next));
  };

  return (
    <>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-start' }}>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={typeFilter}
          onChange={(_, next: TypeFilter | null) => {
            if (next) dispatch(setTypeFilter(next));
          }}
          aria-label="Filter by media type"
          sx={{ flexWrap: 'wrap' }}
        >
          {TYPE_FILTERS.map((type) => (
            <ToggleButton key={type} value={type} aria-label={`Show ${type}`}>
              {type}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      <Box
        sx={{
          mb: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          flexWrap: 'wrap',
          justifyContent: 'space-between',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            flexWrap: 'wrap',
            flex: '1 1 auto',
            minWidth: 0,
          }}
        >
          <TextField
            size="small"
            label="Search title"
            value={searchQuery}
            onChange={(e) => dispatch(setSearchQuery(e.target.value))}
            sx={{ minWidth: 200, flex: '1 1 200px', maxWidth: 320 }}
            slotProps={{ htmlInput: { 'aria-label': 'Search by title' } }}
          />

          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="sort-by-label">Sort by</InputLabel>
            <Select
              labelId="sort-by-label"
              label="Sort by"
              value={sortField}
              onChange={(e) => dispatch(setSortField(e.target.value as SortField))}
            >
              {SORT_FIELD_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <ToggleButtonGroup
            exclusive
            size="small"
            value={sortDirection}
            onChange={(_, next: SortDirection | null) => {
              if (next) dispatch(setSortDirection(next));
            }}
            aria-label="Sort direction"
          >
            <ToggleButton value="asc" aria-label="Ascending">
              Asc
            </ToggleButton>
            <ToggleButton value="desc" aria-label="Descending">
              Desc
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Box
          sx={{
            display: 'flex',
            gap: 1.5,
            alignItems: 'center',
            flexWrap: 'wrap',
            justifyContent: { xs: 'flex-start', sm: 'flex-end' },
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
            sx={VIEW_TOGGLE_SX}
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
            Add Media
          </Button>
        </Box>
      </Box>
    </>
  );
}
