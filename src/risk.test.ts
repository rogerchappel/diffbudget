import { test } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_CONFIG } from "./defaults.js";
import { scoreFile } from "./risk.js";

test("scoreFile tags risky auth changes", () => {
  const risk = scoreFile({ path: "src/auth/login.ts", status: "modified", additions: 25, deletions: 1 }, DEFAULT_CONFIG, false);
  assert.ok(risk.score > 40);
  assert.ok(risk.tags.includes("risky-path"));
  assert.ok(risk.tags.includes("missing-tests"));
});

test("scoreFile tags dependency files", () => {
  const risk = scoreFile({ path: "package-lock.json", status: "modified", additions: 3, deletions: 1 }, DEFAULT_CONFIG, true);
  assert.ok(risk.tags.includes("dependency"));
});
