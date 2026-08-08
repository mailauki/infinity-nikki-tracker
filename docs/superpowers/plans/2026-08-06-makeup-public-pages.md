# Makeup Public Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `ComingSoon` stub at `app/makeup/page.tsx` with a full public makeup index (`/makeup`) and set detail page (`/makeup/[slug]`), at parity with the outfits domain.

**Architecture:** Client data-provider + context, mirroring outfits. A domain `layout.tsx` reads auth server-side and mounts `MakeupDataProvider`, which fetches a bootstrap payload from `/api/makeup` and holds collection + filter state. The outfits virtual grids are **copied and re-typed** for makeup rather than generified — see the spec for why. Two structural divergences from outfits: standalone pieces are set-less variants folded into a client-side pseudo-set, and every set carries all five categories.

**Tech Stack:** Next.js 16 App Router (`cacheComponents: true`), React 19, Supabase (SSR + browser clients), MUI v9, `@tanstack/react-virtual`, notistack, TypeScript, Yarn 4.

**Spec:** `docs/superpowers/specs/2026-08-06-makeup-public-pages-design.md`

**Branch:** `claude/makeup-public-pages` (already cut from `origin/main` @ 892dc1af; draft PR #312 is open).

---

## Global Constraints

These apply to **every** task. They are not repeated per-task.

- **Package manager is Yarn.** Never npm or pnpm. Type-check with `yarn tsc --noEmit` — never `yarn dlx tsc`, which fetches a bogus placeholder package.
- **Prettier:** no semicolons, single quotes, 2-space indent, 100-char print width, ES5 trailing commas. A PostToolUse hook runs `yarn format && yarn lint:fix` then `yarn tsc --noEmit` after every Edit/Write, so formatting self-corrects; do not hand-format.
- **Path alias:** `@/` maps to the project root.
- **Colocation rule:** a component used by exactly one route subtree lives beside that route's `page.tsx`. Only genuinely shared code (2+ unrelated routes) goes in `components/`.
- **React `cache()` is for reads only.** Never wrap a mutation in it.
- **`use cache` vs React `cache()`:** anything calling `cookies()` (all auth-dependent hooks) must use React `cache()`. `use cache` is only for cookie-free public lookups via `createPublicClient()`.
- **`getUserID()` returns `null` when logged out** — always guard before passing it to a user-scoped query.
- **MUI `Stack` rejects layout shorthands** (`justifyContent`, `alignItems`, …) as direct props. Put them in `sx` or the build fails to type-check.
- **Dark mode** must use `useColorScheme()`, never `useTheme().palette.mode`.
- **`git add` with `[slug]` paths must be quoted** — zsh glob-expands the brackets: `git add 'app/makeup/[slug]/page.tsx'`.
- **Migrations are append-only.** Never rewrite an existing migration's timestamp while the PR is open, or the Supabase preview branch check goes stale.
- **Commit messages** end with `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.
- **Do not push after PR #312 is merged.** A tracked `pre-push` hook blocks it; branch from `main` and cherry-pick instead.

### Verification reality

**This repo has no test framework.** There is no jest, vitest, or playwright config, and no `test` script in `package.json`. Do not invent one, and do not write `*.test.ts` files — a plan step demanding `yarn test` would be unrunnable.

The verification gate for every task is therefore:

```bash
yarn tsc --noEmit && yarn lint
```

plus, for tasks that change routing or caching boundaries, `yarn build`. Tasks that produce user-visible UI also carry an explicit **manual check** with concrete steps. Where a task's logic is pure and worth proving, it is verified with a **throwaway `tsx` script run once and deleted**, not a committed test — this matches the repo's existing practice.

Treat "typechecks, lints, builds, and the manual check passes" as the definition of done. Do not claim anything stronger.

---

## Correction to the spec (read before Task 1)

The spec says adding a `user_preferences` column takes **five** lockstep changes. Exploration during planning found it is **six** — `app/api/preferences/route.ts` contains _two_ independent lists:

1. `WRITABLE_KEYS` (a `Set`) — gates the POST allowlist. Missing here ⇒ **writes silently no-op**.
2. `PREFERENCE_COLUMNS` (a select string) — gates the GET. Missing here ⇒ **reads return `undefined`**.

Both fail _silently_. The full six sites are enumerated in Task 1.

---

## File Structure

**New files:**

| Path                                                  | Responsibility                                                                        |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `supabase/migrations/<ts>_add_makeup_preferences.sql` | Adds the 3 `makeup_*` preference columns                                              |
| `components/makeup/makeup-context.tsx`                | `MakeupDataContext`, `MakeupFilterState`, `DEFAULT_MAKEUP_FILTERS`, `useMakeupData()` |
| `components/makeup/makeup-image-mode-context.tsx`     | Image mode + density, `resolveMakeupImage()`, `MakeupImageModeProvider`               |
| `components/makeup/makeup-image-mode-button.tsx`      | Toolbar main/alt swap button bound to the makeup context                              |
| `app/api/makeup/route.ts`                             | Bootstrap payload for the provider                                                    |
| `app/makeup/layout.tsx`                               | Server auth read → provider stack                                                     |
| `app/makeup/loading.tsx`                              | Skeleton                                                                              |
| `app/makeup/actions.ts`                               | `handleObtainedMakeup()`                                                              |
| `app/makeup/makeup-data-provider.tsx`                 | Data fetch, filter state, optimistic toggles                                          |
| `app/makeup/makeup-toolbar.tsx`                       | ToolbarSlot contents                                                                  |
| `app/makeup/makeup-results-bar.tsx`                   | Result count + active filter chips                                                    |
| `app/makeup/filter-makeup.tsx`                        | Filter/sort pipeline, grid selection                                                  |
| `app/makeup/makeup-set-card.tsx`                      | One card per set/evolution group                                                      |
| `app/makeup/makeup-variant-card.tsx`                  | One card per variant                                                                  |
| `app/makeup/makeup-group-header.tsx`                  | Group header row                                                                      |
| `app/makeup/virtual-set-grid.tsx`                     | Copied, makeup-typed                                                                  |
| `app/makeup/virtual-variant-grid.tsx`                 | Copied, makeup-typed                                                                  |
| `app/makeup/virtual-grouped-grid.tsx`                 | Copied, makeup-typed                                                                  |
| `app/makeup/deferred-measure-ref.ts`                  | Copied verbatim (domain-agnostic)                                                     |
| `app/makeup/[slug]/page.tsx`                          | Server: `getMakeupSet` + auth                                                         |
| `app/makeup/[slug]/makeup-set-detail.tsx`             | Evolution selection + filtering                                                       |
| `app/makeup/[slug]/makeup-set-detail-card.tsx`        | Hero card, links to paired outfit                                                     |
| `app/makeup/[slug]/makeup-evolution-variants.tsx`     | Per-category variant grid                                                             |
| `app/makeup/[slug]/makeup-toggle-bar.tsx`             | Evolution/category toggle row                                                         |

**Modified files:**

| Path                           | Change                                                             |
| ------------------------------ | ------------------------------------------------------------------ |
| `lib/types/supabase.ts`        | Regenerated (not hand-edited)                                      |
| `lib/preferences.ts`           | 3 new `DEFAULT_PREFERENCES` entries                                |
| `lib/types/eureka.ts`          | 3 new slugs in the `UserPreferences` `Pick<>`                      |
| `hooks/data/preferences.ts`    | 3 new columns in the select string                                 |
| `app/api/preferences/route.ts` | 3 new entries in **both** `WRITABLE_KEYS` and `PREFERENCE_COLUMNS` |
| `hooks/makeup.ts`              | Standalone bucket, `makeup_categories`, `outfitSet`                |
| `lib/types/makeup.ts`          | Make `makeup_categories`/`outfitSet` non-optional                  |
| `app/makeup/page.tsx`          | Replace `ComingSoon`                                               |

### A dependency that is NOT on this branch

`components/navbar/image-mode-button.tsx` does **not** exist on `main`. It was introduced in commit `5dc53709` on the unmerged `claude/set-detail-card-outfits-toolbar` branch, and it is hardwired to `useOutfitImageMode()`.

Do not import it, do not cherry-pick it, and do not depend on that branch merging first. Task 3 creates a separate `components/makeup/makeup-image-mode-button.tsx` bound to the makeup context. If the outfits branch later merges, unifying the two buttons is follow-up work outside this plan.

---

## Task 1: Preference columns (the six-site lockstep)

**Files:**

- Create: `supabase/migrations/<timestamp>_add_makeup_preferences.sql`
- Modify: `lib/types/supabase.ts` (regenerated), `lib/preferences.ts:30`, `lib/types/eureka.ts:105`, `hooks/data/preferences.ts:12`, `app/api/preferences/route.ts` (two lists)

**Interfaces:**

- Consumes: nothing (first task).
- Produces: three persisted preference keys usable by later tasks —
  `makeup_sort_axis: string | null` (`'date' | 'rarity' | 'progress' | 'title'`, default `'date'`),
  `makeup_density: string | null` (`'standard' | 'compact'`, default `'standard'`),
  `makeup_image_mode: string | null` (`'image' | 'alt'`, default `'image'`).

- [ ] **Step 1: Write the migration**

Use a real UTC timestamp at authoring time for `<timestamp>` (format `YYYYMMDDHHMMSS`), later than `20260804120000`.

```sql
-- <timestamp>_add_makeup_preferences.sql
-- Display preferences for the public makeup pages. Filter axes are
-- deliberately NOT persisted (see 2026-08-06-makeup-public-pages-design.md);
-- only these three cross-cutting display settings survive a reload.

begin;

alter table public.user_preferences
  add column if not exists makeup_sort_axis  text default 'date',
  add column if not exists makeup_density    text default 'standard',
  add column if not exists makeup_image_mode text default 'image';

commit;
```

- [ ] **Step 2: Push and regenerate types**

```bash
supabase db push --include-all
supabase gen types typescript --project-id $(cat supabase/.temp/project-ref) > lib/types/supabase.ts
```

Verify the regeneration landed before continuing — this gates Step 4:

```bash
grep -c "makeup_sort_axis\|makeup_density\|makeup_image_mode" lib/types/supabase.ts
```

Expected: a non-zero count. If it is `0`, the push or generate failed; stop and fix. Do **not** hand-edit `lib/types/supabase.ts`.

- [ ] **Step 3: Add defaults in `lib/preferences.ts`**

Add to the `DEFAULT_PREFERENCES` object, after `outfit_sort_axis: 'date',`:

```ts
  makeup_sort_axis: 'date',
  makeup_density: 'standard',
  makeup_image_mode: 'image',
```

- [ ] **Step 4: Widen the `UserPreferences` type**

In `lib/types/eureka.ts`, the type is a `Pick<>` over `Tables<'user_preferences'>`. Add three members to the union, after `| 'outfit_sort_axis'`:

```ts
  | 'makeup_sort_axis'
  | 'makeup_density'
  | 'makeup_image_mode'
```

This only compiles once Step 2 regenerated `supabase.ts`. If it errors with "not assignable to keyof", Step 2 did not take effect.

- [ ] **Step 5: Add the three columns to `hooks/data/preferences.ts`**

Append to the select string inside `getPreferences` (one long single-quoted string; add to the end, before the closing quote):

```text
, makeup_sort_axis, makeup_density, makeup_image_mode
```

- [ ] **Step 6: Add to BOTH lists in `app/api/preferences/route.ts`**

This is the step the spec undercounted. Two separate edits in one file.

Into the `WRITABLE_KEYS` set, after `'outfit_sort_axis',`:

```ts
  'makeup_sort_axis',
  'makeup_density',
  'makeup_image_mode',
```

And append to the `PREFERENCE_COLUMNS` string, before its closing quote:

```text
, makeup_sort_axis, makeup_density, makeup_image_mode
```

Omitting the first makes writes silently no-op; omitting the second makes reads return `undefined`. Neither throws.

- [ ] **Step 7: Verify all six sites**

```bash
grep -rn "makeup_sort_axis" lib/preferences.ts lib/types/eureka.ts hooks/data/preferences.ts app/api/preferences/route.ts lib/types/supabase.ts
```

Expected: at least 5 files listed, with `app/api/preferences/route.ts` appearing **twice** (once per list). If the route file appears once, one of the two lists was missed.

```bash
yarn tsc --noEmit && yarn lint
```

Expected: both clean.

- [ ] **Step 8: Commit**

```bash
git add supabase/migrations lib/preferences.ts lib/types/eureka.ts lib/types/supabase.ts hooks/data/preferences.ts app/api/preferences/route.ts
git commit -m "$(cat <<'EOF'
feat(makeup): persist makeup sort axis, density, and image mode

Adds the three makeup display preference columns. Filter axes stay
session-only by design.

Note the lockstep is six sites, not five: app/api/preferences/route.ts
carries two independent lists — WRITABLE_KEYS gates the POST allowlist and
PREFERENCE_COLUMNS gates the GET select. A column missing from either fails
silently, as a no-op write or an undefined read.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Extend `createMakeupSet()` — standalone bucket, categories, outfit link

**Files:**

- Modify: `hooks/makeup.ts`, `lib/types/makeup.ts`
- Verify with: a throwaway script, deleted before commit

**Interfaces:**

- Consumes: nothing from Task 1.
- Produces:
  - `STANDALONE_MAKEUP_SLUG = 'standalone-pieces'` (exported const)
  - `createMakeupSet(rows: MakeupSetRaw[], variants: MakeupVariant[], categories?: MakeupCategory[], outfitSets?: OutfitSetRef[]): MakeupSet[]` — categories and outfitSets are **optional** so existing callers keep compiling
  - `type OutfitSetRef = { slug: string; title: string; image_url: string | null }`
  - `isStandaloneMakeupSet(set: Pick<MakeupSet, 'slug'>): boolean`

The pseudo-set is appended **last** and is the only set whose `slug` is not in `makeup_sets`.

- [ ] **Step 1: Make the two TODO fields non-optional in `lib/types/makeup.ts`**

Replace the two commented-optional fields on `MakeupSet` (currently `makeup_categories?:` and `outfitSet?:`, each carrying a "not yet populated" comment) with:

```ts
  // Every makeup set carries all five categories (see commit caf8edb8), so this
  // is the lookup list, not a per-set subset. Populated by createMakeupSet().
  makeup_categories: MakeupCategory[]
  // The paired outfit set, resolved from makeup_sets.outfit_set. Null when the
  // set has no pairing. Populated by createMakeupSet().
  outfitSet: { slug: string; title: string; image_url: string | null } | null
```

Delete the stale "not yet populated / always [] / always null" comments.

- [ ] **Step 2: Add the standalone constant and helper to `hooks/makeup.ts`**

Add near the top, below the imports:

```ts
// The client-side bucket for set-less variants. Unlike outfits — which stores a
// real `standalone_pieces` row — makeup has no container row: a standalone piece
// is a variant with makeup_set IS NULL. This slug therefore never exists in
// makeup_sets, so /makeup/standalone-pieces correctly 404s and nothing links to it.
export const STANDALONE_MAKEUP_SLUG = 'standalone-pieces'

export type OutfitSetRef = { slug: string; title: string; image_url: string | null }

export function isStandaloneMakeupSet(set: Pick<MakeupSet, 'slug'>) {
  return set.slug === STANDALONE_MAKEUP_SLUG
}
```

- [ ] **Step 3: Rewrite `createMakeupSet()`**

Replace the whole existing function with this. The `build` helper gains the two fields; the standalone fold and the outfit-set map are new.

```ts
/**
 * Fold flat makeup_sets rows into base sets, each carrying its evolutions
 * (ordered by `order`) and its own variants. Evolution rows are removed from
 * the top level. An evolution whose base_set matches no base row is dropped
 * rather than promoted — a dangling base_set is bad data, not a base set.
 *
 * Set-less variants (makeup_set IS NULL) are folded into one synthetic
 * "Standalone Pieces" set, appended LAST. It is omitted entirely when no such
 * variants exist.
 */
export function createMakeupSet(
  rows: MakeupSetRaw[],
  variants: MakeupVariant[],
  categories: MakeupCategory[] = [],
  outfitSets: OutfitSetRef[] = []
): MakeupSet[] {
  const variantsBySet = new Map<string, MakeupVariant[]>()
  const standaloneVariants: MakeupVariant[] = []
  for (const variant of variants) {
    if (!variant.makeup_set) {
      standaloneVariants.push(variant)
      continue
    }
    const list = variantsBySet.get(variant.makeup_set)
    if (list) list.push(variant)
    else variantsBySet.set(variant.makeup_set, [variant])
  }

  const outfitSetBySlug = new Map(outfitSets.map((o) => [o.slug, o]))

  const build = (row: MakeupSetRaw, evolutions: MakeupEvolution[]) =>
    ({
      ...row,
      makeup_variants: variantsBySet.get(row.slug) ?? [],
      makeup_categories: categories,
      evolutions,
      season: row.seasons ? { title: row.seasons } : null,
      seasonCategory: row.season_category ? { title: row.season_category } : null,
      outfitSet: row.outfit_set ? (outfitSetBySlug.get(row.outfit_set) ?? null) : null,
    }) as MakeupSet

  const evolutionsByBase = new Map<string, MakeupEvolution[]>()
  for (const row of rows) {
    if (isBaseMakeupSet(row)) continue
    const base = row.base_set as string
    const evolution = build(row, []) as MakeupEvolution
    const list = evolutionsByBase.get(base)
    if (list) list.push(evolution)
    else evolutionsByBase.set(base, [evolution])
  }

  for (const list of evolutionsByBase.values()) {
    list.sort((a, b) => a.order - b.order)
  }

  const sets = rows
    .filter(isBaseMakeupSet)
    .map((row) => build(row, evolutionsByBase.get(row.slug) ?? []))

  if (standaloneVariants.length === 0) return sets

  // A synthetic row: not from the database, so it carries only what consumers
  // read. Rarity 0 keeps it out of every rarity bucket; callers that filter by
  // rarity treat it as a mixed bag and match on its pieces instead.
  const standalone = {
    id: -1,
    slug: STANDALONE_MAKEUP_SLUG,
    title: 'Standalone Pieces',
    description: null,
    rarity: 0,
    style: null,
    label: null,
    seasons: null,
    season_category: null,
    outfit_set: null,
    order: 1,
    base_set: null,
    image_url: standaloneVariants[0]?.image_url ?? null,
    alt_image_url: null,
    created_at: null,
    updated_at: null,
    makeup_variants: standaloneVariants,
    makeup_categories: categories,
    evolutions: [],
    season: null,
    seasonCategory: null,
    outfitSet: null,
  } as unknown as MakeupSet

  return [...sets, standalone]
}
```

- [ ] **Step 4: Verify the transform with a throwaway script**

This repo has no test runner and **no `tsx` binary** (`node_modules/.bin/tsx` does not exist, and `package.json` has no `test` script). Node 25 strips TypeScript natively, so run the script with plain `node` — do not add a dev dependency for a throwaway check.

Write it beside the repo so the relative import resolves, and delete it in Step 5.

```bash
cat > verify-makeup.ts <<'EOF'
import { createMakeupSet, STANDALONE_MAKEUP_SLUG } from './hooks/makeup'

const cats = [{ slug: 'lips', title: 'Lips', image_url: null }]
const rows = [
  { slug: 'rosy', title: 'Rosy', base_set: null, order: 1, outfit_set: 'rosy-fit' },
  { slug: 'rosy-b', title: 'Bloom', base_set: 'rosy', order: 2, outfit_set: null },
  { slug: 'orphan', title: 'Orphan', base_set: 'ghost', order: 2, outfit_set: null },
] as never[]
const variants = [
  { slug: 'rosy-lips', makeup_set: 'rosy', makeup_category: 'lips', image_url: null },
  { slug: 'loose-1', makeup_set: null, makeup_category: 'lips', image_url: 'x.png' },
] as never[]
const outfits = [{ slug: 'rosy-fit', title: 'Rosy Fit', image_url: null }]

const out = createMakeupSet(rows, variants, cats, outfits)
const names = out.map((s) => s.slug)
console.log('order:', names)
console.assert(names[names.length - 1] === STANDALONE_MAKEUP_SLUG, 'FAIL: standalone not last')
console.assert(!names.includes('orphan'), 'FAIL: dangling base_set was promoted')
console.assert(out[0].evolutions.length === 1, 'FAIL: evolution not nested')
console.assert(out[0].outfitSet?.title === 'Rosy Fit', 'FAIL: outfitSet not resolved')
console.assert(out[0].makeup_categories.length === 1, 'FAIL: categories not populated')

const none = createMakeupSet(rows, [variants[0]], cats, outfits)
console.assert(!none.map((s) => s.slug).includes(STANDALONE_MAKEUP_SLUG), 'FAIL: empty bucket added')
console.log('all assertions passed')
EOF
node --experimental-strip-types verify-makeup.ts
```

**Known limitation (verified 2026-08-06):** the bare command above does NOT work in this repo. Node's type stripping erases annotations syntactically but cannot resolve the `@/` path alias or erase a cross-file type-only import (`Tables` from `lib/types/supabase.ts`) — both need full TypeScript semantics. Expect `ERR_MODULE_NOT_FOUND` or an unresolved-type error.

Use the repo's own `typescript` package to transpile on load instead:

```bash
cat > verify-loader.mjs <<'EOF'
import { readFileSync } from 'node:fs'
import ts from 'typescript'

export async function load(url, context, nextLoad) {
  if (!url.endsWith('.ts')) return nextLoad(url, context)
  const src = readFileSync(new URL(url), 'utf8')
  const { outputText } = ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  })
  return { format: 'module', shortCircuit: true, source: outputText }
}
EOF
node --import ./verify-loader.mjs verify-makeup.ts
```

Delete BOTH throwaway files in Step 5. Neither may be committed.

Expected output ends with `all assertions passed` and prints no `FAIL:` lines. Note `console.assert` does not exit non-zero — read the output rather than trusting the exit code. If an assertion fails, fix the code; never weaken the assertion.

- [ ] **Step 5: Delete the script and typecheck**

The script must not be committed — it imports nothing the app uses and would fail `yarn lint`.

```bash
rm -f verify-makeup.ts verify-loader.mjs
git status --short   # confirm neither file is staged or untracked
yarn tsc --noEmit && yarn lint
```

Expected: clean. Existing `createMakeupSet` callers (the admin tree) still compile because the two new parameters are optional — confirm with:

```bash
grep -rn "createMakeupSet(" --include=*.ts --include=*.tsx . | grep -v node_modules
```

- [ ] **Step 6: Commit**

```bash
git add hooks/makeup.ts lib/types/makeup.ts
git commit -m "$(cat <<'EOF'
feat(makeup): fold standalone pieces, categories, and outfit links into sets

createMakeupSet() now populates the two fields that carried "not yet
populated" comments — makeup_categories and outfitSet — and folds set-less
variants into a synthetic "Standalone Pieces" set pinned last.

Unlike outfits, makeup has no standalone container row in the database: a
piece is a variant with makeup_set IS NULL. The pseudo-set's slug therefore
never exists in makeup_sets, so nothing links to it and its route 404s by
construction. It is omitted entirely when no set-less variants exist.

The two new parameters are optional so the admin callers keep compiling.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Makeup contexts and the image-mode button

**Files:**

- Create: `components/makeup/makeup-context.tsx`, `components/makeup/makeup-image-mode-context.tsx`, `components/makeup/makeup-image-mode-button.tsx`

**Interfaces:**

- Consumes: Task 1's `makeup_density` / `makeup_image_mode` keys.
- Produces:
  - `MakeupFilterState` — `{ selectedMakeupSet: string | null; selectedMakeupCategory: string[]; selectedRarity: number | null; selectedObtainedFilter: ObtainedFilter | null; selectedStyle: string[]; selectedLabel: string[]; selectedSeason: string[]; selectedSeasonCategory: string[] }`
  - `DEFAULT_MAKEUP_FILTERS: MakeupFilterState`
  - `MakeupDataContext`, `useMakeupData()` returning `MakeupDataContextValue`
  - `MakeupImageModeProvider`, `useMakeupImageMode()`, `resolveMakeupImage(mode, { image, alt })`, types `MakeupImageMode = 'image' | 'alt'`, `MakeupDensity = 'standard' | 'compact'`
  - `MakeupImageModeButton` (default export)

Note there is **no** `selectedEvolution` axis (unlike outfits) and **no** `groupBySet`/`hideEvolutions`/`hideGlowups` — makeup has no glow-ups, and group-by is not persisted here.

- [ ] **Step 1: Create `components/makeup/makeup-context.tsx`**

```tsx
'use client'

import { createContext, useContext } from 'react'
import { MakeupCategory, MakeupSet, ObtainedMakeup } from '@/lib/types/makeup'
import { Label, Style } from '@/lib/types/eureka'
import { Season, SeasonCategory } from '@/lib/types/outfit'
import { ObtainedFilter } from '@/lib/types/props'

export interface MakeupFilterState {
  selectedMakeupSet: string | null
  selectedMakeupCategory: string[]
  selectedRarity: number | null
  selectedObtainedFilter: ObtainedFilter | null
  selectedStyle: string[]
  selectedLabel: string[]
  selectedSeason: string[]
  selectedSeasonCategory: string[]
}

interface MakeupDataContextValue {
  makeupSets: MakeupSet[]
  obtainedMakeup: ObtainedMakeup[]
  makeupCategories: MakeupCategory[]
  styles: Style[]
  labels: Label[]
  seasons: Season[]
  seasonCategories: SeasonCategory[]
  isLoggedIn: boolean
  isAdmin: boolean
  isLoading: boolean
  isError: boolean
  isObtainedError: boolean
  isFiltering: boolean
  userId: string | null
  groupBySet: boolean
  onGroupBySetChange: () => void
  filters: MakeupFilterState
  onFiltersChange: (updates: Partial<MakeupFilterState>) => void
  onClearFilters: () => void
  onToggleObtained: (makeup_set: string, makeup_category: string, makeup_variant: string) => void
  onBatchToggleObtained: (
    variants: Array<{ makeup_set: string; makeup_category: string; makeup_variant: string }>,
    targetObtained: boolean
  ) => void
}

export const DEFAULT_MAKEUP_FILTERS: MakeupFilterState = {
  selectedMakeupSet: null,
  selectedMakeupCategory: [],
  selectedRarity: null,
  selectedObtainedFilter: null,
  selectedStyle: [],
  selectedLabel: [],
  selectedSeason: [],
  selectedSeasonCategory: [],
}

export const MakeupDataContext = createContext<MakeupDataContextValue>({
  makeupSets: [],
  obtainedMakeup: [],
  makeupCategories: [],
  styles: [],
  labels: [],
  seasons: [],
  seasonCategories: [],
  isLoggedIn: false,
  isAdmin: false,
  isLoading: true,
  isError: false,
  isObtainedError: false,
  isFiltering: false,
  userId: null,
  groupBySet: true,
  onGroupBySetChange: () => {},
  filters: DEFAULT_MAKEUP_FILTERS,
  onFiltersChange: () => {},
  onClearFilters: () => {},
  onToggleObtained: () => {},
  onBatchToggleObtained: () => {},
})

export function useMakeupData() {
  return useContext(MakeupDataContext)
}
```

- [ ] **Step 2: Create `components/makeup/makeup-image-mode-context.tsx`**

The two comments about fire-and-forget writes and the single-call reset record real bugs already fixed in the outfits equivalent. Keep them.

```tsx
'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { UserPreferences } from '@/lib/types/eureka'
import { fetchPreferencesOnce } from '@/lib/preferences-cache'
import { savePreferences } from '@/lib/save-preferences'

export type MakeupImageMode = 'image' | 'alt'

export const MAKEUP_IMAGE_MODES: MakeupImageMode[] = ['image', 'alt']

export type MakeupDensity = 'standard' | 'compact'

// Resolve which image to show for the current mode, falling back to the main
// image when the requested source is missing.
export function resolveMakeupImage(
  mode: MakeupImageMode,
  sources: { image?: string | null; alt?: string | null }
): string | null | undefined {
  const { image, alt } = sources
  if (mode === 'alt') return alt || image
  return image
}

type MakeupImageModeContextValue = {
  mode: MakeupImageMode
  setMode: (mode: MakeupImageMode) => void
  cycleMode: () => void
  density: MakeupDensity
  setDensity: (density: MakeupDensity) => void
  reset: () => void
}

// Defaults make the hook safe outside a provider (e.g. nested cards).
const MakeupImageModeContext = createContext<MakeupImageModeContextValue>({
  mode: 'image',
  setMode: () => {},
  cycleMode: () => {},
  density: 'standard',
  setDensity: () => {},
  reset: () => {},
})

// A failed view-preference write must not disrupt the UI — the setting still
// applies for this session, it just may not survive a reload.
const persistFailed = (err: unknown) => {
  console.error('Failed to persist makeup view preference:', err)
}

export function MakeupImageModeProvider({
  isLoggedIn = false,
  children,
}: {
  isLoggedIn?: boolean
  children: React.ReactNode
}) {
  const [mode, setModeState] = useState<MakeupImageMode>('image')
  const [density, setDensityState] = useState<MakeupDensity>('standard')

  useEffect(() => {
    if (!isLoggedIn) return
    fetchPreferencesOnce()
      .then((prefs: UserPreferences | null) => {
        if (!prefs) return
        if (prefs.makeup_image_mode) setModeState(prefs.makeup_image_mode as MakeupImageMode)
        if (prefs.makeup_density) setDensityState(prefs.makeup_density as MakeupDensity)
      })
      .catch(() => {})
  }, [isLoggedIn])

  const setMode = (next: MakeupImageMode) => {
    setModeState(next)
    // Fire-and-forget: the UI must never wait on this write. Running it inside a
    // transition makes the pending state track a network round-trip, so toggling
    // takes seconds to register.
    if (isLoggedIn) void savePreferences({ makeup_image_mode: next }).catch(persistFailed)
  }

  const setDensity = (next: MakeupDensity) => {
    setDensityState(next)
    if (isLoggedIn) void savePreferences({ makeup_density: next }).catch(persistFailed)
  }

  const reset = () => {
    setModeState('image')
    setDensityState('standard')
    // Both keys in one call: two concurrent upserts would race on the same row.
    if (isLoggedIn) {
      void savePreferences({ makeup_image_mode: 'image', makeup_density: 'standard' }).catch(
        persistFailed
      )
    }
  }

  const value = useMemo<MakeupImageModeContextValue>(
    () => ({
      mode,
      setMode,
      cycleMode: () => {
        const next =
          MAKEUP_IMAGE_MODES[(MAKEUP_IMAGE_MODES.indexOf(mode) + 1) % MAKEUP_IMAGE_MODES.length]
        setMode(next)
      },
      density,
      setDensity,
      reset,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mode, density, isLoggedIn]
  )

  return <MakeupImageModeContext.Provider value={value}>{children}</MakeupImageModeContext.Provider>
}

export function useMakeupImageMode() {
  return useContext(MakeupImageModeContext)
}
```

- [ ] **Step 3: Create `components/makeup/makeup-image-mode-button.tsx`**

`components/navbar/image-mode-button.tsx` is not on this branch and is bound to the outfits context — see the note in File Structure. Makeup gets its own.

```tsx
'use client'

import { Compare } from '@mui/icons-material'
import { IconButton, Tooltip } from '@mui/material'

import { useMakeupImageMode } from '@/components/makeup/makeup-image-mode-context'

const IMAGE_MODE_LABEL = {
  image: 'Showing main image',
  alt: 'Showing alternate image',
} as const

// The main/alt image swap for makeup toolbars. Requires a MakeupImageModeProvider
// above it — outside one the context default makes this a no-op rather than throwing.
export default function MakeupImageModeButton() {
  const { mode, cycleMode } = useMakeupImageMode()

  return (
    <Tooltip title={IMAGE_MODE_LABEL[mode]}>
      <IconButton aria-label={IMAGE_MODE_LABEL[mode]} color="inherit" onClick={cycleMode}>
        <Compare />
      </IconButton>
    </Tooltip>
  )
}
```

- [ ] **Step 4: Typecheck**

```bash
yarn tsc --noEmit && yarn lint
```

Expected: clean. If `makeup_image_mode` errors as not existing on `UserPreferences`, Task 1 Step 4 was skipped.

- [ ] **Step 5: Commit**

```bash
git add components/makeup
git commit -m "$(cat <<'EOF'
feat(makeup): add makeup data and image-mode contexts

Mirrors the outfits contexts, minus the axes makeup has no concept of:
no evolution filter, no hide-glow-ups. Preference writes are
fire-and-forget and the reset sends both keys in one call, carrying over
the two fixes recorded in the outfits equivalent.

Adds a makeup-specific image-mode button rather than reusing
components/navbar/image-mode-button.tsx, which is bound to the outfits
context and is not on this branch (it lives in unmerged commit 5dc53709).

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Bootstrap API route

**Files:**

- Create: `app/api/makeup/route.ts`

**Interfaces:**

- Consumes: Task 2's `createMakeupSet(rows, variants, categories, outfitSets)`.
- Produces: `GET /api/makeup` returning
  `{ makeupSets: MakeupSet[]; makeupCategories: MakeupCategory[]; styles: Style[]; labels: Label[]; seasons: Season[]; seasonCategories: SeasonCategory[]; obtainedMakeup?: ObtainedMakeup[] }`.
  `obtainedMakeup` is **absent** for anonymous requests, never `null`.

- [ ] **Step 1: Create the route**

`await connection()` must be the first statement and must sit **outside** the try/catch, so the prerender-abort signal propagates to React instead of being swallowed as a 500.

```ts
import { NextResponse, connection } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { MakeupSetRaw, ObtainedMakeup } from '@/lib/types/makeup'
import { createMakeupSet } from '@/hooks/makeup'
import { getMakeupCategories } from '@/hooks/data/makeup-categories'
import { getMakeupVariants } from '@/hooks/data/makeup-variants'
import { getObtainedMakeup } from '@/hooks/data/obtained-makeup'
import { getStyles } from '@/hooks/data/styles'
import { getLabels } from '@/hooks/data/labels'
import { getSeasons } from '@/hooks/data/seasons'
import { getSeasonCategories } from '@/hooks/data/season-categories'

const SET_COLUMNS = `
  id, slug, title, description, rarity, style, label, seasons, season_category,
  outfit_set, "order", base_set, image_url, alt_image_url, created_at, updated_at
`

export async function GET() {
  // Must precede any cookie read and stay outside the try/catch below: this is
  // what stops PPR from prerendering the route at build time, and the abort
  // signal it raises has to reach React rather than be caught as a 500.
  await connection()

  const supabase = await createClient()

  const [{ data: rows, error }, variants, makeupCategories] = await Promise.all([
    supabase.from('makeup_sets').select(SET_COLUMNS).order('title', { ascending: true }),
    getMakeupVariants(),
    getMakeupCategories(),
  ])

  if (error) {
    console.error('Failed to fetch makeup sets:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Only the sets actually paired with an outfit need resolving.
  const pairedSlugs = [
    ...new Set((rows ?? []).map((r) => r.outfit_set).filter(Boolean)),
  ] as string[]
  const { data: outfitSets } = pairedSlugs.length
    ? await supabase.from('outfit_sets').select('slug, title, image_url').in('slug', pairedSlugs)
    : { data: [] }

  const [styles, labels, seasons, seasonCategories] = await Promise.all([
    getStyles(),
    getLabels(),
    getSeasons(),
    getSeasonCategories(),
  ])

  const makeupSets = createMakeupSet(
    (rows ?? []) as MakeupSetRaw[],
    variants,
    makeupCategories,
    outfitSets ?? []
  )

  const base = { makeupSets, makeupCategories, styles, labels, seasons, seasonCategories }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // getUserID() is null when logged out — never call the user-scoped query with it.
  if (!user) return NextResponse.json(base)

  let obtainedMakeup: ObtainedMakeup[]
  try {
    obtainedMakeup = await getObtainedMakeup(user.id)
  } catch (obtainedError) {
    const message =
      obtainedError instanceof Error ? obtainedError.message : 'Failed to fetch obtained makeup'
    return NextResponse.json({ error: message }, { status: 500 })
  }

  return NextResponse.json({ ...base, obtainedMakeup })
}
```

- [ ] **Step 2: Typecheck and build**

`yarn build` is the real gate here — it is what catches a violated caching boundary.

```bash
yarn tsc --noEmit && yarn lint && yarn build
```

Expected: build succeeds. A failure mentioning prerender/`cookies()` on `/api/makeup` means `await connection()` is misplaced.

- [ ] **Step 3: Manual check**

```bash
yarn dev
```

In a second terminal, logged out:

```bash
curl -s localhost:3000/api/makeup | head -c 400
```

Expected: JSON with a `makeupSets` array and **no** `obtainedMakeup` key. Confirm the standalone bucket sorts last:

```bash
curl -s localhost:3000/api/makeup | npx json -a makeupSets | tail -1
```

(Or inspect in the browser at `localhost:3000/api/makeup`.) Then sign in via the browser and reload the same URL — `obtainedMakeup` should now be present.

- [ ] **Step 4: Commit**

```bash
git add app/api/makeup/route.ts
git commit -m "$(cat <<'EOF'
feat(makeup): add the /api/makeup bootstrap route

Single round-trip payload for the makeup data provider. await connection()
leads and stays outside the try/catch so PPR does not prerender the route
and the abort signal reaches React instead of surfacing as a 500.

Anonymous requests omit obtainedMakeup entirely rather than sending null,
and the user-scoped query is never called with a null user id. Only sets
actually paired with an outfit are resolved.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Data provider, layout, actions, and loading skeleton

**Files:**

- Create: `app/makeup/actions.ts`, `app/makeup/makeup-data-provider.tsx`, `app/makeup/layout.tsx`, `app/makeup/loading.tsx`

**Interfaces:**

- Consumes: Task 3's contexts, Task 4's `/api/makeup`.
- Produces:
  - `handleObtainedMakeup(makeup_set: string, makeup_category: string, makeup_variant: string): Promise<void>`
  - `MakeupDataProvider` (default export) with props `{ isLoggedIn: boolean; isAdmin?: boolean; userId: string | null; children: React.ReactNode }`
  - `MakeupLoading` (default export of `loading.tsx`)

- [ ] **Step 1: Create `app/makeup/actions.ts`**

```ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { getUserID } from '@/hooks/user'

export async function handleObtainedMakeup(
  makeup_set: string,
  makeup_category: string,
  makeup_variant: string
) {
  const user_id = await getUserID()
  if (!user_id) throw new Error('Not authenticated')

  const supabase = await createClient()

  const { error } = await supabase.rpc('toggle_obtained_makeup', {
    p_makeup_set: makeup_set,
    p_makeup_category: makeup_category,
    p_makeup_variant: makeup_variant,
  })

  if (error) {
    console.error('toggle_obtained_makeup failed:', error)
    throw new Error(error.message)
  }
}
```

- [ ] **Step 2: Create `app/makeup/makeup-data-provider.tsx`**

Standalone pieces have `makeup_set === null`, so the toggle payload sends the pseudo-set slug — the RPC deletes by variant alone, so the set value only matters for the insert.

```tsx
'use client'

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import { enqueueSnackbar } from 'notistack'
import { MakeupCategory, MakeupSet, ObtainedMakeup } from '@/lib/types/makeup'
import { Season, SeasonCategory } from '@/lib/types/outfit'
import { Label, Style } from '@/lib/types/eureka'
import { handleObtainedMakeup } from '@/app/makeup/actions'
import { STANDALONE_MAKEUP_SLUG } from '@/hooks/makeup'
import {
  DEFAULT_MAKEUP_FILTERS,
  MakeupDataContext,
  MakeupFilterState,
} from '@/components/makeup/makeup-context'

async function fetchJson<T>(url: string): Promise<T> {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`${url} returned ${r.status}`)
  return r.json()
}

type MakeupPayload = {
  makeupSets: MakeupSet[]
  makeupCategories: MakeupCategory[]
  styles: Style[]
  labels: Label[]
  seasons: Season[]
  seasonCategories: SeasonCategory[]
  obtainedMakeup?: ObtainedMakeup[]
}

export default function MakeupDataProvider({
  isLoggedIn,
  isAdmin = false,
  userId,
  children,
}: {
  isLoggedIn: boolean
  isAdmin?: boolean
  userId: string | null
  children: React.ReactNode
}) {
  const [makeupSets, setMakeupSets] = useState<MakeupSet[]>([])
  const [makeupCategories, setMakeupCategories] = useState<MakeupCategory[]>([])
  const [styles, setStyles] = useState<Style[]>([])
  const [labels, setLabels] = useState<Label[]>([])
  const [seasons, setSeasons] = useState<Season[]>([])
  const [seasonCategories, setSeasonCategories] = useState<SeasonCategory[]>([])
  const [obtainedMakeup, setObtainedMakeup] = useState<ObtainedMakeup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [isObtainedError, setIsObtainedError] = useState(false)
  const [groupBySet, setGroupBySet] = useState(true)
  const [filters, setFilters] = useState<MakeupFilterState>(DEFAULT_MAKEUP_FILTERS)
  const [isFiltering, startFilterTransition] = useTransition()

  useEffect(() => {
    let cancelled = false
    fetchJson<MakeupPayload>('/api/makeup')
      .then((payload) => {
        if (cancelled) return
        setMakeupSets(payload.makeupSets ?? [])
        setMakeupCategories(payload.makeupCategories ?? [])
        setStyles(payload.styles ?? [])
        setLabels(payload.labels ?? [])
        setSeasons(payload.seasons ?? [])
        setSeasonCategories(payload.seasonCategories ?? [])
        setObtainedMakeup(payload.obtainedMakeup ?? [])
        setIsError(false)
      })
      .catch((err) => {
        if (cancelled) return
        console.error('Failed to load makeup data:', err)
        setIsError(true)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const onFiltersChange = useCallback((updates: Partial<MakeupFilterState>) => {
    // Filter axes are session-only by design — no preference write here.
    startFilterTransition(() => {
      setFilters((prev) => ({ ...prev, ...updates }))
    })
  }, [])

  const onClearFilters = useCallback(() => {
    startFilterTransition(() => setFilters(DEFAULT_MAKEUP_FILTERS))
  }, [])

  const onGroupBySetChange = useCallback(() => setGroupBySet((prev) => !prev), [])

  // Optimistic: flip local state first, roll back the same rows on failure.
  const applyToggles = useCallback(
    (
      rows: Array<{ makeup_set: string; makeup_category: string; makeup_variant: string }>,
      targetObtained: boolean
    ) => {
      setObtainedMakeup((prev) => {
        const slugs = new Set(rows.map((r) => r.makeup_variant))
        if (!targetObtained) return prev.filter((o) => !slugs.has(o.makeup_variant))
        const existing = new Set(prev.map((o) => o.makeup_variant))
        const added = rows
          .filter((r) => !existing.has(r.makeup_variant))
          .map((r, i) => ({ id: -1 - i, ...r }) as ObtainedMakeup)
        return [...prev, ...added]
      })
    },
    []
  )

  const onBatchToggleObtained = useCallback(
    (
      rows: Array<{ makeup_set: string; makeup_category: string; makeup_variant: string }>,
      targetObtained: boolean
    ) => {
      if (!isLoggedIn || rows.length === 0) return
      applyToggles(rows, targetObtained)
      Promise.all(
        rows.map((r) => handleObtainedMakeup(r.makeup_set, r.makeup_category, r.makeup_variant))
      ).catch((err) => {
        console.error('Failed to toggle obtained makeup:', err)
        applyToggles(rows, !targetObtained)
        setIsObtainedError(true)
        enqueueSnackbar('Could not save that change', { variant: 'error' })
      })
    },
    [applyToggles, isLoggedIn]
  )

  const onToggleObtained = useCallback(
    (makeup_set: string, makeup_category: string, makeup_variant: string) => {
      const isObtained = obtainedMakeup.some((o) => o.makeup_variant === makeup_variant)
      onBatchToggleObtained(
        // A standalone piece has makeup_set null; send the bucket slug so the
        // insert has a non-null value. The RPC deletes by variant alone.
        [{ makeup_set: makeup_set || STANDALONE_MAKEUP_SLUG, makeup_category, makeup_variant }],
        !isObtained
      )
    },
    [obtainedMakeup, onBatchToggleObtained]
  )

  const value = useMemo(
    () => ({
      makeupSets,
      obtainedMakeup,
      makeupCategories,
      styles,
      labels,
      seasons,
      seasonCategories,
      isLoggedIn,
      isAdmin,
      isLoading,
      isError,
      isObtainedError,
      isFiltering,
      userId,
      groupBySet,
      onGroupBySetChange,
      filters,
      onFiltersChange,
      onClearFilters,
      onToggleObtained,
      onBatchToggleObtained,
    }),
    [
      makeupSets,
      obtainedMakeup,
      makeupCategories,
      styles,
      labels,
      seasons,
      seasonCategories,
      isLoggedIn,
      isAdmin,
      isLoading,
      isError,
      isObtainedError,
      isFiltering,
      userId,
      groupBySet,
      onGroupBySetChange,
      filters,
      onFiltersChange,
      onClearFilters,
      onToggleObtained,
      onBatchToggleObtained,
    ]
  )

  return <MakeupDataContext.Provider value={value}>{children}</MakeupDataContext.Provider>
}
```

- [ ] **Step 3: Create `app/makeup/loading.tsx`**

```tsx
import { Box, Skeleton, Stack } from '@mui/material'
import CardGrid, { CardGridHeader } from '@/components/card-grid'

function GroupSkeleton() {
  return (
    <CardGrid
      columns="outfit"
      header={
        <CardGridHeader
          actions={<Skeleton height={24} variant="rounded" width={60} />}
          title={<Skeleton height={28} variant="text" width={120} />}
        />
      }
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton
          key={i}
          height={0}
          style={{ paddingBottom: '133%' }}
          sx={{ borderRadius: 1 }}
          variant="rectangular"
          width="100%"
        />
      ))}
    </CardGrid>
  )
}

export default function MakeupLoading() {
  return (
    <Box sx={{ flexGrow: 1, py: 3 }}>
      <Stack spacing={4}>
        <GroupSkeleton />
        <GroupSkeleton />
        <GroupSkeleton />
      </Stack>
    </Box>
  )
}
```

- [ ] **Step 4: Create `app/makeup/layout.tsx`**

```tsx
import { Suspense } from 'react'
import { getUserID, getUserRole } from '@/hooks/user'
import MakeupDataProvider from './makeup-data-provider'
import { MakeupImageModeProvider } from '@/components/makeup/makeup-image-mode-context'
import { SortProvider } from '@/components/sort-context'
import MakeupLoading from './loading'

async function MakeupProviders({ children }: { children: React.ReactNode }) {
  const [userId, role] = await Promise.all([getUserID(), getUserRole()])

  return (
    <SortProvider isLoggedIn={!!userId}>
      <MakeupDataProvider isAdmin={role === 'admin'} isLoggedIn={!!userId} userId={userId}>
        <MakeupImageModeProvider isLoggedIn={!!userId}>{children}</MakeupImageModeProvider>
      </MakeupDataProvider>
    </SortProvider>
  )
}

export default function MakeupLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<MakeupLoading />}>
      <MakeupProviders>{children}</MakeupProviders>
    </Suspense>
  )
}
```

- [ ] **Step 5: Verify**

```bash
yarn tsc --noEmit && yarn lint && yarn build
```

Expected: clean. The stub `page.tsx` still renders `ComingSoon` at this point — that is correct; Task 7 replaces it.

- [ ] **Step 6: Commit**

```bash
git add app/makeup/actions.ts app/makeup/makeup-data-provider.tsx app/makeup/layout.tsx app/makeup/loading.tsx
git commit -m "$(cat <<'EOF'
feat(makeup): add the makeup data provider, layout, and toggle action

