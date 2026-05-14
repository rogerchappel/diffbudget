import type { BudgetStatus, DiffBudgetConfig } from "./types.js";

export function statusForRisk(riskScore: number, findings: string[], budgets: DiffBudgetConfig["budgets"]): BudgetStatus {
  if (findings.length > 0 || riskScore > budgets.maxRiskScore) return "fail";
  if (riskScore >= budgets.warnRiskScore) return "warn";
  return "pass";
}
