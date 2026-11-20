'use client';

import {
  Box,
  Checkbox,
  CircularProgress,
  FormControl,
  FormHelperText,
  InputLabel,
  ListItemText,
  MenuItem,
  Select,
  Stack,
} from '@mui/material';
import { useAppSelector } from '@/redux/hooks';
import {
  useGetUserSettingsQuery,
  useUpdateUserSettingsMutation,
} from '@/redux/api';
import {
  CARD_SIZE_OPTIONS,
  SORT_FIELD_OPTIONS,
  TYPE_FILTERS,
  TYPE_FILTER_LABELS,
  UNIFIED_STATUS_FILTERS,
  isCardSize,
  type SortField,
  type TypeFilter,
} from '@/types/media';

// General settings: default library sort field, media type filter, and grid size.
export function GeneralSection() {
  const username = useAppSelector((state) => state.auth.username);
  const { data: settings, isLoading } = useGetUserSettingsQuery(undefined, {
    skip: !username,
  });
  const [updateUserSettings, updateState] = useUpdateUserSettingsMutation();

  const defaultSort = settings?.default_sort_field ?? 'status';
  const defaultCardSize = settings?.default_card_size ?? 2;
  const defaultTypeFilter = settings?.default_type_filter ?? 'All';
  // Statuses loaded when the library opens; never configured = all.
  const loadedStatuses: readonly string[] = settings?.library_loaded_statuses ?? UNIFIED_STATUS_FILTERS;

  const handleSortChange = (field: SortField) => {
    void updateUserSettings({ default_sort_field: field });
  };

  const handleTypeFilterChange = (filter: TypeFilter) => {
    void updateUserSettings({ default_type_filter: filter });
  };

  const handleLoadedStatusesChange = (value: string | string[]) => {
    const selected = typeof value === 'string' ? value.split(',') : value;
    void updateUserSettings({
      library_loaded_statuses: UNIFIED_STATUS_FILTERS.filter((label) => selected.includes(label)),
    });
  };

  const handleCardSizeChange = (value: string | number) => {
    const size = Number(value);
    if (isCardSize(size)) void updateUserSettings({ default_card_size: size });
  };

  if (isLoading && !settings) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  return (
    <Stack spacing={3} sx={{ flex: 1, minWidth: 0 }}>
      <FormControl fullWidth>
        <InputLabel id="default-sort-label">Default Sort By</InputLabel>
        <Select
          labelId="default-sort-label"
          label="Default Sort By"
          value={defaultSort}
          onChange={(e) => handleSortChange(e.target.value as SortField)}
          disabled={updateState.isLoading}
        >
          {SORT_FIELD_OPTIONS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth>
        <InputLabel id="default-type-filter-label">Default Media Type</InputLabel>
        <Select
          labelId="default-type-filter-label"
          label="Default Media Type"
          value={defaultTypeFilter}
          onChange={(e) => handleTypeFilterChange(e.target.value as TypeFilter)}
          disabled={updateState.isLoading}
        >
          {TYPE_FILTERS.map((filter) => (
            <MenuItem key={filter} value={filter}>
              {TYPE_FILTER_LABELS[filter]}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth>
        <InputLabel id="default-grid-size-label">Default Grid Size</InputLabel>
        <Select
          labelId="default-grid-size-label"
          label="Default Grid Size"
          value={defaultCardSize}
          onChange={(e) => handleCardSizeChange(e.target.value)}
          disabled={updateState.isLoading}
        >
          {CARD_SIZE_OPTIONS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth disabled={updateState.isLoading}>
        <InputLabel id="loaded-statuses-label">Load when opening the library</InputLabel>
        <Select
          multiple
          labelId="loaded-statuses-label"
          label="Load when opening the library"
          value={[...loadedStatuses]}
          onChange={(e) => handleLoadedStatusesChange(e.target.value)}
          renderValue={(selected) =>
            selected.length === UNIFIED_STATUS_FILTERS.length
              ? 'All statuses'
              : selected.length === 0
                ? 'Nothing (everything loads on expand)'
                : UNIFIED_STATUS_FILTERS.filter((label) => selected.includes(label)).join(', ')
          }
        >
          {UNIFIED_STATUS_FILTERS.map((label) => (
            <MenuItem key={label} value={label}>
              <Checkbox checked={loadedStatuses.includes(label)} size="small" />
              <ListItemText primary={label} />
            </MenuItem>
          ))}
        </Select>
        <FormHelperText>
          Unchecked statuses are not loaded, which makes the library open faster. They stay collapsed
          and load when you expand them.
        </FormHelperText>
      </FormControl>
    </Stack>
  );
}