The provider fetches /api/makeup once on mount and holds collection and
filter state. Toggles are optimistic with a rollback of the same rows on
failure. Filter axes are session-only, so no preference write happens on
a filter change.

A standalone piece has makeup_set null, so its toggle payload substitutes
the bucket slug to satisfy the insert; toggle_obtained_makeup deletes by
variant alone, so the set value only matters when inserting.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Cards and virtual grids

**Files:**

- Create: `app/makeup/deferred-measure-ref.ts`, `app/makeup/makeup-variant-card.tsx`, `app/makeup/makeup-set-card.tsx`, `app/makeup/makeup-group-header.tsx`, `app/makeup/virtual-variant-grid.tsx`, `app/makeup/virtual-set-grid.tsx`, `app/makeup/virtual-grouped-grid.tsx`

**Interfaces:**

- Consumes: Task 3's contexts, Task 2's `STANDALONE_MAKEUP_SLUG` / `isStandaloneMakeupSet`.
- Produces: `MakeupVariantCard`, `MakeupSetCard`, `MakeupGroupHeader`, `VirtualVariantGrid`, `VirtualSetGrid`, `VirtualGroupedGrid` (all default exports), plus re-exported `GAP_PX` and `ESTIMATED_ROW_HEIGHT` from `virtual-variant-grid.tsx`.

