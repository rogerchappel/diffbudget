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

test("parseArgs rejects unexpected positional arguments", () => {
  for (const command of ["init", "scan", "report", "doctor"]) {
    assert.throws(
      () => parseArgs([command, "unexpected"]),
      new RegExp(`Unexpected positional argument for ${command}: unexpected`)
    );
  }
});

test("parseArgs rejects repeated options in space-separated and inline forms", () => {
  assert.throws(
    () => parseArgs(["scan", "--diff", "first.patch", "--diff", "second.patch"]),
    /Option --diff may only be specified once/
  );
  assert.throws(
    () => parseArgs(["scan", "--output=first", "--output=second"]),
    /Option --output may only be specified once/
  );
  assert.throws(
    () => parseArgs(["scan", "--format", "json", "--format=markdown"]),
    /Option --format may only be specified once/
  );
  assert.throws(
    () => parseArgs(["init", "--force", "--force"]),
    /Option --force may only be specified once/
  );
});
