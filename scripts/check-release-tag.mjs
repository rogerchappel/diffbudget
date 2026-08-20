#!/usr/bin/env node

import { readFile } from "node:fs/promises";

const tag = process.argv[2];
const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
const expectedTag = `v${packageJson.version}`;

if (!tag) {
  console.error(`Release tag is required (expected ${expectedTag}).`);
  process.exit(1);
}

if (!/^v\d+\.\d+\.\d+$/.test(tag)) {
  console.error(`Release tag must be stable semver in vX.Y.Z form (received ${tag}).`);
  process.exit(1);
}

if (tag !== expectedTag) {
  console.error(`Release tag ${tag} does not match package version ${packageJson.version} (expected ${expectedTag}).`);
  process.exit(1);
}

console.log(`Release tag ${tag} matches package version ${packageJson.version}.`);
