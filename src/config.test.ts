import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadConfig, writeDefaultConfig } from "./config.js";

test("writeDefaultConfig and loadConfig round trip", async () => {
  const dir = await mkdtemp(join(tmpdir(), "diffbudget-config-"));
  try {
    await writeDefaultConfig(dir);
    const { config, path } = await loadConfig(dir);
    assert.equal(config.schemaVersion, 1);
    assert.ok(path?.endsWith("diffbudget.config.json"));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("loadConfig rejects malformed root and nested values with actionable paths", async () => {
  const dir = await mkdtemp(join(tmpdir(), "diffbudget-config-invalid-"));
  const path = join(dir, "config.json");

  try {
    const cases: Array<[unknown, RegExp]> = [
      [null, /config root must be an object/],
      [{ budgets: [] }, /budgets must be an object/],
      [{ budgets: { maxFiles: "12" } }, /budgets\.maxFiles must be a finite non-negative number/],
      [{ budgets: { maxRiskScore: -1 } }, /budgets\.maxRiskScore must be a finite non-negative number/],
      [{ weights: { changedLine: null } }, /weights\.changedLine must be a finite non-negative number/],
      [{ patterns: { riskyPaths: "src\/**" } }, /patterns\.riskyPaths must be an array of strings/],
      [{ patterns: { testPaths: ["test/**", 3] } }, /patterns\.testPaths\[1\] must be a string/],
      [{ redaction: { enabled: "yes" } }, /redaction\.enabled must be a boolean/],
      [{ redaction: { redactHome: 1 } }, /redaction\.redactHome must be a boolean/]
    ];

    for (const [value, expected] of cases) {
      await writeFile(path, JSON.stringify(value));
      await assert.rejects(loadConfig(dir, path), expected);
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("loadConfig accepts validated partial nested overrides", async () => {
  const dir = await mkdtemp(join(tmpdir(), "diffbudget-config-partial-"));
  const path = join(dir, "config.json");

  try {
    await writeFile(path, JSON.stringify({
      budgets: { maxFiles: 0 },
      weights: { changedLine: 0.25 },
      patterns: { riskyPaths: ["server/**"] },
      redaction: { enabled: false, redactHome: false }
    }));
    const { config } = await loadConfig(dir, path);
    assert.equal(config.budgets.maxFiles, 0);
    assert.equal(config.weights.changedLine, 0.25);
    assert.deepEqual(config.patterns.riskyPaths, ["server/**"]);
    assert.deepEqual(config.redaction, { enabled: false, redactHome: false });
    assert.equal(config.budgets.maxChangedLines, 600);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
