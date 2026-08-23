#!/usr/bin/env node

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const packageJson = JSON.parse(readFileSync(join(projectRoot, "package.json"), "utf8"));
const scratch = mkdtempSync(join(tmpdir(), "diffbudget-package-smoke-"));

function npm(args, cwd = projectRoot) {
  return execFileSync("npm", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

try {
  const [dryRun] = JSON.parse(npm(["pack", "--dry-run", "--json"]));
  const packedFiles = new Set(dryRun.files.map(({ path }) => path));
  const forbidden = [...packedFiles].filter((path) => /^dist\/.*\.test\.(?:js|d\.ts)$/.test(path));
  assert.deepEqual(forbidden, [], `compiled test artifacts were packed: ${forbidden.join(", ")}`);

  const runtimeModules = [
    "args", "cli", "commands", "config", "defaults", "diffParser", "git", "index", "io",
    "redact", "report", "risk", "status", "summary", "types",
  ];
  for (const moduleName of runtimeModules) {
    assert.ok(packedFiles.has(`dist/${moduleName}.js`), `runtime module is missing: dist/${moduleName}.js`);
    assert.ok(packedFiles.has(`dist/${moduleName}.d.ts`), `declaration is missing: dist/${moduleName}.d.ts`);
  }

  const packDir = join(scratch, "pack");
  const consumerDir = join(scratch, "consumer");
  mkdirSync(packDir);
  mkdirSync(consumerDir);
  const [packed] = JSON.parse(npm(["pack", "--json", "--pack-destination", packDir]));
  const tarball = join(packDir, packed.filename);

  npm(["init", "--yes"], consumerDir);
  npm(["install", "--ignore-scripts", "--no-audit", "--no-fund", tarball], consumerDir);
  execFileSync(join(consumerDir, "node_modules", ".bin", "diffbudget"), ["--help"], {
    cwd: consumerDir,
    stdio: "ignore",
  });
  execFileSync("node", [
    "--input-type=module",
    "--eval",
    "import('diffbudget').then((pkg) => { if (typeof pkg.parseUnifiedDiff !== 'function') process.exit(1); })",
  ], { cwd: consumerDir, stdio: "ignore" });

  console.log(`${packageJson.name} package smoke passed with ${dryRun.files.length} packed file(s).`);
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
