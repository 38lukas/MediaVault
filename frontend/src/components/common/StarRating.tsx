'use client';

import { Rating } from '@mui/material';
import { palette } from '@/lib/palette';
import { toStars } from '@/utils/rating';

interface StarRatingProps {
  value?: number | null; 
  readOnly?: boolean;
  onChange?: (stars: number | null) => void; 
  size?: 'small' | 'medium' | 'large';
}

// Half-star rating control mapped from DB ratings 1–10.
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
