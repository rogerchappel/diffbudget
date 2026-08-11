import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { CONFIG_FILE, DEFAULT_CONFIG } from "./defaults.js";
import type { DiffBudgetConfig } from "./types.js";

type ConfigInput = {
  schemaVersion?: 1;
  budgets?: Record<string, unknown>;
  weights?: Record<string, unknown>;
  patterns?: Record<string, unknown>;
  redaction?: Record<string, unknown>;
};

const budgetKeys = ["maxFiles", "maxChangedLines", "maxRiskScore", "warnRiskScore"] as const;
const weightKeys = ["baseFile", "changedLine", "riskyPath", "generatedPath", "dependencyFile", "missingTests", "binaryFile", "deletionHeavy"] as const;
const patternKeys = ["riskyPaths", "generatedPaths", "dependencyFiles", "testPaths", "ignorePaths"] as const;
const redactionKeys = ["enabled", "redactHome"] as const;

function objectAt(value: unknown, path: string): Record<string, unknown> | undefined {
  if (value === undefined) return undefined;
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Invalid config: ${path} must be an object`);
  }
  return value as Record<string, unknown>;
}

function validateConfig(value: unknown): ConfigInput {
  const input = objectAt(value, "config root");
  if (!input) throw new Error("Invalid config: config root must be an object");

  if (input.schemaVersion !== undefined && input.schemaVersion !== 1) {
    throw new Error(`Unsupported config schemaVersion: ${String(input.schemaVersion)}`);
  }

  const budgets = objectAt(input.budgets, "budgets");
  const weights = objectAt(input.weights, "weights");
  const patterns = objectAt(input.patterns, "patterns");
  const redaction = objectAt(input.redaction, "redaction");

  for (const [group, keys] of [[budgets, budgetKeys], [weights, weightKeys]] as const) {
    for (const key of keys) {
      const value = group?.[key];
      if (value !== undefined && (typeof value !== "number" || !Number.isFinite(value) || value < 0)) {
        const section = group === budgets ? "budgets" : "weights";
        throw new Error(`Invalid config: ${section}.${key} must be a finite non-negative number`);
      }
    }
  }

  for (const key of patternKeys) {
    const value = patterns?.[key];
    if (value === undefined) continue;
    if (!Array.isArray(value)) throw new Error(`Invalid config: patterns.${key} must be an array of strings`);
    const invalidIndex = value.findIndex((entry) => typeof entry !== "string");
    if (invalidIndex >= 0) throw new Error(`Invalid config: patterns.${key}[${invalidIndex}] must be a string`);
  }

  for (const key of redactionKeys) {
    const value = redaction?.[key];
    if (value !== undefined && typeof value !== "boolean") {
      throw new Error(`Invalid config: redaction.${key} must be a boolean`);
    }
  }

  return { schemaVersion: input.schemaVersion as 1 | undefined, budgets, weights, patterns, redaction };
}

function mergeConfig(input: ConfigInput): DiffBudgetConfig {
  return {
    ...DEFAULT_CONFIG,
    ...input,
    budgets: { ...DEFAULT_CONFIG.budgets, ...input.budgets },
    weights: { ...DEFAULT_CONFIG.weights, ...input.weights },
    patterns: { ...DEFAULT_CONFIG.patterns, ...input.patterns },
    redaction: { ...DEFAULT_CONFIG.redaction, ...input.redaction }
  };
}

export async function loadConfig(cwd: string, explicitPath?: string): Promise<{ config: DiffBudgetConfig; path?: string }> {
  const path = explicitPath ?? join(cwd, CONFIG_FILE);
  try {
    const raw = await readFile(path, "utf8");
    const parsed = validateConfig(JSON.parse(raw));
    return { config: mergeConfig(parsed), path };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT" && !explicitPath) {
      return { config: DEFAULT_CONFIG };
    }
    throw error;
  }
}

export async function writeDefaultConfig(cwd: string, force = false): Promise<string> {
  const path = join(cwd, CONFIG_FILE);
  const body = `${JSON.stringify(DEFAULT_CONFIG, null, 2)}\n`;
  try {
    if (!force) {
      await writeFile(path, body, { flag: "wx" });
    } else {
      await writeFile(path, body);
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") {
      throw new Error(`${CONFIG_FILE} already exists; rerun with --force to replace it`);
    }
    throw error;
  }
  return path;
}
