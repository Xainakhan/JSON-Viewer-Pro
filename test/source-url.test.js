import assert from "node:assert/strict";
import test from "node:test";

import { getJsonSourceUrl } from "../src/core/source-url.js";

test("accepts HTTP and HTTPS source URLs", () => {
  assert.equal(getJsonSourceUrl("https://example.com/data.json"), "https://example.com/data.json");
  assert.equal(getJsonSourceUrl("http://localhost:3000/api"), "http://localhost:3000/api");
});

test("rejects unsupported or invalid source URLs", () => {
  assert.equal(getJsonSourceUrl("chrome://extensions"), null);
  assert.equal(getJsonSourceUrl("file:///data.json"), null);
  assert.equal(getJsonSourceUrl("not a URL"), null);
  assert.equal(getJsonSourceUrl(undefined), null);
});
