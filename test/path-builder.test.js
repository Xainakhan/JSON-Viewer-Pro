import assert from "node:assert/strict";
import test from "node:test";

import { formatPath } from "../src/core/path-builder.js";
import { PathFormat } from "../src/shared/enums.js";

const pathFormats = [PathFormat.DOT, PathFormat.JSON_PATH, PathFormat.OPTIONAL_CHAINING];

test("formats identifier-safe nested paths in every format", () => {
  const segments = ["data", "users", 0, "name"];

  assert.equal(formatPath(segments, PathFormat.DOT), "data.users[0].name");
  assert.equal(formatPath(segments, PathFormat.JSON_PATH), "$.data.users[0].name");
  assert.equal(formatPath(segments, PathFormat.OPTIONAL_CHAINING), "data?.users?.[0]?.name");
});

test("uses escaped bracket notation for unsafe object keys in every format", () => {
  const unsafeKeys = [
    "user-name",
    "has.dot",
    "two words",
    "",
    "123",
    'say "hi"',
    "back\\slash",
    "اردو",
  ];

  for (const format of pathFormats) {
    for (const key of unsafeKeys) {
      const quotedKey = JSON.stringify(key);
      const expectedPrefix = format === PathFormat.JSON_PATH ? "$" : "";
      const expected = `${expectedPrefix}[${quotedKey}]`;
      assert.equal(formatPath([key], format), expected);
    }
  }
});

test("uses bracket notation after safe optional-chain segments", () => {
  assert.equal(formatPath(["data", "user-name"], PathFormat.DOT), 'data["user-name"]');
  assert.equal(formatPath(["data", "user-name"], PathFormat.JSON_PATH), '$.data["user-name"]');
  assert.equal(
    formatPath(["data", "user-name"], PathFormat.OPTIONAL_CHAINING),
    'data?.["user-name"]',
  );
});

test("keeps numeric array indexes distinct from numeric-looking object keys", () => {
  assert.equal(formatPath(["data", 0, "0"], PathFormat.DOT), 'data[0]["0"]');
  assert.equal(formatPath(["data", 0, "0"], PathFormat.JSON_PATH), '$.data[0]["0"]');
  assert.equal(formatPath(["data", 0, "0"], PathFormat.OPTIONAL_CHAINING), 'data?.[0]?.["0"]');
});

test("formats nested arrays", () => {
  const segments = ["a", 0, 1, "b"];

  assert.equal(formatPath(segments, PathFormat.DOT), "a[0][1].b");
  assert.equal(formatPath(segments, PathFormat.JSON_PATH), "$.a[0][1].b");
  assert.equal(formatPath(segments, PathFormat.OPTIONAL_CHAINING), "a?.[0]?.[1]?.b");
});

test("formats root arrays and primitive roots", () => {
  assert.equal(formatPath([0, "id"], PathFormat.DOT), "[0].id");
  assert.equal(formatPath([0, "id"], PathFormat.JSON_PATH), "$[0].id");
  assert.equal(formatPath([0, "id"], PathFormat.OPTIONAL_CHAINING), "[0]?.id");

  assert.equal(formatPath([], PathFormat.DOT), "");
  assert.equal(formatPath([], PathFormat.JSON_PATH), "$");
  assert.equal(formatPath([], PathFormat.OPTIONAL_CHAINING), "");
});

test("formats long deep paths without changing segment order", () => {
  const segments = Array.from({ length: 40 }, (_, index) => `level${index}`);
  const dotPath = formatPath(segments, PathFormat.DOT);
  const jsonPath = formatPath(segments, PathFormat.JSON_PATH);
  const optionalPath = formatPath(segments, PathFormat.OPTIONAL_CHAINING);

  assert.equal(dotPath, segments.join("."));
  assert.equal(jsonPath, `$.${segments.join(".")}`);
  assert.equal(optionalPath, segments.join("?."));
});
