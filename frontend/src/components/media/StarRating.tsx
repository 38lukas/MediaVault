'use client';

import { Rating } from '@mui/material';
import { palette } from '@/lib/palette';
import { toStars } from '@/utils/rating';

interface StarRatingProps {
  value?: number | null; // DB rating 1–10, or null when unrated
  readOnly?: boolean;
  onChange?: (stars: number | null) => void; // half-star value; parent maps to DB
  size?: 'small' | 'medium' | 'large';
}

/** Half-star rating control mapped from DB 1–10 values.
 *
 * @param props.value - DB rating 1–10, or null when unrated.
 * @param props.readOnly - When true, display only (no interaction).
 * @param props.onChange - Called with star value (0.5–5) or null when cleared.
 * @param props.size - MUI Rating size.
 * @returns MUI Rating with primary filled and gray empty icons.
 */
export function StarRating({
  value,
  readOnly = false,
  onChange,
  size = 'medium',
}: StarRatingProps) {
  const stars = toStars(value);

  return (
    <Rating
      value={stars}
      max={5}
      precision={0.5}
      readOnly={readOnly}
      size={size}
      onChange={(_event, newValue) => {
        onChange?.(newValue);
      }}
      sx={{
        color: palette.primary,
        '& .MuiRating-iconEmpty': {
          color: 'grey.600',
        },
      }}
    />
  );
}
