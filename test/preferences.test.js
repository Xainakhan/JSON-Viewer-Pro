import assert from "node:assert/strict";
import test from "node:test";

import { getThemePreference, getViewModePreference } from "../src/shared/preferences.js";

test("falls back when a saved preference is invalid", () => {
  const originalStorage = globalThis.localStorage;
  globalThis.localStorage = { getItem: () => "invalid" };
  assert.equal(getThemePreference(), null);
  assert.equal(getViewModePreference(), "tree");
  globalThis.localStorage = originalStorage;
});

test("falls back when storage throws", () => {
  const originalStorage = globalThis.localStorage;
  globalThis.localStorage = {
    getItem: () => {
      throw new Error("blocked");
    },
  };
  assert.equal(getThemePreference(), null);
  assert.equal(getViewModePreference(), "tree");
  globalThis.localStorage = originalStorage;
});
