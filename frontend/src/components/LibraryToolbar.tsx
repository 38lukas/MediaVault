'use client';

import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import {
  setSortDirection,
  setSortField,
  setTypeFilter,
  toggleGroupByFinishedMonth,
} from '@/redux/libraryUiSlice';
import { TYPE_FILTERS, type SortDirection, type SortField, type TypeFilter } from '@/types/media';

/**
 * Type filter, sort field/direction, and month-grouping controls.
 * @returns Toolbar bound to Redux library UI state.
 */
export function LibraryToolbar() {
  const dispatch = useAppDispatch();
  const { typeFilter, sortField, sortDirection, groupByFinishedMonth } = useAppSelector(
    (state) => state.libraryUi
  );

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
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel id="sort-by-label">Sort by</InputLabel>
          <Select
            labelId="sort-by-label"
            label="Sort by"
            value={sortField}
            onChange={(e) => dispatch(setSortField(e.target.value as SortField))}
          >
            <MenuItem value="title">Title</MenuItem>
            <MenuItem value="status">Status</MenuItem>
            <MenuItem value="started_at">Started at</MenuItem>
            <MenuItem value="finished_at">Finished at</MenuItem>
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

        <ToggleButton
          size="small"
          value="months"
          selected={groupByFinishedMonth}
          onChange={() => dispatch(toggleGroupByFinishedMonth())}
          aria-label="Group by finished month"
        >
          Months
        </ToggleButton>
      </Box>
    </>
  );
}