**This task is a mechanical port, not a rewrite.** Copy each outfits file, then substitute types. Do not redesign the virtualizer, and do not "improve" the measurement constants — they were derived from measured component paddings and a documented resize race (`2026-07-30-known-issue-standard-grid-flash.md`). Preserve every explanatory comment; they are the reason the constants are trustworthy.

- [ ] **Step 1: Copy the six source files**

```bash
cp app/outfits/deferred-measure-ref.ts   app/makeup/deferred-measure-ref.ts
cp app/outfits/outfit-variant-card.tsx   app/makeup/makeup-variant-card.tsx
cp app/outfits/outfit-set-card.tsx       app/makeup/makeup-set-card.tsx
cp app/outfits/outfit-group-header.tsx   app/makeup/makeup-group-header.tsx
cp app/outfits/virtual-variant-grid.tsx  app/makeup/virtual-variant-grid.tsx
cp app/outfits/virtual-set-grid.tsx      app/makeup/virtual-set-grid.tsx
cp app/outfits/virtual-grouped-grid.tsx  app/makeup/virtual-grouped-grid.tsx
```

`deferred-measure-ref.ts` is domain-agnostic — leave its contents untouched.

- [ ] **Step 2: Apply the substitutions**

In the six `.tsx` files, rename consistently:

