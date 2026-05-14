import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { CONFIG_FILE, DEFAULT_CONFIG } from "./defaults.js";
import type { DiffBudgetConfig } from "./types.js";

function mergeConfig(input: Partial<DiffBudgetConfig>): DiffBudgetConfig {
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
    const parsed = JSON.parse(raw) as Partial<DiffBudgetConfig>;
    if (parsed.schemaVersion !== undefined && parsed.schemaVersion !== 1) {
      throw new Error(`Unsupported config schemaVersion: ${String(parsed.schemaVersion)}`);
    }
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
