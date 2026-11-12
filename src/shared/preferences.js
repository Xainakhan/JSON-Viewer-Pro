import { PathFormat, StorageKey, Theme, ViewMode } from "./enums.js";
import { getStoredValue } from "./storage.js";

/**
 * Gets a supported path-format choice.
 *
 * @returns {string} Supported path format.
 */
export function getPathFormatPreference() {
  return getValidatedPreference(StorageKey.PATH_FORMAT, PathFormat, PathFormat.DOT);
}

/**
 * Gets a supported saved theme, or no preference when the system setting should apply.
 *
 * @returns {string | null} Saved theme or null.
 */
export function getThemePreference() {
  return getValidatedPreference(StorageKey.THEME, Theme, null);
}

/**
 * Gets a supported view-mode choice.
 *
 * @returns {string} Supported view mode.
 */
export function getViewModePreference() {
  return getValidatedPreference(StorageKey.VIEW_MODE, ViewMode, ViewMode.TREE);
}

function getValidatedPreference(key, values, defaultValue) {
  try {
    const value = getStoredValue(key, defaultValue);
    return Object.values(values).includes(value) ? value : defaultValue;
  } catch {
    return defaultValue;
  }
}
