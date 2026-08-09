# Admin Dashboard Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the twelve-`StatCard` admin dashboard with a totals-first layout, a completeness list, and a "Needs attention" gap queue that walks you into the existing edit forms.

**Architecture:** A new read-only `admin_entity_stats` SQL view supplies ~48 aggregates in one round trip, replacing twelve full-table fetches. A server-safe entity registry maps the 12 entity keys to their tables, tracked fields, and nav links; every new component and hook reads from it. Queue state lives entirely in validated URL params.

**Tech Stack:** Next.js 16 App Router (`cacheComponents: true`), Supabase (postgres-js + PostgREST), MUI v9, TypeScript, Yarn 4.

**Spec:** [`docs/superpowers/specs/2026-08-09-admin-dashboard-redesign-design.md`](../specs/2026-08-09-admin-dashboard-redesign-design.md)

## Global Constraints

- **No test runner exists.** No jest, vitest, or playwright. `package.json` scripts are only `dev`/`build`/`start`/`lint`/`format`/`lint:fix`. Verification is `yarn tsc --noEmit`, `yarn lint`, `yarn build`, SQL assertions, and driving the app. **Do not add a test framework** — it is not in scope for this plan.
- **Type-check command is `yarn tsc --noEmit`.** Not `yarn dlx tsc`, which fetches a bogus placeholder package.
- **Prettier:** no semicolons, single quotes, 2-space indent, 100 char width, ES5 trailing commas. A PostToolUse hook runs `prettier --write` + `eslint --fix` on every edited file automatically.
- **Never push to `main`.** Work stays on branch `docs/admin-dashboard-redesign-spec` (already checked out) or a branch off it.
- **PostgREST caps responses at 1000 rows.** Any query that could exceed it must paginate via `.range()`. See `hooks/data/admin/outfit-variants.ts:29`.
- **React `cache()` is for reads only.** Wrapping a mutation in `cache()` makes it silently no-op. All new hooks here are reads.
- **`use cache` cannot call `cookies()`.** Auth-dependent hooks must use React `cache()` with `lib/supabase/server.ts`.
- **Server-consumed constants must live in a module with no `'use client'`.** Importing a constant from a client module into a Server Action yields a throwing stub, not the value — see the comment block at the top of `lib/admin-routes.ts`.
- **Prefer CSS grid `Box` over MUI `Grid`.** `<Box sx={{ display: 'grid', gridTemplateColumns: {...}, gap: 2 }}>`.
- **MUI `Stack` rejects layout shorthands as direct props.** Put `justifyContent`, `alignItems` etc. in `sx`.
- **`git add` with `[slug]` in the path needs quoting** in zsh: `git add 'app/admin/.../edit/[slug]/page.tsx'`.
- **Entity keys are fixed** and used as URL values, view rows, and registry keys. Exactly these twelve, kebab-case: `outfit-sets`, `evolutions`, `outfit-variants`, `makeup-sets`, `makeup-variants`, `momo-cloaks`, `eureka-sets`, `eureka-variants`, `trials`, `seasons`, `season-categories`, `abilities`.

## File Structure

| File | Responsibility |
| --- | --- |
| `supabase/migrations/20260809120000_add_admin_entity_stats_view.sql` | The 12-branch aggregate view |
| `lib/admin-entities.ts` | Entity registry: key → table, tracked fields, links, domain. Server-safe. |
| `lib/admin-routes.ts` *(modify)* | Add `buildDashboardHref` + param validators |
| `hooks/data/admin/stats.ts` | `getAdminStats()` |
| `hooks/data/admin/gaps.ts` | `getGapRows()`, `getNextGapSlug()` |
| `app/admin/admin-totals-strip.tsx` | Five totals tiles |
| `app/admin/admin-completeness-list.tsx` | Bars + collapsed complete row |
| `app/admin/admin-completeness-toggle.tsx` | `'use client'` expand/collapse |
| `app/admin/admin-gap-queue.tsx` | Chips, rows, pagination |
| `app/admin/admin-gap-entity-select.tsx` | `'use client'` entity dropdown |
| `app/admin/page.tsx` *(rewrite)* | Composes the four sections |
| `app/admin/stat-card.tsx` *(delete)* | Superseded |
| 4 × `actions.ts` *(modify)* | Gap-aware `update_next` |

---

### Task 1: The `admin_entity_stats` view

**Files:**
- Create: `supabase/migrations/20260809120000_add_admin_entity_stats_view.sql`

**Interfaces:**
- Consumes: nothing.
- Produces: view `admin_entity_stats` with columns `entity text`, `total bigint`, `no_title bigint`, `no_image bigint`, `no_description bigint`, `gaps bigint`. Untracked columns are `null`, never `0`.

- [ ] **Step 1: Write the migration**

Create the file with this content. Note `outfit_sets` contributes two branches, and `eureka_variants` / `abilities` have no `description` column at all.

```sql
-- Aggregate counts for the admin dashboard. Read-only, no row data exposed.
-- Untracked fields are NULL (not 0) so the UI can tell "none missing" from
-- "this column is not part of the content model" — abilities and
-- season_categories legitimately have no images.

create or replace view admin_entity_stats as
  select 'outfit-sets' as entity, count(*) as total,
         count(*) filter (where title is null or btrim(title) = '') as no_title,
         count(*) filter (where image_url is null or btrim(image_url) = '') as no_image,
         count(*) filter (where description is null or btrim(description) = '') as no_description,
         count(*) filter (where (title is null or btrim(title) = '')
                             or (image_url is null or btrim(image_url) = '')) as gaps
    from outfit_sets where base_set is null

  union all
  select 'evolutions', count(*),
         count(*) filter (where title is null or btrim(title) = ''),
         count(*) filter (where image_url is null or btrim(image_url) = ''),
         count(*) filter (where description is null or btrim(description) = ''),
         count(*) filter (where (title is null or btrim(title) = '')
                             or (image_url is null or btrim(image_url) = ''))
    from outfit_sets where base_set is not null

  union all
  select 'outfit-variants', count(*),
         count(*) filter (where title is null or btrim(title) = ''),
         count(*) filter (where image_url is null or btrim(image_url) = ''),
         count(*) filter (where description is null or btrim(description) = ''),
         count(*) filter (where (title is null or btrim(title) = '')
                             or (image_url is null or btrim(image_url) = ''))
    from outfit_variants

  union all
  select 'makeup-sets', count(*),
         count(*) filter (where title is null or btrim(title) = ''),
         count(*) filter (where image_url is null or btrim(image_url) = ''),
         count(*) filter (where description is null or btrim(description) = ''),
         count(*) filter (where (title is null or btrim(title) = '')
                             or (image_url is null or btrim(image_url) = ''))
    from makeup_sets

  union all
  select 'makeup-variants', count(*),
         count(*) filter (where title is null or btrim(title) = ''),
         count(*) filter (where image_url is null or btrim(image_url) = ''),
         count(*) filter (where description is null or btrim(description) = ''),
         count(*) filter (where (title is null or btrim(title) = '')
                             or (image_url is null or btrim(image_url) = ''))
    from makeup_variants

  union all
  select 'momo-cloaks', count(*),
         count(*) filter (where title is null or btrim(title) = ''),
         count(*) filter (where image_url is null or btrim(image_url) = ''),
         count(*) filter (where description is null or btrim(description) = ''),
         count(*) filter (where (title is null or btrim(title) = '')
                             or (image_url is null or btrim(image_url) = ''))
    from momo_cloaks

  -- eureka_sets: no meaningful image. title only.
  union all
  select 'eureka-sets', count(*),
         count(*) filter (where title is null or btrim(title) = ''),
         null,
         count(*) filter (where description is null or btrim(description) = ''),
         count(*) filter (where title is null or btrim(title) = '')
    from eureka_sets

  -- eureka_variants: no title column, no description column. image only.
  union all
  select 'eureka-variants', count(*),
         null,
         count(*) filter (where image_url is null or btrim(image_url) = ''),
         null,
         count(*) filter (where image_url is null or btrim(image_url) = '')
    from eureka_variants

  union all
  select 'trials', count(*),
         count(*) filter (where title is null or btrim(title) = ''),
         count(*) filter (where image_url is null or btrim(image_url) = ''),
         count(*) filter (where description is null or btrim(description) = ''),
         count(*) filter (where (title is null or btrim(title) = '')
                             or (image_url is null or btrim(image_url) = ''))
    from trials

  union all
  select 'seasons', count(*),
         count(*) filter (where title is null or btrim(title) = ''),
         count(*) filter (where image_url is null or btrim(image_url) = ''),
         count(*) filter (where description is null or btrim(description) = ''),
         count(*) filter (where (title is null or btrim(title) = '')
                             or (image_url is null or btrim(image_url) = ''))
    from seasons

  -- season_categories: lookup row, no image expected. title only.
  union all
  select 'season-categories', count(*),
         count(*) filter (where title is null or btrim(title) = ''),
         null,
         count(*) filter (where description is null or btrim(description) = ''),
         count(*) filter (where title is null or btrim(title) = '')
    from season_categories

  -- abilities: lookup row, no image expected, no description column.
  union all
  select 'abilities', count(*),
         count(*) filter (where title is null or btrim(title) = ''),
         null, null,
         count(*) filter (where title is null or btrim(title) = '')
    from abilities;

-- RLS of the underlying tables applies to the caller, not the view owner.
alter view admin_entity_stats set (security_invoker = on);

grant select on admin_entity_stats to authenticated;
```

