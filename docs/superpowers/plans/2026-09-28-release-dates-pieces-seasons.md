# Release Dates, Pieces Wording, Eureka + Cloaks on Seasons: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every collectable a release date and version (owned by seasons and trials, with overrides on individual rows) and sort the "date" axis by it. Put eureka sets and Momo's Cloaks on the season pages. Call outfit and makeup variants "pieces" in the UI.

**Architecture:** Nullable `released_at date` / `version text` columns go on seasons and trials (the sources) and on every set, piece and cloak table (the overrides). One pure module, `hooks/release.ts`, resolves the inheritance chain and supplies the comparator. Nothing is materialized: the data hooks embed each row's season (or trials) and the comparators resolve on the client. Season pages gain two `SeasonEntry` kinds (`eureka` and `momo-cloak`). Cloaks are filtered out before any counting.

**Tech Stack:** Next.js 16 App Router, Supabase (Postgres + PostgREST), MUI v7 + `@mui/x-data-grid` v9, Vitest, Yarn 4.

**Spec:** `docs/superpowers/specs/2026-09-28-release-dates-pieces-seasons-design.md`

## Global Constraints

- Package manager is **Yarn**. Type-check with `yarn tsc --noEmit`, test with `yarn test`, lint with `yarn lint`.
- Prettier: no semicolons, single quotes, 2-space indent, 100-char width, ES5 trailing commas. The PostToolUse hook formats each edited file.
- Quote paths containing `[slug]` in shell commands: `git add 'app/seasons/[slug]/page.tsx'`.
- `release` comes from one resolver only. Never inline a `?? season.released_at` chain anywhere else; call `resolveRelease` / `earliestRelease`.
- The date axis sorts rows with no resolved date **last in both directions**. Ties break by version (same direction), then by `id` ascending.
- Eureka on season pages counts **1 per set**, and a set counts as obtained only when every variant is obtained.
- Cloaks on season pages count toward **nothing**: not the season total, progress bar, category chip, composition chip, sidebar count or index row.
- A cloak with no `season_category` goes in the `"Momo's Cloaks"` bucket, never in `"Other"`.
- The data hooks keep `.order('id')`. Pagination in `hooks/data/outfit-variants.ts` depends on it.
- Adding a `user_preferences` column takes **five** edits: `WRITABLE_KEYS` and `PREFERENCE_COLUMNS` in `app/api/preferences/route.ts`, `DEFAULT_PREFERENCES` in `lib/preferences.ts`, `UserPreferences` in `lib/types/eureka.ts`, and the select string in `hooks/data/preferences.ts`.
- The rename touches **UI text only**. It never changes DB names, TS identifiers, file names, `formId`s or admin URLs, and never touches eureka wording.
- Apply migrations with `supabase db push`, not the MCP `apply_migration` / dashboard, which desyncs migration history. Regenerate types afterwards.
- Branch: `feat/release-dates-pieces-seasons`, with one PR per phase (see Delivery). Never push to a branch whose PR has already merged. Branch phase N+1 off `main` after phase N merges, or stack the PRs and wait to merge.

## Review Focus

1. **Same date, different versions:** two seasons share a `released_at` but have versions `1.9` and `1.10`. Expected: `1.10` sorts as newer under desc, so the versions compare numerically, not as strings. The test is in Task 2.
2. **Version override without a date:** a piece sets only `version` and leaves `released_at` blank. Expected: the version comes from the piece and the date is inherited from the season, because the two resolve independently. The test is in Task 2.
3. **Eureka set whose trials have no dates yet**, the state right after migration. Expected: `release` is `{ null, null }`, the set sorts last, and nothing throws. The test is in Task 2 (`earliestRelease([])`).
4. **Season page whose only content is cloaks**, such as a season where every outfit is hidden by the toggles. Expected: the categories render, the progress header shows `0/0` → no chip, and the index row total stays 0. The test is in Task 7 ("yields 0/0 for a category holding only cloaks").
5. **Migration replayed on an empty Supabase preview DB.** Expected: the 27/13 assertion is skipped because there are no eureka rows, so the Supabase Preview check stays green. This is guarded in the Task 1 SQL (only asserts when the table holds exactly 40 rows).

---

## File Structure

| File                                                                            | Responsibility                                                                                            |
| ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `supabase/migrations/20260928000000_release_dates_and_eureka_seasons.sql` (new) | Columns, FK, preference columns, eureka backfill + assertion                                              |
| `hooks/release.ts` (new)                                                        | `Release` type, `resolveRelease`, `earliestRelease`, `compareVersions`, `compareRelease`, `formatRelease` |
| `hooks/__tests__/release.test.ts` (new)                                         | Unit tests for the above                                                                                  |
| `lib/release-form.ts` (new)                                                     | `readReleaseFields(formData)`, the server-action parser                                                   |
| `lib/__tests__/release-form.test.ts` (new)                                      | Parser tests                                                                                              |
| `components/forms/release-fields.tsx` (new)                                     | Date + version inputs with the inherited-value helper text                                                |
| `hooks/data/admin/inherited-release.ts` (new)                                   | What an override field falls back to, for the admin edit pages                                            |
| `components/release-line.tsx` (new)                                             | The "Released v1.5 · Apr 29, 2025" line                                                                   |
| `app/momo-cloaks/load-cloak-data.ts` (new)                                      | Server loader shared by the `/momo-cloaks` and `/seasons` layouts                                         |
| `app/seasons/[slug]/season-entries.ts`                                          | New entry kinds, `release` on entries, cloak-free counters                                                |
| `app/seasons/[slug]/__tests__/season-entries-eureka-cloaks.test.ts` (new)       | Eureka / cloak grouping and counting tests                                                                |

---

## Phase 1 (PR 1): Release data

### Task 1: Migration and type regeneration

**Files:**

- Create: `supabase/migrations/20260928000000_release_dates_and_eureka_seasons.sql`
- Modify: `lib/types/supabase.ts` (regenerated, never hand-edited)

**Interfaces:**

- Produces: columns `released_at: string | null`, `version: string | null` on `seasons`, `trials`, `outfit_sets`, `outfit_variants`, `makeup_sets`, `makeup_variants`, `eureka_sets`, `momo_cloaks`; `eureka_sets.seasons: string | null`; `user_preferences.season_hide_eureka: boolean`, `season_hide_cloaks: boolean`.

- [ ] **Step 1: Write the migration**

```sql
-- Release date + version for every collectable.
--
-- seasons and trials are the SOURCES: most rows inherit from their season, and
-- a eureka set inherits from the earliest trial it drops from. Every other
-- table's pair is an optional OVERRIDE for a mid-season release or a rerun.
-- Nothing is materialized; hooks/release.ts resolves the chain at read time,
-- so editing a season's date moves everything beneath it.
alter table public.seasons
  add column if not exists released_at date,
  add column if not exists version text;
alter table public.trials
  add column if not exists released_at date,
  add column if not exists version text;
alter table public.outfit_sets
  add column if not exists released_at date,
  add column if not exists version text;
alter table public.outfit_variants
  add column if not exists released_at date,
  add column if not exists version text;
alter table public.makeup_sets
  add column if not exists released_at date,
  add column if not exists version text;
alter table public.makeup_variants
  add column if not exists released_at date,
  add column if not exists version text;
alter table public.eureka_sets
  add column if not exists released_at date,
  add column if not exists version text;
alter table public.momo_cloaks
  add column if not exists released_at date,
  add column if not exists version text;

-- Which season page lists a eureka set (under the eureka_collection category).
alter table public.eureka_sets
  add column if not exists seasons text
    references public.seasons (slug) on update cascade on delete set null;
create index if not exists eureka_sets_seasons_idx on public.eureka_sets (seasons);

alter table public.user_preferences
  add column if not exists season_hide_eureka boolean not null default false,
  add column if not exists season_hide_cloaks boolean not null default false;

-- Backfill: a set's region is the location of the EARLIEST trial it drops from
-- (by trial id — trials have no dates yet), so the ten sets shared between
-- Wishfield and Itzaland trials resolve to Wishfield. Each region's first
-- season is where its eureka sets are listed.
with first_trial as (
  select distinct on (st.eureka_set) st.eureka_set, t.location
  from public.eureka_set_trials st
  join public.trials t on t.slug = st.trial
  order by st.eureka_set, t.id
)
update public.eureka_sets s
set seasons = case ft.location
  when 'wishfield' then 'exploration_season'
  when 'itzaland' then 'terras_call'
end
from first_trial ft
where ft.eureka_set = s.slug
  and s.seasons is null;

-- Not obtained from any trial, so placed by hand.
update public.eureka_sets set seasons = 'exploration_season'
  where slug = 'moon_laurel_rabbit' and seasons is null;
update public.eureka_sets set seasons = 'terras_call'
  where slug = 'essence_of_tears' and seasons is null;

-- Guard the known production shape (27 Wishfield / 13 Itzaland). Skipped on any
-- other row count so replaying migrations into an empty preview branch passes.
do $$
declare
  total int;
  wishfield int;
  itzaland int;
begin
  select count(*),
         count(*) filter (where seasons = 'exploration_season'),
         count(*) filter (where seasons = 'terras_call')
    into total, wishfield, itzaland
    from public.eureka_sets;
  if total = 40 and (wishfield <> 27 or itzaland <> 13) then
    raise exception 'eureka season backfill: expected 27/13, got %/%', wishfield, itzaland;
  end if;
end $$;
```

- [ ] **Step 2: Push the migration**

Run: `supabase db push`
Expected: `Applying migration 20260928000000_release_dates_and_eureka_seasons.sql... Finished supabase db push.` If it complains that local migrations predate remote ones, rerun with `--include-all`.

- [ ] **Step 3: Verify the backfill in the DB**

Run this via the Supabase MCP `execute_sql` (read-only) or the SQL editor:

```sql
select seasons, count(*) from eureka_sets group by 1 order by 1;
```

Expected: `exploration_season | 27`, `terras_call | 13`, no null row.

