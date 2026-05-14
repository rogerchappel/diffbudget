import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { DiffBudgetReport } from "./types.js";
import { renderMarkdown } from "./report.js";

export async function readDiffFile(path: string): Promise<{ text: string; label: string }> {
  return { text: await readFile(path, "utf8"), label: path };
}

export async function writeReportFiles(report: DiffBudgetReport, outputDir: string): Promise<{ json: string; markdown: string }> {
  await mkdir(outputDir, { recursive: true });
  const json = join(outputDir, "diffbudget-report.json");
  const markdown = join(outputDir, "diffbudget-report.md");
  await writeFile(json, `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(markdown, renderMarkdown(report));
  return { json, markdown };
}

export async function writeTextFile(path: string, body: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, body);
}
