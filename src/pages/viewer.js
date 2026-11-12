import { formatRaw } from "../core/raw-formatter.js";
import { buildErrorExcerpt, parseJson } from "../core/parser.js";
import { formatPath } from "../core/path-builder.js";
import { findMatches } from "../core/search.js";
import { createNode } from "../core/tree-model.js";
import { EXPAND_ALL_NODE_LIMIT, SEARCH_DEBOUNCE_MS } from "../shared/constants.js";
import { CopyTarget, StorageKey, Theme, ViewMode } from "../shared/enums.js";
import {
  getPathFormatPreference,
  getThemePreference,
  getViewModePreference,
} from "../shared/preferences.js";
import { setStoredValue } from "../shared/storage.js";
import { copyText } from "../ui/copy.js";
import { renderTree } from "../ui/tree-renderer.js";

const formatButton = document.querySelector("#format-button");
const inputArea = document.querySelector("#json-input");
const outputArea = document.querySelector("#json-output");
const treeOutput = document.querySelector("#tree-output");
const rawOutput = document.querySelector("#raw-output");
const errorOutput = document.querySelector("#error-output");
const pathFormatSelect = document.querySelector("#path-format");
const copyToast = document.querySelector("#copy-toast");
const searchInput = document.querySelector("#search-input");
const searchStatus = document.querySelector("#search-status");
const expandAllButton = document.querySelector("#expand-all-button");
const collapseAllButton = document.querySelector("#collapse-all-button");
const treeViewButton = document.querySelector("#tree-view-button");
const rawViewButton = document.querySelector("#raw-view-button");
const themeToggleButton = document.querySelector("#theme-toggle-button");
let pathFormat = getPathFormatPreference();
let viewMode = getViewModePreference();
let theme = getThemePreference();
let currentValue = null;
let treeControls = null;
let searchTimer;

applyTheme(theme);
configureToolbar();
void loadSourceFromQuery();

function configureToolbar() {
  if (searchInput instanceof HTMLInputElement) {
    searchInput.addEventListener("input", () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(runSearch, SEARCH_DEBOUNCE_MS);
    });
  }
  if (pathFormatSelect instanceof HTMLSelectElement) {
    pathFormatSelect.value = pathFormat;
    pathFormatSelect.addEventListener("change", () => {
      pathFormat = pathFormatSelect.value;
      if (!setStoredValue(StorageKey.PATH_FORMAT, pathFormat))
        showCopyToast("Could not save the path format preference.");
    });
  }
  expandAllButton?.addEventListener("click", expandAll);
  collapseAllButton?.addEventListener("click", () => treeControls?.collapseAll());
  treeViewButton?.addEventListener("click", () => setViewMode(ViewMode.TREE));
  rawViewButton?.addEventListener("click", () => setViewMode(ViewMode.RAW));
  themeToggleButton?.addEventListener("click", toggleTheme);
  formatButton?.addEventListener("click", formatInput);
  updateViewControls();
  updateThemeButton();
}

function formatInput() {
  if (!(inputArea instanceof HTMLTextAreaElement) || !(outputArea instanceof HTMLElement)) return;
  const result = parseJson(inputArea.value);
  if (result.ok) return showValue(result.value);
  showParseError(outputArea, inputArea.value, result.error);
}

function showValue(value) {
  if (!(outputArea instanceof HTMLElement) || !(treeOutput instanceof HTMLElement)) return;
  outputArea.classList.remove("error-box");
  if (errorOutput instanceof HTMLPreElement) errorOutput.hidden = true;
  currentValue = value;
  treeControls = renderTree(treeOutput, createNode({ key: null, value, path: [] }), { onCopy });
  if (rawOutput instanceof HTMLPreElement) rawOutput.textContent = formatRaw(value);
  updateViewControls();
  runSearch();
}

function showParseError(output, text, error) {
  treeControls = null;
  currentValue = null;
  updateViewControls();
  setSearchStatus("");
  const excerpt = buildErrorExcerpt(text, error.line, error.column);
  output.classList.add("error-box");
  if (errorOutput instanceof HTMLPreElement) {
    errorOutput.textContent = excerpt ? `${error.message}\n\n${excerpt}` : error.message;
    errorOutput.hidden = false;
  }
}

