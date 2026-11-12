import assert from "node:assert/strict";
import test from "node:test";

import { formatRaw } from "../src/core/raw-formatter.js";

test("formats objects, arrays, primitives, null, and nested structures with two spaces", () => {
  assert.equal(
    formatRaw({ items: [true, null, { count: 2 }] }),
    '{\n  "items": [\n    true,\n    null,\n    {\n      "count": 2\n    }\n  ]\n}',
  );
  assert.equal(formatRaw("text"), '"text"');
  assert.equal(formatRaw(null), "null");
});

test("preserves Urdu and Arabic strings", () => {
  assert.equal(
    formatRaw({ urdu: "اردو متن", arabic: "مرحبا بالعالم" }),
    '{\n  "urdu": "اردو متن",\n  "arabic": "مرحبا بالعالم"\n}',
  );
});

test("does not throw for large JSON numbers", () => {
  assert.doesNotThrow(() => formatRaw(JSON.parse("123456789012345678901234567890")));
});
