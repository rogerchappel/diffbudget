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

const escapeBytes: Record<string, number> = {
  a: 0x07,
  b: 0x08,
  t: 0x09,
  n: 0x0a,
  v: 0x0b,
  f: 0x0c,
  r: 0x0d,
  "\"": 0x22,
  "\\": 0x5c
};

function readQuotedPath(input: string, start = 0): { path: string; end: number } | undefined {
  if (input[start] !== "\"") return undefined;

  const bytes: number[] = [];
  const encoder = new TextEncoder();
  let index = start + 1;

  while (index < input.length) {
    const character = input[index];
    if (character === "\"") {
      return { path: new TextDecoder().decode(Uint8Array.from(bytes)), end: index + 1 };
    }
    if (character !== "\\") {
      const codePoint = input.codePointAt(index);
      if (codePoint === undefined) return undefined;
      const literal = String.fromCodePoint(codePoint);
      bytes.push(...encoder.encode(literal));
      index += literal.length;
      continue;
    }

    index += 1;
    const escaped = input[index];
    if (escaped === undefined) return undefined;
    if (/[0-7]/.test(escaped)) {
      const octal = input.slice(index).match(/^[0-7]{1,3}/)?.[0];
      if (!octal) return undefined;
      bytes.push(Number.parseInt(octal, 8));
      index += octal.length;
      continue;
    }
    bytes.push(escapeBytes[escaped] ?? escaped.charCodeAt(0));
    index += 1;
  }

  return undefined;
}

function decodeGitPath(path: string): string {
  const quoted = readQuotedPath(path);
  return quoted && quoted.end === path.length ? quoted.path : path;
}

function pathFromDiffHeader(line: string): string {
  const header = line.slice("diff --git ".length);
  if (header.startsWith("\"")) {
    const oldPath = readQuotedPath(header);
    if (oldPath) {
      const nextStart = oldPath.end + (header[oldPath.end] === " " ? 1 : 0);
      const newPath = readQuotedPath(header, nextStart);
      if (newPath && newPath.end === header.length) return newPath.path;
    }
  }

  const match = /^a\/(.*) b\/(.*)$/.exec(header);
  return match ? match[2] : header.trim();
}

export function parseUnifiedDiff(text: string): FileChange[] {
  const byPath = new Map<string, FileChange>();
  let current: FileChange | undefined;

  for (const line of text.split(/\r?\n/)) {
    if (line.startsWith("diff --git ")) {
      const path = pathFromDiffHeader(line);
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
      current.oldPath = decodeGitPath(line.slice("rename from ".length).trim());
      current.status = "renamed";
      continue;
    }
    if (line.startsWith("rename to ")) {
      const nextPath = decodeGitPath(line.slice("rename to ".length).trim());
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
