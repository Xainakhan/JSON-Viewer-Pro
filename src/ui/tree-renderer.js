import { getChildren } from "../core/tree-model.js";
import { CHILD_RENDER_BATCH_SIZE, STRING_PREVIEW_LENGTH } from "../shared/constants.js";
import { CopyTarget, ValueType } from "../shared/enums.js";

const ROOT_NODE_LABEL = "root";
const TREE_ITEM_SELECTOR = '[role="treeitem"]';
const NODE_ID_ATTRIBUTE = "data-tree-node-id";
const rendererControllers = new WeakMap();

/**
 * Renders a lazy, keyboard-accessible JSON tree into a container.
 *
 * @param {HTMLElement} container Target element.
 * @param {import("../core/tree-model.js").JsonTreeNode} rootNode Root model node.
 * @param {TreeRenderOptions} [options] Interaction callbacks.
 * @returns {void}
 */
export function renderTree(container, rootNode, options = {}) {
  rendererControllers.get(container)?.abort();
  const eventController = new AbortController();
  rendererControllers.set(container, eventController);

  const stateById = new Map();
  let nextNodeId = 0;

  container.replaceChildren();
  container.classList.add("json-tree");
  container.setAttribute("role", "tree");
  container.setAttribute("aria-label", "JSON tree");
  container.removeAttribute("aria-live");

  const rootState = createNodeState(rootNode, container);
  expandNode(rootState);

  container.addEventListener(
    "click",
    (event) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const loadMoreButton = target.closest("[data-load-more-node-id]");
      if (loadMoreButton instanceof HTMLButtonElement) {
        loadNextBatch(loadMoreButton.dataset.loadMoreNodeId);
        return;
      }

      const copyButton = target.closest("[data-copy-target]");
      if (copyButton instanceof HTMLButtonElement) {
        const treeItem = copyButton.closest(TREE_ITEM_SELECTOR);
        if (treeItem instanceof HTMLElement) {
          copyNode(copyButton.dataset.copyTarget, treeItem.dataset.treeNodeId);
        }
        return;
      }

      const treeItem = target.closest(TREE_ITEM_SELECTOR);
      if (treeItem instanceof HTMLElement) {
        toggleNode(treeItem.dataset.treeNodeId);
      }
    },
    { signal: eventController.signal },
  );

  container.addEventListener(
    "keydown",
    (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement) || target.getAttribute("role") !== "treeitem") {
        return;
      }

      handleKeyboardNavigation(event, target);
    },
    { signal: eventController.signal },
  );

  /**
   * Registers a node and creates its single focusable treeitem.
   *
   * @param {import("../core/tree-model.js").JsonTreeNode} node Model node.
   * @param {HTMLElement} parent Parent element.
   * @returns {TreeNodeState} Render state.
   */
  function createNodeState(node, parent) {
    const id = String(nextNodeId);
    nextNodeId += 1;

    const treeItem = document.createElement("div");
    treeItem.className = "tree-item";
    treeItem.tabIndex = stateById.size === 0 ? 0 : -1;
    treeItem.setAttribute("role", "treeitem");
    treeItem.setAttribute("aria-level", String(node.path.length + 1));
    treeItem.setAttribute(NODE_ID_ATTRIBUTE, id);

    if (node.isExpandable) {
      treeItem.setAttribute("aria-expanded", "false");
    }

    appendNodeContent(treeItem, node);
    parent.append(treeItem);

    const state = { id, node, treeItem, group: null, renderedCount: 0, isExpanded: false };
    stateById.set(id, state);
    return state;
  }

  /**
   * Expands a node and creates its first child batch only once.
   *
   * @param {TreeNodeState} state Render state.
   * @returns {void}
   */
  function expandNode(state) {
    if (!state.node.isExpandable) {
      return;
    }

    state.isExpanded = true;
    state.treeItem.setAttribute("aria-expanded", "true");

    if (state.group === null) {
      state.group = document.createElement("div");
      state.group.className = "tree-group";
      state.group.setAttribute("role", "group");
      state.treeItem.append(state.group);
      renderNextBatch(state);
      return;
    }

    state.group.hidden = false;
  }

  /**
   * Collapses a node without discarding already-rendered descendants.
   *
   * @param {TreeNodeState} state Render state.
   * @returns {void}
   */
  function collapseNode(state) {
    if (!state.node.isExpandable || state.group === null) {
      return;
    }

    state.isExpanded = false;
    state.treeItem.setAttribute("aria-expanded", "false");
    state.group.hidden = true;
  }

  /**
   * Toggles one registered node by id.
   *
   * @param {string | undefined} nodeId Registered node id.
   * @returns {void}
   */
  function toggleNode(nodeId) {
    const state = nodeId === undefined ? undefined : stateById.get(nodeId);
    if (!state || !state.node.isExpandable) {
      return;
    }

    if (state.isExpanded) {
      collapseNode(state);
      return;
    }

    expandNode(state);
  }

  /**
   * Appends a bounded child batch and updates the remaining-children control.
   *
   * @param {TreeNodeState} state Expanded node state.
   * @returns {void}
   */
  function renderNextBatch(state) {
    if (state.group === null) {
      return;
    }

    state.group.querySelector("[data-load-more-node-id]")?.remove();
    const children = getChildren(state.node, state.renderedCount, CHILD_RENDER_BATCH_SIZE);
    for (const child of children) {
      createNodeState(child, state.group);
    }

    state.renderedCount += children.length;
    appendLoadMoreButton(state);
  }

  /**
   * Loads the next child batch for a registered node.
   *
   * @param {string | undefined} nodeId Registered node id.
   * @returns {void}
   */
  function loadNextBatch(nodeId) {
    const state = nodeId === undefined ? undefined : stateById.get(nodeId);
    if (!state) {
      return;
    }

    renderNextBatch(state);
  }

  /**
   * Delegates copying to the page controller so the renderer stays independent of clipboard APIs.
   *
   * @param {string | undefined} target Requested copy target.
   * @param {string | undefined} nodeId Registered node id.
   * @returns {void}
   */
  function copyNode(target, nodeId) {
    const state = nodeId === undefined ? undefined : stateById.get(nodeId);
    if (!state || target === undefined || options.onCopy === undefined) {
      return;
    }

    Promise.resolve(options.onCopy(target, state.node)).catch(() => undefined);
  }

  /**
   * Adds a progressively-disclosed child batch button when items remain.
   *
   * @param {TreeNodeState} state Expanded node state.
   * @returns {void}
   */
  function appendLoadMoreButton(state) {
    if (state.group === null) {
      return;
    }

    const remainingCount = state.node.childCount - state.renderedCount;
    if (remainingCount <= 0) {
      return;
    }

    const loadMoreButton = document.createElement("button");
    loadMoreButton.className = "show-more-button";
    loadMoreButton.type = "button";
    loadMoreButton.dataset.loadMoreNodeId = state.id;
    loadMoreButton.textContent = `Show ${Math.min(remainingCount, CHILD_RENDER_BATCH_SIZE)} more`;
    state.group.append(loadMoreButton);
  }

  /**
   * Handles tree-specific keyboard navigation through visible nodes.
   *
   * @param {KeyboardEvent} event Keyboard event.
   * @param {HTMLElement} treeItem Focused item.
   * @returns {void}
   */
  function handleKeyboardNavigation(event, treeItem) {
    const state = stateById.get(treeItem.dataset.treeNodeId);
    if (!state) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleNode(state.id);
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      if (!state.isExpanded) {
        expandNode(state);
        return;
      }

      focusFirstChild(state);
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      if (state.isExpanded) {
        collapseNode(state);
        return;
      }

      focusParent(treeItem);
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      moveFocus(treeItem, event.key === "ArrowDown" ? 1 : -1);
    }
  }

  /**
   * Focuses the first visible direct child of an expanded node.
   *
   * @param {TreeNodeState} state Expanded node state.
   * @returns {void}
   */
  function focusFirstChild(state) {
    state.group?.querySelector(`:scope > ${TREE_ITEM_SELECTOR}`)?.focus();
  }

  /**
   * Focuses the closest owning treeitem, if there is one.
   *
   * @param {HTMLElement} treeItem Current treeitem.
   * @returns {void}
   */
  function focusParent(treeItem) {
    treeItem.parentElement?.closest(TREE_ITEM_SELECTOR)?.focus();
  }

  /**
   * Moves focus through rendered, visible treeitems.
   *
   * @param {HTMLElement} treeItem Current treeitem.
   * @param {number} offset Relative visible-item offset.
   * @returns {void}
   */
  function moveFocus(treeItem, offset) {
    const visibleItems = [...container.querySelectorAll(TREE_ITEM_SELECTOR)].filter(
      (item) => !item.closest("[hidden]"),
    );
    const currentIndex = visibleItems.indexOf(treeItem);
    visibleItems[currentIndex + offset]?.focus();
  }
}

