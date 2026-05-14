import { test } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_CONFIG } from "./defaults.js";
import { statusForRisk } from "./status.js";

test("statusForRisk separates pass warn and fail", () => {
  assert.equal(statusForRisk(10, [], DEFAULT_CONFIG.budgets), "pass");
  assert.equal(statusForRisk(DEFAULT_CONFIG.budgets.warnRiskScore, [], DEFAULT_CONFIG.budgets), "warn");
  assert.equal(statusForRisk(10, ["too many files"], DEFAULT_CONFIG.budgets), "fail");
});
