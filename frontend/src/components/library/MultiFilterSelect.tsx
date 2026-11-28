'use client';

import { useId, type ReactNode } from 'react';
import {
  Box,
  Checkbox,
  FormControl,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
} from '@mui/material';
import { palette } from '@/lib/palette';

interface MultiFilterSelectProps {
  label: string;
  options: readonly string[];
  // Selected options; empty = no filter, shown as "All" in the field but not as an option.
  value: readonly string[];
  onChange: (selected: string[]) => void;
  // Content of an option, used in the open list and for the first pick in the closed field.
  renderOption: (option: string) => ReactNode;
}

// Multi-select for library filters: a checkbox per option.
export function MultiFilterSelect({
  label,
  options,
  value,
  onChange,
  renderOption,
}: MultiFilterSelectProps) {
  const labelId = useId();
  const selected = options.filter((option) => value.includes(option));

  return (
    <FormControl fullWidth>
      <InputLabel id={labelId} shrink>
        {label}
      </InputLabel>
      <Select
        multiple
        displayEmpty
        labelId={labelId}
        input={<OutlinedInput label={label} notched />}
        value={selected}
        onChange={(e) =>
          onChange(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)
        }
        renderValue={() =>
          selected.length === 0 ? (
            <Box component="span" sx={{ color: 'text.secondary' }}>
              All
            </Box>
          ) : (
            <Box
              sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0, overflow: 'hidden' }}
            >
              {renderOption(selected[0])}
              {selected.length > 1 && (
                <Box component="span" sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
                  +{selected.length - 1}
                </Box>
              )}
            </Box>
          )
        }
        sx={{ '& .MuiSelect-select': { display: 'flex', alignItems: 'center' } }}
      >
        {options.map((option) => (
          <MenuItem
            key={option}
            value={option}
            sx={{
              py: 0.25,
              '&.Mui-selected, &.Mui-selected.Mui-focusVisible': {
                backgroundColor: palette.selectedBg,
              },
              '&:hover, &.Mui-selected:hover': { backgroundColor: palette.borderMuted },
            }}
          >
            <Checkbox checked={selected.includes(option)} size="small" />
            {renderOption(option)}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
