import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseUnifiedDiff } from "./diffParser.js";

test("parseUnifiedDiff extracts paths and line counts", () => {
  const diff = readFileSync("fixtures/simple-risk/sample.diff", "utf8");
  const changes = parseUnifiedDiff(diff);
  assert.equal(changes.length, 3);
  assert.equal(changes[0]?.path, "src/auth/login.ts");
  assert.equal(changes[0]?.additions, 17);
  assert.equal(changes[0]?.deletions, 1);
  assert.equal(changes[2]?.status, "added");
});
