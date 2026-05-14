# Report schema

`diffbudget scan` writes `diffbudget-report.json` with this top-level shape:

```json
{
  "tool": "diffbudget",
  "version": "0.1.0",
  "generatedAt": "2026-01-01T00:00:00.000Z",
  "workspace": "~/repo",
  "source": "git diff HEAD",
  "status": "pass",
  "totals": { "files": 1, "additions": 2, "deletions": 1, "changedLines": 3, "riskScore": 4.3 },
  "budgets": { "maxFiles": 20, "maxChangedLines": 600, "maxRiskScore": 120, "warnRiskScore": 80 },
  "findings": [],
  "files": []
}
```

Status values are `pass`, `warn`, or `fail`. `files` is sorted by descending risk score so a reviewer can start at the top.
