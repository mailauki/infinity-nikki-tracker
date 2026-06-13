#!/usr/bin/env bash
#
# cleanup-merged-branches: delete local branches whose PR is MERGED *and* whose
# commits have all landed in origin/main.
#
# The two-part check is deliberate: a squash-merge rewrites history, so a PR can
# read MERGED while a commit pushed after the squash is still stranded on the
# branch (this happened with #163). We only delete when `git cherry` confirms
# every commit on the branch is already represented in origin/main — never on PR
# state alone.
#
# Usage:
#   .githooks/cleanup-merged-branches.sh          # interactive: list, confirm, delete
#   .githooks/cleanup-merged-branches.sh --dry-run # show what would be deleted, do nothing
#   .githooks/cleanup-merged-branches.sh --yes     # delete without the confirmation prompt
#
# Wired as a git alias: `git cleanup-merged` (see CLAUDE.md / git config alias).
#
# Requires: gh (authenticated). Fails closed on a per-branch basis — if a
# branch's PR state can't be determined, it is KEPT, never deleted.

set -euo pipefail

dry_run=false
assume_yes=false
for arg in "$@"; do
  case "$arg" in
    --dry-run) dry_run=true ;;
    --yes|-y)  assume_yes=true ;;
    *) echo "unknown arg: $arg" >&2; exit 2 ;;
  esac
done

if ! command -v gh >/dev/null 2>&1 || ! gh auth status >/dev/null 2>&1; then
  echo "cleanup-merged: gh CLI not available/authenticated — aborting (cannot verify PR state)." >&2
  exit 1
fi

current="$(git symbolic-ref --short HEAD 2>/dev/null || echo '')"

echo "Fetching + pruning origin..."
git fetch origin --prune --quiet

to_delete=()
for branch in $(git for-each-ref --format='%(refname:short)' refs/heads/); do
  # Never touch main or the branch you're currently on.
  if [ "$branch" = "main" ] || [ "$branch" = "$current" ]; then
    continue
  fi

  state="$(gh pr view "$branch" --json state --jq '.state' 2>/dev/null || echo '')"
  if [ "$state" != "MERGED" ]; then
    printf '  keep   %-50s (PR: %s)\n' "$branch" "${state:-none}"
    continue
  fi

  # Squash-safe verification: are there commits on this branch NOT in origin/main?
  # `git cherry origin/main <branch>` prints a line per commit; '+' = not upstream.
  unmerged="$(git cherry origin/main "$branch" 2>/dev/null | grep -c '^+' || true)"
  if [ "$unmerged" -gt 0 ]; then
    printf '  KEEP   %-50s (PR MERGED but %s commit(s) not in main!)\n' "$branch" "$unmerged"
    echo "         ^ stranded work — cherry-pick onto a fresh branch before deleting." >&2
    continue
  fi

  printf '  delete %-50s (PR MERGED, all commits in main)\n' "$branch"
  to_delete+=("$branch")
done

if [ "${#to_delete[@]}" -eq 0 ]; then
  echo "Nothing to clean up."
  exit 0
fi

if [ "$dry_run" = true ]; then
  echo "(dry run — no branches deleted)"
  exit 0
fi

if [ "$assume_yes" != true ]; then
  printf 'Delete %d branch(es)? [y/N] ' "${#to_delete[@]}"
  read -r reply </dev/tty
  case "$reply" in
    y|Y|yes|YES) ;;
    *) echo "Aborted."; exit 0 ;;
  esac
fi

for branch in "${to_delete[@]}"; do
  git branch -D "$branch"
done
echo "Done."
