import { SEARCH_MATCH_LIMIT } from "../shared/constants.js";
import { MatchField } from "../shared/enums.js";

/**
 * Finds keys and primitive values containing the query, in source order.
 *
 * @param {unknown} root Parsed JSON value.
 * @param {string} query Case-insensitive search text.
 * @param {number} [limit] Maximum matches returned.
 * @returns {{ matches: Array<{ path: Array<string | number>, field: string }>, truncated: boolean }}
 */
export function findMatches(root, query, limit = SEARCH_MATCH_LIMIT) {
  const needle = query.trim().toLowerCase();
  if (needle === "") {
    return { matches: [], truncated: false };
  }

  const matches = [];
  const stack = [{ key: null, value: root, path: [] }];

  while (stack.length > 0) {
    const { key, value, path } = stack.pop();

    if (typeof key === "string" && containsText(key, needle)) {
      matches.push({ path, field: MatchField.KEY });
    }

    if (!isContainer(value) && containsText(String(value), needle)) {
      matches.push({ path, field: MatchField.VALUE });
    }

    if (matches.length > limit) {
      return { matches: matches.slice(0, limit), truncated: true };
    }

    pushChildren(stack, value, path);
  }

  return { matches, truncated: false };
}

function containsText(text, needle) {
  return text.toLowerCase().includes(needle);
}

function isContainer(value) {
  return typeof value === "object" && value !== null;
}

function pushChildren(stack, value, path) {
  if (!isContainer(value)) {
    return;
  }

  const entries = Array.isArray(value)
    ? value.map((child, index) => [index, child])
    : Object.entries(value);

  for (let index = entries.length - 1; index >= 0; index -= 1) {
    const [key, child] = entries[index];
    stack.push({ key, value: child, path: [...path, key] });
  }
}
