import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseArgs } from "./args.js";
import { runCommand } from "./commands.js";

test("runCommand scans a fixture diff", async () => {
  const dir = await mkdtemp(join(tmpdir(), "diffbudget-command-"));
  try {
    const result = await runCommand(parseArgs(["scan", "--diff", join(process.cwd(), "fixtures/simple-risk/sample.diff"), "--output", join(dir, "out"), "--format", "json"]), process.cwd());
    assert.equal(result.code, 0);
    assert.match(result.stdout, /"tool": "diffbudget"/);
    assert.match(result.stdout, /Wrote/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