| From                                             | To                                              |
| ------------------------------------------------ | ----------------------------------------------- |
| `OutfitSet`                                      | `MakeupSet`                                     |
| `OutfitVariant`                                  | `MakeupVariant`                                 |
| `Evolution`                                      | `MakeupEvolution`                               |
| `outfit_set`                                     | `makeup_set`                                    |
| `outfit_category`                                | `makeup_category`                               |
| `outfit_variants`                                | `makeup_variants`                               |
| `useOutfitData`                                  | `useMakeupData`                                 |
| `useOutfitImageMode`                             | `useMakeupImageMode`                            |
| `resolveOutfitImage`                             | `resolveMakeupImage`                            |
| `OutfitSetCard`                                  | `MakeupSetCard`                                 |
| `OutfitVariantCard`                              | `MakeupVariantCard`                             |
| `OutfitGroupHeader`                              | `MakeupGroupHeader`                             |
| `@/components/outfits/outfit-context`            | `@/components/makeup/makeup-context`            |
| `@/components/outfits/outfit-image-mode-context` | `@/components/makeup/makeup-image-mode-context` |
| `./outfit-set-card`                              | `./makeup-set-card`                             |
| `./outfit-variant-card`                          | `./makeup-variant-card`                         |
| `./outfit-group-header`                          | `./makeup-group-header`                         |
| `/outfits/` (in `href`s)                         | `/makeup/`                                      |

