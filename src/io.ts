import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { DiffBudgetReport } from "./types.js";
import { renderMarkdown } from "./report.js";

export async function readDiffFile(path: string): Promise<{ text: string; label: string }> {
  return { text: await readFile(path, "utf8"), label: path };
}

export async function writeReportFiles(report: DiffBudgetReport, outputDir: string, overwrite = false): Promise<{ json: string; markdown: string }> {
  await mkdir(outputDir, { recursive: true });
  const json = join(outputDir, "diffbudget-report.json");
  const markdown = join(outputDir, "diffbudget-report.md");
  const contents = [
    [json, `${JSON.stringify(report, null, 2)}\n`],
    [markdown, renderMarkdown(report)]
  ] as const;
  if (overwrite) {
    for (const [path, body] of contents) await writeFile(path, body);
  } else {
    // Check both destinations before creating either; exclusive creation also
    // protects against a file appearing after this check.
    for (const [path] of contents) {
      try {
        await readFile(path);
        throw new Error(`Refusing to overwrite existing report file: ${path}`);
      } catch (error) {
        if (error instanceof Error && error.message.startsWith("Refusing to overwrite")) throw error;
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      }
    }
    for (const [path, body] of contents) await writeFile(path, body, { flag: "wx" });
  }
  return { json, markdown };
}

export async function writeTextFile(path: string, body: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, body);
}
