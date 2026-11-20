'use client';

import { useState } from 'react';
import {
  Box,
  Button,
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
  type UserSettingsUpdate,
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

// Library settings: default sort, media type, grid size and which status sections start expanded.
// Changing a field only edits a local draft (cheap); the Apply button saves all changes in one request.
export function GeneralSection() {
  const username = useAppSelector((state) => state.auth.username);
  const { data: settings, isLoading } = useGetUserSettingsQuery(undefined, {
    skip: !username,
  });
  const [updateUserSettings, updateState] = useUpdateUserSettingsMutation();
  const [draft, setDraft] = useState<UserSettingsUpdate>({});

  const saved = {
    default_sort_field: settings?.default_sort_field ?? 'status',
    default_card_size: settings?.default_card_size ?? 2,
    default_type_filter: settings?.default_type_filter ?? 'All',
    // Statuses whose library sections start expanded; never configured = all.
    library_loaded_statuses: settings?.library_loaded_statuses ?? [...UNIFIED_STATUS_FILTERS],
  };
  const current = { ...saved, ...draft };

  // Only the fields whose draft differs from what is saved.
  const changes: UserSettingsUpdate = {};
  if (current.default_sort_field !== saved.default_sort_field) {
    changes.default_sort_field = current.default_sort_field;
  }
  if (current.default_card_size !== saved.default_card_size) {
    changes.default_card_size = current.default_card_size;
  }
  if (current.default_type_filter !== saved.default_type_filter) {
    changes.default_type_filter = current.default_type_filter;
  }
  if (
    current.library_loaded_statuses.length !== saved.library_loaded_statuses.length ||
    current.library_loaded_statuses.some((label) => !saved.library_loaded_statuses.includes(label))
  ) {
    changes.library_loaded_statuses = current.library_loaded_statuses;
  }
  const dirty = Object.keys(changes).length > 0;

  const handleStatusesChange = (value: string | string[]) => {
    const selected = typeof value === 'string' ? value.split(',') : value;
    setDraft((previous) => ({
      ...previous,
      library_loaded_statuses: UNIFIED_STATUS_FILTERS.filter((label) => selected.includes(label)),
    }));
  };

  const handleApply = async () => {
    try {
      await updateUserSettings(changes).unwrap();
      setDraft({});
    } catch {
      // Keep the draft so the user can try again.
    }
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
          value={current.default_sort_field}
          onChange={(e) =>
            setDraft((previous) => ({ ...previous, default_sort_field: e.target.value as SortField }))
          }
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
          value={current.default_type_filter}
          onChange={(e) =>
            setDraft((previous) => ({
              ...previous,
              default_type_filter: e.target.value as TypeFilter,
            }))
          }
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
          value={current.default_card_size}
          onChange={(e) => {
            const size = Number(e.target.value);
            if (isCardSize(size)) setDraft((previous) => ({ ...previous, default_card_size: size }));
          }}
        >
          {CARD_SIZE_OPTIONS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth>
        <InputLabel id="loaded-statuses-label">Expanded when opening the library</InputLabel>
        <Select
          multiple
          labelId="loaded-statuses-label"
          label="Expanded when opening the library"
          value={current.library_loaded_statuses}
          onChange={(e) => handleStatusesChange(e.target.value)}
          renderValue={(selected) =>
            selected.length === UNIFIED_STATUS_FILTERS.length
              ? 'All statuses'
              : selected.length === 0
                ? 'None (all collapsed)'
                : UNIFIED_STATUS_FILTERS.filter((label) => selected.includes(label)).join(', ')
          }
        >
          {UNIFIED_STATUS_FILTERS.map((label) => (
            <MenuItem key={label} value={label}>
              <Checkbox checked={current.library_loaded_statuses.includes(label)} size="small" />
              <ListItemText primary={label} />
            </MenuItem>
          ))}
        </Select>
        <FormHelperText>
          Unchecked statuses start collapsed and their covers are not drawn, which makes the library
          open faster. Click a status header in the library to expand it.
        </FormHelperText>
      </FormControl>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Button
          variant="contained"
          disabled={!dirty || updateState.isLoading}
          onClick={() => void handleApply()}
        >
          {updateState.isLoading ? 'Applying…' : 'Apply'}
        </Button>
        {dirty && !updateState.isLoading && (
          <Button color="inherit" onClick={() => setDraft({})} sx={{ color: 'text.secondary' }}>
            Discard
          </Button>
        )}
      </Box>
    </Stack>
  );
}
