import { buildErrorExcerpt, parseJson } from "../core/parser.js";
import { createNode } from "../core/tree-model.js";
import { renderTree } from "../ui/tree-renderer.js";

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
      showTree(outputArea, result.value);
      return;
    }

    showParseError(outputArea, inputArea.value, result.error);
  });
}

/**
 * Builds the root node and delegates JSON presentation to the tree renderer.
 *
 * @param {HTMLElement} outputArea Output container.
 * @param {unknown} value Parsed JSON value.
 * @returns {void}
 */
function showTree(outputArea, value) {
  outputArea.classList.remove("error-box");
  renderTree(outputArea, createNode({ key: null, value, path: [] }));
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

  outputArea.classList.remove("json-tree");
  outputArea.classList.add("error-box");
  outputArea.setAttribute("role", "alert");
  outputArea.textContent = excerpt ? `${error.message}\n\n${excerpt}` : error.message;
}