Keep `outfitColumnsForWidth` and `GRID_CONTAINER` imported from `@/lib/types/props` under their existing names — they are shared layout helpers, not outfit domain logic, and renaming them would touch the outfits pages.

- [ ] **Step 3: Remove the glow-up concept from the set card**

`makeup-set-card.tsx` imports `isGlowup` from `@/hooks/outfit`. Makeup has no glow-ups. Delete that import and any `isGlowup(...)` branch, keeping whichever badge/`topLeft` content remains for the non-glow-up case.

- [ ] **Step 4: Make the standalone bucket non-navigable**

In `makeup-set-card.tsx`, a standalone card must not link anywhere (its slug is not in `makeup_sets`). Add the import:

```ts
import { isStandaloneMakeupSet } from '@/hooks/makeup'
```

and layer the gate ON TOP of the source's existing href construction — do not replace it. The `?evolution=` query param must survive, because Task 8's detail page resolves the selected evolution from it; dropping it makes every evolution card deep-link to the base state instead:

```ts
// The standalone bucket is a client-side pseudo-set whose slug is not in
// makeup_sets, so it has no detail route. Pieces are toggled inline instead.
const href = isStandaloneMakeupSet(set)
  ? ''
  : evolution
    ? `/makeup/${evolution.slug.replace('-', '?evolution=')}`
    : `/makeup/${set.slug}?evolution=base`
```

