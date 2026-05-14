import { test } from "node:test";
import assert from "node:assert/strict";
import { redactText } from "./redact.js";

test("redactText hides common secrets and home paths", () => {
  const output = redactText("token=abcdef123456 path=/Users/alice/project sk-abcdefghijklmnopqrstuvwxyz", "/Users/alice");
  assert.match(output, /token=\[REDACTED\]/);
  assert.match(output, /~\/project/);
  assert.doesNotMatch(output, /sk-abcdefghijklmnopqrstuvwxyz/);
});
