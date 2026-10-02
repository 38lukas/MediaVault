'use client';

import {
  Box,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import { palette } from '@/lib/palette';
import { useAppSelector } from '@/redux/hooks';
import {
  useGetUserSettingsQuery,
  useUpdateUserSettingsMutation,
} from '@/redux/mediaApi';
import { SORT_FIELD_OPTIONS, type SortField } from '@/types/media';

/**
 * General settings: default sort field.
 * @returns Form that PATCHes user settings on each change.
 */
export function GeneralSection() {
  const username = useAppSelector((state) => state.auth.username);
  const { data: settings, isLoading } = useGetUserSettingsQuery(undefined, {
    skip: !username,
  });
  const [updateUserSettings, updateState] = useUpdateUserSettingsMutation();

  const defaultSort = settings?.default_sort_field ?? 'status';

  /**
   * Persists the default sort field immediately.
   * @param field - Sort field to use when the library loads.
   */
  const handleSortChange = (field: SortField) => {
    void updateUserSettings({ default_sort_field: field });
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
    </Stack>
  );
}
