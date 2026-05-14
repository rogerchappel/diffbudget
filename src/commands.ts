import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { boolFlag, stringFlag, type ParsedArgs } from "./args.js";
import { loadConfig, writeDefaultConfig } from "./config.js";
import { diffFromGit, isGitRepo } from "./git.js";
import { readDiffFile, writeReportFiles, writeTextFile } from "./io.js";
import { parseUnifiedDiff } from "./diffParser.js";
import { buildReport, renderMarkdown } from "./report.js";
import { oneLineSummary } from "./summary.js";

export const VERSION = "0.1.0";

export function helpText(): string {
  return `DiffBudget — local patch risk budgets before a commit escapes\n\nUsage:\n  diffbudget init [--force]\n  diffbudget scan [--base HEAD] [--target main] [--diff file.patch] [--config file] [--output .diffbudget/latest] [--format markdown|json] [--strict]\n  diffbudget report [--input .diffbudget/latest/diffbudget-report.json] [--format markdown|json]\n  diffbudget doctor\n\nExamples:\n  diffbudget init\n  diffbudget scan --base HEAD --strict\n  diffbudget scan --diff fixtures/simple-risk/sample.diff --output .diffbudget/sample
  diffbudget scan --base origin/main --target HEAD --format json\n`;
}

export async function runCommand(parsed: ParsedArgs, cwd = process.cwd()): Promise<{ code: number; stdout: string; stderr: string }> {
  if (parsed.command === "help" || parsed.command === "--help" || parsed.command === "-h") return { code: 0, stdout: helpText(), stderr: "" };
  if (parsed.command === "--version" || parsed.command === "version") return { code: 0, stdout: `${VERSION}\n`, stderr: "" };

  if (parsed.command === "init") {
    const path = await writeDefaultConfig(cwd, boolFlag(parsed.flags, "force"));
    return { code: 0, stdout: `Wrote ${path}\n`, stderr: "" };
  }

  if (parsed.command === "doctor") {
    const git = await isGitRepo(cwd);
    const { path } = await loadConfig(cwd, stringFlag(parsed.flags, "config"));
    return { code: git ? 0 : 1, stdout: `git: ${git ? "ok" : "missing"}\nconfig: ${path ?? "defaults"}\nnetwork: not used\n`, stderr: git ? "" : "Not inside a git work tree. Use --diff for fixture/offline scans.\n" };
  }

  if (parsed.command === "scan") {
    const { config } = await loadConfig(cwd, stringFlag(parsed.flags, "config"));
    const diffPath = stringFlag(parsed.flags, "diff");
    const source = diffPath ? await readDiffFile(diffPath) : await diffFromGit(cwd, stringFlag(parsed.flags, "base") ?? "HEAD", stringFlag(parsed.flags, "target"));
    const changes = parseUnifiedDiff(source.text);
    const report = buildReport({ changes, config, workspace: cwd, source: source.label, version: VERSION });
    const output = stringFlag(parsed.flags, "output") ?? join(cwd, ".diffbudget", "latest");
    const files = await writeReportFiles(report, output);
    const format = stringFlag(parsed.flags, "format") ?? "markdown";
    const stdout = format === "json" ? `${JSON.stringify(report, null, 2)}\n` : renderMarkdown(report);
    const summary = `\n${oneLineSummary(report)}\nWrote ${files.json}\nWrote ${files.markdown}\n`;
    const strict = boolFlag(parsed.flags, "strict");
    return { code: strict && report.status === "fail" ? 2 : 0, stdout: `${stdout}${summary}`, stderr: "" };
  }

  if (parsed.command === "report") {
    const input = stringFlag(parsed.flags, "input") ?? join(cwd, ".diffbudget", "latest", "diffbudget-report.json");
    const report = JSON.parse(await readFile(input, "utf8"));
    const format = stringFlag(parsed.flags, "format") ?? "markdown";
    const out = stringFlag(parsed.flags, "output");
    const body = format === "json" ? `${JSON.stringify(report, null, 2)}\n` : renderMarkdown(report);
    if (out) await writeTextFile(out, body);
    return { code: 0, stdout: out ? `Wrote ${out}\n` : body, stderr: "" };
  }

  return { code: 1, stdout: helpText(), stderr: `Unknown command: ${parsed.command}\n` };
}
