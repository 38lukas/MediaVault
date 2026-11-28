'use client';

import { useRef, useState } from 'react';
import { CalendarTodayOutlinedIcon } from '@/lib/icons';
import { Box, IconButton, InputAdornment, TextField } from '@mui/material';

interface DateFieldProps {
  label: string;
  // ISO date (YYYY-MM-DD) or '' when empty.
  value: string;
  onChange: (value: string) => void;
}

// ISO (YYYY-MM-DD) -> German display (TT.MM.JJJJ).
function isoToDisplay(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return match ? `${match[3]}.${match[2]}.${match[1]}` : '';
}

// Digits only (max 8) -> progressively dotted TT.MM.JJJJ.
function formatDigits(digits: string): string {
  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);
  return [day, month, year].filter(Boolean).join('.');
}

// Complete, real calendar date typed as TT.MM.JJJJ -> ISO, otherwise ''.
function displayToIso(display: string): string {
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(display);
  if (!match) return '';
  const [, day, month, year] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  const valid =
    date.getFullYear() === Number(year) &&
    date.getMonth() === Number(month) - 1 &&
    date.getDate() === Number(day);
  return valid ? `${year}-${month}-${day}` : '';
}

// Date input that always shows the German format, independent of the browser/OS locale.
export function DateField({ label, value, onChange }: DateFieldProps) {
  const [text, setText] = useState(() => isoToDisplay(value));
  const [syncedValue, setSyncedValue] = useState(value);
  const pickerRef = useRef<HTMLInputElement>(null);

  // Follow outside changes (loading an entry, picking from the calendar) but not our own partial typing.
  if (value !== syncedValue) {
    setSyncedValue(value);
    if (displayToIso(text) !== value) setText(isoToDisplay(value));
  }

  const handleTyping = (raw: string) => {
    const formatted = formatDigits(raw.replace(/\D/g, '').slice(0, 8));
    setText(formatted);
    onChange(displayToIso(formatted));
  };

  return (
    <Box sx={{ position: 'relative' }}>
      <TextField
        label={label}
        size="small"
        fullWidth
        value={text}
        placeholder="TT.MM.JJJJ"
        onChange={(e) => handleTyping(e.target.value)}
        slotProps={{
          inputLabel: { shrink: true },
          htmlInput: { inputMode: 'numeric', autoComplete: 'off' },
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  edge="end"
                  aria-label={`Pick ${label} from calendar`}
                  onClick={() => pickerRef.current?.showPicker?.()}
                >
                  <CalendarTodayOutlinedIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />
      {/* Native picker only supplies the calendar popup; the visible value stays German. */}
      <input
        ref={pickerRef}
        type="date"
        tabIndex={-1}
        aria-hidden
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          position: 'absolute',
          left: 0,
          bottom: 0,
          width: 0,
          height: 0,
          opacity: 0,
          pointerEvents: 'none',
          border: 0,
          padding: 0,
        }}
      />
    </Box>
  );
}