- [ ] **Step 4: Regenerate types**

Run: `supabase gen types typescript --project-id $(cat supabase/.temp/project-ref) > lib/types/supabase.ts`
Then run `yarn tsc --noEmit`. Expected: exit 0. The new columns are all nullable, so no existing code breaks.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260928000000_release_dates_and_eureka_seasons.sql lib/types/supabase.ts
git commit -m "feat(db): release date/version columns and eureka_sets.seasons backfill"
```

---

### Task 2: `hooks/release.ts` (resolver, comparator, formatter)

**Files:**

- Create: `hooks/release.ts`
- Test: `hooks/__tests__/release.test.ts`

**Interfaces:**

- Consumes: `SortDir` from `@/components/sort-context`.
- Produces:
  - `type Release = { released_at: string | null; version: string | null }`
  - `type ReleaseSource = { released_at?: string | null; version?: string | null } | null | undefined`
  - `resolveRelease(...sources: ReleaseSource[]): Release`
  - `earliestRelease(sources: ReleaseSource[]): Release`
  - `compareVersions(a: string, b: string): number`
  - `compareRelease(a: Release, b: Release, dir: SortDir): number`
  - `formatRelease(release: Release): string | null`

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from 'vitest'
import {
  compareRelease,
  compareVersions,
  earliestRelease,
  formatRelease,
  resolveRelease,
  type Release,
} from '../release'

const r = (released_at: string | null, version: string | null): Release => ({
  released_at,
  version,
})

describe('resolveRelease', () => {
  it('takes the first non-null value along the chain', () => {
    expect(resolveRelease(null, r(null, null), r('2025-04-29', '1.5'))).toEqual(
      r('2025-04-29', '1.5')
    )
  })

  it('resolves date and version independently', () => {
    const piece = { version: '1.5.5', released_at: null }
    const season = r('2025-04-29', '1.5')
    expect(resolveRelease(piece, season)).toEqual(r('2025-04-29', '1.5.5'))
  })

  it('returns nulls when nothing is set', () => {
    expect(resolveRelease(undefined, null)).toEqual(r(null, null))
  })
})

describe('earliestRelease', () => {
  it('picks the earliest dated source and carries its version', () => {
    expect(
      earliestRelease([r('2025-06-01', '1.6'), r('2024-12-05', '1.0'), r(null, '9.9')])
    ).toEqual(r('2024-12-05', '1.0'))
  })

  it('falls back to the first version when no source is dated', () => {
    expect(earliestRelease([r(null, null), r(null, '2.0')])).toEqual(r(null, '2.0'))
  })

  it('is empty for no sources', () => {
    expect(earliestRelease([])).toEqual(r(null, null))
  })
})

describe('compareVersions', () => {
  it('compares numerically, segment by segment', () => {
    expect(compareVersions('1.10', '1.9')).toBeGreaterThan(0)
    expect(compareVersions('2.0', '1.11')).toBeGreaterThan(0)
    expect(compareVersions('1.5', '1.5.0')).toBe(0)
  })
})

describe('compareRelease', () => {
  const sort = (items: Release[], dir: 'asc' | 'desc') =>
    [...items].sort((a, b) => compareRelease(a, b, dir))

  const early = r('2024-12-05', '1.0')
  const late = r('2025-04-29', '1.5')
  const none = r(null, null)

  it('orders by date in the chosen direction', () => {
    expect(sort([early, late], 'desc')).toEqual([late, early])
    expect(sort([late, early], 'asc')).toEqual([early, late])
  })

  it('sorts undated rows last in BOTH directions', () => {
    expect(sort([none, early, late], 'desc').at(-1)).toBe(none)
    expect(sort([none, early, late], 'asc').at(-1)).toBe(none)
  })

  it('breaks a same-day tie on version, numerically', () => {
    const a = r('2025-04-29', '1.9')
    const b = r('2025-04-29', '1.10')
    expect(sort([a, b], 'desc')).toEqual([b, a])
  })

  it('returns 0 for identical releases so the caller can tie-break on id', () => {
    expect(compareRelease(late, r('2025-04-29', '1.5'), 'desc')).toBe(0)
  })
})

describe('formatRelease', () => {
  it('formats version and date', () => {
    expect(formatRelease(r('2025-04-29', '1.5'))).toBe('v1.5 · Apr 29, 2025')
  })
  it('formats either half alone', () => {
    expect(formatRelease(r(null, '1.5'))).toBe('v1.5')
    expect(formatRelease(r('2025-04-29', null))).toBe('Apr 29, 2025')
  })
  it('is null when empty', () => {
    expect(formatRelease(r(null, null))).toBeNull()
  })
})
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `yarn test hooks/__tests__/release.test.ts`
Expected: FAIL, `Failed to resolve import "../release"`.

- [ ] **Step 3: Implement**

```ts
import type { SortDir } from '@/components/sort-context'

// A collectable's release, resolved. Seasons and trials own the real values;
// every set, piece and cloak carries an optional override. Both halves resolve
// independently, so a piece can override only its version (a x.5 mid-season
// drop) and still inherit its season's date.
export type Release = { released_at: string | null; version: string | null }

export type ReleaseSource =
  | { released_at?: string | null; version?: string | null }
  | null
  | undefined

export const NO_RELEASE: Release = { released_at: null, version: null }

/** First non-null value along the chain, most specific source first. */
export function resolveRelease(...sources: ReleaseSource[]): Release {
  let released_at: string | null = null
  let version: string | null = null
  for (const source of sources) {
    if (!source) continue
    released_at ??= source.released_at ?? null
    version ??= source.version ?? null
  }
  return { released_at, version }
}

/**
 * The release of the earliest dated source, version included — a eureka set
 * dates from the first trial it dropped from. With no dated source, falls back
 * to the first version present so a version-only trial still labels the set.
 */
export function earliestRelease(sources: ReleaseSource[]): Release {
  let best: Release | null = null
  for (const source of sources) {
    if (!source?.released_at) continue
    if (!best || source.released_at < best.released_at!) {
      best = { released_at: source.released_at, version: source.version ?? null }
    }
  }
  if (best) return best
  return { released_at: null, version: sources.find((s) => s?.version)?.version ?? null }
}

/** `1.10` > `1.9`; missing segments count as 0, so `1.5` == `1.5.0`. */
export function compareVersions(a: string, b: string): number {
  const pa = a.split('.')
  const pb = b.split('.')
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] ?? '0'
    const y = pb[i] ?? '0'
    const nx = Number(x)
    const ny = Number(y)
    const cmp = Number.isNaN(nx) || Number.isNaN(ny) ? x.localeCompare(y) : nx - ny
    if (cmp !== 0) return cmp
  }
  return 0
}

function nullsLast<T>(a: T | null, b: T | null, cmp: (x: T, y: T) => number, dir: SortDir) {
  if (a === null && b === null) return 0
  if (a === null) return 1
  if (b === null) return -1
  const result = cmp(a, b)
  return dir === 'asc' ? result : -result
}

/**
 * The date axis comparator. Date first, then version, both in `dir`; unknown
 * values sort last whichever way the list runs, so gaps in the data never float
 * to the top. Returns 0 on a full tie — callers append `|| a.id - b.id`.
 */
export function compareRelease(a: Release, b: Release, dir: SortDir): number {
  return (
    nullsLast(a.released_at, b.released_at, (x, y) => (x < y ? -1 : x > y ? 1 : 0), dir) ||
    nullsLast(a.version, b.version, compareVersions, dir)
  )
}

/** "v1.5 · Apr 29, 2025", either half alone, or null when nothing is known. */
export function formatRelease({ released_at, version }: Release): string | null {
  const date = released_at
    ? new Date(`${released_at}T00:00:00Z`).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC',
      })
    : null
  const parts = [version ? `v${version}` : null, date].filter(Boolean)
  return parts.length ? parts.join(' · ') : null
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `yarn test hooks/__tests__/release.test.ts`
Expected: PASS, 14 tests.

- [ ] **Step 5: Commit**

```bash
git add hooks/release.ts hooks/__tests__/release.test.ts
git commit -m "feat(release): release resolver, comparator and formatter"
```

---

### Task 3: Data hooks and types carry release fields

**Files:**

- Modify: `hooks/data/seasons.ts:11`, `hooks/data/admin/seasons.ts:21,32`, `hooks/data/trials.ts:11,22`
- Modify: `hooks/data/outfit-sets.ts:25-45` (list select) and the single-set select below it
- Modify: `hooks/data/evolutions.ts:8-17` (`EVOLUTION_SELECT`)
- Modify: `hooks/data/outfit-variants.ts:6` (`PUBLIC_VARIANT_SELECT`)
- Modify: `hooks/data/makeup-sets.ts:12` (`SET_COLUMNS`), `hooks/data/makeup-variants.ts:14`
- Modify: `hooks/makeup.ts:172` (the `season` object) and the `seasonTitleBySlug` map above it
- Modify: `hooks/data/momo-cloaks.ts:5-33`
- Modify: `hooks/data/eureka-sets.ts:18-45` and the single-set query near line 110
- Modify: `lib/types/outfit.ts:124`, `lib/types/makeup.ts:55`, `lib/types/momo.ts:25`, `lib/types/eureka.ts:5-11`

**Interfaces:**

- Consumes: `resolveRelease`, `earliestRelease`, `Release` (Task 2).
- Produces:
  - `OutfitSet.season: { title: string; released_at: string | null; version: string | null } | null`, and the same shape on `MakeupSet.season` and `MomoCloak.season`.
  - `EurekaSet.release: Release`, the fully resolved release (override → earliest trial).
  - `EurekaSet.seasons: string | null` (from the generated types).
  - `Season`, `Trial`, `OutfitVariant`, `MakeupVariant` rows now include `released_at`, `version`.

- [ ] **Step 1: Widen the season-embed type in all three places**

In `lib/types/outfit.ts`, add this exported type and use it for `OutfitSet.season`:

