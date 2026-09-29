/** Converts a DB rating (1–10) to UI stars (0.5–5).
 * 
 * @param rating - Integer 1–10, or nullish when unrated.
 * @returns Star value for MUI Rating, or null when unrated.
 */
export function toStars(rating?: number | null): number | null {
  if (rating == null) return null;
  return rating / 2;
}

/** Converts UI stars (0.5–5) to a DB rating (1–10).
 *
 *  @param stars - Half-star value from MUI Rating, or nullish when cleared.
 *  @returns Integer 1–10, or null when unrated.
 */
export function toDbRating(stars?: number | null): number | null {
  if (stars == null) return null;
  return Math.round(stars * 2);
}

// Custom text shown next to star icons on rating section dividers.
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

// Label for the unrated section divider (no stars shown).
export const UNRATED_SECTION_LABEL = 'Unrated';