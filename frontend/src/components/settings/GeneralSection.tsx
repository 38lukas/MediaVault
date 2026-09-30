'use client';

import {
  Box,
  CircularProgress,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
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
 * General settings: ratings toggle and default sort field.
 * @returns Form that PATCHes user settings on each change.
 */
export function GeneralSection() {
  const username = useAppSelector((state) => state.auth.username);
  const { data: settings, isLoading } = useGetUserSettingsQuery(undefined, {
    skip: !username,
  });
  const [updateUserSettings, updateState] = useUpdateUserSettingsMutation();

  const ratingsEnabled = settings?.ratings_enabled ?? true;
  const defaultSort = settings?.default_sort_field ?? 'status';

  const sortOptions = SORT_FIELD_OPTIONS.filter(
    (opt) => ratingsEnabled || opt.value !== 'rating',
  );

  /**
   * Persists the ratings_enabled flag immediately.
   * @param enabled - Whether ratings should be shown in the library.
   */
  const handleRatingsChange = (enabled: boolean) => {
    void updateUserSettings({ ratings_enabled: enabled });
  };

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
      <Box>
        <Typography variant="h6" sx={{ color: palette.textOnDark, mb: 0.5 }}>
          Generell
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Library defaults for this account.
        </Typography>
      </Box>

      <FormControlLabel
        control={
          <Switch
            checked={ratingsEnabled}
            onChange={(_, checked) => handleRatingsChange(checked)}
            disabled={updateState.isLoading}
          />
        }
        label="Enable ratings"
      />

      <FormControl fullWidth>
        <InputLabel id="default-sort-label">Default Sort By</InputLabel>
        <Select
          labelId="default-sort-label"
          label="Default Sort By"
          value={defaultSort === 'rating' && !ratingsEnabled ? 'status' : defaultSort}
          onChange={(e) => handleSortChange(e.target.value as SortField)}
          disabled={updateState.isLoading}
        >
          {sortOptions.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Stack>
  );
}