```ts
// A row's season as the data hooks embed it: the title for display plus the
// release fields hooks/release.ts inherits from.
export type EmbeddedSeason = { title: string; released_at: string | null; version: string | null }
```

Change `season: { title: string } | null` → `season: EmbeddedSeason | null` in `lib/types/outfit.ts:124`, `lib/types/makeup.ts:55` and `lib/types/momo.ts:25` (keeping `?:` on momo). Import `EmbeddedSeason` from `@/lib/types/outfit`.

In `lib/types/eureka.ts`, add `release: Release` to `EurekaSet` (import `Release` from `@/hooks/release`).

- [ ] **Step 2: Add the columns to every select**

- `hooks/data/seasons.ts` and both selects in `hooks/data/admin/seasons.ts`: append `, released_at, version`.
- Both selects in `hooks/data/trials.ts`: append `, released_at, version`.
- `hooks/data/outfit-sets.ts` (both selects): add `released_at, version,` to the column list and change the embed to `season:seasons!outfit_sets_seasons_fkey ( title, released_at, version ),`.
- `hooks/data/evolutions.ts` `EVOLUTION_SELECT`: add `released_at, version` after `updated_at`, and change the season embed the same way.
- `hooks/data/outfit-variants.ts` `PUBLIC_VARIANT_SELECT`: append `, released_at, version`.
- `hooks/data/makeup-sets.ts` `SET_COLUMNS` and `hooks/data/makeup-variants.ts`: add `released_at, version`.
- `hooks/data/momo-cloaks.ts`: add `released_at, version,` and `season:seasons!momo_cloaks_seasons_fkey ( title, released_at, version )` to `CLOAK_COLUMNS`. Delete the now-duplicate `season:` line from `CLOAK_DETAIL_COLUMNS`, since a repeated alias is a PostgREST error.

- [ ] **Step 3: Carry release through the makeup season lookup**

In `hooks/makeup.ts`, replace the `seasonTitleBySlug` map with:

```ts
const seasonBySlug = new Map(seasons.map((s) => [s.slug, s]))
```

and the `season:` property with:

```ts
season: row.seasons
  ? {
      title: seasonBySlug.get(row.seasons)?.title ?? row.seasons,
      released_at: seasonBySlug.get(row.seasons)?.released_at ?? null,
      version: seasonBySlug.get(row.seasons)?.version ?? null,
    }
  : null,
```

- [ ] **Step 4: Resolve eureka set release in the hook**

In `hooks/data/eureka-sets.ts`, add `released_at, version, seasons,` to both set selects. Change the trials embed to `eureka_set_trials ( trial, trials ( released_at, version ) )`. If PostgREST reports an ambiguous relationship, use `trials!eureka_set_trials_trial_fkey ( released_at, version )`. Where each set is returned, add:

```ts
release: resolveRelease(
  eurekaSet,
  earliestRelease(eurekaSet.eureka_set_trials.map((link) => link.trials))
),
```

Import from `../release`. If the generated type of `link.trials` is an array, which PostgREST uses for some embeds, pass `firstLinked(link.trials)` using the existing `firstLinked` helper in `lib/types/outfit.ts`.

- [ ] **Step 5: Type-check and run the whole suite**

Run: `yarn tsc --noEmit && yarn test`
Expected: tsc exits 0 and all tests pass. Fix any fixture that builds a `season: { title }` literal by adding `released_at: null, version: null`.

- [ ] **Step 6: Smoke-test the API payloads**

Run `yarn dev`, then `curl -s localhost:3000/api/eureka/bootstrap | head -c 600`.
Expected: the sets include `"seasons":"exploration_season"` and `"release":{"released_at":null,"version":null}`.

- [ ] **Step 7: Commit**

```bash
git add hooks lib/types
git commit -m "feat(release): load release fields and resolve eureka set release"
```

---

### Task 4: Admin forms for release data

**Files:**

- Create: `lib/release-form.ts`, `lib/__tests__/release-form.test.ts`
- Create: `components/forms/release-fields.tsx`
- Create: `hooks/data/admin/inherited-release.ts`
- Modify: `lib/types/form-fields.ts` (add `DateField`), `app/admin/entity-form.tsx` (render it), `app/admin/build-fields.ts` (`BuilderData.inheritedRelease`)
- Modify: `app/admin/outfits/seasons/fields.ts`, `app/admin/outfits/seasons/new/actions.ts`, `app/admin/outfits/seasons/edit/[slug]/actions.ts`, `app/admin/outfits/seasons/outfit-season-table.tsx`
- Modify: `app/admin/eureka/trials/fields.ts`, `app/admin/eureka/trials/actions.ts`, `app/admin/eureka/trials/trial-table.tsx`, `app/admin/actions.ts` (`updateTrial`)
- Modify: `app/admin/outfits/variants/fields.tsx`, `app/admin/outfits/variants/actions.ts`, and the `edit/[slug]/page.tsx` of outfit variants
- Modify: `app/admin/makeup/variants/fields.ts*`, `app/admin/makeup/variants/actions.ts`, and the `edit/[slug]/page.tsx` of makeup variants
- Modify: the bespoke forms and their actions: `app/admin/outfits/sets/{new/add,edit/[slug]/edit}-outfit-set-form.tsx` + `app/admin/outfits/sets/actions.ts`; `app/admin/outfits/evolutions/edit/[slug]/edit-evolution-form.tsx` + `actions.ts`; `app/admin/makeup/sets/{new/add,edit/[slug]/edit}-makeup-set-form.tsx` + `actions.ts`; `app/admin/eureka/sets/{new/add,edit/[slug]/edit}-eureka-set-form.tsx` + `actions.ts`; `app/admin/momo-cloaks/{new/add,edit/[slug]/edit}-momo-cloak-form.tsx` + `actions.ts`; plus each edit `page.tsx` that renders them

**Interfaces:**

- Consumes: `Release`, `resolveRelease`, `earliestRelease`, `formatRelease` (Task 2).
- Produces:
  - `readReleaseFields(formData: FormData): { released_at: string | null; version: string | null }`
  - `<ReleaseFields defaultReleasedAt?: string | null; defaultVersion?: string | null; inherited?: Release | null />`, which renders inputs named `released_at` and `version`
  - `getInheritedRelease(kind: InheritedKind, slug: string): Promise<Release | null>`, where `type InheritedKind = 'outfitSet' | 'evolution' | 'outfitVariant' | 'makeupSet' | 'makeupVariant' | 'eurekaSet' | 'momoCloak'`
  - the `FieldConfig` union gains `{ type: 'date'; name; label?; helperText? }`
  - `BuilderData.inheritedRelease?: Release | null`

- [ ] **Step 1: Write the failing parser test**

```ts
import { describe, expect, it } from 'vitest'
import { readReleaseFields } from '../release-form'

const fd = (entries: Record<string, string>) => {
  const data = new FormData()
  for (const [k, v] of Object.entries(entries)) data.set(k, v)
  return data
}

describe('readReleaseFields', () => {
  it('reads a date and a trimmed version', () => {
    expect(readReleaseFields(fd({ released_at: '2025-04-29', version: ' 1.5 ' }))).toEqual({
      released_at: '2025-04-29',
      version: '1.5',
    })
  })

  it('stores blanks as null so the row inherits', () => {
    expect(readReleaseFields(fd({ released_at: '', version: '  ' }))).toEqual({
      released_at: null,
      version: null,
    })
  })

  it('rejects a malformed date rather than sending it to Postgres', () => {
    expect(readReleaseFields(fd({ released_at: '29/04/2025' })).released_at).toBeNull()
  })

  it('treats absent keys as null', () => {
    expect(readReleaseFields(new FormData())).toEqual({ released_at: null, version: null })
  })
})
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `yarn test lib/__tests__/release-form.test.ts`
Expected: FAIL, import not found.

- [ ] **Step 3: Implement the parser**

```ts
// The two release inputs every admin form shares. Blank means "inherit", which
// the DB stores as null; a date must already be ISO (what <input type="date">
// submits) so a hand-typed value can never reach Postgres as a cast error.
export function readReleaseFields(formData: FormData) {
  const date = ((formData.get('released_at') as string | null) ?? '').trim()
  const version = ((formData.get('version') as string | null) ?? '').trim()
  return {
    released_at: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null,
    version: version || null,
  }
}
```

Run: `yarn test lib/__tests__/release-form.test.ts`
Expected: PASS.

- [ ] **Step 4: Add the shared input component**

`components/forms/release-fields.tsx`:

```tsx
'use client'

import { Stack, TextField } from '@mui/material'
import { formatRelease, type Release } from '@/hooks/release'

