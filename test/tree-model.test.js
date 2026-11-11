import assert from "node:assert/strict";
import test from "node:test";

import { createNode, getChildren } from "../src/core/tree-model.js";
import { ValueType } from "../src/shared/enums.js";

test("identifies node types and container metadata", () => {
  const objectNode = createNode({ key: null, value: { name: "Ada", active: true }, path: [] });
  const arrayNode = createNode({ key: "items", value: [1, 2], path: ["items"] });

  assert.equal(objectNode.type, ValueType.OBJECT);
  assert.equal(objectNode.childCount, 2);
  assert.equal(objectNode.isExpandable, true);
  assert.equal(arrayNode.type, ValueType.ARRAY);
  assert.equal(arrayNode.childCount, 2);
});

test("creates children lazily in source order", () => {
  const node = createNode({ key: null, value: { first: 1, second: 2, third: 3 }, path: [] });
  const firstBatch = getChildren(node, 0, 2);
  const secondBatch = getChildren(node, 2, 1);

  assert.deepEqual(
    firstBatch.map((child) => child.key),
    ["first", "second"],
  );
  assert.deepEqual(
    secondBatch.map((child) => child.key),
    ["third"],
  );
  assert.deepEqual(firstBatch[0].path, ["first"]);
});

test("handles empty objects and arrays without expandable children", () => {
  for (const value of [{}, []]) {
    const node = createNode({ key: null, value, path: [] });

    assert.equal(node.childCount, 0);
    assert.equal(node.isExpandable, false);
    assert.deepEqual(getChildren(node), []);
  }
});

test("treats null as a non-expandable null node", () => {
  const node = createNode({ key: "value", value: null, path: ["value"] });

  assert.equal(node.type, ValueType.NULL);
  assert.equal(node.isExpandable, false);
});

test("keeps array indexes in paths", () => {
  const node = createNode({ key: "users", value: [{ name: "Ada" }], path: ["users"] });
  const [child] = getChildren(node);

  assert.equal(child.key, 0);
  assert.deepEqual(child.path, ["users", 0]);
});

test("preserves Urdu and Arabic keys and values", () => {
  const node = createNode({ key: null, value: { اردو: "متن", العربية: "مرحبا" }, path: [] });
  const children = getChildren(node);

  assert.deepEqual(
    children.map((child) => [child.key, child.value]),
    [
      ["اردو", "متن"],
      ["العربية", "مرحبا"],
    ],
  );
});

test("supports top-level primitive values", () => {
  const node = createNode({ key: null, value: true, path: [] });

  assert.equal(node.type, ValueType.BOOLEAN);
  assert.equal(node.childCount, 0);
  assert.equal(node.isExpandable, false);
});