- [ ] **Step 2: Apply the migration**

```bash
cd /Users/mailauki/Developer/infinity-nikki-tracker && npx supabase db push
```

Expected: the migration applies without error. If `supabase link` has not been run in this clone, run it first — the `git-workflow` skill documents the Supabase CLI gotchas.

- [ ] **Step 3: Assert the view reproduces the measured baseline**

This is the real test for this task. Run:

```bash
cd /Users/mailauki/Developer/infinity-nikki-tracker && npx supabase db execute --query "select entity, total, no_title, no_image, gaps from admin_entity_stats order by total desc"
```

Expected, exactly (baseline measured 2026-08-09 — if the data has changed since, re-measure with the query in the spec and compare shapes, not literals):

| entity | total | no_title | no_image | gaps |
| --- | ---: | ---: | ---: | ---: |
| outfit-variants | 6534 | 2643 | 2579 | **2699** |
| eureka-variants | 456 | *null* | 16 | 16 |
| makeup-variants | 446 | 20 | 281 | 281 |
| evolutions | 437 | 0 | 0 | 0 |
| outfit-sets | 292 | 0 | 0 | 0 |
| momo-cloaks | 119 | 0 | 0 | 0 |
| makeup-sets | 87 | 0 | 14 | 14 |
| abilities | 47 | 0 | *null* | 0 |
| eureka-sets | 38 | 0 | *null* | 0 |
| seasons | 21 | 0 | 0 | 0 |
| season-categories | 18 | 0 | *null* | 0 |
| trials | 15 | 0 | 0 | 0 |

**The single most important assertion: `outfit-variants.gaps` is 2699, not 5222.** 5222 is `2643 + 2579`, which double-counts rows missing both fields. If you see 5222, the `gaps` expression is a sum instead of an `or` filter.

Second: `abilities.no_image`, `eureka-sets.no_image`, `season-categories.no_image` and `eureka-variants.no_title` must be **null**, not 0.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260809120000_add_admin_entity_stats_view.sql
git commit -m "feat(admin): add admin_entity_stats aggregate view"
```

---

### Task 2: Entity registry and dashboard href builder

**Files:**
- Create: `lib/admin-entities.ts`
- Modify: `lib/admin-routes.ts`

**Interfaces:**
- Consumes: `navLinksData` from `lib/nav-links.tsx`.
- Produces:
  - `type AdminEntityKey` — union of the 12 kebab-case keys
  - `type GapKind = 'image' | 'title' | 'description' | 'duplicate'`
  - `ADMIN_ENTITIES: Record<AdminEntityKey, AdminEntity>` where `AdminEntity = { key, title, table, slugColumn, tracksTitle, tracksImage, tracksDescription, isVariant, baseSetFilter, addHref?, listHref, editHref }`
  - `ADMIN_ENTITY_KEYS: AdminEntityKey[]`
  - `parseEntityKey(v: unknown): AdminEntityKey | null`
  - `parseGapKind(v: unknown): GapKind`
  - `buildDashboardHref(p: { entity?: string; gap?: string; page?: number }): string` (from `lib/admin-routes.ts`)

- [ ] **Step 1: Create the registry**

`lib/admin-entities.ts` — no `'use client'`, because Server Actions import it.

```ts
import { navLinksData } from '@/lib/nav-links'

export type AdminEntityKey =
  | 'outfit-sets'
  | 'evolutions'
  | 'outfit-variants'
  | 'makeup-sets'
  | 'makeup-variants'
  | 'momo-cloaks'
  | 'eureka-sets'
  | 'eureka-variants'
  | 'trials'
  | 'seasons'
  | 'season-categories'
  | 'abilities'

export type GapKind = 'image' | 'title' | 'description' | 'duplicate'

export interface AdminEntity {
  key: AdminEntityKey
  title: string
  /** Postgres table backing this entity. */
  table: string
  tracksTitle: boolean
  tracksImage: boolean
  tracksDescription: boolean
  /** Variant tables are the only ones the duplicate check applies to. */
  isVariant: boolean
  /**
   * outfit_sets backs two entities. `true` = evolutions (base_set IS NOT NULL),
   * `false` = base sets (base_set IS NULL), `undefined` = not applicable.
   */
  evolutionFilter?: boolean
  addHref?: string
  listHref: string
  editHref: string
}

const A = navLinksData.admin

