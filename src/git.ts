import { execFile } from "node:child_process";
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

export async function diffFromGit(cwd: string, base = "HEAD", target?: string): Promise<{ text: string; label: string }> {
  const range = target ? `${base}..${target}` : base;
  const args = target ? ["diff", "--find-renames", range] : ["diff", "--find-renames", base];
  const text = await runGit(args, cwd);
  return { text, label: `git diff ${range}` };
}
