# DiffBudget orchestration

DiffBudget is intentionally boring to orchestrate: run it in the repository, keep outputs local, and fail the gate only when the configured budget is exceeded.

## Suggested agent gate

1. Run `npm run build` if the package changed.
2. Run `diffbudget scan --base HEAD --output .diffbudget/latest --strict` before committing.
3. Attach `.diffbudget/latest/diffbudget-report.md` to the handoff.
4. If status is `fail`, split the patch or explain why the budget needs a one-off override.

## Privacy defaults

- No network calls.
- No telemetry.
- Common token patterns and home paths are redacted in display helpers.
- `.git`, `node_modules`, generated outputs, and `.diffbudget` are ignored by default budgets.

## Exit codes

- `0`: command succeeded; scan can still be `warn` unless `fail` with `--strict`.
- `1`: command/config/environment error.
- `2`: scan completed, `--strict` was set, and the report status is `fail`.
