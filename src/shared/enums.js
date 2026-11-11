/** @typedef {"string" | "number" | "boolean" | "null" | "object" | "array"} ValueTypeValue */

/**
 * JSON values supported by the viewer.
 *
 * @readonly
 * @enum {ValueTypeValue}
 */
export const ValueType = Object.freeze({
  STRING: "string",
  NUMBER: "number",
  BOOLEAN: "boolean",
  NULL: "null",
  OBJECT: "object",
  ARRAY: "array",
});

/** @typedef {"light" | "dark"} ThemeValue */

/**
 * Available color themes.
 *
 * @readonly
 * @enum {ThemeValue}
 */
export const Theme = Object.freeze({
  LIGHT: "light",
  DARK: "dark",
});

/** @typedef {"tree" | "raw"} ViewModeValue */

/**
 * Ways JSON can be displayed.
 *
 * @readonly
 * @enum {ViewModeValue}
 */
export const ViewMode = Object.freeze({
  TREE: "tree",
  RAW: "raw",
});

/** @typedef {"dot" | "jsonPath" | "optionalChaining"} PathFormatValue */

/**
 * Supported copied key-path syntaxes.
 *
 * @readonly
 * @enum {PathFormatValue}
 */
export const PathFormat = Object.freeze({
  DOT: "dot",
  JSON_PATH: "jsonPath",
  OPTIONAL_CHAINING: "optionalChaining",
});

/** @typedef {"emptyInput" | "invalidJson"} ParseErrorCodeValue */

/**
 * User-actionable parsing failures.
 *
 * @readonly
 * @enum {ParseErrorCodeValue}
 */
export const ParseErrorCode = Object.freeze({
  EMPTY_INPUT: "emptyInput",
  INVALID_JSON: "invalidJson",
});

/** @typedef {"theme" | "viewMode"} StorageKeyValue */

/**
 * Persistent preference keys owned by the extension.
 *
 * @readonly
 * @enum {StorageKeyValue}
 */
export const StorageKey = Object.freeze({
  THEME: "theme",
  VIEW_MODE: "viewMode",
});