/**
 * @typedef {object} TreeRenderOptions
 * @property {(target: string, node: import("../core/tree-model.js").JsonTreeNode) => void | Promise<void>} [onCopy]
 */

/**
 * @typedef {object} TreeNodeState
 * @property {string} id Registered node id.
 * @property {import("../core/tree-model.js").JsonTreeNode} node Model node.
 * @property {HTMLElement} treeItem Treeitem element.
 * @property {HTMLElement | null} group Descendant group.
 * @property {number} renderedCount Number of child nodes already created.
 * @property {boolean} isExpanded Current expansion state.
 */

/**
 * Adds key, summary, and type-colored value content without parsing or stringifying JSON as HTML.
 *
 * @param {HTMLElement} treeItem Treeitem element.
 * @param {import("../core/tree-model.js").JsonTreeNode} node Model node.
 * @returns {void}
 */
function appendNodeContent(treeItem, node) {
  const row = document.createElement("span");
  row.className = "tree-row";

  const toggle = document.createElement("span");
  toggle.className = node.isExpandable ? "tree-toggle" : "tree-toggle tree-toggle-placeholder";
  toggle.setAttribute("aria-hidden", "true");
  toggle.textContent = node.isExpandable ? "▸" : "";

  const key = document.createElement("button");
  key.className = "tree-key";
  key.type = "button";
  key.dataset.copyTarget = CopyTarget.PATH;
  key.setAttribute("aria-label", "Copy path");
  key.textContent = node.key === null ? ROOT_NODE_LABEL : String(node.key);

  const separator = document.createElement("span");
  separator.className = "tree-separator";
  separator.textContent = ": ";

  row.append(toggle, key, separator, createValueElement(node), createActionButtons());
  treeItem.append(row);
}

