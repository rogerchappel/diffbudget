import type { DiffBudgetReport } from "./types.js";

export function oneLineSummary(report: DiffBudgetReport): string {
  return `${report.status.toUpperCase()} files=${report.totals.files} changed=${report.totals.changedLines} risk=${report.totals.riskScore}`;
}
