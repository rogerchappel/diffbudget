import { matchesAny } from "./glob.js";
import type { DiffBudgetConfig, FileChange, FileRisk } from "./types.js";

function roundScore(value: number): number {
  return Math.round(value * 10) / 10;
}

export function scoreFile(change: FileChange, config: DiffBudgetConfig, hasTestChange: boolean): FileRisk {
  const reasons: string[] = [];
  const tags: string[] = [];
  let score = config.weights.baseFile;
  const changed = change.additions + change.deletions;
  score += changed * config.weights.changedLine;
  reasons.push(`${changed} changed lines`);

  if (matchesAny(change.path, config.patterns.riskyPaths)) {
    score += config.weights.riskyPath;
    tags.push("risky-path");
    reasons.push("matches a risky path budget");
  }
  if (matchesAny(change.path, config.patterns.generatedPaths)) {
    score += config.weights.generatedPath;
    tags.push("generated");
    reasons.push("looks generated or built output");
  }
  if (matchesAny(change.path, config.patterns.dependencyFiles)) {
    score += config.weights.dependencyFile;
    tags.push("dependency");
    reasons.push("changes dependency resolution state");
  }
  if (change.binary) {
    score += config.weights.binaryFile;
    tags.push("binary");
    reasons.push("binary diff cannot be inspected here");
  }
  if (change.deletions > change.additions * 2 && change.deletions > 20) {
    score += config.weights.deletionHeavy;
    tags.push("deletion-heavy");
    reasons.push("deletions dominate additions");
  }
  const isTest = matchesAny(change.path, config.patterns.testPaths);
  if (!isTest && !hasTestChange && changed > 10) {
    score += config.weights.missingTests;
    tags.push("missing-tests");
    reasons.push("no nearby or global test fixture change detected");
  }

  return { file: change, score: roundScore(score), reasons, tags };
}

export function hasTestChange(changes: FileChange[], config: DiffBudgetConfig): boolean {
  return changes.some((change) => matchesAny(change.path, config.patterns.testPaths));
}
