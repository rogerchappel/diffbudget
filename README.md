# DiffBudget 🧮

Local patch risk budgets before a commit escapes.

DiffBudget reads a git diff, scores the patch against plain local budgets, and writes a shareable Markdown + JSON report. It is for maintainers and coding-agent workflows that need a crisp answer to: “is this patch too spicy to ship as-is?”

## Install

```sh
npm install -D diffbudget
npx diffbudget --version
```

From a checkout of this repository:

```sh
npm install
npm run build
node dist/cli.js --help
```

## Quickstart

```sh
# create diffbudget.config.json
npx diffbudget init

# score uncommitted changes against HEAD
npx diffbudget scan --base HEAD --output .diffbudget/latest

# short alias for the same CLI
npx dbudget scan --base HEAD --output .diffbudget/latest

# fail with exit code 2 when the patch exceeds budget
npx diffbudget scan --base HEAD --strict

# render an existing JSON report
npx diffbudget report --input .diffbudget/latest/diffbudget-report.json
```

## Practical examples

Scan the checked-in fixture:

```sh
node dist/cli.js scan \
  --diff fixtures/simple-risk/sample.diff \
  --output .diffbudget/sample \
  --format markdown
```

Use in an agent handoff:

```sh
diffbudget scan --base HEAD --output .diffbudget/latest --strict
cat .diffbudget/latest/diffbudget-report.md
```

Tune budgets in `diffbudget.config.json`:

```json
{
  "budgets": { "maxFiles": 12, "maxChangedLines": 350, "maxRiskScore": 90, "warnRiskScore": 60 },
  "patterns": { "riskyPaths": ["src/auth/**", "infra/**", ".github/workflows/**"] }
}
```

## What it scores

- number of changed files and changed lines
- risky paths such as auth, security, infra, and CI workflows
- generated or built output
- dependency lockfiles and resolver churn
- binary files that cannot be reviewed as text
- large deletion-heavy changes
- production changes without a test or fixture change in the same diff

## JSON output notes

`scan` always writes:

- `diffbudget-report.json` — deterministic object for gates and bots
- `diffbudget-report.md` — human-readable handoff summary

The JSON includes `status`, `totals`, `budgets`, `findings`, and per-file `score`, `tags`, and `reasons`.

## Safety model

DiffBudget is local-first:

- no required network access
- no telemetry or background daemon
- no repo uploads
- secret-ish tokens and home paths are redacted in display helpers
- `.git`, `node_modules`, build caches, and `.diffbudget` are ignored by default budgets

## Limitations

- V1 parses unified git diffs; semantic language analysis is out of scope.
- Missing-test detection is heuristic, not proof.
- Budgets are intentionally conservative defaults; tune them per repo.
- Branch protection, CI, and release publishing remain your responsibility.

## Verify

```sh
npm test
npm run check
npm run build
npm run smoke
npm run package:smoke
npm run release:check
bash scripts/validate.sh
```

## Contributing

Keep changes small, local-first, and fixture-backed. See [CONTRIBUTING.md](CONTRIBUTING.md) and [SECURITY.md](SECURITY.md).

## License

MIT
