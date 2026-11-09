import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { test } from "node:test";

function checkTag(tag?: string) {
  return spawnSync(process.execPath, ["scripts/check-release-tag.mjs", ...(tag ? [tag] : [])], {
    cwd: process.cwd(),
    encoding: "utf8"
  });
}

test("release tag preflight accepts the package version tag", () => {
  const result = checkTag("v0.1.0");
  assert.equal(result.status, 0);
  assert.match(result.stdout, /matches package version 0\.1\.0/);
});

test("release tag preflight rejects missing, malformed, prerelease, and mismatched tags", () => {
  for (const tag of [undefined, "0.1.0", "v0.1.0-rc.1", "v9.9.9"]) {
    const result = checkTag(tag);
    assert.equal(result.status, 1, `expected ${tag ?? "missing tag"} to fail`);
  }
});

test("release workflow validates its tag before creating artifacts", () => {
  const workflow = readFileSync(".github/workflows/release.yml", "utf8");
  assert.doesNotMatch(workflow, /id-token:\s*write/);
  const preflight = workflow.indexOf("npm run release:tag-check -- \"${GITHUB_REF_NAME}\"");
  assert.ok(preflight >= 0, "workflow must pass GITHUB_REF_NAME to the preflight");
  assert.ok(preflight < workflow.indexOf("npm pack"));
  assert.ok(preflight < workflow.indexOf("gh release create"));
});
