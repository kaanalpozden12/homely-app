// Search-distance helpers shared by the map and the feed.

export const MIN_MILES = 0.5;
export const MAX_MILES = 10;

/** Rounds to a friendly step: quarter miles up to 2 mi, then half miles. */
export function snapMiles(miles: number) {
  const step = miles < 2 ? 0.25 : 0.5;
  return Math.min(MAX_MILES, Math.max(MIN_MILES, Math.round(miles / step) * step));
}

/** 2 → "2 mi", 2.5 → "2.5 mi", 0.75 → "0.75 mi". */
export const formatMiles = (m: number) => `${+m.toFixed(2)} mi`;
