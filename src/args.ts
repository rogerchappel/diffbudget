export interface ParsedArgs {
  command: string;
  flags: Record<string, string | boolean>;
  rest: string[];
}

type OptionKind = "boolean" | "string" | "format";

const COMMAND_OPTIONS: Record<string, Record<string, OptionKind>> = {
  init: { force: "boolean" },
  scan: {
    base: "string",
    target: "string",
    diff: "string",
    config: "string",
    output: "string",
    format: "format",
    strict: "boolean"
  },
  report: { input: "string", output: "string", format: "format" },
  doctor: { config: "string" },
  help: {},
  version: {},
  "--help": {},
  "--version": {},
  "-h": {}
};

const COMMANDS_WITHOUT_POSITIONALS = new Set(["init", "scan", "report", "doctor"]);

export function parseArgs(argv: string[]): ParsedArgs {
  const [command = "help", ...tail] = argv;
  const options = COMMAND_OPTIONS[command] ?? {};
  const flags: Record<string, string | boolean> = {};
  const rest: string[] = [];
  for (let index = 0; index < tail.length; index += 1) {
    const token = tail[index];
    if (!token.startsWith("--")) {
      if (COMMANDS_WITHOUT_POSITIONALS.has(command)) {
        throw new Error(`Unexpected positional argument for ${command}: ${token}`);
      }
      rest.push(token);
      continue;
    }
    const withoutPrefix = token.slice(2);
    const equalsIndex = withoutPrefix.indexOf("=");
    const key = equalsIndex === -1 ? withoutPrefix : withoutPrefix.slice(0, equalsIndex);
    const inlineValue = equalsIndex === -1 ? undefined : withoutPrefix.slice(equalsIndex + 1);
    const kind = options[key];
    if (!kind) {
      throw new Error(`Unknown option for ${command}: --${key}`);
    }
    if (Object.hasOwn(flags, key)) {
      throw new Error(`Option --${key} may only be specified once`);
    }
    if (kind === "boolean") {
      if (inlineValue !== undefined || (tail[index + 1] && !tail[index + 1].startsWith("--"))) {
        throw new Error(`Option --${key} does not accept a value`);
      }
      flags[key] = true;
      continue;
    }
    const value = inlineValue ?? tail[index + 1];
    if (value === undefined || value === "" || (inlineValue === undefined && value.startsWith("--"))) {
      throw new Error(`Option --${key} requires a value`);
    }
    if (inlineValue === undefined) {
      index += 1;
    }
    if (kind === "format" && value !== "markdown" && value !== "json") {
      throw new Error(`Invalid value for --format: ${value} (expected markdown or json)`);
    }
    flags[key] = value;
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
