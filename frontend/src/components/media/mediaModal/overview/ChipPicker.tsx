'use client';

import { Box, Stack, Typography, type SxProps, type Theme } from '@mui/material';
import { palette } from '@/lib/palette';

interface ChipColors {
  bg: string;
  border: string;
  color: string;
}

interface ChipPickerProps<T extends string> {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (option: T) => void;
  getSelectedColors: (option: T) => ChipColors;
  sx?: SxProps<Theme>;
}

/** Labeled row of pill buttons with a single selected option.
 *
 * @param props - Options, current value and selected-chip colors.
 * @returns Caption plus wrapping pill buttons.
 */
export function ChipPicker<T extends string>({
  label,
  options,
  value,
  onChange,
  getSelectedColors,
  sx,
}: ChipPickerProps<T>) {
  return (
    <Box sx={sx}>
      <Typography
        variant="caption"
        sx={{ color: 'text.secondary', mb: 1, display: 'block', fontWeight: 600 }}
      >
        {label}
      </Typography>
      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
        {options.map((option) => {
          const selected = option === value;
          const colors = selected ? getSelectedColors(option) : null;
          return (
            <Box
              key={option}
              component="button"
              type="button"
              onClick={() => onChange(option)}
              sx={{
                cursor: 'pointer',
                border: `1px solid ${colors?.border ?? palette.border}`,
                backgroundColor: colors?.bg ?? palette.fieldBg,
                color: colors?.color ?? 'text.secondary',
                borderRadius: 999,
                px: 1.5,
                py: 0.6,
                fontSize: '0.8rem',
                fontWeight: 600,
                fontFamily: 'inherit',
                textTransform: 'capitalize',
                transition: 'background-color 0.15s ease, border-color 0.15s ease',
              }}
            >
              {option}
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}
