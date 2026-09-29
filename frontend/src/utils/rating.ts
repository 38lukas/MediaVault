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
