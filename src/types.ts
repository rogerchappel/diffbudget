export type BudgetStatus = "pass" | "warn" | "fail";

export interface DiffBudgetConfig {
  schemaVersion: 1;
  budgets: {
    maxFiles: number;
    maxChangedLines: number;
    maxRiskScore: number;
    warnRiskScore: number;
  };
  weights: {
    baseFile: number;
    changedLine: number;
    riskyPath: number;
    generatedPath: number;
    dependencyFile: number;
    missingTests: number;
    binaryFile: number;
    deletionHeavy: number;
  };
  patterns: {
    riskyPaths: string[];
    generatedPaths: string[];
    dependencyFiles: string[];
    testPaths: string[];
    ignorePaths: string[];
  };
  redaction: {
    enabled: boolean;
    redactHome: boolean;
  };
}

export interface FileChange {
  path: string;
  oldPath?: string;
  status: "added" | "modified" | "deleted" | "renamed" | "binary";
  additions: number;
  deletions: number;
  binary?: boolean;
}

export interface FileRisk {
  file: FileChange;
  score: number;
  reasons: string[];
  tags: string[];
}

export interface DiffBudgetReport {
  tool: "diffbudget";
  version: string;
  generatedAt: string;
  workspace: string;
  source: string;
  status: BudgetStatus;
  totals: {
    files: number;
    additions: number;
    deletions: number;
    changedLines: number;
    riskScore: number;
  };
  budgets: DiffBudgetConfig["budgets"];
  findings: string[];
  files: FileRisk[];
}
