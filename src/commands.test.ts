import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rename, rm, writeFile } from "node:fs/promises";
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

test("runCommand reports logical paths from a real Git diff", async () => {
  const dir = await mkdtemp(join(tmpdir(), "diffbudget-git-paths-"));
  const tabPath = "src/tab\tname.ts";
  const renamedPath = "test/renamed é file.test.ts";
  const git = (args: string[]) => execFileSync("git", args, { cwd: dir, encoding: "utf8" });

  try {
    git(["init", "--quiet"]);
    git(["config", "user.name", "DiffBudget Test"]);
    git(["config", "user.email", "test@example.com"]);
    await mkdir(join(dir, "src"));
    await mkdir(join(dir, "test"));
    await writeFile(join(dir, tabPath), "before\n");
    await writeFile(join(dir, "old name.txt"), "rename me\n");
    git(["add", "."]);
    git(["commit", "--quiet", "-m", "base"]);

    await writeFile(join(dir, tabPath), "after\n");
    await rename(join(dir, "old name.txt"), join(dir, renamedPath));
    git(["add", "-A"]);
    git(["commit", "--quiet", "-m", "change"]);

    const result = await runCommand(parseArgs([
      "scan",
      "--base", "HEAD~1",
      "--target", "HEAD",
      "--output", join(dir, "report"),
      "--format", "json"
    ]), dir);
    const report = JSON.parse(await readFile(join(dir, "report", "diffbudget-report.json"), "utf8"));

    assert.equal(result.code, 0);
    assert.deepEqual(report.files.map(({ file }: { file: { path: string } }) => file.path), [
      tabPath,
      renamedPath
    ]);
    assert.equal(report.files[0].file.additions, 1);
    assert.equal(report.files[0].file.deletions, 1);
    assert.equal(report.files[1].file.oldPath, "old name.txt");
    assert.equal(report.files[1].file.status, "renamed");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