This mirrors `app/outfits/outfit-set-card.tsx:65-67` exactly, with the gate added. Note `virtual-grouped-grid.tsx` builds its header href with the same `replace('-', '?evolution=')` rule but omits `?evolution=base` on the base branch — that asymmetry exists in the outfits source too, so preserve it rather than harmonizing the two (Task 8 treats a missing param and `evolution=base` identically).

- [ ] **Step 5: Typecheck and fix fallout**

```bash
yarn tsc --noEmit && yarn lint
```

Expected: clean after the substitutions. Common residue: a missed `outfit_` field name, or `MakeupVariant.makeup_set` being `string | null` where the outfits code assumed non-null — use `v.makeup_set ?? STANDALONE_MAKEUP_SLUG` at toggle-payload sites rather than a non-null assertion.

- [ ] **Step 6: Commit**

```bash
git add app/makeup
git commit -m "$(cat <<'EOF'
feat(makeup): port the outfit cards and virtual grids to makeup

A mechanical port: types and context imports substituted, layout logic
untouched. The measured row-height constants and the resize-settle
handling are preserved verbatim along with their comments — they encode
the behaviour documented in 2026-07-30-known-issue-standard-grid-flash.md
and are not worth re-deriving.

Two makeup-specific changes: the glow-up branch is dropped (makeup has no
glow-ups), and the standalone bucket renders without an href since its
slug has no detail route.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Filter pipeline, toolbar, results bar, and index page

**Files:**

- Create: `app/makeup/filter-makeup.tsx`, `app/makeup/makeup-toolbar.tsx`, `app/makeup/makeup-results-bar.tsx`
- Modify: `app/makeup/page.tsx` (replace the `ComingSoon` stub)

**Interfaces:**

- Consumes: Tasks 3–6.
- Produces: `FilterMakeup`, `MakeupToolBar` (prop `{ showFilters?: boolean }`), `MakeupResultsBar` (all default exports); `/makeup` renders the live grid.

- [ ] **Step 1: Create `filter-makeup.tsx` by porting `filter-outfits.tsx`**

```bash
cp app/outfits/filter-outfits.tsx app/makeup/filter-makeup.tsx
```

Apply the Task 6 substitution table, then make these makeup-specific changes:

**(a) Replace the outfits standalone constant with the shared one:**

```ts
import { STANDALONE_MAKEUP_SLUG, isStandaloneMakeupSet } from '@/hooks/makeup'
```

Delete any local `const STANDALONE_SLUG = 'standalone_pieces'` — note the outfits value uses an underscore and the makeup value a hyphen, so a copied literal would silently never match.

**(b) Keep the mixed-bag rarity rule.** The bucket has `rarity: 0` and must survive a rarity filter when any _piece_ matches:

```ts
// The standalone bucket has no rarity of its own — keep it when any of its
// pieces match, and show only those pieces.
if (isStandaloneMakeupSet(set)) return set.makeup_variants.some((v) => v.rarity === selectedRarity)
```

**(c) Keep the pin-last rule,** applied **after** sorting, in both directions:

```ts
// The standalone bucket is a catch-all — always last, regardless of sort axis
// or direction. Only one bucket exists, so both-standalone never happens.
if (isStandaloneMakeupSet(a)) return 1
if (isStandaloneMakeupSet(b)) return -1
```

**(d)** Delete the evolution/glow-up filter axes (`selectedEvolution`, `hideEvolutions`, `hideGlowups`) — `MakeupFilterState` has no such fields.

**(e)** Category filtering reads the fixed five-way list from `makeupCategories` in context, not from per-set variants.

- [ ] **Step 2: Create `app/makeup/makeup-toolbar.tsx`**

```tsx
'use client'

