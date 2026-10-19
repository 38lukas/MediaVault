// Mean star rating (0.5–5) across histogram buckets. Null when nothing is rated.
export function averageStars(
  distribution: { rating: number; count: number }[],
): number | null {
  let weighted = 0;
  let total = 0;
  for (const bucket of distribution) {
    weighted += bucket.rating * bucket.count;
    total += bucket.count;
  }
  if (total === 0) return null;
  return weighted / total / 2;
}

// Convert a DB rating (1–10) to UI stars (0.5–5)
export function toStars(rating?: number | null): number | null {
  if (rating == null) return null;
  return rating / 2;
}

// Convert UI stars (0.5–5) to a DB rating (1–10)
export function toDbRating(stars?: number | null): number | null {
  if (stars == null) return null;
  return Math.round(stars * 2);
}

// Custom labels shown next to star icons on rating section dividers
export const RATING_SECTION_LABELS: Record<number, string> = {
  0.5: 'Slop',
  1: 'Ass',
  1.5: 'Bad',
  2: 'Disappointing',
  2.5: 'Mid',
  3: 'Solid',
  3.5: 'Great',
  4: 'Amazing',
  4.5: 'Almost Peak',
  5: 'Peak',
};

export const UNRATED_SECTION_LABEL = 'Unrated';
