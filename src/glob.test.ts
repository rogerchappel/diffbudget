import { test } from "node:test";
import assert from "node:assert/strict";
import { matchesAny } from "./glob.js";

test("matchesAny supports star and globstar", () => {
  assert.equal(matchesAny("src/auth/login.ts", ["src/auth/**"]), true);
  assert.equal(matchesAny("src/a/b/c.test.ts", ["src/**/*.test.*"]), true);
  assert.equal(matchesAny("README.md", ["src/**"]), false);
});
