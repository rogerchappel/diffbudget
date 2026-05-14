import { test } from "node:test";
import assert from "node:assert/strict";
import { oneLineSummary } from "./summary.js";

test("oneLineSummary is concise", () => {
  assert.equal(oneLineSummary({
    tool: "diffbudget",
    version: "x",
    generatedAt: "now",
    workspace: ".",
    source: "fixture",
    status: "pass",
    totals: { files: 1, additions: 2, deletions: 3, changedLines: 5, riskScore: 9 },
    budgets: { maxFiles: 1, maxChangedLines: 10, maxRiskScore: 20, warnRiskScore: 15 },
    findings: [],
    files: []
  }), "PASS files=1 changed=5 risk=9");
});
