# Use DiffBudget As An Agent Risk Gate

This tutorial uses the checked-in `fixtures/simple-risk/sample.diff` file to show how an agent or maintainer can score a patch before continuing.

## 1. Run The Fixture Demo

```sh
npm install
bash demo/run-fixture-risk-scan.sh
```

The demo writes:

- `.tmp/demo-fixture-risk-scan/diffbudget-report.md`
- `.tmp/demo-fixture-risk-scan/diffbudget-report.json`

## 2. Review The Human Report

The Markdown report summarizes status, changed files, changed lines, risk score, and the riskiest files. In the fixture, the report calls out a dependency lockfile and an auth path.

## 3. Hand JSON To Automation

Agents and CI jobs should read `diffbudget-report.json` for status and findings instead of scraping the Markdown report. Treat `pass` as a signal to continue with normal checks, not as permission to skip review.

## 4. Escalate On Strict Failure

For uncommitted work, use:

```sh
diffbudget scan --base HEAD --output .diffbudget/latest --strict
```

When strict mode exits non-zero, capture the command, report path, and top findings before asking for maintainer review.

## Boundaries

- DiffBudget scores unified diffs; it does not prove semantic correctness.
- Missing-test detection is heuristic.
- Branch protection, test execution, and release approval remain separate controls.
