import type { DiffBudgetConfig } from "./types.js";

export const CONFIG_FILE = "diffbudget.config.json";

export const DEFAULT_CONFIG: DiffBudgetConfig = {
  schemaVersion: 1,
  budgets: {
    maxFiles: 20,
    maxChangedLines: 600,
    maxRiskScore: 120,
    warnRiskScore: 80
  },
  weights: {
    baseFile: 2,
    changedLine: 0.12,
    riskyPath: 24,
    generatedPath: 18,
    dependencyFile: 26,
    missingTests: 22,
    binaryFile: 20,
    deletionHeavy: 8
  },
  patterns: {
    riskyPaths: ["src/auth/**", "src/security/**", "infra/**", ".github/workflows/**"],
    generatedPaths: ["dist/**", "build/**", "coverage/**", "*.min.js", "*.generated.*"],
    dependencyFiles: ["package-lock.json", "pnpm-lock.yaml", "yarn.lock", "Cargo.lock", "go.sum", "requirements*.txt"],
    testPaths: ["test/**", "tests/**", "src/**/*.test.*", "src/**/*.spec.*", "fixtures/**"],
    ignorePaths: [".git/**", "node_modules/**", ".diffbudget/**", "dist/**", "coverage/**"]
  },
  redaction: {
    enabled: true,
    redactHome: true
  }
};
