import { ParseErrorCode } from "../shared/enums.js";

const POSITION_PATTERN = /\bat position\s+(\d+)\b/i;
const LINE_COLUMN_PATTERN = /\(?line\s+(\d+)[,\s]+column\s+(\d+)\)?/i;

/**
 * Parses JSON without exposing engine exceptions to callers.
 *
 * @param {string} text JSON source text.
 * @returns {{ ok: true, value: unknown } | { ok: false, error: JsonParseError }} The parsed value or an error.
 */
export function parseJson(text) {
  if (text.trim().length === 0) {
    return {
      ok: false,
      error: createParseError(
        ParseErrorCode.EMPTY_INPUT,
        "Paste JSON to format it.",
        null,
        null,
        null,
      ),
    };
  }

  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (error) {
    const location = extractErrorLocation(error, text);

    return {
      ok: false,
      error: createParseError(
        ParseErrorCode.INVALID_JSON,
        createFriendlyMessage(error, location.line, location.column),
        location.position,
        location.line,
        location.column,
      ),
    };
  }
}

/**
 * Builds a readable source excerpt for a known error location.
 *
 * @param {string} text JSON source text.
 * @param {number | null} line One-based source line number.
 * @param {number | null} column One-based source column number.
 * @returns {string} The offending line and a caret, or an empty string when location is unknown.
 */
export function buildErrorExcerpt(text, line, column) {
  if (!Number.isInteger(line) || !Number.isInteger(column) || line < 1 || column < 1) {
    return "";
  }

  const sourceLine = text.split(/\r?\n/)[line - 1];
  if (sourceLine === undefined) {
    return "";
  }

  return `${sourceLine}\n${" ".repeat(column - 1)}^`;
}

/**
 * @typedef {object} JsonParseError
 * @property {string} code Stable error category.
 * @property {string} message User-facing error message.
 * @property {number | null} position Zero-based source position.
 * @property {number | null} line One-based source line.
 * @property {number | null} column One-based source column.
 */

/**
 * Creates an immutable-shaped parse error consistently for all parser branches.
 *
 * @param {string} code Stable error category.
 * @param {string} message User-facing error message.
 * @param {number | null} position Zero-based source position.
 * @param {number | null} line One-based source line.
 * @param {number | null} column One-based source column.
 * @returns {JsonParseError} Parse error details.
 */
function createParseError(code, message, position, line, column) {
  return { code, message, position, line, column };
}

/**
 * Extracts a location from JSON.parse diagnostics without assuming a browser-specific message format.
 *
 * @param {unknown} error Parsing exception.
 * @param {string} text JSON source text.
 * @returns {{ position: number | null, line: number | null, column: number | null }} Source location.
 */
function extractErrorLocation(error, text) {
  const errorMessage = error instanceof Error ? error.message : "";
  const positionMatch = errorMessage.match(POSITION_PATTERN);

  if (positionMatch) {
    const position = Number(positionMatch[1]);
    return { position, ...getLineAndColumn(text, position) };
  }

  const lineColumnMatch = errorMessage.match(LINE_COLUMN_PATTERN);
  if (lineColumnMatch) {
    const line = Number(lineColumnMatch[1]);
    const column = Number(lineColumnMatch[2]);
    return { position: getPosition(text, line, column), line, column };
  }

  return { position: null, line: null, column: null };
}

/**
 * Converts a zero-based source position to a one-based line and column.
 *
 * @param {string} text JSON source text.
 * @param {number} position Zero-based source position.
 * @returns {{ line: number, column: number }} One-based source location.
 */
function getLineAndColumn(text, position) {
  const prefix = text.slice(0, position);
  const line = prefix.split("\n").length;
  const lastLineBreak = prefix.lastIndexOf("\n");
  const column = position - lastLineBreak;

  return { line, column };
}

/**
 * Converts a one-based line and column to a zero-based source position.
 *
 * @param {string} text JSON source text.
 * @param {number} line One-based source line.
 * @param {number} column One-based source column.
 * @returns {number | null} Zero-based source position when the location exists.
 */
function getPosition(text, line, column) {
  const lines = text.split(/\r?\n/);
  if (line > lines.length || column > lines[line - 1].length + 1) {
    return null;
  }

  let position = 0;
  for (let index = 0; index < line - 1; index += 1) {
    position += lines[index].length + 1;
  }

  return position + column - 1;
}

/**
 * Keeps engine-specific parser text out of the interface while retaining useful context.
 *
 * @param {unknown} error Parsing exception.
 * @param {number | null} line One-based source line.
 * @param {number | null} column One-based source column.
 * @returns {string} Friendly parsing failure message.
 */
function createFriendlyMessage(error, line, column) {
  const engineMessage = error instanceof Error ? error.message : "";
  const summary = /unexpected end/i.test(engineMessage)
    ? "Unexpected end of JSON input"
    : "Unexpected token";

  if (line === null || column === null) {
    return `${summary}. Check that the JSON is valid.`;
  }

  return `${summary} at line ${line}, column ${column}.`;
}
