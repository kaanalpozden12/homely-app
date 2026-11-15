/** Turns a database or network error into a sentence a person can act on. */
export function friendly(e: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const msg = (e as { message?: string })?.message ?? '';
  if (!msg) return fallback;
  if (/failed to fetch|network request failed|load failed|networkerror/i.test(msg)) {
    return 'No internet connection. Check your connection and try again.';
  }
  if (/row-level security|permission denied/i.test(msg)) return "You can't do that. If you think this is a mistake, contact us.";
  if (/jwt|token.*expired|not signed in/i.test(msg)) return 'Your session has ended. Please sign in again.';
  if (/payload too large|maximum allowed size|exceeded the maximum/i.test(msg)) return 'That photo is too large. Try a different one.';
  if (/mime type|invalid_mime|not supported/i.test(msg)) return 'Only JPG, PNG or WebP photos can be uploaded.';
  if (/duplicate key|violates|constraint|syntax|function|column|relation/i.test(msg)) return fallback;
  return msg; // our own database messages are already written for people
}
