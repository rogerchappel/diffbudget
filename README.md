# DiffBudget 🧮

Local patch risk budgets before a commit escapes.

DiffBudget reads a git diff, scores the patch against plain local budgets, and writes a shareable Markdown + JSON report. It is for maintainers and coding-agent workflows that need a crisp answer to: “is this patch too spicy to ship as-is?”

## Install

DiffBudget is not currently published to the npm registry. Install the current
source directly from GitHub:

```sh
npm install -D github:rogerchappel/diffbudget#main
npx --no-install diffbudget --version
```

The `prepare` script builds the CLI during installation. Pin a commit SHA
instead of `main` when you need a reproducible dependency.

For local development from a checkout of this repository:

```sh
npm ci
npm run build
node dist/cli.js --help
```

## Quickstart

```sh
# create diffbudget.config.json (after installing as above)
npx --no-install diffbudget init

# score uncommitted changes against HEAD
npx --no-install diffbudget scan --base HEAD --output .diffbudget/latest

# short alias for the same CLI
npx --no-install dbudget scan --base HEAD --output .diffbudget/latest

# fail with exit code 2 when the patch exceeds budget
npx --no-install diffbudget scan --base HEAD --strict

# render an existing JSON report
npx --no-install diffbudget report --input .diffbudget/latest/diffbudget-report.json
```

Without `--target`, a Git-backed scan combines staged and unstaged tracked
changes against `--base` with every non-ignored untracked file. Text content
and line counts contribute to risk normally; binary and empty untracked files
still contribute to the changed-file count. Git-ignored files and the selected
report output directory are excluded. With `--target`, the scan is strictly the
committed `--base..--target` range and does not inspect working-tree files.

## Practical examples

Scan the checked-in fixture:

```sh
node dist/cli.js scan \
  --diff fixtures/simple-risk/sample.diff \
  --output .diffbudget/sample \
  --format markdown
```

Or run the fixture-backed demo script:

```sh
bash demo/run-fixture-risk-scan.sh
```

The tutorial in [docs/tutorials/agent-risk-gate.md](docs/tutorials/agent-risk-gate.md) shows how to use the generated Markdown and JSON reports in an agent handoff. Promotion hooks are in [docs/promo/social-hooks.md](docs/promo/social-hooks.md), and a recording outline is in [docs/promo/video-brief-fixture-risk-gate.md](docs/promo/video-brief-fixture-risk-gate.md).

Use in an agent handoff:

```sh
diffbudget scan --base HEAD --output .diffbudget/latest --strict
cat .diffbudget/latest/diffbudget-report.md
```

## CLI options

- `init`: `--force`
- `scan`: `--base`, `--target`, `--diff`, `--config`, `--output`, `--format markdown|json`, `--strict`
- `report`: `--input`, `--output`, `--format markdown|json`
- `doctor`: `--config`

Boolean options (`--force` and `--strict`) do not take values. Unknown options,
missing values, and formats other than `markdown` or `json` exit with an error.

Tune budgets in `diffbudget.config.json`:

```json
{
  "budgets": { "maxFiles": 12, "maxChangedLines": 350, "maxRiskScore": 90, "warnRiskScore": 60 },
  "patterns": { "riskyPaths": ["src/auth/**", "infra/**", ".github/workflows/**"] }
}
```

Config sections are optional and merge with the defaults. Supplied budgets and
weights must be finite non-negative numbers, patterns must be arrays of strings,
and redaction settings must be booleans. Unknown root or nested keys are
rejected with their full path, so configuration misspellings cannot silently
fall back to defaults. See
[docs/CONFIG.md](docs/CONFIG.md) for the complete constraints and redaction
behavior.

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
npm run install:smoke
npm run package:smoke
npm run release:check
bash scripts/validate.sh
```

## Contributing

Keep changes small, local-first, and fixture-backed. See [CONTRIBUTING.md](CONTRIBUTING.md) and [SECURITY.md](SECURITY.md).

## Development

Use Node.js 20 or newer. Run these checks before opening a PR:

```sh
npm run build
npm run check
npm test
npm run smoke
npm run install:smoke
npm run package:smoke
npm run release:check
```

## License

MIT
