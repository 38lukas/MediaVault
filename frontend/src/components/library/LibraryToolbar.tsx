'use client';

import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import {
  setSearchQuery,
  setSortDirection,
  setSortField,
  setTypeFilter,
} from '@/redux/libraryUiSlice';
import {
  SORT_FIELD_OPTIONS,
  TYPE_FILTERS,
  type SortDirection,
  type SortField,
  type TypeFilter,
} from '@/types/media';

/** Type filter, title search, and sort field/direction controls.
 *
 *  @returns Toolbar bound to Redux library UI state.
 */
export function LibraryToolbar() {
  const dispatch = useAppDispatch();
  const { typeFilter, sortField, sortDirection, searchQuery } = useAppSelector((state) => state.libraryUi);

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
          justifyContent: 'flex-start',
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
    </>
  );
}

