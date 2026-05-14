# DiffBudget Tasks

## MVP checklist

- [x] Scaffold an OSS TypeScript CLI with StackForge.
- [x] Add `init`, `scan`, `report`, and `doctor` commands.
- [x] Parse checked-in unified diff fixtures deterministically.
- [x] Score risky paths, generated outputs, dependency churn, binary files, deletion-heavy changes, and missing tests.
- [x] Emit JSON and Markdown reports.
- [x] Document orchestration behavior for agent gates.
- [x] Include fixture-backed tests and a real CLI smoke.
- [x] Keep the tool local-first with no required network access.

## Near-term follow-ups

- [ ] Add optional SARIF output for code review systems.
- [ ] Support config presets for Node, Python, Go, and Rust repos.
- [ ] Add baseline comparison mode for teams that want trend budgets.
