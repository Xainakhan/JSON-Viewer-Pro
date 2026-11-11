import assert from "node:assert/strict";
import test from "node:test";

import { buildErrorExcerpt, parseJson } from "../src/core/parser.js";
import { ParseErrorCode } from "../src/shared/enums.js";

test("parses a valid object", () => {
  const result = parseJson('{"name":"Ada"}');

  assert.deepEqual(result, { ok: true, value: { name: "Ada" } });
});

test("parses a valid array", () => {
  const result = parseJson("[1, 2, 3]");

  assert.deepEqual(result, { ok: true, value: [1, 2, 3] });
});

test("parses top-level primitive values", () => {
  assert.deepEqual(parseJson("123"), { ok: true, value: 123 });
  assert.deepEqual(parseJson('"text"'), { ok: true, value: "text" });
  assert.deepEqual(parseJson("null"), { ok: true, value: null });
  assert.deepEqual(parseJson("true"), { ok: true, value: true });
});

test("returns EMPTY_INPUT for empty or whitespace-only input", () => {
  for (const text of ["", " \n\t "]) {
    const result = parseJson(text);

    assert.equal(result.ok, false);
    assert.equal(result.error.code, ParseErrorCode.EMPTY_INPUT);
    assert.equal(result.error.position, null);
  }
});

test("reports invalid JSON variants without throwing", () => {
  for (const text of ['{"name":"Ada",}', '{"name:"Ada"}', "{'name':'Ada'}", '{"name":']) {
    const result = parseJson(text);

    assert.equal(result.ok, false);
    assert.equal(result.error.code, ParseErrorCode.INVALID_JSON);
    assert.match(result.error.message, /Unexpected/);
  }
});

test("reports a multi-line invalid JSON location and excerpt", () => {
  const text = '{\n  "name": "Ada",\n  "active": true,\n}';
  const result = parseJson(text);

  assert.equal(result.ok, false);
  assert.equal(result.error.code, ParseErrorCode.INVALID_JSON);
  assert.equal(result.error.line, 4);
  assert.equal(result.error.column, 1);
  assert.equal(result.error.position, text.length - 1);
  assert.equal(buildErrorExcerpt(text, result.error.line, result.error.column), "}\n^");
});

test("parses Urdu and Arabic string values", () => {
  const result = parseJson('{"urdu":"اردو متن","arabic":"مرحبا بالعالم"}');

  assert.deepEqual(result, {
    ok: true,
    value: { urdu: "اردو متن", arabic: "مرحبا بالعالم" },
  });
});

test("accepts very large numeric values without throwing", () => {
  const result = parseJson('{"value":123456789012345678901234567890}');

  assert.equal(result.ok, true);
  assert.equal(typeof result.value, "object");
});
