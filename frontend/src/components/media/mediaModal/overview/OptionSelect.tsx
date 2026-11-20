'use client';

import { useId, type ReactNode } from 'react';
import { Box, FormControl, InputLabel, MenuItem, OutlinedInput, Select } from '@mui/material';
import { palette } from '@/lib/palette';
import { fieldSx, selectMenuProps } from '../constants';

interface OptionSelectProps<T extends string> {
  label: string;
  options: readonly T[];
  // '' is only valid together with emptyLabel.
  value: T | '';
  onChange: (option: T) => void;
  // Adds a first "nothing selected" entry (for filters); picking it calls onClear.
  emptyLabel?: string;
  onClear?: () => void;
  // Compact 36px field (same height as the filter chips) for toolbars.
  dense?: boolean;
  // Custom content for an option (e.g. stars); ignored when getOptionColors is given.
  renderOption?: (option: T) => ReactNode;
  // When provided, options render as colored pills.
  getOptionColors?: (option: T) => { bg: string; border: string; color: string };
}

// Labeled dropdown with a single selected option.
export function OptionSelect<T extends string>({
  label,
  options,
  value,
  onChange,
  emptyLabel,
  onClear,
  dense = false,
  renderOption,
  getOptionColors,
}: OptionSelectProps<T>) {
  const labelId = useId();
  return (
    <FormControl
      size="small"
      fullWidth
      sx={
        dense
          ? {
              ...fieldSx,
              '& .MuiOutlinedInput-root.MuiOutlinedInput-root': { minHeight: 36 },
              '& .MuiSelect-select.MuiSelect-select': { py: '5px', fontSize: '0.85rem' },
            }
          : fieldSx
      }
    >
      <InputLabel id={labelId} shrink={emptyLabel ? true : undefined}>
        {label}
      </InputLabel>
      <Select
        labelId={labelId}
        {...(emptyLabel
          ? { displayEmpty: true, input: <OutlinedInput label={label} notched /> }
          : { label })}
        value={value}
        onChange={(e) => {
          const next = e.target.value as T | '';
          if (next === '') onClear?.();
          else onChange(next);
        }}
        MenuProps={selectMenuProps}
        // The pill is shorter than the select's minimum content height, so center it vertically.
        sx={
          getOptionColors
            ? { '& .MuiSelect-select': { display: 'flex', alignItems: 'center' } }
            : undefined
        }
      >
          {emptyLabel && (
            <MenuItem value="" sx={{ px: 1.75, py: 0.75 }}>
              <Box component="span" sx={{ color: 'text.secondary' }}>
                {emptyLabel}
              </Box>
            </MenuItem>
          )}
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
                ) : renderOption ? (
                  renderOption(option)
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
