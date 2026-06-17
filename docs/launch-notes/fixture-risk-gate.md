# Launch Note Draft: Fixture Risk Gate Demo

`diffbudget` now has a runnable fixture demo for showing local patch risk budgets in a review or agent handoff.

## What Changed

- `demo/run-fixture-risk-scan.sh` builds the CLI and scans `fixtures/simple-risk/sample.diff`.
- The demo writes both Markdown and JSON reports under `.tmp/demo-fixture-risk-scan/`.
- The tutorial in `docs/tutorials/agent-risk-gate.md` explains how to use the report as a pre-review stop point.
- The social hooks in `docs/promo/social-hooks.md` keep promotion grounded in the checked-in fixture.

## Why It Matters

Maintainers can show `diffbudget` without needing a live risky branch. Agents can also use the JSON report shape as a concrete example for workflow integration.

## Limitations To Mention

- DiffBudget scores unified diffs, not semantic correctness.
- Missing-test detection is heuristic.
- Strict mode is a local budget gate, not a replacement for tests or branch protection.
