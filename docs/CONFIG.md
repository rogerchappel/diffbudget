# Configuration

Run `diffbudget init` to create `diffbudget.config.json`.

Configuration files must contain a JSON object. Every section is optional and
is merged with the defaults, but supplied values are validated before a scan:

- `schemaVersion`, when present, must be `1`.
- Budget and weight values must be finite, non-negative JSON numbers.
- Pattern values must be arrays containing only strings.
- `redaction.enabled` and `redaction.redactHome` must be booleans.

Invalid values stop `scan` and `doctor` with the full property path in the
error, before reports are written.

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

## Redaction

- `enabled`: redact common credential-shaped values and, by default, the home
  directory in the report's workspace path. Set to `false` to leave that path
  unchanged.
- `redactHome`: replace the home-directory prefix with `~` when redaction is
  enabled. Set to `false` to retain the home path while still redacting common
  credential-shaped values.
