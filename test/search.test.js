import assert from "node:assert/strict";
import test from "node:test";

import { findMatches } from "../src/core/search.js";
import { MatchField } from "../src/shared/enums.js";

const sample = {
  users: [
    { name: "Ada", city: "Lahore" },
    { name: "Ali", active: true },
  ],
};

test("returns no matches for an empty or whitespace query", () => {
  assert.deepEqual(findMatches(sample, ""), { matches: [], truncated: false });
  assert.deepEqual(findMatches(sample, "   "), { matches: [], truncated: false });
});

test("matches keys and values case-insensitively in source order", () => {
  const { matches } = findMatches(sample, "NAME");

  assert.deepEqual(matches, [
    { path: ["users", 0, "name"], field: MatchField.KEY },
    { path: ["users", 1, "name"], field: MatchField.KEY },
  ]);
});

test("matches primitive values including booleans and null", () => {
  assert.deepEqual(findMatches(sample, "true").matches, [
    { path: ["users", 1, "active"], field: MatchField.VALUE },
  ]);
  assert.equal(findMatches({ a: null }, "null").matches.length, 1);
});

test("does not match array indexes or container values", () => {
  assert.equal(findMatches(sample, "0").matches.length, 0);
  assert.equal(findMatches(sample, "object").matches.length, 0);
});

test("reports both key and value matches on the same node", () => {
  const { matches } = findMatches({ ada: "Ada" }, "ada");

  assert.deepEqual(matches, [
    { path: ["ada"], field: MatchField.KEY },
    { path: ["ada"], field: MatchField.VALUE },
  ]);
});

test("matches Urdu text", () => {
  assert.equal(findMatches({ نام: "علی" }, "علی").matches.length, 1);
});

test("truncates at the limit", () => {
  const many = Array.from({ length: 10 }, () => "x");
  const result = findMatches(many, "x", 3);

  assert.equal(result.matches.length, 3);
  assert.equal(result.truncated, true);
});

test("handles very deep nesting without recursion errors", () => {
  let deep = "needle";
  for (let level = 0; level < 20000; level += 1) {
    deep = { child: deep };
  }

  assert.equal(findMatches(deep, "needle").matches.length, 1);
});

test("handles top-level primitives", () => {
  assert.deepEqual(findMatches("hello", "ell").matches, [{ path: [], field: MatchField.VALUE }]);
});
