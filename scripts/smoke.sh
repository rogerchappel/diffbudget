#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP="${TMPDIR:-/tmp}/diffbudget-smoke-$$"
cleanup() { rm -rf "$TMP"; }
trap cleanup EXIT
mkdir -p "$TMP"
cd "$ROOT"
npm run build >/dev/null
node dist/cli.js --version >/dev/null
node dist/cli.js scan --diff fixtures/simple-risk/sample.diff --output "$TMP/report" --format json > "$TMP/stdout.json"
test -s "$TMP/report/diffbudget-report.json"
test -s "$TMP/report/diffbudget-report.md"
grep -q '"tool": "diffbudget"' "$TMP/stdout.json"
node dist/cli.js report --input "$TMP/report/diffbudget-report.json" --format markdown > "$TMP/report.md"
grep -q 'DiffBudget Report' "$TMP/report.md"
echo "smoke ok"