function expandAll() {
  if (treeControls?.expandAll().complete === false) {
    showCopyToast(
      `Expanded the first ${EXPAND_ALL_NODE_LIMIT} nodes. Use search or expand nodes individually.`,
    );
  }
}

function setViewMode(mode) {
  viewMode = mode;
  setStoredValue(StorageKey.VIEW_MODE, mode);
  updateViewControls();
  if (mode === ViewMode.RAW) setSearchStatus("Search highlighting is unavailable in raw view.");
  else runSearch();
}

function updateViewControls() {
  const hasTree = treeControls !== null;
  if (treeOutput instanceof HTMLElement) treeOutput.hidden = viewMode !== ViewMode.TREE || !hasTree;
  if (rawOutput instanceof HTMLPreElement) rawOutput.hidden = viewMode !== ViewMode.RAW || !hasTree;
  if (errorOutput instanceof HTMLPreElement) errorOutput.hidden = hasTree;
  if (treeViewButton instanceof HTMLButtonElement)
    treeViewButton.setAttribute("aria-pressed", String(viewMode === ViewMode.TREE));
  if (rawViewButton instanceof HTMLButtonElement)
    rawViewButton.setAttribute("aria-pressed", String(viewMode === ViewMode.RAW));
  const disabled = !hasTree || viewMode === ViewMode.RAW;
  if (expandAllButton instanceof HTMLButtonElement) expandAllButton.disabled = disabled;
  if (collapseAllButton instanceof HTMLButtonElement) collapseAllButton.disabled = disabled;
}

function toggleTheme() {
  theme = theme === Theme.DARK ? Theme.LIGHT : Theme.DARK;
  applyTheme(theme);
  setStoredValue(StorageKey.THEME, theme);
  updateThemeButton();
}

function applyTheme(nextTheme) {
  if (nextTheme === null) delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = nextTheme;
}

function updateThemeButton() {
  if (!(themeToggleButton instanceof HTMLButtonElement)) return;
  const effectiveTheme =
    theme ?? (matchMedia("(prefers-color-scheme: dark)").matches ? Theme.DARK : Theme.LIGHT);
  themeToggleButton.textContent =
    effectiveTheme === Theme.DARK ? "Switch to light theme" : "Switch to dark theme";
}

async function onCopy(target, node) {
  const path = formatPath(node.path, pathFormat);
  const result = await copyText(getCopyText(target, node.value, path));
  showCopyToast(
    result.ok
      ? target === CopyTarget.PATH
        ? `Copied: ${path}`
        : "Copied to clipboard."
      : result.error,
  );
}

function getCopyText(target, value, path) {
  if (target === CopyTarget.PATH) return path;
  if (target === CopyTarget.VALUE && typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
}

function showCopyToast(message) {
  if (copyToast instanceof HTMLElement) copyToast.textContent = message;
}

function runSearch() {
  if (treeControls === null || !(searchInput instanceof HTMLInputElement)) return;
  if (viewMode === ViewMode.RAW)
    return setSearchStatus("Search highlighting is unavailable in raw view.");
  const { matches, truncated } = findMatches(currentValue, searchInput.value);
  treeControls.setHighlights(matches.map((match) => match.path));
  setSearchStatus(
    searchInput.value.trim() === "" ? "" : describeMatches(matches.length, truncated),
  );
}

function describeMatches(count, truncated) {
  if (count === 0) return "No matches";
  return `${count}${truncated ? "+" : ""} ${count === 1 ? "match" : "matches"}`;
}

function setSearchStatus(message) {
  if (searchStatus instanceof HTMLElement) searchStatus.textContent = message;
}

async function loadSourceFromQuery() {
  const sourceUrl = new URLSearchParams(location.search).get("source");
  if (sourceUrl === null || !(inputArea instanceof HTMLTextAreaElement)) return;

  setSearchStatus("Loading JSON from the active tab…");
  try {
    const response = await fetch(sourceUrl);
    if (!response.ok) throw new Error("The page could not be loaded.");
    inputArea.value = await response.text();
    formatInput();
  } catch {
    setSearchStatus("Could not load JSON from the active tab. Paste it here instead.");
  }
}
