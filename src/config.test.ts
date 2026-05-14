import { mkdtemp, rm } from "node:fs/promises";
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
