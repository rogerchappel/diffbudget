import assert from "node:assert/strict";
import { test } from "node:test";
import { parseArgs } from "./args.js";

test("parseArgs accepts documented command options", () => {
  assert.deepEqual(parseArgs(["init", "--force"]), {
    command: "init",
    flags: { force: true },
    rest: []
  });
  assert.deepEqual(parseArgs([
    "scan",
    "--base", "HEAD",
    "--target=main",
    "--diff", "change.patch",
    "--config", "diffbudget.config.json",
    "--output", ".diffbudget/latest",
    "--format", "json",
    "--strict"
  ]), {
    command: "scan",
    flags: {
      base: "HEAD",
      target: "main",
      diff: "change.patch",
      config: "diffbudget.config.json",
      output: ".diffbudget/latest",
      format: "json",
      strict: true
    },
    rest: []
  });
  assert.deepEqual(parseArgs(["report", "--input", "report.json", "--output", "report.md", "--format", "markdown"]), {
    command: "report",
    flags: { input: "report.json", output: "report.md", format: "markdown" },
    rest: []
  });
  assert.deepEqual(parseArgs(["doctor", "--config", "diffbudget.config.json"]), {
    command: "doctor",
    flags: { config: "diffbudget.config.json" },
    rest: []
  });
});

test("parseArgs rejects unknown options with the command name", () => {
  assert.throws(
    () => parseArgs(["scan", "--strcit"]),
    /Unknown option for scan: --strcit/
  );
});

test("parseArgs rejects unsupported output formats", () => {
  assert.throws(
    () => parseArgs(["scan", "--format", "yaml"]),
    /Invalid value for --format: yaml \(expected markdown or json\)/
  );
});

test("parseArgs rejects values supplied to boolean options", () => {
  assert.throws(
    () => parseArgs(["scan", "--strict=false"]),
    /Option --strict does not accept a value/
  );
  assert.throws(
    () => parseArgs(["scan", "--strict", "false"]),
    /Option --strict does not accept a value/
  );
});