import ToolbarSlot from '@/components/navbar/toolbar-slot'
import FilterMenu from '@/components/filter/filter-menu'
import { SortButton } from '@/components/navbar/appbar-actions'
import MakeupImageModeButton from '@/components/makeup/makeup-image-mode-button'

export default function MakeupToolBar({ showFilters = true }: { showFilters?: boolean }) {
  return (
    <ToolbarSlot>
      <MakeupImageModeButton />
      <SortButton />
      {showFilters && <FilterMenu />}
    </ToolbarSlot>
  )
}
```

- [ ] **Step 3: Create `makeup-results-bar.tsx` by porting `outfit-results-bar.tsx`**

```bash
cp app/outfits/outfit-results-bar.tsx app/makeup/makeup-results-bar.tsx
```

Apply the same substitutions and the same standalone rules as Step 1 (it repeats the mixed-bag rarity logic). Drop the evolution and glow-up chips.

- [ ] **Step 4: Replace `app/makeup/page.tsx`**

The `ComingSoon` import goes away entirely.

```tsx
import { Suspense } from 'react'
import { Metadata } from 'next'
import MakeupToolBar from './makeup-toolbar'
import MakeupResultsBar from './makeup-results-bar'
import FilterMakeup from './filter-makeup'
import MakeupLoading from './loading'
import PageShell from '@/components/page-shell'

export const metadata: Metadata = {
  title: 'Makeup',
}

export default function MakeupPage() {
  return (
    <>
      <MakeupToolBar />
      <MakeupResultsBar />
      <PageShell>
        <Suspense fallback={<MakeupLoading />}>
          <FilterMakeup />
        </Suspense>
      </PageShell>
    </>
  )
}
```

- [ ] **Step 5: Verify**

```bash
yarn tsc --noEmit && yarn lint && yarn build
```

- [ ] **Step 6: Manual check**

```bash
yarn dev
```

Visit `localhost:3000/makeup` and confirm, **logged out**:

- the grid renders sets; no toggle controls appear
- the standalone bucket is present and **last**
- no console errors

Then sign in and confirm:

- toggling a variant updates the count immediately
- a hard reload preserves the toggle
- each of the five categories filters correctly
- switching sort axis and direction keeps the standalone bucket last in **both** directions
- sort axis and density survive a reload; filter axes reset

- [ ] **Step 7: Commit**

```bash
git add app/makeup
git commit -m "$(cat <<'EOF'
feat(makeup): build the public makeup index page

Replaces the ComingSoon stub with the filtered, sorted, virtualized grid.

The standalone bucket keeps the two rules it needs to behave: it survives a
rarity filter when any of its pieces match (it has no rarity of its own),
and it pins last after sorting in both directions. Its slug is hyphenated
where the outfits equivalent is underscored, so the constant is imported
rather than repeated.

The evolution and glow-up axes are dropped — makeup has neither — and
category filtering reads the fixed five-way lookup rather than deriving a
per-set subset.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Set detail page

**Files:**

- Create: `app/makeup/[slug]/page.tsx`, `app/makeup/[slug]/makeup-set-detail.tsx`, `app/makeup/[slug]/makeup-set-detail-card.tsx`, `app/makeup/[slug]/makeup-evolution-variants.tsx`, `app/makeup/[slug]/makeup-toggle-bar.tsx`

**Interfaces:**

- Consumes: Tasks 2–7; `getMakeupSet(slug)` from `hooks/data/makeup-sets.ts`.
- Produces: the `/makeup/[slug]` route.

Remember to quote `[slug]` paths in every `git add`.

- [ ] **Step 1: Create `app/makeup/[slug]/page.tsx`**

`getMakeupSet()` returns `MakeupSet | null` — unlike the outfits equivalent, which is non-null — so both `generateMetadata` and the page must handle `null`.

