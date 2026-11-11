import { ValueType } from "../shared/enums.js";

/**
 * Creates a JSON tree node without traversing any descendants.
 *
 * @param {{ key: string | number | null, value: unknown, path: Array<string | number> }} options Node properties.
 * @returns {JsonTreeNode} A lazily-expandable JSON tree node.
 */
export function createNode({ key, value, path }) {
  const type = getValueType(value);
  const childCount = getChildCount(value, type);

  return {
    key,
    value,
    path,
    type,
    childCount,
    isExpandable: childCount > 0,
  };
}

/**
 * Creates a requested range of children only when an expanded UI needs them.
 *
 * @param {JsonTreeNode} node Parent node.
 * @param {number} [startIndex=0] Zero-based child offset.
 * @param {number} [count=node.childCount] Number of children to create.
 * @returns {JsonTreeNode[]} Child nodes in JSON property or array-index order.
 */
export function getChildren(node, startIndex = 0, count = node.childCount) {
  if (!node.isExpandable || count <= 0 || startIndex >= node.childCount) {
    return [];
  }

  const endIndex = Math.min(startIndex + count, node.childCount);
  if (node.type === ValueType.ARRAY) {
    return createArrayChildren(node, startIndex, endIndex);
  }

  return createObjectChildren(node, startIndex, endIndex);
}

/**
 * @typedef {object} JsonTreeNode
 * @property {string | number | null} key Object key, array index, or null for the root.
 * @property {unknown} value The source JSON value.
 * @property {Array<string | number>} path Unformatted source path segments.
 * @property {string} type JSON value type.
 * @property {number} childCount Number of immediate children.
 * @property {boolean} isExpandable Whether the node has children to reveal.
 */

/**
 * Identifies a value without treating null as an object.
 *
 * @param {unknown} value JSON value.
 * @returns {string} JSON value type.
 */
function getValueType(value) {
  if (value === null) {
    return ValueType.NULL;
  }

  if (Array.isArray(value)) {
    return ValueType.ARRAY;
  }

  if (typeof value === "object") {
    return ValueType.OBJECT;
  }

  return typeof value;
}

/**
 * Counts only immediate container entries, preserving a constant-cost node creation path.
 *
 * @param {unknown} value JSON value.
 * @param {string} type JSON value type.
 * @returns {number} Immediate child count.
 */
function getChildCount(value, type) {
  if (type === ValueType.ARRAY) {
    return value.length;
  }

  if (type === ValueType.OBJECT) {
    return Object.keys(value).length;
  }

  return 0;
}

/**
 * Creates a slice of array children without materializing the remaining items.
 *
 * @param {JsonTreeNode} node Array parent.
 * @param {number} startIndex First index to create.
 * @param {number} endIndex Exclusive final index.
 * @returns {JsonTreeNode[]} Array child nodes.
 */
function createArrayChildren(node, startIndex, endIndex) {
  const children = [];
  for (let index = startIndex; index < endIndex; index += 1) {
    children.push(
      createNode({ key: index, value: node.value[index], path: [...node.path, index] }),
    );
  }

  return children;
}

/**
 * Creates a slice of object children in Object.keys order.
 *
 * @param {JsonTreeNode} node Object parent.
 * @param {number} startIndex First property index to create.
 * @param {number} endIndex Exclusive final property index.
 * @returns {JsonTreeNode[]} Object child nodes.
 */
function createObjectChildren(node, startIndex, endIndex) {
  const keys = Object.keys(node.value);
  return keys
    .slice(startIndex, endIndex)
    .map((key) => createNode({ key, value: node.value[key], path: [...node.path, key] }));
}
