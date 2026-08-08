---
name: git-workflow
description: Git, PR, and deployment workflow for this repo — branch protection, the merge-race guard, merging and locking PRs, cleaning up merged branches, per-clone hook setup, and the Vercel/Supabase CLI gotchas. Use when committing, branching, pushing, opening or merging a PR, cleaning up branches, deploying, or running supabase/vercel CLI commands.
---

# Git & Deployment

**Branch protection:** `main` requires a PR with 1 approving review + Vercel status check. Force push and deletion are blocked.

**Merge-race guard (do not strand commits):** A squash-merge captures only the commits that existed on the branch _at merge time_. Pushing more commits to a branch after its PR is merged silently strands that work outside `main`. Therefore: **before a PR is merged, confirm all intended commits are already pushed; never push to a branch whose PR is already merged** — branch from `main` and cherry-pick instead. A tracked `pre-push` hook (`.githooks/pre-push`, enabled via `core.hooksPath .githooks`) blocks pushes to any branch whose PR is `MERGED` (override with `git push --no-verify`). The repo also has "automatically delete head branch on merge" enabled so a late push reopens the PR visibly rather than riding a stale branch.

**Cleaning up merged local branches:** Run `git cleanup-merged` (alias → `.githooks/cleanup-merged-branches.sh`) to delete local branches whose PR is `MERGED` **and** whose commits are all in `origin/main`. It deletes only when `git cherry origin/main <branch>` confirms nothing is stranded — a branch with a post-squash commit is kept with a warning, never deleted. Flags: `--dry-run`, `--yes`. Don't `git branch -D` a merged branch by hand without this check.

**Lock PRs after merge:** Merge via the project `/merge-pr` command, which squash-merges, verifies the PR is `MERGED`, then runs `gh pr lock <n> --reason resolved` and finally `git cleanup-merged`. GitHub has no native auto-lock, so the lock lives in the merge flow; if you merge via the web UI, lock manually with `gh pr lock <n> --reason resolved`. Locking marks the PR done and stops the thread reopening (it does not by itself prevent pushes to the head branch — that's the pre-push hook's job).

**Per-clone setup (local git config, not auto-applied on clone):** after a fresh clone, run `git config core.hooksPath .githooks` (enables the pre-push hook) and `git config alias.cleanup-merged '!bash "$(git rev-parse --show-toplevel)/.githooks/cleanup-merged-branches.sh"'` (registers the cleanup command).

**Claude branches:** Auto-generated branches use pattern `claude/<feature>-<id>` — check for unmerged remote branches and create PRs as needed.

**`git add` with `[slug]` paths** fails in zsh due to glob expansion — always quote: `git add 'app/admin/eureka/sets/edit/[slug]/page.tsx'`.

## Vercel CLI

- `vercel ls --yes` — list deployments (`--yes` skips interactive confirmation)
- `vercel inspect <url>` — check deployment status and build output
- `vercel logs <url>` — stream runtime logs (fails for errored deployments; use Vercel dashboard instead)

## Supabase CLI

- `supabase db push --include-all` — use when local migrations predate the latest remote migration
- `supabase gen types typescript --project-id $(cat supabase/.temp/project-ref) > lib/types/supabase.ts` — regenerate types after schema changes
- `supabase db dump` requires Docker Desktop to be running; `supabase db execute --sql` does not exist
- FK on a non-PK column requires a UNIQUE constraint on the referenced column first
- Use `ON UPDATE CASCADE` on string FKs so renaming a referenced title cascades automatically
- RLS `WITH CHECK` sub-selects on the same table risk infinite recursion — use `current_setting('request.jwt.claims', true)::jsonb` for role comparisons instead of a sub-select

### Red "Supabase Preview" PR check is usually benign and self-clearing

The Supabase GitHub integration spins up a throwaway branch DB per PR and replays migrations on it. If the PR's migration files are **rebased or renamed after that branch DB was first created**, the branch's `schema_migrations` ends up pointing at versions no longer in the repo, and the CLI fails the check with `Remote migration versions not found in local migrations directory`. This is a per-PR branch-history mismatch, not a broken migration — production and `main`'s preview are unaffected (verify: the production `supabase_migrations.schema_migrations` versions match `supabase/migrations/*.sql` exactly, and `branch-action` logs on `git_ref=main` say "All migrations are up to date"). The stale branch DB is deleted on merge (`--delete-branch`), so the red check dies with it. To avoid triggering it mid-PR, **add new migrations rather than rewriting existing migration timestamps once a PR is open**; if a preview does go stale, reset that branch (MCP `reset_branch` or the dashboard) instead of letting the check ride red. Diagnose via the `branch-action` service in `get_logs` on the production project ref.
