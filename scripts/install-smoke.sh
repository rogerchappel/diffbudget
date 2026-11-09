#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
install_root="$(mktemp -d "${TMPDIR:-/tmp}/diffbudget-install-smoke.XXXXXX")"

cleanup() {
  rm -rf "$install_root"
}
trap cleanup EXIT

git -C "$repo_root" archive HEAD | tar -x -C "$install_root"
git -C "$install_root" init --quiet
git -C "$install_root" add .
git -C "$install_root" \
  -c user.name="DiffBudget install smoke" \
  -c user.email="install-smoke@example.invalid" \
  commit --quiet -m "install fixture"

consumer_root="$install_root/consumer"
mkdir "$consumer_root"
cd "$consumer_root"
npm init --yes >/dev/null
npm install --save-dev "git+file://$install_root" >/dev/null

installed_version="$(npx --no-install diffbudget --version)"
expected_version="$(node -p "require('./node_modules/diffbudget/package.json').version")"

test "$installed_version" = "$expected_version"
test "$(npx --no-install dbudget --version)" = "$expected_version"

printf 'source install smoke ok (%s)\n' "$installed_version"
