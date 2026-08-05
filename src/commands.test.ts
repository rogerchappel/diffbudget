import { execFileSync, spawnSync } from "node:child_process";
import { access, mkdir, mkdtemp, readFile, rename, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseArgs } from "./args.js";
import { runCommand } from "./commands.js";

test("CLI rejects invalid argument shapes before creating output", async () => {
  const dir = await mkdtemp(join(tmpdir(), "diffbudget-cli-args-"));
  const output = join(dir, "out");
  const fixture = join(process.cwd(), "fixtures/simple-risk/sample.diff");

  try {
    for (const args of [
      ["scan", "unexpected", "--diff", fixture, "--output", output],
      ["scan", "--diff", fixture, "--diff", fixture, "--output", output],
      ["scan", `--diff=${fixture}`, `--diff=${fixture}`, `--output=${output}`]
    ]) {
      const result = spawnSync(process.execPath, [join(process.cwd(), "dist/cli.js"), ...args], {
        cwd: dir,
        encoding: "utf8"
      });
      assert.equal(result.status, 1);
      assert.match(result.stderr, /Unexpected positional argument|may only be specified once/);
      await assert.rejects(access(output));
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

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
    await writeFile(join(dir, "deleted.txt"), "remove me\n");
    git(["add", "."]);
    git(["commit", "--quiet", "-m", "base"]);

    await writeFile(join(dir, tabPath), "after\n");
    await writeFile(join(dir, "added.txt"), "new\n");
    await writeFile(join(dir, "binary.dat"), Uint8Array.from([0, 1, 2, 3]));
    await rm(join(dir, "deleted.txt"));
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
    const report = JSON.parse(await readFile(join(dir, "report", "diffbudget-report.json"), "utf8")) as {
      files: Array<{ file: { path: string; oldPath?: string; status: string; additions: number; deletions: number } }>;
    };

    assert.equal(result.code, 0);
    const files = new Map(report.files.map(({ file }) => [file.path, file]));
    assert.deepEqual([...files.keys()].sort(), ["added.txt", "binary.dat", "deleted.txt", tabPath, renamedPath].sort());
    assert.deepEqual(files.get("added.txt"), { path: "added.txt", status: "added", additions: 1, deletions: 0 });
    assert.deepEqual(files.get("binary.dat"), { path: "binary.dat", status: "binary", additions: 0, deletions: 0, binary: true });
    assert.deepEqual(files.get("deleted.txt"), { path: "deleted.txt", status: "deleted", additions: 0, deletions: 1 });
    assert.deepEqual(files.get(tabPath), { path: tabPath, status: "modified", additions: 1, deletions: 1 });
    assert.equal(files.get(renamedPath)?.status, "renamed");
    assert.equal(files.get(renamedPath)?.oldPath, "old name.txt");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("runCommand includes reviewable untracked files in worktree scans", async () => {
  const dir = await mkdtemp(join(tmpdir(), "diffbudget-git-worktree-"));
  const git = (args: string[]) => execFileSync("git", args, { cwd: dir, encoding: "utf8" });
  const output = join(dir, "scan-output");

  try {
    git(["init", "--quiet"]);
    git(["config", "user.name", "DiffBudget Test"]);
    git(["config", "user.email", "test@example.com"]);
    await writeFile(join(dir, ".gitignore"), "ignored.txt\n");
    await writeFile(join(dir, "tracked.txt"), "base\n");
    await writeFile(join(dir, "staged.txt"), "base\n");
    git(["add", "."]);
    git(["commit", "--quiet", "-m", "base"]);

    await writeFile(join(dir, "tracked.txt"), "base\nunstaged\n");
    await writeFile(join(dir, "staged.txt"), "base\nstaged\n");
    git(["add", "staged.txt"]);
    await writeFile(join(dir, "untracked.ts"), "export const token = process.env.SECRET;\n");
    await writeFile(join(dir, "binary.dat"), Uint8Array.from([0, 1, 2, 3]));
    await writeFile(join(dir, "empty.txt"), "");
    await writeFile(join(dir, "ignored.txt"), "ignored\n");

    const scan = async () => {
      const result = await runCommand(parseArgs([
        "scan",
        "--base", "HEAD",
        "--output", output,
        "--format", "json"
      ]), dir);
      assert.equal(result.code, 0);
      return JSON.parse(await readFile(join(output, "diffbudget-report.json"), "utf8")) as {
        totals: { files: number; additions: number };
        files: Array<{ file: { path: string; status: string; additions: number; binary?: boolean } }>;
      };
    };

    const first = await scan();
    const second = await scan();
    const files = new Map(second.files.map(({ file }) => [file.path, file]));

    assert.equal(first.totals.files, 5);
    assert.equal(second.totals.files, 5);
    assert.deepEqual([...files.keys()].sort(), ["binary.dat", "empty.txt", "staged.txt", "tracked.txt", "untracked.ts"]);
    assert.equal(files.get("untracked.ts")?.status, "added");
    assert.equal(files.get("untracked.ts")?.additions, 1);
    assert.deepEqual(files.get("empty.txt"), { path: "empty.txt", status: "added", additions: 0, deletions: 0 });
    assert.equal(files.get("binary.dat")?.binary, true);
    assert.equal(files.has("ignored.txt"), false);
    assert.equal([...files.keys()].some((path) => path.startsWith("scan-output/")), false);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
