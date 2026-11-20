'use client';

import type { ReactNode } from 'react';
import { Box } from '@mui/material';

// Space reserved at the right of a field so text never runs under the action button.
export const FIELD_ACTION_RESERVED_PX = 96;

// Distance from the right edge: the action button sits next to the arrow, the spinner just left of it.
export const FIELD_ACTION_RIGHT_PX = 38;
export const FIELD_SPINNER_RIGHT_PX = 74;

// Overrides that reserve that space (!important to beat Autocomplete / Select defaults).
export const fieldActionPaddingSx = {
  '& .MuiOutlinedInput-root': { paddingRight: `${FIELD_ACTION_RESERVED_PX}px !important` },
  '& .MuiSelect-select.MuiSelect-select': { paddingRight: `${FIELD_ACTION_RESERVED_PX}px` },
  // The action button takes the clear icon's spot next to the arrow.
  '& .MuiAutocomplete-clearIndicator': { display: 'none' },
};

// Icon button pinned at a fixed distance from the right edge, so the title and season fields line up.
export function FieldAction({
  children,
  right = FIELD_ACTION_RIGHT_PX,
}: {
  children: ReactNode;
  right?: number;
}) {
  return (
    <Box
      sx={{
        position: 'absolute',
        right,
        top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex',
        alignItems: 'center',
        zIndex: 1,
      }}
    >
      {children}
    </Box>
  );
}
