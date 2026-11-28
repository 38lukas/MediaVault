'use client';

import { useId, type ReactNode } from 'react';
import { Box, FormControl, InputLabel, MenuItem, OutlinedInput, Select } from '@mui/material';
import { StatusLabel } from '@/components/common/StatusLabel';
import { CheckIcon } from '@/lib/icons';
import { palette } from '@/lib/palette';

interface OptionSelectProps<T extends string> {
  label: string;
  options: readonly T[];
  // '' is only valid together with emptyLabel.
  value: T | '';
  onChange: (option: T) => void;
  // Adds a first "nothing selected" entry (for filters); picking it calls onClear.
  emptyLabel?: string;
  onClear?: () => void;
  // Custom content for an option (e.g. stars); ignored when statusOptions is set.
  renderOption?: (option: T) => ReactNode;
  // Options are media statuses: shown with a colored dot, and a check on the selected one.
  statusOptions?: boolean;
}

// Labeled dropdown with a single selected option.
export function OptionSelect<T extends string>({
  label,
  options,
  value,
  onChange,
  emptyLabel,
  onClear,
  renderOption,
  statusOptions = false,
}: OptionSelectProps<T>) {
  const labelId = useId();
  return (
    <FormControl fullWidth>
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
        // Status options show their label only in the closed field (the check is for the menu).
        renderValue={
          statusOptions
            ? (selected) => (selected === '' ? emptyLabel : <StatusLabel status={selected} />)
            : undefined
        }
        // Dot+text and icon+text options are not plain text, so center them vertically in the field.
        sx={
          statusOptions || renderOption
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
                {statusOptions ? (
                  <>
                    <StatusLabel status={option} />
                    {option === value && (
                      <CheckIcon fontSize="small" sx={{ ml: 'auto', pl: 1, color: 'text.secondary' }} />
                    )}
                  </>
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
