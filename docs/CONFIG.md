# Configuration

Run `diffbudget init` to create `diffbudget.config.json`.

## Budgets

- `maxFiles`: hard cap for changed files.
- `maxChangedLines`: hard cap for additions plus deletions.
- `maxRiskScore`: hard cap for weighted risk.
- `warnRiskScore`: softer threshold that marks a scan as `warn`.

## Weights

Weights are intentionally plain numbers. Higher values make a file more expensive against the total patch budget.

## Patterns

Patterns use a small built-in glob matcher supporting `*`, `?`, and `**`.

- `riskyPaths`: code that deserves extra review.
- `generatedPaths`: built output that usually should not be committed.
- `dependencyFiles`: lockfiles and resolver inputs.
- `testPaths`: test or fixture changes that satisfy the missing-test heuristic.
- `ignorePaths`: paths excluded from report totals.