export const ADMIN_ENTITIES: Record<AdminEntityKey, AdminEntity> = {
  'outfit-sets': {
    key: 'outfit-sets', title: A.outfits.sets.title, table: 'outfit_sets',
    tracksTitle: true, tracksImage: true, tracksDescription: true, isVariant: false,
    evolutionFilter: false,
    addHref: A.outfits.sets.add, listHref: A.outfits.sets.list, editHref: A.outfits.sets.edit,
  },
  evolutions: {
    key: 'evolutions', title: A.outfits.evolutions.title, table: 'outfit_sets',
    tracksTitle: true, tracksImage: true, tracksDescription: true, isVariant: false,
    evolutionFilter: true,
    listHref: A.outfits.evolutions.list, editHref: A.outfits.evolutions.edit,
  },
  'outfit-variants': {
    key: 'outfit-variants', title: A.outfits.variants.title, table: 'outfit_variants',
    tracksTitle: true, tracksImage: true, tracksDescription: true, isVariant: true,
    addHref: A.outfits.variants.add, listHref: A.outfits.variants.list, editHref: A.outfits.variants.edit,
  },
  'makeup-sets': {
    key: 'makeup-sets', title: A.makeup.sets.title, table: 'makeup_sets',
    tracksTitle: true, tracksImage: true, tracksDescription: true, isVariant: false,
    addHref: A.makeup.sets.add, listHref: A.makeup.sets.list, editHref: A.makeup.sets.edit,
  },
  'makeup-variants': {
    key: 'makeup-variants', title: A.makeup.variants.title, table: 'makeup_variants',
    tracksTitle: true, tracksImage: true, tracksDescription: true, isVariant: true,
    addHref: A.makeup.variants.add, listHref: A.makeup.variants.list, editHref: A.makeup.variants.edit,
  },
  'momo-cloaks': {
    key: 'momo-cloaks', title: A.momoCloaks.cloaks.title, table: 'momo_cloaks',
    tracksTitle: true, tracksImage: true, tracksDescription: true, isVariant: false,
    addHref: A.momoCloaks.cloaks.add, listHref: A.momoCloaks.cloaks.list, editHref: A.momoCloaks.cloaks.edit,
  },
  'eureka-sets': {
    key: 'eureka-sets', title: A.eureka.sets.title, table: 'eureka_sets',
    tracksTitle: true, tracksImage: false, tracksDescription: true, isVariant: false,
    addHref: A.eureka.sets.add, listHref: A.eureka.sets.list, editHref: A.eureka.sets.edit,
  },
  'eureka-variants': {
    key: 'eureka-variants', title: A.eureka.variants.title, table: 'eureka_variants',
    tracksTitle: false, tracksImage: true, tracksDescription: false, isVariant: true,
    addHref: A.eureka.variants.add, listHref: A.eureka.variants.list, editHref: A.eureka.variants.edit,
  },
  trials: {
    key: 'trials', title: A.eureka.trials.title, table: 'trials',
    tracksTitle: true, tracksImage: true, tracksDescription: true, isVariant: false,
    addHref: A.eureka.trials.add, listHref: A.eureka.trials.list, editHref: A.eureka.trials.edit,
  },
  seasons: {
    key: 'seasons', title: A.outfits.seasons.title, table: 'seasons',
    tracksTitle: true, tracksImage: true, tracksDescription: true, isVariant: false,
    addHref: A.outfits.seasons.add, listHref: A.outfits.seasons.list, editHref: A.outfits.seasons.edit,
  },
  'season-categories': {
    key: 'season-categories', title: A.outfits.seasonCategories.title, table: 'season_categories',
    tracksTitle: true, tracksImage: false, tracksDescription: true, isVariant: false,
    addHref: A.outfits.seasonCategories.add, listHref: A.outfits.seasonCategories.list,
    editHref: A.outfits.seasonCategories.edit,
  },
  abilities: {
    key: 'abilities', title: A.outfits.abilities.title, table: 'abilities',
    tracksTitle: true, tracksImage: false, tracksDescription: false, isVariant: false,
    addHref: A.outfits.abilities.add, listHref: A.outfits.abilities.list, editHref: A.outfits.abilities.edit,
  },
}

export const ADMIN_ENTITY_KEYS = Object.keys(ADMIN_ENTITIES) as AdminEntityKey[]

const GAP_KINDS: GapKind[] = ['image', 'title', 'description', 'duplicate']

export function parseEntityKey(v: unknown): AdminEntityKey | null {
  return typeof v === 'string' && v in ADMIN_ENTITIES ? (v as AdminEntityKey) : null
}

export function parseGapKind(v: unknown): GapKind {
  return typeof v === 'string' && (GAP_KINDS as string[]).includes(v) ? (v as GapKind) : 'image'
}

/** Domain groupings for the totals strip. Lookups appear only in the all-entries total. */
export const ADMIN_DOMAINS = [
  { title: 'Outfits', lead: 'outfit-variants', leadNoun: 'variants',
    chips: [{ key: 'outfit-sets', label: 'sets' }, { key: 'evolutions', label: 'evo' }] },
  { title: 'Eureka', lead: 'eureka-variants', leadNoun: 'variants',
    chips: [{ key: 'eureka-sets', label: 'sets' }, { key: 'trials', label: 'trials' }] },
  { title: 'Makeup', lead: 'makeup-variants', leadNoun: 'variants',
    chips: [{ key: 'makeup-sets', label: 'sets' }] },
  { title: "Momo's", lead: 'momo-cloaks', leadNoun: 'cloaks', chips: [] },
] as const satisfies ReadonlyArray<{
  title: string
  lead: AdminEntityKey
  leadNoun: string
  chips: ReadonlyArray<{ key: AdminEntityKey; label: string }>
}>
```

- [ ] **Step 2: Add `buildDashboardHref` to `lib/admin-routes.ts`**

Append to the existing file — **do not** move `ADMIN_DASHBOARD` or add a `'use client'` directive; the comment block at the top of that file explains why.

```ts
/**
 * Rebuild the dashboard URL from validated scalars.
 *
 * Deliberately NOT a `?returnTo=<url>` passthrough. The 2026-07-09
 * remove-admin-back-searchparams spec removed `?back=<url>` precisely so
 * redirect() would stop receiving a URL-decoded query value. This takes an
 * entity key, a gap kind and a page number, and always emits '/admin?…' —
 * an attacker-supplied value can change which queue you land on, nothing more.
 */
export function buildDashboardHref({
  entity,
  gap,
  page,
}: {
  entity?: string | null
  gap?: string | null
  page?: number | null
}): string {
  const params = new URLSearchParams()
  if (entity) params.set('entity', entity)
  if (gap) params.set('gap', gap)
  if (page && page > 1) params.set('page', String(page))
  const qs = params.toString()
  return qs ? `${ADMIN_DASHBOARD}?${qs}` : ADMIN_DASHBOARD
}
```

Callers pass values already through `parseEntityKey` / `parseGapKind`, so the strings are whitelisted before they reach here.

- [ ] **Step 3: Type-check**

```bash
cd /Users/mailauki/Developer/infinity-nikki-tracker && yarn tsc --noEmit
```

Expected: PASS. A failure here almost certainly means a `navLinksData.admin.*` path is wrong — `evolutions` has no `add`, which is why `addHref` is optional.

- [ ] **Step 4: Verify no client-module leak**

```bash
cd /Users/mailauki/Developer/infinity-nikki-tracker && head -1 lib/admin-entities.ts && grep -c "use client" lib/admin-entities.ts lib/admin-routes.ts
```

Expected: first line is the `import`, and both files report `0`.

- [ ] **Step 5: Commit**

```bash
git add lib/admin-entities.ts lib/admin-routes.ts
git commit -m "feat(admin): add entity registry and dashboard href builder"
```

---

### Task 3: `getAdminStats()`

**Files:**
- Create: `hooks/data/admin/stats.ts`

**Interfaces:**
- Consumes: `ADMIN_ENTITIES`, `AdminEntityKey` (Task 2); view `admin_entity_stats` (Task 1).
- Produces: `getAdminStats(): Promise<AdminStat[]>` and `type AdminStat = { key, title, total, noTitle, noImage, noDescription, gaps, complete, percentComplete, addHref, listHref }`. `noTitle`/`noImage`/`noDescription` are `number | null` — null means untracked.

- [ ] **Step 1: Write the hook**

```ts
import { createClient } from '@/lib/supabase/server'
import { cache } from 'react'
import { ADMIN_ENTITIES, ADMIN_ENTITY_KEYS, type AdminEntityKey } from '@/lib/admin-entities'

export interface AdminStat {
  key: AdminEntityKey
  title: string
  total: number
  /** null = field not tracked for this entity (e.g. abilities have no image). */
  noTitle: number | null
  noImage: number | null
  noDescription: number | null
  /** Rows missing ANY tracked field. NOT noTitle + noImage — a row can lack both. */
  gaps: number
  complete: number
  percentComplete: number
  addHref?: string
  listHref: string
}

