#!/usr/bin/env bash
set -euo pipefail

# Match the locked-dependency audit run by .github/workflows/ci.yml.
if [[ ! -f package-lock.json ]]; then
  echo "package-lock.json is required for the CI dependency audit." >&2
  exit 1
fi

npm ci
npm audit --audit-level=high --package-lock-only
