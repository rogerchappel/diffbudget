const SECRET_PATTERNS: RegExp[] = [
  /ghp_[A-Za-z0-9_]{20,}/g,
  /github_pat_[A-Za-z0-9_]{30,}/g,
  /sk-[A-Za-z0-9]{20,}/g,
  /AKIA[0-9A-Z]{16}/g,
  /(?<key>(?:token|secret|password|api[_-]?key)\s*[:=]\s*)['\"]?[^'\"\s]+/gi
];

export function redactText(input: string, home = process.env.HOME): string {
  let output = input;
  for (const pattern of SECRET_PATTERNS) {
    output = output.replace(pattern, (...args: unknown[]) => {
      const groups = args.at(-1) as { key?: string } | undefined;
      return groups?.key ? `${groups.key}[REDACTED]` : "[REDACTED]";
    });
  }
  if (home) {
    output = output.replaceAll(home, "~");
  }
  return output;
}

export function redactPath(path: string): string {
  return redactText(path).replaceAll("\\", "/");
}
