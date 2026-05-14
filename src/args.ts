export interface ParsedArgs {
  command: string;
  flags: Record<string, string | boolean>;
  rest: string[];
}

export function parseArgs(argv: string[]): ParsedArgs {
  const [command = "help", ...tail] = argv;
  const flags: Record<string, string | boolean> = {};
  const rest: string[] = [];
  for (let index = 0; index < tail.length; index += 1) {
    const token = tail[index];
    if (!token.startsWith("--")) {
      rest.push(token);
      continue;
    }
    const withoutPrefix = token.slice(2);
    const [key, inlineValue] = withoutPrefix.split(/=(.*)/s).filter(Boolean);
    if (inlineValue !== undefined) {
      flags[key] = inlineValue;
      continue;
    }
    const next = tail[index + 1];
    if (next && !next.startsWith("--")) {
      flags[key] = next;
      index += 1;
    } else {
      flags[key] = true;
    }
  }
  return { command, flags, rest };
}

export function stringFlag(flags: Record<string, string | boolean>, name: string): string | undefined {
  const value = flags[name];
  return typeof value === "string" ? value : undefined;
}

export function boolFlag(flags: Record<string, string | boolean>, name: string): boolean {
  return flags[name] === true;
}
