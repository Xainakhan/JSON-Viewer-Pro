/**
 * Returns an HTTP(S) source URL that the extension can safely request.
 *
 * @param {string | undefined} value Candidate tab URL.
 * @returns {string | null} Supported URL or null.
 */
export function getJsonSourceUrl(value) {
  if (typeof value !== "string") {
    return null;
  }

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}
