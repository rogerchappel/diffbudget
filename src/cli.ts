#!/usr/bin/env node
import { parseArgs } from "./args.js";
import { runCommand } from "./commands.js";

try {
  const result = await runCommand(parseArgs(process.argv.slice(2)));
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  process.exitCode = result.code;
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}
