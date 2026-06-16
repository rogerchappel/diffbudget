#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/.tmp/demo-fixture-risk-scan"

mkdir -p "$OUT"

npm run build

echo "== scan checked-in sample diff =="
node "$ROOT/dist/cli.js" scan \
  --diff "$ROOT/fixtures/simple-risk/sample.diff" \
  --output "$OUT" \
  --format markdown

sed -n '1,80p' "$OUT/diffbudget-report.md"

grep -Fq 'Status: **PASS**' "$OUT/diffbudget-report.md"
grep -Fq 'package-lock.json' "$OUT/diffbudget-report.md"
grep -Fq 'src/auth/login.ts' "$OUT/diffbudget-report.md"
grep -Fq '"status": "pass"' "$OUT/diffbudget-report.json"

echo
echo "Demo artifacts written to $OUT"
