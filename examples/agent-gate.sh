#!/usr/bin/env bash
set -euo pipefail

diffbudget scan --base "${DIFFBUDGET_BASE:-HEAD}" --output .diffbudget/latest --strict
cat .diffbudget/latest/diffbudget-report.md