// The two release inputs, side by side. `inherited` is what a blank field falls
// back to; showing it makes an empty override read as a choice, not a gap.
// Omit it on seasons and trials, which are the sources themselves.
export default function ReleaseFields({
  defaultReleasedAt,
  defaultVersion,
  inherited,
}: {
  defaultReleasedAt?: string | null
  defaultVersion?: string | null
  inherited?: Release | null
}) {
  const inheritedText = inherited ? formatRelease(inherited) : null
  const helperText =
    inherited === undefined
      ? undefined
      : inheritedText
        ? `Blank inherits ${inheritedText}`
        : 'Blank inherits from its season'

  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
      <TextField
        defaultValue={defaultReleasedAt ?? ''}
        fullWidth
        helperText={helperText}
        label="Released"
        name="released_at"
        slotProps={{ inputLabel: { shrink: true } }}
        type="date"
      />
      <TextField
        defaultValue={defaultVersion ?? ''}
        fullWidth
        label="Version"
        name="version"
        placeholder="1.5"
      />
    </Stack>
  )
}
```

- [ ] **Step 5: Add a `date` field type to the declarative engine**

In `lib/types/form-fields.ts`, add:

```ts
interface DateField extends BaseField {
  type: 'date'
}
```

and add `| DateField` to `FieldConfig`. In `app/admin/entity-form.tsx`, render `type: 'date'` next to the existing `text` branch, as a controlled `<TextField type="date" name={field.name} slotProps={{ inputLabel: { shrink: true } }} value={values[field.name] ?? ''} …>` with the same `onChange` / `helperText` handling the text branch uses. `typeDefault` already returns `''` for unknown types.

In `app/admin/build-fields.ts`, add `inheritedRelease?: Release | null` to `BuilderData`, and pass `data.inheritedRelease` to `outfitVariantFields` and `makeupVariantFields`.

- [ ] **Step 6: Source forms (seasons and trials)**

Append to both `seasonFields` and `trialFields`:

```ts
{ type: 'date', name: 'released_at', label: 'Released' },
{ type: 'text', name: 'version', label: 'Version', helperText: 'e.g. 1.5 — sets and pieces inherit this' },
```

In `addSeason`, `editSeason`, `addTrial` and `editTrial`, spread `...readReleaseFields(formData)` into the insert/update object.

- Seasons table: add read-only columns `{ field: 'version', headerName: 'Version', width: 90 }` and `{ field: 'released_at', headerName: 'Released', width: 120 }`.
- Trial table: add the same two columns with `editable: true` (`type: 'date'` with a `valueGetter`/`valueSetter` that converts between ISO string and `Date` for `released_at`). Include `released_at` and `version` in the `updateTrial` payload in `processRowUpdate`, and allow both keys in `updateTrial` in `app/admin/actions.ts`, normalizing `''` → `null`.

- [ ] **Step 7: Inherited-release lookup for override forms**

`hooks/data/admin/inherited-release.ts`:

```ts
import { createClient } from '@/lib/supabase/server'
import { earliestRelease, resolveRelease, type Release } from '@/hooks/release'

export type InheritedKind =
  | 'outfitSet'
  | 'evolution'
  | 'outfitVariant'
  | 'makeupSet'
  | 'makeupVariant'
  | 'eurekaSet'
  | 'momoCloak'

const REL = 'released_at, version'

/**
 * What a row's blank override would resolve to — everything ABOVE the row in
 * its chain, never the row itself. Admin-only, a few small queries per edit
 * page; not used on any public read path.
 */
export async function getInheritedRelease(
  kind: InheritedKind,
  slug: string
): Promise<Release | null> {
  const supabase = await createClient()

  const season = async (seasonSlug: string | null) => {
    if (!seasonSlug) return null
    const { data } = await supabase.from('seasons').select(REL).eq('slug', seasonSlug).maybeSingle()
    return data
  }

  // A set row → (base set if it is an evolution) → season.
  const setChain = async (table: 'outfit_sets' | 'makeup_sets', setSlug: string | null) => {
    if (!setSlug) return null
    const { data: set } = await supabase
      .from(table)
      .select(`${REL}, seasons, base_set`)
      .eq('slug', setSlug)
      .maybeSingle()
    if (!set) return null
    const { data: base } = set.base_set
      ? await supabase.from(table).select(`${REL}, seasons`).eq('slug', set.base_set).maybeSingle()
      : { data: null }
    return resolveRelease(set, base, await season(base?.seasons ?? set.seasons))
  }

  switch (kind) {
    case 'outfitSet':
    case 'makeupSet':
    case 'momoCloak': {
      const table =
        kind === 'outfitSet' ? 'outfit_sets' : kind === 'makeupSet' ? 'makeup_sets' : 'momo_cloaks'
      const { data } = await supabase.from(table).select('seasons').eq('slug', slug).maybeSingle()
      return resolveRelease(await season(data?.seasons ?? null))
    }
    case 'evolution': {
      const { data } = await supabase
        .from('outfit_sets')
        .select('base_set')
        .eq('slug', slug)
        .maybeSingle()
      return setChain('outfit_sets', data?.base_set ?? null)
    }
    case 'outfitVariant':
    case 'makeupVariant': {
      const table = kind === 'outfitVariant' ? 'outfit_variants' : 'makeup_variants'
      const setColumn = kind === 'outfitVariant' ? 'outfit_set' : 'makeup_set'
      const { data } = await supabase
        .from(table)
        .select(`${setColumn}, seasons`)
        .eq('slug', slug)
        .maybeSingle()
      const row = data as Record<string, string | null> | null
      const setSlug = row?.[setColumn] ?? null
      // Standalone pieces live in a container set with no season — they inherit
      // straight from their own season column.
      if (!setSlug || setSlug === 'standalone_pieces')
        return resolveRelease(await season(row?.seasons ?? null))
      return setChain(kind === 'outfitVariant' ? 'outfit_sets' : 'makeup_sets', setSlug)
    }
    case 'eurekaSet': {
      const { data } = await supabase
        .from('eureka_set_trials')
        .select('trials ( released_at, version )')
        .eq('eureka_set', slug)
      return earliestRelease((data ?? []).map((link) => link.trials as never))
    }
  }
}
```

`momo_cloaks`, `outfit_sets` and `makeup_sets` all have a `seasons` column. In `makeup_variants` the standalone container slug is `STANDALONE_MAKEUP_SLUG`: import it from `@/hooks/makeup` and compare against it instead of the literal when `kind === 'makeupVariant'`.

- [ ] **Step 8: Override fields on the declarative piece forms**

In `outfitVariantFields(mode, inheritedRelease)` and `makeupVariantFields(mode, inheritedRelease)`, append:

```ts
{
  type: 'date',
  name: 'released_at',
  label: 'Released',
  helperText: inheritedRelease
    ? `Blank inherits ${formatRelease(inheritedRelease) ?? 'from its set or season'}`
    : 'Blank inherits from its set or season',
},
{ type: 'text', name: 'version', label: 'Version' },
```

In each variant edit `page.tsx`, call `getInheritedRelease('outfitVariant' | 'makeupVariant', slug)` and pass `builderData={{ ...existing, inheritedRelease }}`. In the add/edit actions, spread `...readReleaseFields(formData)` into the insert and update payloads.

- [ ] **Step 9: Override fields on the bespoke forms**

Each bespoke form gets `<ReleaseFields defaultReleasedAt={initial?.released_at} defaultVersion={initial?.version} inherited={inherited} />` directly above its description field. It takes a new optional `inherited?: Release | null` prop, which the edit `page.tsx` fills from `getInheritedRelease(kind, slug)`. Add pages pass `inherited={null}`, which gives the generic helper text. The pairs are:

| Form                | kind        | Action to extend with `...readReleaseFields(formData)`               |
| ------------------- | ----------- | -------------------------------------------------------------------- |
| outfit set add/edit | `outfitSet` | add + edit in `app/admin/outfits/sets/actions.ts`                    |
| evolution edit      | `evolution` | `app/admin/outfits/evolutions/edit/[slug]/actions.ts`                |
| makeup set add/edit | `makeupSet` | add + edit in `app/admin/makeup/sets/actions.ts`                     |
| eureka set add/edit | `eurekaSet` | `addEurekaSet`, `editEurekaSet`                                      |
| cloak add/edit      | `momoCloak` | the shared `values` builder at `app/admin/momo-cloaks/actions.ts:10` |

The eureka set forms also get a **Season** select (`name="seasons"`, options from `getSeasons()` passed down by the page, plus an empty "—" option). `addEurekaSet` / `editEurekaSet` persist `seasons: (formData.get('seasons') as string | null) || null`.

- [ ] **Step 10: Verify**

Run: `yarn tsc --noEmit && yarn lint && yarn test`
Expected: all green.

Then run `yarn dev` and check by hand as an admin:

1. Edit Exploration Season: set `2024-12-05` / `1.0` and save. Reopen it; the values persist.
2. Open any Exploration Season outfit set's edit page. The Released helper reads `Blank inherits v1.0 · Dec 5, 2024`.
3. Open a eureka set's edit page. The Season select shows its backfilled season.

- [ ] **Step 11: Commit**

```bash
git add lib components/forms hooks/data/admin app/admin
git commit -m "feat(admin): release date/version fields with inherited hints"
```

---

## Phase 2 (PR 2): Date sort and display

### Task 5: Date axis sorts by release everywhere

**Files:**

- Modify: `app/outfits/filter-outfits.tsx:193-220`
- Modify: `app/makeup/filter-makeup.tsx:161-188`
- Modify: `app/eureka/filter-eureka.tsx:134`
- Modify: `app/eureka/sets/sets-content.tsx:56-60`
- Modify: `app/eureka/trials/trials-content.tsx:56`
- Modify: `app/momo-cloaks/filter-momo-cloaks.tsx:35-58`
- Modify: `app/seasons/seasons-content.tsx:102-106`
- Test: `hooks/__tests__/release.test.ts` (append domain-helper tests)

**Interfaces:**

- Consumes: `resolveRelease`, `compareRelease` (Task 2); `OutfitSet.season`, `MakeupSet.season`, `MomoCloak.season` with release fields, and `EurekaSet.release` (Task 3).
- Produces, in `hooks/release.ts`:
  - `setRelease(row: { released_at?; version?; season?: ReleaseSource }): Release`, for outfit sets, makeup sets and cloaks
  - `orderToDir(order: 'new' | 'old'): SortDir`

- [ ] **Step 1: Write the failing test for the domain helper**

Append to `hooks/__tests__/release.test.ts`:

```ts
import { setRelease } from '../release'

describe('setRelease', () => {
  it('prefers the row override, then its embedded season', () => {
    expect(
      setRelease({ released_at: null, version: '1.5.5', season: r('2025-04-29', '1.5') })
    ).toEqual(r('2025-04-29', '1.5.5'))
  })
  it('handles a row with no season', () => {
    expect(setRelease({ released_at: null, version: null, season: null })).toEqual(r(null, null))
  })
})
```

Run: `yarn test hooks/__tests__/release.test.ts`. Expected: FAIL, `setRelease` is not exported.

- [ ] **Step 2: Implement the helpers**

Append to `hooks/release.ts`:

```ts
/** A set or cloak row: its own override, then the season the hook embedded. */
export function setRelease(row: {
  released_at?: string | null
  version?: string | null
  season?: ReleaseSource
}): Release {
  return resolveRelease(row, row.season)
}

