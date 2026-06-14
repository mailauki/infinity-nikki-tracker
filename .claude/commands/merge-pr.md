---
allowed-tools: Bash(git checkout:*), Bash(git pull:*), Bash(git branch:*), Bash(git remote:*), Bash(git fetch:*), Bash(git cleanup-merged:*), Bash(gh pr merge:*), Bash(gh pr view:*), Bash(gh pr lock:*)
description: Merge the current branch's PR into main, lock it, and safely clean up branches
---

## Context

- Current branch: !`git branch --show-current`
- Open PR for this branch: !`gh pr view --json number,title,state,url 2>/dev/null || echo "No open PR found"`

## Your task

This is the single canonical merge-pr flow for this repo. It supersedes the
`commit-commands` plugin's `/merge-pr` (which is a subset — no lock, no
squash-safe cleanup). Always use this one.

Merge the open PR for the current branch into main, lock it, then clean up branches. Do all steps in order:

1. **Find the PR** — use `gh pr view` to get the PR number. If no open PR exists, stop and say so.
2. **Merge the PR** — run `gh pr merge <number> --squash --delete-branch` to squash-merge and delete the remote branch. If branch protection blocks it (needs review/checks), report that and stop — do **not** add `--auto` here, because the lock step below must run against an actually-merged PR, not a queued one. If the user wants auto-merge, tell them to wait for checks and re-run `/merge-pr`.
3. **Verify it actually merged** — `gh pr view <number> --json state --jq '.state'` must report `MERGED` before continuing. If not, stop and report.
4. **Lock the PR conversation** — `gh pr lock <number> --reason resolved`. This marks it done and prevents the thread from being reopened via comment. (GitHub has no native auto-lock; this is why it lives here.) If locking fails, report it but continue — the merge already succeeded.
5. **Switch to main and pull** — `git checkout main && git pull --rebase` (set upstream with `git branch --set-upstream-to=origin/main main` if it warns about no tracking).
6. **Safely clean up merged local branches** — run `git cleanup-merged --yes`. This deletes local branches whose PR is MERGED _and_ whose commits are all in origin/main; it keeps (with a warning) any branch that still has stranded commits. Do **not** use bare `git branch -D` — the cleanup command exists specifically to avoid dropping post-squash commits.
7. **Prune stale remote refs** — `git remote prune origin`, then delete any remaining `[gone]` branches shown by `git branch -vv | grep '\[gone\]'` (these are safe — their upstream is gone, meaning the PR's remote branch was deleted on merge).

Report what was merged, that it was locked, and what was cleaned up when done. If `git cleanup-merged` kept any branch due to stranded commits, surface that prominently.
