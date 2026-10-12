'use client';

import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SvgIcon,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { openCreateMediaModal } from '@/redux/slices/mediaModalSlice';
import {
  setCardSize,
  setSearchQuery,
  setSortDirection,
  setSortField,
  setTypeFilter,
} from '@/redux/slices/libraryUiSlice';
import {
  CARD_SIZE_OPTIONS,
  SORT_FIELD_OPTIONS,
  TYPE_FILTERS,
  isCardSize,
  type SortDirection,
  type SortField,
  type TypeFilter,
} from '@/types/media';

// Library filters, sort controls, grid size, and add-media action.
export function LibraryToolbar() {
  const dispatch = useAppDispatch();
  const viewingAs = useAppSelector((state) => state.auth.viewingAs);
  const {
    typeFilter,
    sortField,
    sortDirection,
    searchQuery,
    cardSize,
  } = useAppSelector((state) => state.libraryUi);

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
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel id="grid-size-label">Grid Size</InputLabel>
            <Select
              labelId="grid-size-label"
              label="Grid Size"
              value={cardSize}
              onChange={(e) => {
                const size = Number(e.target.value);
                if (isCardSize(size)) dispatch(setCardSize(size));
              }}
              aria-label="Grid size"
            >
              {CARD_SIZE_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {!viewingAs && (
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
          )}
        </Box>
      </Box>
    </>
  );
}
