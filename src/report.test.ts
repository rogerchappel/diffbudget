import { test } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_CONFIG } from "./defaults.js";
import { buildReport, renderMarkdown } from "./report.js";

test("buildReport produces deterministic totals with injected date", () => {
  const report = buildReport({
    changes: [{ path: "src/security/policy.ts", status: "modified", additions: 100, deletions: 5 }],
    config: DEFAULT_CONFIG,
    workspace: "/tmp/example",
    source: "fixture.diff",
    version: "0.0.0-test",
    now: new Date("2026-01-01T00:00:00Z")
  });
  assert.equal(report.generatedAt, "2026-01-01T00:00:00.000Z");
  assert.equal(report.totals.changedLines, 105);
  assert.equal(report.files[0]?.tags.includes("risky-path"), true);
  assert.match(renderMarkdown(report), /DiffBudget Report/);
});
