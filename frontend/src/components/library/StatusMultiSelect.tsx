'use client';

import { Box } from '@mui/material';
import { MultiFilterSelect } from '@/components/library/MultiFilterSelect';
import { getStatusColor } from '@/utils/mediaStatus';

interface StatusMultiSelectProps {
  label: string;
  options: readonly string[];
  // Selected statuses; empty = no filter (all statuses).
  value: readonly string[];
  onChange: (statuses: string[]) => void;
}

// Colored status pill, same look as in the media modal's status dropdown.
function StatusPill({ status }: { status: string }) {
  const colors = getStatusColor(status);
  return (
    <Box
      component="span"
      sx={{
        boxSizing: 'border-box',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 72,
        height: 20,
        px: 1,
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
      {status}
    </Box>
  );
}

// Library status filter: a checkbox per status, shown as colored pills.
export function StatusMultiSelect({ label, options, value, onChange }: StatusMultiSelectProps) {
  return (
    <MultiFilterSelect
      label={label}
      options={options}
      value={value}
      onChange={onChange}
      renderOption={(status) => <StatusPill status={status} />}
    />
  );
}