/** The legacy 'new'/'old' date direction as a SortDir: new = newest first. */
export const orderToDir = (order: 'new' | 'old'): SortDir => (order === 'new' ? 'desc' : 'asc')
```

Run: `yarn test hooks/__tests__/release.test.ts`. Expected: PASS.

- [ ] **Step 3: Replace every id-based date comparison**

The pattern is the same everywhere: the date branch stops going through the `(sortDir === 'asc' ? cmp : -cmp)` wrapper, because `compareRelease` already applies the direction and must keep nulls last.

`app/outfits/filter-outfits.tsx` and `app/makeup/filter-makeup.tsx` (the same shape in both):

```ts
if (axis === 'date') {
  return compareRelease(setRelease(a), setRelease(b), sortDir) || a.id! - b.id!
}
let cmp: number
switch (axis) {
  case 'rarity':
    cmp = a.rarity - b.rarity
    break
  case 'progress':
    cmp = progress(a) - progress(b)
    break
  default:
    cmp = a.title.localeCompare(b.title)
}
return (sortDir === 'asc' ? cmp : -cmp) || a.id! - b.id!
```

Keep the standalone-last guard above this block exactly as it is.

`app/momo-cloaks/filter-momo-cloaks.tsx`: apply the same shape using `setRelease(a)` / `setRelease(b)` on the cloak rows. Delete the stale comment at line 35 ("`date` sorts on id…") and replace it with `// date sorts on the cloak's release (override → season); see hooks/release.ts`.

`app/eureka/filter-eureka.tsx:134`:

```ts
.sort((a, b) => compareRelease(a.release, b.release, orderToDir(sortOrder)) || a.id! - b.id!)
```

`app/eureka/sets/sets-content.tsx`: keep rarity first, then:

```ts
return compareRelease(a.release, b.release, orderToDir(sortOrder)) || a.id! - b.id!
```

`app/eureka/trials/trials-content.tsx:56`:

```ts
.sort((a, b) => compareRelease(resolveRelease(a), resolveRelease(b), orderToDir(sortOrder)) || a.id - b.id)
```

`app/seasons/seasons-content.tsx:102-106`:

```ts
// Seasons order by their release (id as the fallback while dates are blank).
const sortedSeasons = [...seasons].sort(
  (a, b) =>
    compareRelease(resolveRelease(a), resolveRelease(b), orderToDir(sortOrder)) ||
    (sortOrder === 'new' ? b.id - a.id : a.id - b.id)
)
```

This fallback keeps the old `id` order in the chosen direction, so the index doesn't flip while the dates are unfilled. The ordinal code below it is unchanged.

- [ ] **Step 4: Verify**

Run: `yarn tsc --noEmit && yarn test`
Expected: green. The existing `season-entries-sort.test.ts` still passes, because season entries are wired in Task 8.

Manual check: fill in two seasons' dates in the admin. `/outfits` with sort "newest" puts the later season's sets first, and toggling the direction reverses them. Sets whose season has no date sit at the end both ways.

- [ ] **Step 5: Commit**

```bash
git add hooks app/outfits app/makeup app/eureka app/momo-cloaks app/seasons/seasons-content.tsx
git commit -m "feat(sort): date axis orders by resolved release instead of id"
```

---

### Task 6: "Released" line on detail pages and the season header

**Files:**

- Create: `components/release-line.tsx`
- Modify: `app/outfits/[slug]/outfit-set-detail-card.tsx`, `app/makeup/[slug]/makeup-set-detail-card.tsx`, `app/eureka/[slug]/eureka-set-detail-card.tsx`, `app/momo-cloaks/[slug]/momo-cloak-detail.tsx`, `app/seasons/[slug]/page.tsx`

**Interfaces:**

- Consumes: `formatRelease`, `setRelease`, `resolveRelease`, `Release`.
- Produces: `<ReleaseLine release={Release} />`, which renders nothing when both halves are null.

- [ ] **Step 1: The component**

```tsx
import { Typography } from '@mui/material'
import { formatRelease, type Release } from '@/hooks/release'

export default function ReleaseLine({ release }: { release: Release }) {
  const text = formatRelease(release)
  if (!text) return null
  return (
    <Typography color="text.secondary" size="small" variant="body">
      Released {text}
    </Typography>
  )
}
```

- [ ] **Step 2: Place it**

Place it under the existing season/category line on each detail card:

- **Outfit card:** `release={resolveRelease(evolution, set, evolution?.season, set.season)}`, using the card's current `evolution`/`set` props.
- **Makeup card:** the same chain over its makeup evolution/set.
- **Eureka card:** `release={set.release}`.
- **Cloak detail:** `release={setRelease(cloak)}`.
- **Season page** (`app/seasons/[slug]/page.tsx`): render `<ReleaseLine release={resolveRelease(season)} />` directly below the `<Typography component="h1">` row.

- [ ] **Step 3: Verify**

Run: `yarn tsc --noEmit && yarn lint`. Expected: green.
Manual check: an Exploration Season set detail shows `Released v1.0 · Dec 5, 2024`, and a season with no data shows no line.

- [ ] **Step 4: Commit**

```bash
git add components/release-line.tsx app/outfits app/makeup app/eureka app/momo-cloaks 'app/seasons/[slug]/page.tsx'
git commit -m "feat(release): show the resolved release on detail pages and season header"
```

---

## Phase 3 (PR 3): Eureka and cloaks on season pages

### Task 7: Season entries: new kinds, release, cloak-free counters

**Files:**

- Modify: `app/seasons/[slug]/season-entries.ts`
- Modify: `app/seasons/[slug]/__tests__/season-entries-sort.test.ts` (date-axis expectations)
- Create: `app/seasons/[slug]/__tests__/season-entries-eureka-cloaks.test.ts`

**Interfaces:**

- Consumes: `Release`, `NO_RELEASE`, `resolveRelease`, `compareRelease` (Task 2); `EurekaSet` with `release` and `seasons` (Task 3); `MomoCloak` (`lib/types/momo.ts`).
- Produces:
  - `export const EUREKA_CATEGORY = 'eureka_collection'`
  - `export const MOMO_CLOAKS_CATEGORY = "Momo's Cloaks"`
  - `SeasonEntry` adds `| { kind: 'eureka'; key: string; set: EurekaSet; release?: Release } | { kind: 'momo-cloak'; key: string; cloak: MomoCloak; obtained: boolean; release?: Release }`, and every existing kind gains `release?: Release`
  - `groupSeasonEntries({ …existing, eurekaSets?: EurekaSet[]; cloaks?: MomoCloak[]; obtainedCloaks?: ReadonlySet<string>; hideEureka?: boolean; hideCloaks?: boolean; seasonRelease?: Release })`
  - `countEntryKinds(...)` returns `{ outfit, standalone, eureka, obtained: { outfit, standalone, eureka } }`

- [ ] **Step 1: Write the failing tests**