// Auth-dependent (createClient reads cookies), so React cache(), not `use cache`.
export const getAdminStats = cache(async (): Promise<AdminStat[]> => {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('admin_entity_stats')
    .select('entity, total, no_title, no_image, no_description, gaps')

  if (error) throw error

  const byKey = new Map((data ?? []).map((r) => [r.entity as AdminEntityKey, r]))

  return ADMIN_ENTITY_KEYS.map((key) => {
    const e = ADMIN_ENTITIES[key]
    const row = byKey.get(key)
    const total = row?.total ?? 0
    const gaps = row?.gaps ?? 0
    const complete = total - gaps
    return {
      key,
      title: e.title,
      total,
      noTitle: e.tracksTitle ? (row?.no_title ?? 0) : null,
      noImage: e.tracksImage ? (row?.no_image ?? 0) : null,
      noDescription: e.tracksDescription ? (row?.no_description ?? 0) : null,
      gaps,
      complete,
      percentComplete: total === 0 ? 100 : Math.round((complete / total) * 100),
      addHref: e.addHref,
      listHref: e.listHref,
    }
  })
})
```

The registry drives which counts surface, so even if the view ever returned a number for an untracked column it would not reach the UI.

- [ ] **Step 2: Regenerate Supabase types so the view is known**

```bash
cd /Users/mailauki/Developer/infinity-nikki-tracker && npx supabase gen types typescript --linked > lib/types/supabase.ts
```

Then confirm the view landed in the `Views` section:

```bash
grep -n "admin_entity_stats" lib/types/supabase.ts
```

Expected: at least one hit. `lib/types/supabase.ts` is generated — regenerate it, never hand-edit.

- [ ] **Step 3: Type-check**

```bash
cd /Users/mailauki/Developer/infinity-nikki-tracker && yarn tsc --noEmit
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add hooks/data/admin/stats.ts lib/types/supabase.ts
git commit -m "feat(admin): add getAdminStats reading the aggregate view"
```

---

### Task 4: `getGapRows()` and `getNextGapSlug()`

**Files:**
- Create: `hooks/data/admin/gaps.ts`

**Interfaces:**
- Consumes: `ADMIN_ENTITIES`, `AdminEntityKey`, `GapKind` (Task 2).
- Produces:
  - `GAP_PAGE_SIZE = 10`
  - `type GapRow = { slug: string; title: string; imageUrl: string | null; editHref: string }`
  - `getGapRows(a: { entity: AdminEntityKey; gap: GapKind; page: number }): Promise<{ rows: GapRow[]; total: number }>`
  - `getNextGapSlug(a: { entity: AdminEntityKey; gap: GapKind; afterSlug: string }): Promise<string | null>`

- [ ] **Step 1: Write the hook**

```ts
import { createClient } from '@/lib/supabase/server'
import { cache } from 'react'
import { toSlug, toTitle } from '@/lib/utils'
import { ADMIN_ENTITIES, type AdminEntityKey, type GapKind } from '@/lib/admin-entities'

export const GAP_PAGE_SIZE = 10

export interface GapRow {
  slug: string
  title: string
  imageUrl: string | null
  editHref: string
}

type Client = Awaited<ReturnType<typeof createClient>>

/**
 * Base query for one entity, with the evolution split applied.
 * `outfit_sets` backs both outfit-sets and evolutions.
 */
function baseQuery(supabase: Client, key: AdminEntityKey, select: string) {
  const e = ADMIN_ENTITIES[key]
  let q = supabase.from(e.table).select(select, { count: 'exact' })
  if (e.evolutionFilter === true) q = q.not('base_set', 'is', null)
  if (e.evolutionFilter === false) q = q.is('base_set', null)
  return q
}

/** Apply the gap predicate. `duplicate` is handled separately — it is not a column test. */
function applyGap<T>(q: T, key: AdminEntityKey, gap: GapKind): T {
  const e = ADMIN_ENTITIES[key]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query = q as any
  if (gap === 'image' && e.tracksImage) return query.or('image_url.is.null,image_url.eq.')
  if (gap === 'title' && e.tracksTitle) return query.or('title.is.null,title.eq.')
  if (gap === 'description' && e.tracksDescription)
    return query.or('description.is.null,description.eq.')
  return q
}

export const getGapRows = cache(
  async ({
    entity,
    gap,
    page,
  }: {
    entity: AdminEntityKey
    gap: GapKind
    page: number
  }): Promise<{ rows: GapRow[]; total: number }> => {
    const e = ADMIN_ENTITIES[entity]

    // A gap that this entity does not track has no rows by definition.
    if (gap === 'image' && !e.tracksImage) return { rows: [], total: 0 }
    if (gap === 'title' && !e.tracksTitle) return { rows: [], total: 0 }
    if (gap === 'description' && !e.tracksDescription) return { rows: [], total: 0 }
    if (gap === 'duplicate') return getDuplicateRows(entity, page)

    const supabase = await createClient()
    const from = (page - 1) * GAP_PAGE_SIZE

    const select = e.tracksTitle ? 'slug, title, image_url' : 'slug, image_url'
    let query = baseQuery(supabase, entity, select)
    query = applyGap(query, entity, gap)

    // .range() is mandatory: PostgREST caps at 1000 rows and outfit_variants
    // has ~2.6k rows in some gap sets.
    const { data, count, error } = await query
      .order('slug', { ascending: true })
      .range(from, from + GAP_PAGE_SIZE - 1)

    if (error) throw error

    const rows = (data ?? []).map((r) => {
      const row = r as { slug: string; title?: string | null; image_url: string | null }
      return {
        slug: row.slug,
        title: row.title?.trim() || toTitle(row.slug),
        imageUrl: row.image_url,
        editHref: `${e.editHref}/${row.slug}`,
      }
    })

    return { rows, total: count ?? 0 }
  }
)

/**
 * Title-derived duplicate detection, computed on the fly.
 *
 * The two slug schemes in app/admin/outfits/variants/fields.tsx never overlap —
 * a standalone piece slugs from title+category, a set piece from set+category —
 * so the same garment added both ways produces two different slugs. Grouping by
 * toSlug(title) surfaces those. Variants only; other entities have no such split.
 *
 * Untitled rows cannot participate (~2.6k outfit variants have no title), which
 * is why this is a detection aid, not an enforcement mechanism.
 */
async function getDuplicateRows(
  entity: AdminEntityKey,
  page: number
): Promise<{ rows: GapRow[]; total: number }> {
  const e = ADMIN_ENTITIES[entity]
  if (!e.isVariant || !e.tracksTitle) return { rows: [], total: 0 }

  const supabase = await createClient()

  // Titled variants only. Paginated because PostgREST caps at 1000 rows.
  const all: { slug: string; title: string | null }[] = []
  const PAGE = 1000
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from(e.table)
      .select('slug, title')
      .not('title', 'is', null)
      .order('slug', { ascending: true })
      .range(from, from + PAGE - 1)
    if (error) throw error
    const batch = (data ?? []) as { slug: string; title: string | null }[]
    all.push(...batch)
    if (batch.length < PAGE) break
  }

  const groups = new Map<string, { slug: string; title: string | null }[]>()
  for (const row of all) {
    const key = toSlug(row.title?.trim() ?? '')
    if (!key) continue
    const bucket = groups.get(key)
    if (bucket) bucket.push(row)
    else groups.set(key, [row])
  }

  const dupes = [...groups.values()].filter((g) => g.length > 1).flat()
  const from = (page - 1) * GAP_PAGE_SIZE

  return {
    rows: dupes.slice(from, from + GAP_PAGE_SIZE).map((r) => ({
      slug: r.slug,
      title: r.title?.trim() || toTitle(r.slug),
      imageUrl: null,
      editHref: `${e.editHref}/${r.slug}`,
    })),
    total: dupes.length,
  }
}

