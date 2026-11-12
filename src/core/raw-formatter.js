/**
 * Formats a JSON value for the raw viewer without interpreting it as markup.
 *
 * @param {unknown} value Parsed JSON value.
 * @returns {string} Two-space-indented JSON.
 */
export function formatRaw(value) {
  return JSON.stringify(value, null, 2);
}