`app/seasons/[slug]/__tests__/season-entries-eureka-cloaks.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  applySeasonFilters,
  countCountableEntries,
  countEntries,
  countEntryCards,
  countEntryKinds,
  EUREKA_CATEGORY,
  groupSeasonEntries,
  MOMO_CLOAKS_CATEGORY,
  sortSeasonEntries,
  type SeasonEntry,
} from '../season-entries'
import type { EurekaSet } from '@/lib/types/eureka'
import type { MomoCloak } from '@/lib/types/momo'

const SEASON = 'exploration_season'

const eureka = (
  slug: string,
  obtained: boolean[],
  release = { released_at: null, version: null }
) =>
  ({
    id: slug.length,
    slug,
    title: slug,
    rarity: 4,
    style: 'elegant',
    seasons: SEASON,
    release,
    eureka_variants: obtained.map((o, i) => ({ slug: `${slug}-${i}`, obtained: o })),
  }) as unknown as EurekaSet

const cloak = (slug: string, category: string | null, rarity = 4) =>
  ({
    id: slug.length,
    slug,
    title: slug,
    rarity,
    style: 'cute',
    seasons: SEASON,
    season_category: category,
    season: null,
    released_at: null,
    version: null,
  }) as unknown as MomoCloak

const base = {
  seasonSets: [],
  standaloneVariants: [],
  makeupSets: [],
  seasonSlug: SEASON,
  hideEvolutions: true,
  hideGlowups: true,
}

const flat = (groups: [string, SeasonEntry[]][]) => groups.flatMap(([, e]) => e)

describe('eureka entries', () => {
  it('groups every eureka set of the season under eureka_collection, one card each', () => {
    const groups = groupSeasonEntries({
      ...base,
      eurekaSets: [eureka('a', [true, false]), eureka('b', [true])],
    })
    expect(groups).toEqual([[EUREKA_CATEGORY, expect.any(Array)]])
    expect(groups[0][1].map((e) => e.key)).toEqual(['eureka:a', 'eureka:b'])
  })

  it('ignores eureka sets from another season', () => {
    const other = { ...eureka('x', [true]), seasons: 'terras_call' } as EurekaSet
    expect(groupSeasonEntries({ ...base, eurekaSets: [other] })).toEqual([])
  })

  it('counts 1 per set, obtained only when every variant is', () => {
    const entries = flat(
      groupSeasonEntries({
        ...base,
        eurekaSets: [eureka('a', [true, false]), eureka('b', [true, true])],
      })
    )
    expect(countEntries(entries)).toEqual({ total: 2, obtained: 1 })
    expect(countCountableEntries(entries)).toEqual({ total: 2, obtained: 1 })
    expect(countEntryKinds(entries).eureka).toBe(2)
    expect(countEntryKinds(entries).obtained.eureka).toBe(1)
  })

  it('is dropped by hideEureka', () => {
    expect(
      groupSeasonEntries({ ...base, eurekaSets: [eureka('a', [true])], hideEureka: true })
    ).toEqual([])
  })
})

describe('cloak entries', () => {
  it('files a cloak under its own season category', () => {
    const groups = groupSeasonEntries({ ...base, cloaks: [cloak('c1', 'limited_time_resonance')] })
    expect(groups[0][0]).toBe('limited_time_resonance')
  })

  it("files an uncategorised cloak under Momo's Cloaks, never Other", () => {
    const groups = groupSeasonEntries({ ...base, cloaks: [cloak('c1', null)] })
    expect(groups[0][0]).toBe(MOMO_CLOAKS_CATEGORY)
  })

  it('never counts toward any total', () => {
    const entries = flat(
      groupSeasonEntries({
        ...base,
        cloaks: [cloak('c1', null), cloak('c2', 'distant_sea')],
        obtainedCloaks: new Set(['c1']),
        eurekaSets: [eureka('a', [true])],
      })
    )
    expect(countEntries(entries)).toEqual({ total: 1, obtained: 1 })
    expect(countCountableEntries(entries)).toEqual({ total: 1, obtained: 1 })
    expect(countEntryCards(entries)).toEqual({ total: 1, obtained: 1 })
    const kinds = countEntryKinds(entries)
    expect(kinds.outfit + kinds.standalone + kinds.eureka).toBe(1)
  })

  it('yields 0/0 for a category holding only cloaks', () => {
    const entries = flat(groupSeasonEntries({ ...base, cloaks: [cloak('c1', null)] }))
    expect(countEntryCards(entries)).toEqual({ total: 0, obtained: 0 })
  })

  it('still answers the obtained and rarity filters', () => {
    const groups = groupSeasonEntries({
      ...base,
      cloaks: [cloak('c1', null, 5), cloak('c2', null, 3)],
      obtainedCloaks: new Set(['c1']),
    })
    const obtained = applySeasonFilters(groups, { obtained: 'obtained', rarity: null, styles: [] })
    expect(flat(obtained).map((e) => e.key)).toEqual(['momo-cloak:c1'])
    const rare = applySeasonFilters(groups, { obtained: null, rarity: 3, styles: [] })
    expect(flat(rare).map((e) => e.key)).toEqual(['momo-cloak:c2'])
  })

  it('is dropped by hideCloaks', () => {
    expect(groupSeasonEntries({ ...base, cloaks: [cloak('c1', null)], hideCloaks: true })).toEqual(
      []
    )
  })
})

describe('date sort on the season page', () => {
  it('orders eureka sets by their own release, undated last', () => {
    const groups = groupSeasonEntries({
      ...base,
      eurekaSets: [
        eureka('old', [false], { released_at: '2024-12-05', version: '1.0' }),
        eureka('none', [false]),
        eureka('new', [false], { released_at: '2025-06-01', version: '1.6' }),
      ],
    })
    const keys = (dir: 'asc' | 'desc') =>
      sortSeasonEntries(groups, 'date', dir)[0][1].map((e) => e.key)
    expect(keys('desc')).toEqual(['eureka:new', 'eureka:old', 'eureka:none'])
    expect(keys('asc')).toEqual(['eureka:old', 'eureka:new', 'eureka:none'])
  })

  it('lets a mid-season piece override sort after the season default', () => {
    const season = { released_at: '2025-04-29', version: '1.5' }
    const piece = (slug: string, released_at: string | null) =>
      ({
        id: slug.length,
        slug,
        seasons: SEASON,
        season_category: 'x',
        released_at,
        version: null,
        obtained: false,
      }) as never
    const groups = groupSeasonEntries({
      ...base,
      seasonRelease: season,
      standaloneVariants: [piece('launch', null), piece('midseason', '2025-05-20')],
    })
    expect(sortSeasonEntries(groups, 'date', 'desc')[0][1].map((e) => e.key)).toEqual([
      'standalone:midseason',
      'standalone:launch',
    ])
  })
})
```

In `season-entries-sort.test.ts`, the two date-axis tests currently assert id order. The fixtures carry no `release`, so every entry resolves to the same nulls and the tie-break falls to `id` **ascending** in both directions. Change the two expectations to:

```ts
it('falls back to id order on the date axis when nothing is dated', () => {
  expect(keys(sortSeasonEntries(groups, 'date', 'desc'))).toEqual(['p1', 'p2', 'p3'])
  expect(keys(sortSeasonEntries(groups, 'date', 'asc'))).toEqual(['p1', 'p2', 'p3'])
})
```

Delete the two old date tests it replaces.

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `yarn test 'app/seasons/[slug]/__tests__'`
Expected: FAIL. `EUREKA_CATEGORY` isn't exported, and the date expectation doesn't match.

- [ ] **Step 3: Implement in `season-entries.ts`**

1. Add imports `EurekaSet` (`@/lib/types/eureka`), `MomoCloak` (`@/lib/types/momo`), and `compareRelease, NO_RELEASE, resolveRelease, type Release` (`@/hooks/release`). Add the constants:

```ts
// eureka_sets carry no category of their own — every one lists under this
// existing season category (Radiant Whim group).
export const EUREKA_CATEGORY = 'eureka_collection'

// Cloaks with no season_category get their own bucket rather than "Other":
// they are a distinct collection, and "Other" reads as unfiled outfits.
export const MOMO_CLOAKS_CATEGORY = "Momo's Cloaks"
```

2. Extend the union. Add `release?: Release` to each of the three existing variants, then:

```ts
  | { kind: 'eureka'; key: string; set: EurekaSet; release?: Release }
  // Shown on the season page but counted nowhere — see countedEntries.
  | { kind: 'momo-cloak'; key: string; cloak: MomoCloak; obtained: boolean; release?: Release }
```

3. `entryVariants`:

```ts
export function entryVariants(entry: SeasonEntry): { obtained?: boolean }[] {
  if (entry.kind === 'standalone' || entry.kind === 'makeup-standalone') return [entry.variant]
  // A eureka set is ONE unit toward the season: complete when every variant is.
  // Rarity and style ride along so the filter axes can read them.
  if (entry.kind === 'eureka') {
    const variants = entry.set.eureka_variants
    return [
      {
        obtained: variants.length > 0 && variants.every((v) => v.obtained),
        rarity: entry.set.rarity,
        style: entry.set.style,
      } as { obtained?: boolean },
    ]
  }
  if (entry.kind === 'momo-cloak') {
    return [
      { obtained: entry.obtained, rarity: entry.cloak.rarity, style: entry.cloak.style } as {
        obtained?: boolean
      },
    ]
  }
  return entry.variants
}
```

4. The cloak exclusion, applied at the top of every counter:

```ts
/** Cloaks are listed on season pages but never counted — the game's season
 *  totals don't include them. Every counter goes through this. */
function countedEntries(entries: SeasonEntry[]) {
  return entries.filter((entry) => entry.kind !== 'momo-cloak')
}
```

- `countEntries`: `const variants = countedEntries(entries).flatMap(entryVariants)`.
- `countCountableEntries`: `countedEntries(entries).flatMap(...)`.
- `countEntryCards`: compute over `const counted = countedEntries(entries)`.
- `countEntryKinds`: `const of = (kind) => countedEntries(entries).filter(...)`, then add `const eureka = counts('eureka')` and return `eureka: eureka.total` plus `obtained: { …, eureka: eureka.obtained }`.

5. `sortSeasonEntries`: extend `row` and the date branch:

```ts
const row = (entry: SeasonEntry) =>
  entry.kind === 'standalone' || entry.kind === 'makeup-standalone'
    ? entry.variant
    : entry.kind === 'eureka'
      ? entry.set
      : entry.kind === 'momo-cloak'
        ? entry.cloak
        : (entry.evolution ?? entry.set)
```

Then, inside `compare`, before the switch:

```ts
if (sortAxis === 'date') {
  return (
    compareRelease(a.release ?? NO_RELEASE, b.release ?? NO_RELEASE, sortDir) ||
    (ra.id ?? 0) - (rb.id ?? 0)
  )
}
```

Remove the `default:` id branch. The switch now only handles rarity, progress and title, and its default becomes `title`.

6. `groupSeasonEntries`: add the new params with defaults `eurekaSets = []`, `cloaks = []`, `obtainedCloaks`, `hideEureka = false`, `hideCloaks = false`, `seasonRelease = NO_RELEASE`. Attach `release` wherever entries are built:
   - Outfit set entries: `release: resolveRelease(entry.evolution, entry.set, seasonRelease)`.
   - Standalone outfit pieces: `release: resolveRelease(variant, seasonRelease)`.
   - Makeup set pieces: change `asPieces` in `expandMakeupSet` to take the state set and base set, and set `release: resolveRelease(variant, state, set, seasonRelease)`. Thread `seasonRelease` in as a new last parameter of `expandMakeupSet`.
   - Standalone makeup pieces: `release: resolveRelease(variant, seasonRelease)`.

Then, before the final `return`:

```ts
if (!hideEureka && seasonSlug) {
  for (const set of eurekaSets) {
    if (set.seasons !== seasonSlug) continue
    push(EUREKA_CATEGORY, [
      { kind: 'eureka', key: `eureka:${set.slug}`, set, release: set.release },
    ])
  }
}

if (!hideCloaks && seasonSlug) {
  for (const cloak of cloaks) {
    if (cloak.seasons !== seasonSlug) continue
    push(cloak.season_category ?? MOMO_CLOAKS_CATEGORY, [
      {
        kind: 'momo-cloak',
        key: `momo-cloak:${cloak.slug}`,
        cloak,
        obtained: obtainedCloaks?.has(cloak.slug) ?? false,
        release: resolveRelease(cloak, seasonRelease),
      },
    ])
  }
}
```

`push(null, …)` would route to "Other", which is why the cloak branch passes `MOMO_CLOAKS_CATEGORY` explicitly.

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `yarn test 'app/seasons'`
Expected: PASS across all season test files, including the untouched `season-index-counts.test.ts`.

- [ ] **Step 5: Commit**

```bash
git add 'app/seasons/[slug]/season-entries.ts' 'app/seasons/[slug]/__tests__'
git commit -m "feat(seasons): eureka and cloak entry kinds, release-ordered date sort"
```

---

