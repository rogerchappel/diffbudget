import { execFile } from "node:child_process";
import { resolve, sep } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export async function runGit(args: string[], cwd: string): Promise<string> {
  const { stdout } = await execFileAsync("git", args, {
    cwd,
    maxBuffer: 20 * 1024 * 1024
  });
  return stdout;
}

export async function isGitRepo(cwd: string): Promise<boolean> {
  try {
    const output = await runGit(["rev-parse", "--is-inside-work-tree"], cwd);
    return output.trim() === "true";
  } catch {
    return false;
  }
}

async function diffForUntrackedFile(cwd: string, path: string): Promise<string> {
  try {
    return await runGit(["diff", "--no-index", "--", "/dev/null", path], cwd);
  } catch (error) {
    const gitDiff = error as { code?: number; stdout?: string };
    if (gitDiff.code === 1 && typeof gitDiff.stdout === "string") return gitDiff.stdout;
    throw error;
  }
}

function isInside(path: string, directory: string): boolean {
  return path === directory || path.startsWith(`${directory}${sep}`);
}

export async function diffFromGit(cwd: string, base = "HEAD", target?: string, excludedDirectory?: string): Promise<{ text: string; label: string }> {
  const range = target ? `${base}..${target}` : base;
  const args = target ? ["diff", "--find-renames", range] : ["diff", "--find-renames", base];
  const tracked = await runGit(args, cwd);
  if (target) return { text: tracked, label: `git diff ${range}` };

  const excluded = excludedDirectory ? resolve(excludedDirectory) : undefined;
  const untracked = (await runGit(["ls-files", "--others", "--exclude-standard", "-z"], cwd))
    .split("\0")
    .filter(Boolean)
    .filter((path) => !excluded || !isInside(resolve(cwd, path), excluded))
    .sort();
  const untrackedDiffs: string[] = [];
  for (const path of untracked) untrackedDiffs.push(await diffForUntrackedFile(cwd, path));
  const text = [tracked, ...untrackedDiffs].filter(Boolean).join("\n");
  return { text, label: `git diff ${range} + non-ignored untracked files` };
}
