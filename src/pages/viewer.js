import { buildErrorExcerpt, parseJson } from "../core/parser.js";

const formatButton = document.querySelector("#format-button");
const inputArea = document.querySelector("#json-input");
const outputArea = document.querySelector("#json-output");

if (
  formatButton instanceof HTMLButtonElement &&
  inputArea instanceof HTMLTextAreaElement &&
  outputArea instanceof HTMLElement
) {
  formatButton.addEventListener("click", () => {
    const result = parseJson(inputArea.value);

    if (result.ok) {
      showValidJson(outputArea, result.value);
      return;
    }

    showParseError(outputArea, inputArea.value, result.error);
  });
}

/**
 * Shows the temporary success state until tree rendering is available.
 *
 * @param {HTMLElement} outputArea Output container.
 * @param {unknown} value Parsed JSON value.
 * @returns {void}
 */
function showValidJson(outputArea, value) {
  const count = getTopLevelCount(value);
  const unit = Array.isArray(value) ? "items" : "keys";

  outputArea.classList.remove("error-box");
  outputArea.setAttribute("role", "status");
  outputArea.textContent = `Valid JSON: ${count} top-level ${unit}.`;
}

/**
 * Shows a safely-rendered, accessible parsing failure.
 *
 * @param {HTMLElement} outputArea Output container.
 * @param {string} text JSON source text.
 * @param {{ message: string, line: number | null, column: number | null }} error Parse error details.
 * @returns {void}
 */
function showParseError(outputArea, text, error) {
  const excerpt = buildErrorExcerpt(text, error.line, error.column);

  outputArea.classList.add("error-box");
  outputArea.setAttribute("role", "alert");
  outputArea.textContent = excerpt ? `${error.message}\n\n${excerpt}` : error.message;
}

/**
 * Counts object keys or array items without changing primitive values.
 *
 * @param {unknown} value Parsed JSON value.
 * @returns {number} Number of top-level entries.
 */
function getTopLevelCount(value) {
  if (Array.isArray(value)) {
    return value.length;
  }

  if (value !== null && typeof value === "object") {
    return Object.keys(value).length;
  }

  return 0;
}
