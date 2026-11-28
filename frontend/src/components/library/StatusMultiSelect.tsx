'use client';

import { MultiFilterSelect } from '@/components/library/MultiFilterSelect';
import { StatusLabel } from '@/components/common/StatusLabel';

interface StatusMultiSelectProps {
  label: string;
  options: readonly string[];
  // Selected statuses; empty = no filter (all statuses).
  value: readonly string[];
  onChange: (statuses: string[]) => void;
}

// Library status filter: a checkbox per status, each with its colored dot.
export function StatusMultiSelect({ label, options, value, onChange }: StatusMultiSelectProps) {
  return (
    <MultiFilterSelect
      label={label}
      options={options}
      value={value}
      onChange={onChange}
      renderOption={(status) => <StatusLabel status={status} />}
    />
  );
}
