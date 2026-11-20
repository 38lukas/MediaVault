'use client';

import { useId } from 'react';
import { Box, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { palette } from '@/lib/palette';
import { fieldSx, selectMenuProps } from '../constants';

interface OptionSelectProps<T extends string> {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (option: T) => void;
  // When provided, options render as colored pills.
  getOptionColors?: (option: T) => { bg: string; border: string; color: string };
}

// Labeled dropdown with a single selected option.
export function OptionSelect<T extends string>({
  label,
  options,
  value,
  onChange,
  getOptionColors,
}: OptionSelectProps<T>) {
  const labelId = useId();
  return (
    <FormControl size="small" fullWidth sx={fieldSx}>
      <InputLabel id={labelId}>{label}</InputLabel>
      <Select
        labelId={labelId}
        label={label}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        MenuProps={selectMenuProps}
        // The pill is shorter than the select's minimum content height, so center it vertically.
        sx={
          getOptionColors
            ? { '& .MuiSelect-select': { display: 'flex', alignItems: 'center' } }
            : undefined
        }
      >
          {options.map((option) => {
            const colors = getOptionColors?.(option);
            return (
              <MenuItem
                key={option}
                value={option}
                sx={{
                  px: 1.75,
                  py: 0.75,
                  '&.Mui-selected, &.Mui-selected.Mui-focusVisible': {
                    backgroundColor: palette.selectedBg,
                  },
                  '&:hover, &.Mui-selected:hover': { backgroundColor: palette.borderMuted },
                }}
              >
                {colors ? (
                  <Box
                    component="span"
                    sx={{
                      boxSizing: 'border-box',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 88,
                      height: 20,
                      // Font metrics leave extra space below the glyphs; nudge the text down ~1px to look centered.
                      pt: '2px',
                      border: `1px solid ${colors.border}`,
                      backgroundColor: colors.bg,
                      color: colors.color,
                      borderRadius: 999,
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      lineHeight: 1,
                      textTransform: 'capitalize',
                    }}
                  >
                    {option}
                  </Box>
                ) : (
                  option
                )}
              </MenuItem>
            );
          })}
      </Select>
    </FormControl>
  );
}