/**
 * Creates explicit copy actions that are revealed only during node interaction.
 *
 * @returns {HTMLElement} Action-button container.
 */
function createActionButtons() {
  const actions = document.createElement("span");
  actions.className = "tree-actions";
  actions.append(
    createCopyButton(CopyTarget.PATH, "Copy path"),
    createCopyButton(CopyTarget.VALUE, "Copy value"),
    createCopyButton(CopyTarget.SUBTREE, "Copy subtree"),
  );
  return actions;
}

/**
 * Creates one accessible copy button for a tree node.
 *
 * @param {string} target Copy target.
 * @param {string} label Accessible action label.
 * @returns {HTMLButtonElement} Copy action button.
 */
function createCopyButton(target, label) {
  const button = document.createElement("button");
  button.className = "tree-action";
  button.type = "button";
  button.dataset.copyTarget = target;
  button.setAttribute("aria-label", label);
  button.textContent = label;
  return button;
}

/**
 * Creates an appropriate value or container-summary element.
 *
 * @param {import("../core/tree-model.js").JsonTreeNode} node Model node.
 * @returns {HTMLElement} Renderable value element.
 */
function createValueElement(node) {
  const value = document.createElement("span");
  value.className = `tree-value value-${node.type}`;

  if (node.type === ValueType.OBJECT) {
    value.textContent = `{${node.childCount}}`;
    return value;
  }

  if (node.type === ValueType.ARRAY) {
    value.textContent = `[${node.childCount}]`;
    return value;
  }

  const fullText = node.type === ValueType.STRING ? `"${node.value}"` : String(node.value);
  value.textContent = truncateText(fullText);
  value.title = fullText;
  return value;
}

/**
 * Limits oversized previews while preserving the complete value in the node model and title.
 *
 * @param {string} text Full display value.
 * @returns {string} Short display value.
 */
function truncateText(text) {
  if (text.length <= STRING_PREVIEW_LENGTH) {
    return text;
  }

  return `${text.slice(0, STRING_PREVIEW_LENGTH)}…`;
}
