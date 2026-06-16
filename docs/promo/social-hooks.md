# Social Hooks

Grounded post drafts for the fixture risk scan.

## Hooks

1. Before an agent keeps editing, ask a simpler question: how risky is this diff? `diffbudget` turns a patch into Markdown and JSON risk reports.
2. The fixture demo scores changed files, changed lines, dependency lockfile churn, and an auth-path change without uploading the repo anywhere.
3. `bash demo/run-fixture-risk-scan.sh` writes a human report plus `diffbudget-report.json`, so CI and agents do not need to scrape Markdown.
4. `diffbudget scan --base HEAD --strict` is a practical stop sign when a patch exceeds local budgets; the report gives reviewers the top findings to inspect.

## Clip Outline

- Open `fixtures/simple-risk/sample.diff`.
- Run `bash demo/run-fixture-risk-scan.sh`.
- Show `.tmp/demo-fixture-risk-scan/diffbudget-report.md`.
- Point to the package-lock and auth-path findings.
- Show the JSON status for automation handoff.

## Guardrails

- Do not call the score a security verdict.
- Do not claim semantic understanding of the patch.
- Keep the message on local budgets, review triage, and explicit reports.
