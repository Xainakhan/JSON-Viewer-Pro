import { PathFormat } from "../shared/enums.js";

const IDENTIFIER_PATTERN = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
const JSON_PATH_ROOT = "$";

/**
 * Formats path segments as a dot path, JSONPath, or optional-chaining expression.
 *
 * @param {Array<string | number>} segments Object keys (strings) and array indexes (numbers).
 * @param {string} format One of PathFormat.
 * @returns {string} The formatted path.
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

function formatDotPath(segments) {
  return segments.map((segment, index) => formatDotSegment(segment, index === 0)).join("");
}

function formatJsonPath(segments) {
  return `${JSON_PATH_ROOT}${segments.map((segment) => formatDotSegment(segment, false)).join("")}`;
}

function formatOptionalChainingPath(segments) {
  return segments.map((segment, index) => formatOptionalSegment(segment, index === 0)).join("");
}

function formatDotSegment(segment, isFirst) {
  if (typeof segment === "number") {
    return `[${segment}]`;
  }

  if (isIdentifierSafe(segment)) {
    return isFirst ? segment : `.${segment}`;
  }

  return `[${JSON.stringify(segment)}]`;
}

function formatOptionalSegment(segment, isFirst) {
  const separator = isFirst ? "" : "?.";

  if (typeof segment === "number") {
    return `${separator}[${segment}]`;
  }

  if (isIdentifierSafe(segment)) {
    return `${separator}${segment}`;
  }

  return `${separator}[${JSON.stringify(segment)}]`;
}

function isIdentifierSafe(key) {
  return IDENTIFIER_PATTERN.test(key);
}
