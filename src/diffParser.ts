import type { FileChange } from "./types.js";

function emptyChange(path: string): FileChange {
  return { path, status: "modified", additions: 0, deletions: 0 };
}

function statusFromHeader(line: string): FileChange["status"] {
  if (line.includes("new file mode")) return "added";
  if (line.includes("deleted file mode")) return "deleted";
  return "modified";
}

function stripPrefix(path: string): string {
  return path.replace(/^a\//, "").replace(/^b\//, "");
}

export function parseUnifiedDiff(text: string): FileChange[] {
  const byPath = new Map<string, FileChange>();
  let current: FileChange | undefined;

  for (const line of text.split(/\r?\n/)) {
    if (line.startsWith("diff --git ")) {
      const match = /^diff --git a\/(.*) b\/(.*)$/.exec(line);
      const path = match ? match[2] : line.slice("diff --git ".length).trim();
      current = emptyChange(stripPrefix(path));
      byPath.set(current.path, current);
      continue;
    }
    if (!current) continue;
    if (line.startsWith("new file mode") || line.startsWith("deleted file mode")) {
      current.status = statusFromHeader(line);
      continue;
    }
    if (line.startsWith("rename from ")) {
      current.oldPath = line.slice("rename from ".length).trim();
      current.status = "renamed";
      continue;
    }
    if (line.startsWith("rename to ")) {
      const nextPath = line.slice("rename to ".length).trim();
      byPath.delete(current.path);
      current.path = nextPath;
      current.status = "renamed";
      byPath.set(current.path, current);
      continue;
    }
    if (line.startsWith("Binary files ")) {
      current.binary = true;
      current.status = "binary";
      continue;
    }
    if (line.startsWith("+++") || line.startsWith("---")) continue;
    if (line.startsWith("+") && !line.startsWith("+++")) current.additions += 1;
    if (line.startsWith("-") && !line.startsWith("---")) current.deletions += 1;
  }

  return [...byPath.values()];
}