```tsx
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

import { getUserID, getUserRole } from '@/hooks/user'
import { getMakeupSet } from '@/hooks/data/makeup-sets'
import MakeupSetDetail from './makeup-set-detail'

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const makeupSet = await getMakeupSet(slug)

  return { title: makeupSet?.title ?? 'Makeup' }
}

export default async function MakeupSetPage({ params }: Props) {
  const { slug } = await params

  return (
    <Suspense>
      <MakeupSetLoader slug={slug} />
    </Suspense>
  )
}

async function MakeupSetLoader({ slug }: { slug: string }) {
  const [makeupSet, user_id, role] = await Promise.all([
    getMakeupSet(slug),
    getUserID(),
    getUserRole(),
  ])

  // Covers both a bad slug and 'standalone-pieces', which is a client-side
  // pseudo-set with no row in makeup_sets and therefore no detail page.
  if (!makeupSet) notFound()

  return <MakeupSetDetail isAdmin={role === 'admin'} isLoggedIn={!!user_id} makeupSet={makeupSet} />
}
```

- [ ] **Step 2: Port the four detail components**

```bash
cp 'app/outfits/[slug]/outfit-set-detail.tsx'       'app/makeup/[slug]/makeup-set-detail.tsx'
cp 'app/outfits/[slug]/outfit-set-detail-card.tsx'  'app/makeup/[slug]/makeup-set-detail-card.tsx'
cp 'app/outfits/[slug]/outfit-evolution-variants.tsx' 'app/makeup/[slug]/makeup-evolution-variants.tsx'
cp 'app/outfits/[slug]/outfit-toggle-bar.tsx'       'app/makeup/[slug]/makeup-toggle-bar.tsx'
```

Apply the Task 6 substitution table, plus:

- Rename components `OutfitSetDetail` → `MakeupSetDetail`, `OutfitSetDetailCard` → `MakeupSetDetailCard`, `OutfitEvolutionVariants` → `MakeupEvolutionVariants`, `OutfitToggleBar` → `MakeupToggleBar`; the prop `outfitSet` → `makeupSet`.
- Delete the outfits `STANDALONE_SLUG` constant and every `isStandalone` branch. The makeup bucket has no detail page, so this route never renders it — the standalone-only season/season-category filter state goes away with it.
- Drop the carousel entirely. There is no `makeup_set_carousel_images` table; remove `showCarousel` state and any `OutfitCarousel` import (there is no makeup equivalent to copy).
- Keep the evolution `?evolution=` resolution exactly as-is, including the base-state rule:

```ts
// The base state's slug is the bare set slug, so `evolution=base` seeds the set
// slug itself; every other evolution seeds `{set}-{evolution}`.
const resolveEvolutionSlug = () => {
  if (!evolutionParams) return null
  if (evolutionParams === 'base') return makeupSet.slug
  return `${makeupSet.slug}-${evolutionParams}`
}
```

- [ ] **Step 3: Render the paired outfit link in `makeup-set-detail-card.tsx`**

This is the third deferred item from the prior spec. `outfitSet` is populated by Task 2; render a link when present:

```tsx
{
  makeupSet.outfitSet && (
    <Button
      component={Link}
      href={`/outfits/${makeupSet.outfitSet.slug}`}
      size="small"
      variant="outlined"
    >
      {makeupSet.outfitSet.title}
    </Button>
  )
}
```

Import `Link` from `next/link` and `Button` from `@mui/material`. Place it near the set's title/description block.

- [ ] **Step 4: Verify**

```bash
yarn tsc --noEmit && yarn lint && yarn build
```

- [ ] **Step 5: Manual check**

With `yarn dev` running:

- click a set from `/makeup` → its detail page renders
- a set with evolutions shows the toggle bar; selecting one swaps the variants
- `‌/makeup/<slug>?evolution=base` selects the base state; `?evolution=<name>` selects that evolution
- a set with a paired outfit shows a link that navigates to `/outfits/<slug>`
- `/makeup/standalone-pieces` returns 404 (expected — it is a pseudo-set)
- `/makeup/not-a-real-slug` returns 404
- logged out: no toggles; logged in: toggling persists across reload

- [ ] **Step 6: Commit**

```bash
git add 'app/makeup/[slug]'
git commit -m "$(cat <<'EOF'
feat(makeup): add the makeup set detail page

Ports the outfits detail view: evolution selection via ?evolution=, with
the base state seeded by the bare set slug.

Three deletions relative to the source: no carousel (makeup has no
carousel-images table), no standalone branch (the bucket is a pseudo-set
with no detail route), and no glow-up handling.

getMakeupSet returns MakeupSet | null where the outfits equivalent is
non-null, so the route calls notFound() — which is also what makes
/makeup/standalone-pieces 404 by construction.

Renders the paired outfit link, closing the last item deferred by
2026-08-02-makeup-tables-design.md.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Final verification and PR update

**Files:** none created; may touch any file to fix fallout.

- [ ] **Step 1: Full clean verification**

```bash
yarn tsc --noEmit && yarn lint && yarn build
```

All three must pass. Do not proceed with failures outstanding.

- [ ] **Step 2: Confirm no stray outfit references leaked into the makeup tree**

```bash
grep -rn "outfit" app/makeup components/makeup | grep -vi "outfitSet\|outfit_set\|/outfits/\|outfitColumnsForWidth\|OutfitSetRef"
```

Expected: no output. The excluded terms are legitimate — the paired-outfit link, its FK column, and the shared column helper.

- [ ] **Step 3: Confirm the spec's checklist**

Walk the spec's Verification section end to end and confirm each item, logged out and logged in. Record any deviation rather than silently fixing it in a way that contradicts the spec.

- [ ] **Step 4: Mark the PR ready**

```bash
gh pr ready 312
gh pr view 312 --json title,isDraft
```

- [ ] **Step 5: Update the PR description**

The current body says "spec only — no implementation yet". Replace that framing with what actually shipped, what was verified (typecheck, lint, build, manual pass — no automated tests, since the repo has none), and the two divergences reviewers should look at. Do not claim test coverage.

```bash
gh pr edit 312 --body "$(cat <<'EOF'
<updated description — see Step 5 guidance>
EOF
)"
```

- [ ] **Step 6: Push**

```bash
git push
```

Confirm PR #312 is **not** already merged before pushing — the tracked `pre-push` hook blocks pushes to a merged branch, and a late push would strand commits outside `main`.

---

## Self-Review

**Spec coverage** — every spec section maps to a task:

| Spec section                             | Task                       |
| ---------------------------------------- | -------------------------- |
| Preferences (3 columns, lockstep)        | 1                          |
| Standalone pieces pseudo-set             | 2, 6, 7                    |
| Categories are universal                 | 2, 7                       |
| Outfit association (`outfitSet`)         | 2, 8                       |
| `/api/makeup` bootstrap + `connection()` | 4                          |
| Provider / context / layout              | 3, 5                       |
| Toggling via RPC                         | 5                          |
| Grids and cards (copy-adapt)             | 6                          |
| Index page                               | 7                          |
| Detail page + `?evolution=`              | 8                          |
| Verification                             | every task; 9 consolidates |

**Corrections made to the spec during planning:**

1. The preference lockstep is **six** sites, not five — `app/api/preferences/route.ts` holds two independent lists, both failing silently when missed. Task 1 enumerates all six.
2. `components/navbar/image-mode-button.tsx` is **not on this branch** (it lives in unmerged commit `5dc53709` and is bound to the outfits context). Task 3 creates a makeup-specific button instead of depending on that branch.
3. The spec did not mention that `getMakeupSet()` returns `MakeupSet | null` while the outfits equivalent is non-null. Task 8 handles it with `notFound()`, which is also what makes `/makeup/standalone-pieces` 404 for free.
4. The outfits standalone slug is `standalone_pieces` (underscore); makeup's is `standalone-pieces` (hyphen). A copied literal would silently never match, so Task 7 imports the constant.
5. There is **no `tsx` binary** in `node_modules/.bin`, so Task 2's verification script runs under `node --experimental-strip-types` (Node 25 is installed) rather than adding a dev dependency for a throwaway check.

**Placeholder scan:** no TBD/TODO/"handle edge cases"/"similar to Task N" remain. Every code step carries real content.

**Type consistency:** `STANDALONE_MAKEUP_SLUG`, `isStandaloneMakeupSet`, `OutfitSetRef`, `createMakeupSet`'s 4-arg signature, `MakeupFilterState`'s exact fields, `resolveMakeupImage`, and `handleObtainedMakeup`'s parameter order are defined once and used identically downstream.

**Known limitation:** verification is typecheck + lint + build + manual checks. The repo has no test framework, so no task claims automated coverage — and no task instructs writing tests that could not be run.
