import { buildErrorExcerpt, parseJson } from "../core/parser.js";
import { formatPath } from "../core/path-builder.js";
import { createNode } from "../core/tree-model.js";
import { StorageKey, PathFormat, CopyTarget } from "../shared/enums.js";
import { getStoredValue, setStoredValue } from "../shared/storage.js";
import { copyText } from "../ui/copy.js";
import { renderTree } from "../ui/tree-renderer.js";

const formatButton = document.querySelector("#format-button");
const inputArea = document.querySelector("#json-input");
const outputArea = document.querySelector("#json-output");
const pathFormatSelect = document.querySelector("#path-format");
const copyToast = document.querySelector("#copy-toast");
let pathFormat = getPathFormatPreference();

if (pathFormatSelect instanceof HTMLSelectElement) {
  pathFormatSelect.value = pathFormat;
  pathFormatSelect.addEventListener("change", () => {
    pathFormat = pathFormatSelect.value;
    if (!setStoredValue(StorageKey.PATH_FORMAT, pathFormat)) {
      showCopyToast("Could not save the path format preference.");
    }
  });
}

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
  renderTree(outputArea, createNode({ key: null, value, path: [] }), { onCopy });
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

/**
 * Uses a persisted format only when it is one of the formats this version supports.
 *
 * @returns {string} Supported path format.
 */
function getPathFormatPreference() {
  const storedFormat = getStoredValue(StorageKey.PATH_FORMAT, PathFormat.DOT);
  return Object.values(PathFormat).includes(storedFormat) ? storedFormat : PathFormat.DOT;
}

/**
 * Copies a node representation selected by the tree renderer.
 *
 * @param {string} target Requested copy target.
 * @param {import("../core/tree-model.js").JsonTreeNode} node JSON tree node.
 * @returns {Promise<void>}
 */
async function onCopy(target, node) {
  const path = formatPath(node.path, pathFormat);
  const text = getCopyText(target, node.value, path);
  const result = await copyText(text);

  if (!result.ok) {
    showCopyToast(result.error);
    return;
  }

  showCopyToast(target === CopyTarget.PATH ? `Copied: ${path}` : "Copied to clipboard.");
}

/**
 * Converts a copy request to safe plain text.
 *
 * @param {string} target Requested copy target.
 * @param {unknown} value Node value.
 * @param {string} path Formatted node path.
 * @returns {string} Clipboard text.
 */
function getCopyText(target, value, path) {
  if (target === CopyTarget.PATH) {
    return path;
  }

  return JSON.stringify(value, null, 2);
}

/**
 * Announces copying feedback without interpreting copied JSON as markup.
 *
 * @param {string} message Toast text.
 * @returns {void}
 */
function showCopyToast(message) {
  if (copyToast instanceof HTMLElement) {
    copyToast.textContent = message;
  }
}
