# Video Brief: Fixture Risk Gate

## Promise

Show how `diffbudget` turns a unified diff into a local risk report before an agent or maintainer keeps editing.

## Demo Path

1. Open `fixtures/simple-risk/sample.diff`.
2. Point out the auth path, lockfile change, and mixed production/test edits.
3. Run `bash demo/run-fixture-risk-scan.sh`.
4. Open `.tmp/demo-fixture-risk-scan/diffbudget-report.md`.
5. Show `.tmp/demo-fixture-risk-scan/diffbudget-report.json` for automation handoff.

## On-Screen Commands

```sh
npm install
bash demo/run-fixture-risk-scan.sh
node dist/cli.js scan --diff fixtures/simple-risk/sample.diff --output .tmp/demo-fixture-risk-scan
```

## Talk Track

- "This does not run the patch. It reads a diff and scores review risk."
- "The Markdown report is for humans; the JSON report is for agents and CI."
- "Strict mode can stop a workflow when the patch crosses local budgets."

## Guardrails

- Do not call the score a security verdict.
- Do not imply the tool understands runtime behavior.
- Do not claim the default budgets fit every repo.
