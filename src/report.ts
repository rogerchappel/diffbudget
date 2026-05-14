import type { DiffBudgetConfig, DiffBudgetReport, FileChange } from "./types.js";
import { hasTestChange, scoreFile } from "./risk.js";
import { matchesAny } from "./glob.js";
import { redactPath } from "./redact.js";

export function buildReport(input: {
  changes: FileChange[];
  config: DiffBudgetConfig;
  workspace: string;
  source: string;
  version: string;
  now?: Date;
}): DiffBudgetReport {
  const relevant = input.changes.filter((change) => change.path.length > 0 && !matchesAny(change.path, input.config.patterns.ignorePaths));
  const testChange = hasTestChange(relevant, input.config);
  const files = relevant.map((change) => scoreFile(change, input.config, testChange));
  const additions = relevant.reduce((sum, change) => sum + change.additions, 0);
  const deletions = relevant.reduce((sum, change) => sum + change.deletions, 0);
  const riskScore = Math.round(files.reduce((sum, file) => sum + file.score, 0) * 10) / 10;
  const changedLines = additions + deletions;
  const findings: string[] = [];

  if (relevant.length > input.config.budgets.maxFiles) findings.push(`file count ${relevant.length} exceeds budget ${input.config.budgets.maxFiles}`);
  if (changedLines > input.config.budgets.maxChangedLines) findings.push(`changed lines ${changedLines} exceeds budget ${input.config.budgets.maxChangedLines}`);
  if (riskScore > input.config.budgets.maxRiskScore) findings.push(`risk score ${riskScore} exceeds budget ${input.config.budgets.maxRiskScore}`);

  const status = findings.length > 0 ? "fail" : riskScore >= input.config.budgets.warnRiskScore ? "warn" : "pass";
  return {
    tool: "diffbudget",
    version: input.version,
    generatedAt: (input.now ?? new Date()).toISOString(),
    workspace: redactPath(input.workspace),
    source: input.source,
    status,
    totals: { files: relevant.length, additions, deletions, changedLines, riskScore },
    budgets: input.config.budgets,
    findings,
    files: files.sort((a, b) => b.score - a.score || a.file.path.localeCompare(b.file.path))
  };
}

export function renderMarkdown(report: DiffBudgetReport): string {
  const icon = report.status === "pass" ? "✅" : report.status === "warn" ? "⚠️" : "🛑";
  const lines = [
    `# DiffBudget Report ${icon}`,
    "",
    `Status: **${report.status.toUpperCase()}**`,
    `Source: \`${report.source}\``,
    `Workspace: \`${report.workspace}\``,
    "",
    "## Totals",
    "",
    `- Files: ${report.totals.files} / ${report.budgets.maxFiles}`,
    `- Changed lines: ${report.totals.changedLines} / ${report.budgets.maxChangedLines}`,
    `- Risk score: ${report.totals.riskScore} / ${report.budgets.maxRiskScore}`,
    ""
  ];
  if (report.findings.length > 0) {
    lines.push("## Findings", "", ...report.findings.map((finding) => `- ${finding}`), "");
  }
  lines.push("## Riskiest files", "");
  for (const entry of report.files.slice(0, 12)) {
    const tags = entry.tags.length > 0 ? ` (${entry.tags.join(", ")})` : "";
    lines.push(`- **${entry.score}** \`${entry.file.path}\`${tags}: ${entry.reasons.join("; ")}`);
  }
  lines.push("");
  return `${lines.join("\n")}\n`;
}
