import { PathFormat } from "../shared/enums.js";

const IDENTIFIER_PATTERN = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
const JSON_PATH_ROOT = "$";

/**
 * Formats path segments in a supported JSON-navigation syntax.
 *
 * @param {Array<string | number>} segments Object-key and array-index segments.
 * @param {string} format Desired path format.
 * @returns {string} Formatted path.
 */
export function formatPath(segments, format) {
  if (segments.length === 0) {
    return format === PathFormat.JSON_PATH ? JSON_PATH_ROOT : "";
  }

  if (format === PathFormat.JSON_PATH) {
    return formatJsonPath(segments);
  }

  if (format === PathFormat.OPTIONAL_CHAINING) {
    return formatOptionalChainingPath(segments);
  }

  return formatDotPath(segments);
}

/**
 * Formats a path that starts at an implicit JavaScript root.
 *
 * @param {Array<string | number>} segments Path segments.
 * @returns {string} Dot-format path.
 */
function formatDotPath(segments) {
  return segments.map((segment, index) => formatDotSegment(segment, index === 0)).join("");
}

/**
 * Formats a JSONPath expression rooted at `$`.
 *
 * @param {Array<string | number>} segments Path segments.
 * @returns {string} JSONPath expression.
 */
function formatJsonPath(segments) {
  return `${JSON_PATH_ROOT}${segments.map((segment) => formatDotSegment(segment, false)).join("")}`;
}

/**
 * Formats a null-safe JavaScript property-access path.
 *
 * @param {Array<string | number>} segments Path segments.
 * @returns {string} Optional-chaining path.
 */
function formatOptionalChainingPath(segments) {
  return segments.map((segment, index) => formatOptionalSegment(segment, index === 0)).join("");
}

/**
 * Formats a segment for dot paths and JSONPath.
 *
 * @param {string | number} segment Path segment.
 * @param {boolean} isRoot Whether this is the first segment.
 * @returns {string} Formatted segment.
 */
function formatDotSegment(segment, isRoot) {
  if (typeof segment === "number") {
    return `[${segment}]`;
  }

  if (isIdentifierSafe(segment)) {
    return isRoot ? segment : `.${segment}`;
  }

  return `[${JSON.stringify(segment)}]`;
}

/**
 * Formats a segment for optional chaining.
 *
 * @param {string | number} segment Path segment.
 * @param {boolean} isRoot Whether this is the first segment.
 * @returns {string} Formatted segment.
 */
function formatOptionalSegment(segment, isRoot) {
  if (typeof segment === "number") {
    return isRoot ? `[${segment}]` : `?.[${segment}]`;
  }

  if (isIdentifierSafe(segment)) {
    return isRoot ? segment : `?.${segment}`;
  }

  return isRoot ? `[${JSON.stringify(segment)}]` : `?.[${JSON.stringify(segment)}]`;
}

/**
 * Restricts dot notation to unambiguous JavaScript identifiers.
 *
 * @param {string} key Object key.
 * @returns {boolean} Whether dot notation is safe.
 */
function isIdentifierSafe(key) {
  return IDENTIFIER_PATTERN.test(key);
}