/** Next row in the same gap set, for "Save & next gap". Null when exhausted. */
export const getNextGapSlug = cache(
  async ({
    entity,
    gap,
    afterSlug,
  }: {
    entity: AdminEntityKey
    gap: GapKind
    afterSlug: string
  }): Promise<string | null> => {
    const e = ADMIN_ENTITIES[entity]
    if (gap === 'duplicate') return null

    const supabase = await createClient()
    let query = baseQuery(supabase, entity, 'slug')
    query = applyGap(query, entity, gap)

    const { data, error } = await query
      .gt('slug', afterSlug)
      .order('slug', { ascending: true })
      .limit(1)

    if (error) throw error
    return (data ?? [])[0] ? ((data ?? [])[0] as { slug: string }).slug : null
  }
)
```

Note the row just saved no longer matches the gap predicate (you filled the image in), so `getNextGapSlug` cannot return the record you came from even though it uses `.gt()` on slug.

- [ ] **Step 2: Type-check and lint**

```bash
cd /Users/mailauki/Developer/infinity-nikki-tracker && yarn tsc --noEmit && yarn lint
```

Expected: both PASS. The one `eslint-disable` line is deliberate — PostgREST's builder type changes shape after `.or()`, and threading the generic through adds noise for no safety.

- [ ] **Step 3: Verify pagination is real**

```bash
cd /Users/mailauki/Developer/infinity-nikki-tracker && grep -n "range(" hooks/data/admin/gaps.ts
```

Expected: at least 2 hits. A `getGapRows` without `.range()` reintroduces the bug this whole plan exists to fix.

- [ ] **Step 4: Commit**

```bash
git add hooks/data/admin/gaps.ts
git commit -m "feat(admin): add gap row queries with server-side pagination"
```

---

### Task 5: Totals strip

**Files:**
- Create: `app/admin/admin-totals-strip.tsx`

**Interfaces:**
- Consumes: `AdminStat` (Task 3), `ADMIN_DOMAINS` (Task 2).
- Produces: `<AdminTotalsStrip stats={AdminStat[]} />`, a Server Component.

- [ ] **Step 1: Write the component**

```tsx
import { Box, Card, CardContent, Chip, Typography } from '@mui/material'
import Link from 'next/link'
import { ADMIN_DOMAINS, type AdminEntityKey } from '@/lib/admin-entities'
import { buildDashboardHref } from '@/lib/admin-routes'
import type { AdminStat } from '@/hooks/data/admin/stats'

export default function AdminTotalsStrip({ stats }: { stats: AdminStat[] }) {
  const by = new Map(stats.map((s) => [s.key, s]))
  const get = (k: AdminEntityKey) => by.get(k)

  const allEntries = stats.reduce((n, s) => n + s.total, 0)
  const allGaps = stats.reduce((n, s) => n + s.gaps, 0)
  const percent = allEntries === 0 ? 100 : Math.round(((allEntries - allGaps) / allEntries) * 100)

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr 1fr', md: '1.25fr 1fr 1fr 1fr 1fr' },
        gap: 2,
      }}
    >
      <Card sx={{ borderWidth: 2 }} variant="outlined">
        <CardContent>
          <Typography color="text.secondary" component="p" variant="overline">
            All entries
          </Typography>
          <Typography component="p" variant="h2">
            {allEntries.toLocaleString()}
          </Typography>
          <Chip label={`${percent}% complete`} size="small" sx={{ mt: 1 }} variant="outlined" />
        </CardContent>
      </Card>

      {ADMIN_DOMAINS.map((domain) => {
        const lead = get(domain.lead)
        return (
          <Card key={domain.title} variant="outlined">
            <CardContent>
              <Typography color="text.secondary" component="p" variant="overline">
                {domain.title}
              </Typography>
              <Typography component="p" variant="h2">
                {(lead?.total ?? 0).toLocaleString()}
              </Typography>
              <Typography color="text.secondary" component="p" variant="caption">
                {domain.leadNoun}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                {domain.chips.length === 0 ? (
                  <Chip
                    disabled
                    label="no sets"
                    size="small"
                    sx={{ opacity: 0.6 }}
                    variant="outlined"
                  />
                ) : (
                  domain.chips.map((chip) => (
                    <Chip
                      key={chip.key}
                      clickable
                      component={Link}
                      href={buildDashboardHref({ entity: chip.key })}
                      label={`${(get(chip.key)?.total ?? 0).toLocaleString()} ${chip.label}`}
                      size="small"
                      variant="outlined"
                    />
                  ))
                )}
              </Box>
            </CardContent>
          </Card>
        )
      })}
    </Box>
  )
}
```

`allEntries` sums all twelve entities, so it is a true total (8,510). The domain tiles report their lead entity only and deliberately do **not** sum to it — see the spec.

- [ ] **Step 2: Type-check**

```bash
cd /Users/mailauki/Developer/infinity-nikki-tracker && yarn tsc --noEmit
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add app/admin/admin-totals-strip.tsx
git commit -m "feat(admin): add totals strip"
```

---

### Task 6: Completeness list

**Files:**
- Create: `app/admin/admin-completeness-list.tsx`
- Create: `app/admin/admin-completeness-toggle.tsx`

**Interfaces:**
- Consumes: `AdminStat` (Task 3), `buildDashboardHref` (Task 2).
- Produces: `<AdminCompletenessList stats={AdminStat[]} />`.

- [ ] **Step 1: Write the client toggle**

`app/admin/admin-completeness-toggle.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { Box, Collapse, Typography } from '@mui/material'
import { ExpandLess, ExpandMore } from '@mui/icons-material'