### Task 8: Season hide toggles for eureka and cloaks (preferences)

**Files:**

- Modify: `app/api/preferences/route.ts` (`WRITABLE_KEYS`, `PREFERENCE_COLUMNS`)
- Modify: `lib/preferences.ts` (`DEFAULT_PREFERENCES`)
- Modify: `lib/types/eureka.ts` (`UserPreferences`)
- Modify: `hooks/data/preferences.ts` (select string, which is the one that's easy to miss)
- Modify: `app/seasons/[slug]/season-filter-context.tsx`
- Modify: the season toggle menu that renders the existing `hideMakeup` switch (find it with `grep -rn "setHideMakeup\|onToggleMakeup\|hideMakeup" app/seasons components --include=*.tsx`)
- Test: `app/seasons/[slug]/__tests__/season-filter-context.test.tsx`

**Interfaces:**

- Consumes: the `season_hide_eureka` / `season_hide_cloaks` columns (Task 1).
- Produces: `useSeasonFilter()` gains `hideEureka: boolean`, `hideCloaks: boolean`, `onHideEurekaChange(): void` and `onHideCloaksChange(): void`, following the existing `onHideMakeupChange`. `onSetAllVisible(visible)` covers both.

- [ ] **Step 1: Write the failing tests**

Append inside the `describe` in `season-filter-context.test.tsx`. The file's `save` mock and imports already cover this:

```tsx
function ToggleProbe() {
  const { hideEureka, hideCloaks, onHideEurekaChange, onHideCloaksChange, onSetAllVisible } =
    useSeasonFilter()
  return (
    <div>
      <span data-testid="eureka">{String(hideEureka)}</span>
      <span data-testid="cloaks">{String(hideCloaks)}</span>
      <button onClick={onHideEurekaChange}>eureka</button>
      <button onClick={onHideCloaksChange}>cloaks</button>
      <button onClick={() => onSetAllVisible(false)}>hide all</button>
    </div>
  )
}

it('shows eureka and cloaks by default, and hydrates saved values', () => {
  const { unmount } = render(
    <SeasonFilterProvider isLoggedIn={false}>
      <ToggleProbe />
    </SeasonFilterProvider>
  )
  expect(screen.getByTestId('eureka')).toHaveTextContent('false')
  expect(screen.getByTestId('cloaks')).toHaveTextContent('false')
  unmount()

  render(
    <SeasonFilterProvider
      isLoggedIn
      preferences={{ season_hide_eureka: true, season_hide_cloaks: true }}
    >
      <ToggleProbe />
    </SeasonFilterProvider>
  )
  expect(screen.getByTestId('eureka')).toHaveTextContent('true')
  expect(screen.getByTestId('cloaks')).toHaveTextContent('true')
})

it('toggles and persists hideEureka and hideCloaks', () => {
  render(
    <SeasonFilterProvider isLoggedIn>
      <ToggleProbe />
    </SeasonFilterProvider>
  )
  act(() => screen.getByText('eureka').click())
  act(() => screen.getByText('cloaks').click())
  expect(screen.getByTestId('eureka')).toHaveTextContent('true')
  expect(screen.getByTestId('cloaks')).toHaveTextContent('true')
  expect(save).toHaveBeenCalledWith({ season_hide_eureka: true })
  expect(save).toHaveBeenCalledWith({ season_hide_cloaks: true })
})

it('includes eureka and cloaks in hide-all', () => {
  render(
    <SeasonFilterProvider isLoggedIn>
      <ToggleProbe />
    </SeasonFilterProvider>
  )
  act(() => screen.getByText('hide all').click())
  expect(save).toHaveBeenCalledWith(
    expect.objectContaining({ season_hide_eureka: true, season_hide_cloaks: true })
  )
})
```

Run: `yarn test 'app/seasons/[slug]/__tests__/season-filter-context.test.tsx'`
Expected: FAIL. `hideEureka` is undefined, so the text reads "undefined".

- [ ] **Step 2: Make the five lockstep preference edits**

Add `season_hide_eureka` and `season_hide_cloaks` to:

1. `WRITABLE_KEYS` in `app/api/preferences/route.ts`
2. `PREFERENCE_COLUMNS` in `app/api/preferences/route.ts`
3. `DEFAULT_PREFERENCES` in `lib/preferences.ts`, both `false`
4. `UserPreferences` in `lib/types/eureka.ts`, as `boolean`
5. The select string in `hooks/data/preferences.ts`

- [ ] **Step 3: Update the context**

In `season-filter-context.tsx`, mirror the `hideMakeup` state (lines 77-78) and `onHideMakeupChange` (near line 132) as `hideEureka` / `onHideEurekaChange` / `season_hide_eureka` and `hideCloaks` / `onHideCloaksChange` / `season_hide_cloaks`. Add both to:

- the hide-all `savePreferences({...})` payload near line 151
- the `setHide…(hidden)` calls in the same function
- the "is default" comparison near line 200
- the context value and type

- [ ] **Step 4: Add the switches to the toggle menu**

Render two more switches next to the makeup one, using the same component. Label them **"Eureka"** and **"Momo's Cloaks"**, and bind them to `!hideEureka` / `!hideCloaks` so they match how the existing switches read ("shown").

- [ ] **Step 5: Verify and commit**

Run: `yarn tsc --noEmit && yarn test 'app/seasons'`
Expected: PASS.

```bash
git add app/api/preferences/route.ts lib/preferences.ts lib/types/eureka.ts hooks/data/preferences.ts app/seasons
git commit -m "feat(seasons): persisted hide toggles for eureka and cloaks"
```

---

### Task 9: Wire providers, pages and cards

**Files:**

- Create: `app/momo-cloaks/load-cloak-data.ts`
- Modify: `app/momo-cloaks/layout.tsx`, `app/seasons/layout.tsx`
- Modify: `app/seasons/[slug]/page.tsx`, `season-outfit-list.tsx`, `season-contents.tsx`, `season-overview.tsx`, `season-progress.tsx`
- Modify: `app/seasons/seasons-content.tsx`
- Modify: `components/seasons/composition-counts.tsx`
- Test: `app/seasons/__tests__/season-index-counts.test.ts` (append)

**Interfaces:**

- Consumes: `groupSeasonEntries` with the new params, `EUREKA_CATEGORY`, `MOMO_CLOAKS_CATEGORY` (Task 7); `hideEureka`/`hideCloaks` (Task 8); `useEurekaData()` → `{ eurekaSets, isLoading, onBatchToggleObtained }`; `useMomoCloakData()` → `{ cloaks, obtainedSlugs, onToggleObtained, isObtainedError }`.
- Produces: `loadCloakData(): Promise<{ cloaks: MomoCloak[]; obtainedSlugs: string[]; isError: boolean; isObtainedError: boolean; isLoggedIn: boolean }>`. `CompositionCounts` gains optional `eureka?: number` and `obtainedEureka?: number`.

- [ ] **Step 1: Write the failing index-parity test**

Append to `app/seasons/__tests__/season-index-counts.test.ts`:

```ts
import { EUREKA_CATEGORY } from '@/app/seasons/[slug]/season-entries'
import type { EurekaSet } from '@/lib/types/eureka'
import type { MomoCloak } from '@/lib/types/momo'

describe('eureka and cloaks on the index', () => {
  const set = (slug: string) =>
    ({
      slug,
      seasons: SEASON,
      eureka_variants: [{ obtained: true }],
      release: { released_at: null, version: null },
    }) as unknown as EurekaSet
  const cloak = { slug: 'c', seasons: SEASON, season_category: null } as unknown as MomoCloak

  it('adds one card per eureka set and nothing for cloaks', () => {
    const groups = groupSeasonEntries({
      seasonSets: [],
      standaloneVariants: [],
      makeupSets: [],
      seasonSlug: SEASON,
      hideEvolutions: true,
      hideGlowups: true,
      eurekaSets: [set('a'), set('b')],
      cloaks: [cloak],
    })
    const all = groups.flatMap(([, e]) => e)
    expect(countEntryCards(all)).toEqual({ total: 2, obtained: 2 })
    expect(groups.find(([c]) => c === EUREKA_CATEGORY)?.[1]).toHaveLength(2)
  })
})
```

Run: `yarn test app/seasons/__tests__/season-index-counts.test.ts`. Expected: PASS already, because Task 7 did the logic. This test pins the invariant for the wiring below, so keep it even though it's green.

- [ ] **Step 2: Extract the cloak loader**

Move the body of `MomoCloakProviders` in `app/momo-cloaks/layout.tsx` (the `getUserID`, the cloak fetch with try/catch, and the obtained fetch with try/catch) into `app/momo-cloaks/load-cloak-data.ts`:

```ts
import { getMomoCloaks } from '@/hooks/data/momo-cloaks'
import { getObtainedMomoCloaks } from '@/hooks/data/obtained-momo-cloaks'
import { getUserID } from '@/hooks/user'

// Server-side inputs for MomoCloakDataProvider. Shared by /momo-cloaks and
// /seasons so both mount the provider with identical failure handling.
export async function loadCloakData() {
  const userId = await getUserID()

  let cloaks: Awaited<ReturnType<typeof getMomoCloaks>> = []
  let isError = false
  try {
    cloaks = await getMomoCloaks()
  } catch (err) {
    console.error('Failed to load momo cloaks:', err)
    isError = true
  }

  let obtainedSlugs: string[] = []
  let isObtainedError = false
  if (userId) {
    try {
      const obtained = await getObtainedMomoCloaks(userId)
      obtainedSlugs = obtained.map((o) => o.momo_cloak).filter((slug): slug is string => !!slug)
    } catch (err) {
      console.error('Failed to load obtained momo cloaks:', err)
      isObtainedError = true
    }
  }

  return { cloaks, obtainedSlugs, isError, isObtainedError, isLoggedIn: !!userId }
}
```

In the momo layout, replace the moved code with `const data = await loadCloakData()` and `<MomoCloakDataProvider {...data}>`. Keep its comments about `OutfitImageModeProvider`.

- [ ] **Step 3: Mount both providers in `app/seasons/layout.tsx`**

Inside `SeasonProviders`, run `loadCloakData()` in a `Promise.all` alongside `getPreferences`, then nest:

```tsx
<EurekaDataProvider isLoggedIn={!!userId} userId={userId}>
  <MomoCloakDataProvider {...cloakData}>
    {/* existing OutfitImageModeProvider… subtree */}
  </MomoCloakDataProvider>
</EurekaDataProvider>
```

Place these inside `MakeupDataProvider`. Import `EurekaDataProvider` from `@/app/eureka/eureka-data-provider`. Extend the top-of-file comment with one sentence: season pages now also list eureka sets and cloaks through their real providers, so their toggles work.

- [ ] **Step 4: Pass eureka, cloaks and season release through the page components**

`page.tsx` still passes only server data. The eureka and cloak data come from context inside the client components. Add `seasonRelease={resolveRelease(season)}` to `SeasonOutfitList`, `SeasonContents`, `SeasonOverview` and `SeasonProgress`. Each of those four components:

```ts
const { eurekaSets } = useEurekaData()
const { cloaks, obtainedSlugs } = useMomoCloakData()
const { hideEureka, hideCloaks } = useSeasonFilter()
// …
groupSeasonEntries({
  …existing,
  eurekaSets,
  cloaks,
  obtainedCloaks: obtainedSlugs,
  hideEureka,
  hideCloaks,
  seasonRelease,
})
```

`SeasonProgress` and `SeasonOverview` can omit `cloaks`, because they only count and cloaks count as nothing.

- [ ] **Step 5: Render the new cards in `season-outfit-list.tsx`**

In `renderEntry`:

```tsx
if (entry.kind === 'eureka') {
  const variants = entry.set.eureka_variants
  const obtained = variants.filter((v) => v.obtained).length
  return (
    <SetCard
      key={entry.key}
      in
      href={`/eureka/${entry.set.slug}`}
      imageSrc={entry.set.image_url ?? ''}
      isLoggedIn={isLoggedIn}
      obtained={obtained}
      rarity={entry.set.rarity ?? 0}
      showAlt={false}
      title={entry.set.title}
      total={variants.length}
      onToggle={() =>
        onBatchToggleObtained(
          variants.map((v) => ({
            eureka_set: v.eureka_set!,
            category: v.category!,
            color: v.color!,
          })),
          obtained !== variants.length
        )
      }
    />
  )
}

if (entry.kind === 'momo-cloak') {
  return (
    <SetCard
      key={entry.key}
      in
      href={`/momo-cloaks/${entry.cloak.slug}`}
      imageSrc={
        resolveOutfitImage(mode, {
          image: entry.cloak.image_url,
          alt: entry.cloak.alt_image_url,
        }) ?? ''
      }
      isLoggedIn={isLoggedIn && !isCloakObtainedError}
      obtained={entry.obtained ? 1 : 0}
      rarity={entry.cloak.rarity ?? 0}
      showAlt={mode === 'alt'}
      title={entry.cloak.title}
      total={1}
      onToggle={() => onToggleCloak(entry.cloak.slug)}
    />
  )
}
```

This uses `onBatchToggleObtained` from `useEurekaData()`, `onToggleObtained: onToggleCloak` and `isObtainedError: isCloakObtainedError` from `useMomoCloakData()`, and `mode` from `useOutfitImageMode()`. `resolveOutfitImage` is imported the same way `app/momo-cloaks/filter-momo-cloaks.tsx` imports it. `in` is pinned true with no `animateExit`, as the Card Animations rules require for cards with no missing-filter hold.

Change the set/piece grid split to `entry.kind === 'outfit' || entry.kind === 'eureka' || entry.kind === 'momo-cloak'` for the `outfit`-column grid.

Resolve the category title in one helper and use it here and in `season-contents.tsx`:

```ts
const categoryLabel = (slug: string) =>
  slug === OTHER_CATEGORY || slug === MOMO_CLOAKS_CATEGORY ? slug : categoryTitle(slug)
```

`CategoryProgress`: pass `eureka={kinds.eureka}` and `obtainedEureka={kinds.obtained.eureka}` through to `CompositionCounts`. Render the `ProgressChip` + `LinearProgress` only when `total > 0`, so a category holding only cloaks shows a bare title.

- [ ] **Step 6: Add eureka to `CompositionCounts`**

Add optional `eureka` / `obtainedEureka` props. When `eureka` is greater than 0, render a third `<Count value={eureka} obtained={obtainedEureka} singular="eureka" plural="eureka" icon={<AutoAwesome fontSize="inherit" />} />` after the pieces count (import `AutoAwesome` from `@mui/icons-material`). Pass the same two props from `season-contents.tsx:153`.

- [ ] **Step 7: Seasons index**

In `seasons-content.tsx`:

- Read `eurekaSets` and `isLoading: isEurekaLoading` from `useEurekaData()`, and `hideEureka` from `useSeasonFilter()`.
- Pass `eurekaSets` and `hideEureka` into the `groupSeasonEntries` call in `rowsForSeason`. Don't pass cloaks.
- Extend `isLoading` to `isOutfitLoading || isMakeupLoading || isEurekaLoading`, and `isError` likewise. Update the gate comment from "BOTH" to "every provider".
- The `OTHER_CATEGORY` title branch in `rowsForSeason` doesn't need a cloak branch, because cloaks never reach the index.

- [ ] **Step 8: Verify**

Run: `yarn tsc --noEmit && yarn lint && yarn test`
Expected: green.

Manual check with `yarn dev`, logged in:

1. `/seasons/exploration_season` shows a **Eureka Collection** section under Radiant Whim with **27** set cards. Toggling one updates its card, the category chip, the overview and the season progress.
2. `/seasons/terras_call` shows **13**.
3. `/seasons/golden_dust` shows cloaks inside Limited-Time Resonance and a **Momo's Cloaks** section for the 8 with no category. Toggling a cloak changes no total or progress number.
4. `/seasons`: Exploration Season's card total equals its page's total.
5. The Eureka and Momo's Cloaks switches hide and show their sections, and the setting survives a reload.

- [ ] **Step 9: Commit**

```bash
git add app/momo-cloaks app/seasons components/seasons
git commit -m "feat(seasons): list eureka sets and momo cloaks on season pages"
```

---

## Phase 4 (PR 4): "Pieces" wording

### Task 10: Rename user-visible "variant(s)" to "piece(s)" for outfits and makeup

**Files:** everything the audit grep in Step 1 finds. Known hits include:

- `app/about/page.tsx:26,45,47,292`
- `app/outfits/outfit-variant-card.tsx:46` (`'Outfit Variant'` alt fallback)
- `app/profile/makeup-collection-charts.tsx:83` (`label: 'Variants'`)
- `app/admin/outfits/variants/outfit-variant-list.tsx:49` (`title="Outfit Variant"`)
- `app/admin/makeup/variants/makeup-variant-list.tsx:48` (`title="Makeup Variant"`)
- `app/admin/admin-variant-columns-toggle.tsx:25` (`aria-label="toggle variant image columns"`)
- `app/admin/admin-gap-queue.tsx` (display labels only; the `'outfit-variants'` keys stay)
- `lib/nav-links.ts` and the `pageTitle()` table (whatever file `pageTitle` reads from; find it with `grep -rn "export function pageTitle" lib app`)
- `app/makeup/*` and `components/makeup/*` toggles and labels

**Interfaces:** none; this task changes text only.

- [ ] **Step 1: Audit**

Run:

```bash
grep -rnE "['\">\`][^'\"<\`]*\b[Vv]ariants?\b[^'\"<\`]*['\"<\`]" app components lib \
  | grep -v __tests__ | grep -viE "eureka|from '|import |\bvariant[=:]|Tables<|\.from\(|formId|table=|'use " \
  > /tmp/variant-audit.txt; wc -l /tmp/variant-audit.txt
```

Go through each line and keep only the **rendered text**: JSX text, `title=`, `label:`, `aria-label`, `alt`, `helperText`, snackbar messages, page titles and nav titles. Skip identifiers, DB/table names, route paths, keys, comments, and anything under `eureka`.

- [ ] **Step 2: Replace**

For each kept hit, change `Variant` → `Piece`, `Variants` → `Pieces`, `variant` → `piece` and `variants` → `pieces`, keeping the case. Grammar: "a variant" → "a piece". "variants individually" → "pieces individually". Leave "Standalone Pieces" as it is.

- [ ] **Step 3: Update tests that assert the old text**

Run: `yarn test`
Any failure that asserts the old visible string (for example `getByText('Variants')`) gets its expectation updated to the new wording. Don't touch tests that fail for any other reason; investigate those instead.

- [ ] **Step 4: Re-audit**

Rerun the Step 1 grep and review the remaining lines.
Expected: none of them are user-visible text for outfits or makeup.

- [ ] **Step 5: Verify and commit**

Run: `yarn tsc --noEmit && yarn lint && yarn test`
Expected: green.

```bash
git add -A app components lib
git commit -m "feat(copy): call outfit and makeup variants 'pieces' in the UI"
```

Review the staged list before committing. `lib/theme-presets.ts` has an unrelated uncommitted change on this branch and must **not** be staged: run `git restore --staged lib/theme-presets.ts` if `-A` picked it up.

---

## Delivery

| PR             | Tasks | Merge gate                                                            |
| -------------- | ----- | --------------------------------------------------------------------- |
| 1 Release data | 1-4   | Migration pushed, types regenerated, admin round-trip checked by hand |
| 2 Date sort    | 5-6   | Grids reorder once season dates are entered                           |
| 3 Season pages | 7-9   | 27 / 13 eureka cards, cloaks uncounted, index = page totals           |
| 4 Rename       | 10    | Audit grep is clean                                                   |

After merging PR 1, fill in the season and trial dates and versions in the admin. PR 2's sort is only visible once they exist. Until then everything ties and falls back to `id`, which is today's order.
