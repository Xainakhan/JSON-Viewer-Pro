/**
 * Reads a stored preference while treating browser privacy restrictions as an unavailable cache.
 *
 * @param {string} key Storage key.
 * @param {string} defaultValue Value used when storage is unavailable or empty.
 * @returns {string} Stored value or the supplied default.
 */
export function getStoredValue(key, defaultValue) {
  try {
    return localStorage.getItem(key) ?? defaultValue;
  } catch (error) {
    console.warn("JSON Viewer Pro could not read a saved preference.", error);
    return defaultValue;
  }
}

/**
 * Saves a preference without allowing storage failures to interrupt the viewer.
 *
 * @param {string} key Storage key.
 * @param {string} value Value to persist.
 * @returns {boolean} Whether the value was saved.
 */
export function setStoredValue(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn("JSON Viewer Pro could not save a preference.", error);
    return false;
  }
}