export default function AdminCompletenessToggle({
  summary,
  children,
}: {
  summary: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Box
        aria-expanded={open}
        component="button"
        onClick={() => setOpen((v) => !v)}
        sx={{
          alignItems: 'center',
          background: 'none',
          border: 0,
          color: 'text.secondary',
          cursor: 'pointer',
          display: 'flex',
          gap: 0.5,
          px: 0,
          py: 1,
          width: '100%',
        }}
      >
        {open ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
        <Typography color="text.secondary" variant="body2">
          {summary}
        </Typography>
      </Box>
      <Collapse in={open}>{children}</Collapse>
    </>
  )
}
```

- [ ] **Step 2: Write the list**

`app/admin/admin-completeness-list.tsx`:

```tsx
import { Box, Card, CardContent, Chip, LinearProgress, Typography } from '@mui/material'
import Link from 'next/link'
import { buildDashboardHref } from '@/lib/admin-routes'
import type { AdminStat } from '@/hooks/data/admin/stats'
import AdminCompletenessToggle from './admin-completeness-toggle'

function Row({ stat }: { stat: AdminStat }) {
  return (
    <Box
      sx={{
        alignItems: 'center',
        display: 'grid',
        gap: 1.5,
        gridTemplateColumns: { xs: '1fr auto', md: '150px 1fr auto 70px' },
        py: 1,
      }}
    >
      <Typography variant="body2">{stat.title}</Typography>
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <LinearProgress
          aria-label={`${stat.title} ${stat.percentComplete}% complete`}
          color={stat.gaps === 0 ? 'success' : 'warning'}
          value={stat.percentComplete}
          variant="determinate"
        />
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {stat.gaps === 0 ? (
          <Chip color="success" label="complete" size="small" variant="outlined" />
        ) : (
          <>
            {/* Chips render only where the field is tracked — a chip for an
                untracked column would imply a backlog that cannot exist. */}
            {stat.noTitle !== null && stat.noTitle > 0 && (
              <Chip
                clickable
                component={Link}
                href={buildDashboardHref({ entity: stat.key, gap: 'title' })}
                label={`${stat.noTitle.toLocaleString()} title`}
                size="small"
                variant="outlined"
              />
            )}
            {stat.noImage !== null && stat.noImage > 0 && (
              <Chip
                clickable
                component={Link}
                href={buildDashboardHref({ entity: stat.key, gap: 'image' })}
                label={`${stat.noImage.toLocaleString()} img`}
                size="small"
                variant="outlined"
              />
            )}
          </>
        )}
      </Box>
      <Typography sx={{ fontWeight: 600, textAlign: 'right' }} variant="body2">
        {stat.total.toLocaleString()}
      </Typography>
    </Box>
  )
}

export default function AdminCompletenessList({ stats }: { stats: AdminStat[] }) {
  const withGaps = stats.filter((s) => s.gaps > 0).sort((a, b) => b.total - a.total)
  const complete = stats.filter((s) => s.gaps === 0).sort((a, b) => b.total - a.total)
  const completeTotal = complete.reduce((n, s) => n + s.total, 0)

  const all = stats.reduce((n, s) => n + s.total, 0)
  const allGaps = stats.reduce((n, s) => n + s.gaps, 0)

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography color="text.secondary" component="p" variant="overline">
          Completeness — {(all - allGaps).toLocaleString()} of {all.toLocaleString()} complete
        </Typography>
        {withGaps.map((s) => (
          <Row key={s.key} stat={s} />
        ))}
        {complete.length > 0 && (
          <AdminCompletenessToggle
            summary={`${complete.length} entities complete · ${completeTotal.toLocaleString()} entries`}
          >
            {complete.map((s) => (
              <Row key={s.key} stat={s} />
            ))}
          </AdminCompletenessToggle>
        )}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 3: Type-check and lint**

```bash
cd /Users/mailauki/Developer/infinity-nikki-tracker && yarn tsc --noEmit && yarn lint
```

Expected: both PASS.

- [ ] **Step 4: Commit**

```bash
git add app/admin/admin-completeness-list.tsx app/admin/admin-completeness-toggle.tsx
git commit -m "feat(admin): add completeness list with collapsed complete entities"
```

---

### Task 7: Needs attention queue

**Files:**
- Create: `app/admin/admin-gap-queue.tsx`
- Create: `app/admin/admin-gap-entity-select.tsx`

**Interfaces:**
- Consumes: `getGapRows`, `GAP_PAGE_SIZE` (Task 4); `AdminStat` (Task 3); registry + `buildDashboardHref` (Task 2).
- Produces: `<AdminGapQueue stats={AdminStat[]} entity={AdminEntityKey} gap={GapKind} page={number} />`, a Server Component that fetches its own rows; `<AdminGapEntitySelect entity gap />`, a client dropdown.

- [ ] **Step 1: Write the entity dropdown**

A `<Select>` needs an onChange handler, so this is the one client component in the queue. It navigates rather than holding state — the URL stays the source of truth.

`app/admin/admin-gap-entity-select.tsx`:

```tsx
'use client'

import { MenuItem, TextField } from '@mui/material'
import { useRouter } from 'next/navigation'
import {
  ADMIN_ENTITIES,
  ADMIN_ENTITY_KEYS,
  type AdminEntityKey,
  type GapKind,
} from '@/lib/admin-entities'
import { buildDashboardHref } from '@/lib/admin-routes'

export default function AdminGapEntitySelect({
  entity,
  gap,
}: {
  entity: AdminEntityKey
  gap: GapKind
}) {
  const router = useRouter()

  return (
    <TextField
      label="Entity"
      onChange={(e) =>
        router.push(buildDashboardHref({ entity: e.target.value, gap }))
      }
      select
      size="small"
      sx={{ minWidth: 200 }}
      value={entity}
    >
      {ADMIN_ENTITY_KEYS.map((key) => (
        <MenuItem key={key} value={key}>
          {ADMIN_ENTITIES[key].title}
        </MenuItem>
      ))}
    </TextField>
  )
}
```

- [ ] **Step 2: Write the queue component**

```tsx
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Typography,
} from '@mui/material'
import { Add, Category } from '@mui/icons-material'
import Link from 'next/link'
import LazyImage from '@/components/lazy-image'
import { getGapRows, GAP_PAGE_SIZE } from '@/hooks/data/admin/gaps'
import { ADMIN_ENTITIES, type AdminEntityKey, type GapKind } from '@/lib/admin-entities'
import { buildDashboardHref } from '@/lib/admin-routes'
import type { AdminStat } from '@/hooks/data/admin/stats'
import AdminGapEntitySelect from './admin-gap-entity-select'

const GAPS: { kind: GapKind; label: string }[] = [
  { kind: 'image', label: 'No image' },
  { kind: 'title', label: 'No title' },
  { kind: 'description', label: 'No description' },
  { kind: 'duplicate', label: 'Dupes' },
]

function gapCount(stat: AdminStat | undefined, kind: GapKind): number | null {
  if (!stat) return null
  if (kind === 'image') return stat.noImage
  if (kind === 'title') return stat.noTitle
  if (kind === 'description') return stat.noDescription
  return null
}

export default async function AdminGapQueue({
  stats,
  entity,
  gap,
  page,
}: {
  stats: AdminStat[]
  entity: AdminEntityKey
  gap: GapKind
  page: number
}) {
  const e = ADMIN_ENTITIES[entity]
  const stat = stats.find((s) => s.key === entity)
  const { rows, total } = await getGapRows({ entity, gap, page })

  const lastPage = Math.max(1, Math.ceil(total / GAP_PAGE_SIZE))
  const from = total === 0 ? 0 : (page - 1) * GAP_PAGE_SIZE + 1
  const to = Math.min(page * GAP_PAGE_SIZE, total)

  return (
    <Card variant="outlined">
      <CardContent>
        <Box sx={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
          <Typography component="p" variant="overline">
            Needs attention
          </Typography>
          <Box sx={{ ml: 'auto' }} />
          {/* All 12 entities listed — confirming an entity is clean is worth doing. */}
          <AdminGapEntitySelect entity={entity} gap={gap} />
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
          {GAPS.map(({ kind, label }) => {
            // Hide a filter the entity cannot have. Duplicates apply to variants only.
            if (kind === 'image' && !e.tracksImage) return null
            if (kind === 'title' && !e.tracksTitle) return null
            if (kind === 'description' && !e.tracksDescription) return null
            if (kind === 'duplicate' && !e.isVariant) return null
            const count = gapCount(stat, kind)
            return (
              <Chip
                key={kind}
                clickable
                color={kind === gap ? 'primary' : 'default'}
                component={Link}
                href={buildDashboardHref({ entity, gap: kind })}
                label={count === null ? label : `${label} ${count.toLocaleString()}`}
                size="small"
                sx={kind === 'description' ? { borderStyle: 'dashed', opacity: 0.7 } : undefined}
                variant={kind === gap ? 'filled' : 'outlined'}
              />
            )
          })}
          {e.addHref && (
            <Button
              component={Link}
              href={e.addHref}
              size="small"
              startIcon={<Add />}
              sx={{ ml: 'auto' }}
            >
              Add
            </Button>
          )}
        </Box>

        {rows.length === 0 ? (
          <Typography color="text.disabled" sx={{ py: 3, textAlign: 'center' }} variant="body2">
            Nothing needs attention in {e.title}.
          </Typography>
        ) : (
          <>
            <List disablePadding>
              {rows.map((row, i) => (
                <Box key={row.slug}>
                  <ListItem disablePadding>
                    <ListItemButton component={Link} href={row.editHref}>
                      <ListItemAvatar>
                        <LazyImage
                          alt={row.slug}
                          src={row.imageUrl ?? undefined}
                          sx={{ bgcolor: 'transparent', color: 'text.disabled' }}
                        >
                          <Category fontSize="inherit" />
                        </LazyImage>
                      </ListItemAvatar>
                      <ListItemText
                        primary={row.title}
                        secondary={row.slug}
                        slotProps={{
                          primary: { variant: 'body2', noWrap: true },
                          secondary: { variant: 'caption' },
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                  {i < rows.length - 1 && <Divider component="li" variant="inset" />}
                </Box>
              ))}
            </List>

            <Box
              sx={{ alignItems: 'center', display: 'flex', gap: 1, justifyContent: 'space-between', mt: 1.5 }}
            >
              <Typography color="text.secondary" variant="caption">
                {from}–{to} of {total.toLocaleString()}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  component={Link}
                  disabled={page <= 1}
                  href={buildDashboardHref({ entity, gap, page: page - 1 })}
                  size="small"
                >
                  Previous
                </Button>
                <Button
                  component={Link}
                  disabled={page >= lastPage}
                  href={buildDashboardHref({ entity, gap, page: page + 1 })}
                  size="small"
                >
                  Next
                </Button>
                <Button
                  component={Link}
                  href={`${rows[0].editHref}?entity=${entity}&gap=${gap}&page=${page}`}
                  size="small"
                  variant="outlined"
                >
                  Start fixing
                </Button>
              </Box>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  )
}
```

"Start fixing" is the only link that carries the queue params into the edit form — that is what Task 9 reads to power "Save & next gap" and the return trip.

- [ ] **Step 3: Type-check and lint**

```bash
cd /Users/mailauki/Developer/infinity-nikki-tracker && yarn tsc --noEmit && yarn lint
```

Expected: both PASS.

- [ ] **Step 4: Commit**

```bash
git add app/admin/admin-gap-queue.tsx app/admin/admin-gap-entity-select.tsx
git commit -m "feat(admin): add needs-attention gap queue"
```

---

### Task 8: Rewrite the dashboard page

**Files:**
- Modify: `app/admin/page.tsx` (full rewrite)
- Delete: `app/admin/stat-card.tsx`

**Interfaces:**
- Consumes: everything from Tasks 3–7.
- Produces: the assembled `/admin` route.

- [ ] **Step 1: Rewrite `page.tsx`**

Replace the entire file:

```tsx
import { Suspense } from 'react'
import { Alert, Box, Stack } from '@mui/material'
import { Metadata } from 'next'
import { getAdminStats } from '@/hooks/data/admin/stats'
import { getRecentlyAdded, getRecentlyEdited } from '@/hooks/data/admin/recents'
import { parseEntityKey, parseGapKind, type AdminEntityKey } from '@/lib/admin-entities'
import AdminRecentsList from './admin-recents-list'
import AdminTotalsStrip from './admin-totals-strip'
import AdminCompletenessList from './admin-completeness-list'
import AdminGapQueue from './admin-gap-queue'

export const metadata: Metadata = {
  title: 'Admin',
}

type SearchParams = Promise<{ entity?: string; gap?: string; page?: string }>

export default function AdminPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Stack spacing={2}>
      {/* Separate boundaries so stats and recents stream independently and one
          failure cannot blank the page. */}
      <Suspense>
        <AdminOverview searchParams={searchParams} />
      </Suspense>
      <Suspense>
        <AdminRecents />
      </Suspense>
    </Stack>
  )
}

async function AdminOverview({ searchParams }: { searchParams: SearchParams }) {
  const { entity: rawEntity, gap: rawGap, page: rawPage } = await searchParams

  let stats
  try {
    stats = await getAdminStats()
  } catch {
    return <Alert severity="error">Could not load admin statistics. Try reloading.</Alert>
  }

  const gap = parseGapKind(rawGap)
  // Default to the largest entity that actually has gaps, so the queue opens on
  // real work rather than an empty state.
  const fallback: AdminEntityKey =
    [...stats].sort((a, b) => b.gaps - a.gaps)[0]?.key ?? 'outfit-variants'
  const entity = parseEntityKey(rawEntity) ?? fallback

  const parsedPage = Number.parseInt(rawPage ?? '1', 10)
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1

  return (
    <Stack spacing={2}>
      <AdminTotalsStrip stats={stats} />
      <AdminCompletenessList stats={stats} />
      <Suspense key={`${entity}-${gap}-${page}`}>
        <AdminGapQueue entity={entity} gap={gap} page={page} stats={stats} />
      </Suspense>
    </Stack>
  )
}

async function AdminRecents() {
  const [recentlyAdded, recentlyEdited] = await Promise.all([
    getRecentlyAdded(),
    getRecentlyEdited(),
  ])

  return (
    <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
      <AdminRecentsList items={recentlyAdded} title="Recently Added" />
      <AdminRecentsList items={recentlyEdited} title="Recently Edited" />
    </Box>
  )
}
```

The `key` on the queue's `Suspense` makes navigating between filters show a fallback rather than a stale list.

- [ ] **Step 2: Delete `StatCard` — after the rewrite, not before**

```bash
cd /Users/mailauki/Developer/infinity-nikki-tracker && rm app/admin/stat-card.tsx && grep -rn "StatCard" app hooks lib components
```

Expected: the only remaining hit is the explanatory comment in `app/outfits/seasons/[slug]/season-overview.tsx`, which mentions `StatCard` in prose and imports nothing. If any import shows up, the rewrite in Step 1 was incomplete.

- [ ] **Step 3: Type-check, lint, build**

```bash
cd /Users/mailauki/Developer/infinity-nikki-tracker && yarn tsc --noEmit && yarn lint && yarn build
```

Expected: all three PASS.

- [ ] **Step 4: Confirm the full-table fetches are gone**

```bash
cd /Users/mailauki/Developer/infinity-nikki-tracker && grep -nE "getOutfitVariantsRaw|getMakeupVariantsRaw|getMomoCloaksRaw|getOutfitSets|getEurekaSets|getAdminData" app/admin/page.tsx
```

Expected: **no output.** Any hit means the ~8,500-row fetch survived the rewrite.

- [ ] **Step 5: Drive the app**

```bash
cd /Users/mailauki/Developer/infinity-nikki-tracker && yarn dev
```

Visit `http://localhost:3000/admin` as an admin user and confirm:
- Totals strip shows 8,510 all entries; Outfits tile shows 6,534 with chips `292 sets` / `437 evo`; Momo's shows 119 with a muted "no sets".
- Completeness list shows four rows with gaps, then a collapsed "8 entities complete · 987 entries" that expands.
- Queue opens on Outfit Variants / No image with 2,579 and ten rows.
- `?entity=nonsense&gap=nonsense&page=999` falls back without erroring.
- Abilities and Season Categories show no image chip anywhere.

- [ ] **Step 6: Commit**

```bash
git add app/admin/page.tsx && git rm app/admin/stat-card.tsx
git commit -m "feat(admin): rebuild dashboard around totals, completeness and gap queue"
```

---

### Task 9: Gap-aware "Save & next gap"

**Files:**
- Modify: `app/admin/outfits/variants/actions.ts:99-112`
- Modify: `app/admin/makeup/variants/actions.ts`
- Modify: `app/admin/makeup/sets/actions.ts`
- Modify: `app/admin/eureka/variants/actions.ts`

**Interfaces:**
- Consumes: `getNextGapSlug` (Task 4), `buildDashboardHref`, `parseEntityKey`, `parseGapKind` (Task 2).
- Produces: no new exports. Behavior change only.

**Scope:** exactly these four entities — the ones that have gaps. The other eight `actions.ts` files are untouched.

- [ ] **Step 1: Change the `update_next` branch in `outfits/variants/actions.ts`**

The existing block at lines 99–110 is:

```ts
if (formData.get('update_next') === 'true') {
  const { data: next } = await supabase
    .from('outfit_variants')
    .select('slug')
    .gt('slug', slug)
    .order('slug', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (next?.slug) redirect(`${navLinksData.admin.outfits.variants.edit}/${next.slug}`)
  redirect(ADMIN_DASHBOARD)
}
```

Replace it with:

```ts
// Queue params arrive only from the dashboard's "Start fixing" link. Without
// them this stays the alphabetical walk from the 2026-06-22 update-and-next
// spec — guard on presence, not truthiness, so the shipped behavior is intact.
const entityParam = parseEntityKey(formData.get('entity'))
const gapParam = formData.get('gap') ? parseGapKind(formData.get('gap')) : null
const pageParam = Number.parseInt(String(formData.get('page') ?? '1'), 10)
const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1

if (formData.get('update_next') === 'true') {
  if (entityParam && gapParam) {
    const nextSlug = await getNextGapSlug({ entity: entityParam, gap: gapParam, afterSlug: slug })
    if (nextSlug) {
      redirect(
        `${navLinksData.admin.outfits.variants.edit}/${nextSlug}?entity=${entityParam}&gap=${gapParam}&page=${page}`
      )
    }
    redirect(buildDashboardHref({ entity: entityParam, gap: gapParam, page }))
  }

  const { data: next } = await supabase
    .from('outfit_variants')
    .select('slug')
    .gt('slug', slug)
    .order('slug', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (next?.slug) redirect(`${navLinksData.admin.outfits.variants.edit}/${next.slug}`)
  redirect(ADMIN_DASHBOARD)
}

// Plain save: back to the queue position if we came from it, else the dashboard.
redirect(buildDashboardHref({ entity: entityParam, gap: gapParam, page }))
```

Delete the bare `redirect(ADMIN_DASHBOARD)` that was the final line of the action — `buildDashboardHref` returns exactly `/admin` when all params are absent, so behavior for non-queue edits is unchanged.

Add the imports:

```ts
import { getNextGapSlug } from '@/hooks/data/admin/gaps'
import { buildDashboardHref } from '@/lib/admin-routes'
import { parseEntityKey, parseGapKind } from '@/lib/admin-entities'
```

`redirect()` throws to signal, so every one of these calls must stay outside any `try`/`catch` and after all DB work.

- [ ] **Step 2: Add the hidden params to the edit form**

The form must post `entity`/`gap`/`page` or the action reads nothing. Note the 2026-07-09 spec **removed** the `searchParams` prop from four edit pages — for `app/admin/outfits/variants/edit/[slug]/page.tsx` it removed the `back` local but left the page's own signature, so check what the file currently accepts before editing.

Add `searchParams` to the page and thread the three values down. The outer page and inner async component both need the signature (they are a `page` → `async` pair, as the 2026-07-09 spec notes):

```tsx
type SearchParams = Promise<{ entity?: string; gap?: string; page?: string }>

export default function EditOutfitVariantPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: SearchParams
}) {
  return (
    <Suspense>
      <EditView params={params} searchParams={searchParams} />
    </Suspense>
  )
}
```

Inside the inner component, resolve and validate before rendering:

```tsx
const { entity: rawEntity, gap: rawGap, page: rawPage } = await searchParams
const entity = parseEntityKey(rawEntity)
const gap = rawGap ? parseGapKind(rawGap) : null
const page = Number.parseInt(rawPage ?? '1', 10)
```

Then render these three inside the `<form>`, alongside the existing fields:

```tsx
{entity && <input name="entity" type="hidden" value={entity} />}
{gap && <input name="gap" type="hidden" value={gap} />}
{entity && <input name="page" type="hidden" value={Number.isFinite(page) && page > 0 ? page : 1} />}
```

These are three constrained scalars, not a URL — validated here and re-validated in the action by `parseEntityKey` / `parseGapKind`. A hand-edited value can only change which queue you return to, never where `redirect()` points.

- [ ] **Step 3: Apply the same change to the other three entities**

Paste the identical block from Step 1 into each of the three remaining actions, changing only the four marked values below. Do **not** factor this into a shared helper yet — the four actions have differing signatures and bound-argument orders, and the 2026-07-09 spec's post-mortem shows bulk signature edits are exactly where the bugs come from.

| File | `entity` value | `.from()` table | edit base | ordering column |
| --- | --- | --- | --- | --- |
| `app/admin/makeup/variants/actions.ts` | `'makeup-variants'` | `makeup_variants` | `navLinksData.admin.makeup.variants.edit` | `slug` |
| `app/admin/makeup/sets/actions.ts` | `'makeup-sets'` | `makeup_sets` | `navLinksData.admin.makeup.sets.edit` | `slug` |
| `app/admin/eureka/variants/actions.ts` | `'eureka-variants'` | `eureka_variants` | `navLinksData.admin.eureka.variants.edit` | `slug` |

So for `makeup/variants/actions.ts` the block reads:

```ts
const entityParam = parseEntityKey(formData.get('entity'))
const gapParam = formData.get('gap') ? parseGapKind(formData.get('gap')) : null
const pageParam = Number.parseInt(String(formData.get('page') ?? '1'), 10)
const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1

if (formData.get('update_next') === 'true') {
  if (entityParam && gapParam) {
    const nextSlug = await getNextGapSlug({ entity: entityParam, gap: gapParam, afterSlug: slug })
    if (nextSlug) {
      redirect(
        `${navLinksData.admin.makeup.variants.edit}/${nextSlug}?entity=${entityParam}&gap=${gapParam}&page=${page}`
      )
    }
    redirect(buildDashboardHref({ entity: entityParam, gap: gapParam, page }))
  }

  const { data: next } = await supabase
    .from('makeup_variants')
    .select('slug')
    .gt('slug', slug)
    .order('slug', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (next?.slug) redirect(`${navLinksData.admin.makeup.variants.edit}/${next.slug}`)
  redirect(ADMIN_DASHBOARD)
}

redirect(buildDashboardHref({ entity: entityParam, gap: gapParam, page }))
```

`makeup/sets/actions.ts` and `eureka/variants/actions.ts` are the same with their row substituted. Each file also needs the three imports from Step 1.

**Two cautions per file.** First, some of these actions already order their existing `update_next` fallback by `title` rather than `slug` — leave that fallback query exactly as you found it; you are only adding the gap branch above it. Second, add the hidden inputs from Step 2 to each entity's `edit/[slug]/page.tsx`, or the params never reach the action and the gap branch silently never fires.

- [ ] **Step 4: Type-check and lint**

```bash
cd /Users/mailauki/Developer/infinity-nikki-tracker && yarn tsc --noEmit && yarn lint
```

Expected: both PASS.

- [ ] **Step 5: Verify no URL passthrough crept in**

```bash
cd /Users/mailauki/Developer/infinity-nikki-tracker && grep -rn "returnTo\|?back=" app/admin lib hooks
```

Expected: **no output.** If a `returnTo` appears, the open-redirect fix from the 2026-07-09 spec has been undone.

- [ ] **Step 6: Drive both paths**

With `yarn dev` running:
- From `/admin`, click "Start fixing" on Outfit Variants / No image → edit form opens → Save → back on `/admin?entity=outfit-variants&gap=image` with the same filter selected.
- On that form, "Update & next item" → lands on the next variant **missing an image**, not the next alphabetically.
- Open an edit form from the Recently Edited list (no params) → Save → lands on plain `/admin`, and "Update & next item" walks alphabetically exactly as before.

- [ ] **Step 7: Commit**

```bash
git add app/admin/outfits/variants app/admin/makeup app/admin/eureka/variants
git commit -m "feat(admin): make Update & next walk the gap queue when invoked from it"
```

---

## Self-Review Notes

**Spec coverage:** totals strip → Task 5; completeness list → Task 6; queue → Task 7; recents unchanged → Task 8; view → Task 1; stats hook → Task 3; gaps hook → Task 4; URL state + validation → Tasks 2 and 8; fix loop and Save & next gap → Task 9; `StatCard` deletion → Task 8; error handling → Task 8 (try/catch + per-section `Suspense`).

**Known deviations from the skill's template:** the standard TDD cycle (write failing test → run → implement → pass) is not used, because the repo has no test runner and adding one is out of scope. Each task instead ends in a concrete, runnable assertion — a SQL result compared against the measured baseline, a `grep` that must return nothing, or `yarn tsc --noEmit && yarn lint && yarn build`. Task 1's baseline comparison is the highest-value check in the plan; if `outfit-variants.gaps` reads 5222 instead of 2699, stop and fix the view before continuing.

**Deferred to its own spec:** `alt_slug` and write-time duplicate prevention. The `duplicate` filter in Task 4 computes the key on the fly and currently returns zero rows.
