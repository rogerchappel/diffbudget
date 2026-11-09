import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseUnifiedDiff } from "./diffParser.js";

test("parseUnifiedDiff extracts paths and line counts", () => {
  const diff = readFileSync("fixtures/simple-risk/sample.diff", "utf8");
  const changes = parseUnifiedDiff(diff);
  assert.equal(changes.length, 3);
  assert.equal(changes[0]?.path, "src/auth/login.ts");
  assert.equal(changes[0]?.additions, 17);
  assert.equal(changes[0]?.deletions, 1);
  assert.equal(changes[2]?.status, "added");
});

test("parseUnifiedDiff decodes Git-quoted modification paths", () => {
  const diff = [
    String.raw`diff --git "a/tab\tquote\"slash\\-\303\251.txt" "b/tab\tquote\"slash\\-\303\251.txt"`,
    "index 1234567..89abcde 100644",
    String.raw`--- "a/tab\tquote\"slash\\-\303\251.txt"`,
    String.raw`+++ "b/tab\tquote\"slash\\-\303\251.txt"`,
    "@@ -1 +1 @@",
    "-before",
    "+after"
  ].join("\n");

  assert.deepEqual(parseUnifiedDiff(diff), [{
    path: "tab\tquote\"slash\\-é.txt",
    status: "modified",
    additions: 1,
    deletions: 1
  }]);
});

test("parseUnifiedDiff counts hunk content lines beginning with -- or ++", () => {
  const diff = [
    "diff --git a/t.md b/t.md",
    "index 1234567..89abcde 100644",
    "--- a/t.md",
    "+++ b/t.md",
    "@@ -1,5 +1,5 @@",
    " keep",
    "--- dashed",
    "-++ plus",
    "---- triple",
    " keep2",
    "+-- dashed2",
    "+++ plus2",
    "+--- triple2"
  ].join("\n");

  assert.deepEqual(parseUnifiedDiff(diff), [{
    path: "t.md",
    status: "modified",
    additions: 3,
    deletions: 3
  }]);
});

test("parseUnifiedDiff counts --/++-prefixed content in untracked no-index shapes", () => {
  const diff = [
    "diff --git a/dev/null b/t.md",
    "new file mode 100644",
    "index 0000000..1234567",
    "--- /dev/null",
    "+++ b/t.md",
    "@@ -0,0 +1,5 @@",
    "+keep",
    "+-- dashed",
    "+++ plus",
    "+--- triple",
    "+keep2"
  ].join("\n");

  assert.deepEqual(parseUnifiedDiff(diff), [{
    path: "t.md",
    status: "added",
    additions: 5,
    deletions: 0
  }]);
});

test("parseUnifiedDiff preserves ordinary spaces and decodes quoted renames", () => {
  const diff = [
    "diff --git a/ordinary space.txt b/ordinary space.txt",
    "index 1234567..89abcde 100644",
    "--- a/ordinary space.txt",
    "+++ b/ordinary space.txt",
    "@@ -1 +1 @@",
    "-before",
    "+after",
    String.raw`diff --git "a/old\tname.txt" "b/new\nname.txt"`,
    "similarity index 100%",
    String.raw`rename from "old\tname.txt"`,
    String.raw`rename to "new\nname.txt"`
  ].join("\n");

  assert.deepEqual(parseUnifiedDiff(diff), [
    {
      path: "ordinary space.txt",
      status: "modified",
      additions: 1,
      deletions: 1
    },
    {
      path: "new\nname.txt",
      oldPath: "old\tname.txt",
      status: "renamed",
      additions: 0,
      deletions: 0
    }
  ]);
});

test("parseUnifiedDiff preserves an unquoted path containing the header separator", () => {
  const diff = [
    "diff --git a/dir b/name.txt b/dir b/name.txt",
    "index 1234567..89abcde 100644",
    "--- a/dir b/name.txt",
    "+++ b/dir b/name.txt",
    "@@ -1 +1,2 @@",
    " before",
    "+after"
  ].join("\n");

  assert.deepEqual(parseUnifiedDiff(diff), [{
    path: "dir b/name.txt",
    status: "modified",
    additions: 1,
    deletions: 0
  }]);
});
