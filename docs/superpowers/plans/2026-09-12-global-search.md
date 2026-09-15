# Global Search Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One keyword search across every user-facing table, surfaced as a ⌘K modal showing the top 5 results per type, with a `/search` page for the full list.

**Architecture:** A Postgres `search_index` view unions 14 tables into one `(kind, slug, title, subtitle, image_url, parent_slug, filter_value, haystack)` shape. A single `search_all(q)` RPC does a substring pass, falling back to `pg_trgm` similarity only when that pass is thin. On the client, query terms that name a closed-vocabulary attribute (style, label, color, …) are claimed as _facets_ and attached to the destination URL as params the detail pages already read.

**Tech Stack:** Next.js 16 App Router, Supabase (Postgres 17, `pg_trgm` 1.6), MUI 7, Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-12-global-search-design.md`

## Global Constraints

- **Package manager is Yarn.** Never `npm`/`pnpm`. Type-check with `yarn tsc --noEmit` (not `yarn dlx tsc`).
- **Tests:** `yarn test` (Vitest, `run` mode). Single file: `yarn test path/to/file.test.ts`.
- **Prettier:** no semicolons, single quotes, 2-space indent, 100 char width, ES5 trailing commas. A PostToolUse hook runs `prettier --write` + `eslint --fix` on each edited file automatically — do not fight it.
- **Never push to `main`** — it is protected. Branch first. Load the `git-workflow` skill before any commit/push/PR.
- **Path alias:** `@/` maps to the project root.
- **SQL function convention:** `set search_path to ''` on every function, and fully qualify every reference (`public.foo`, not `foo`). Follow `supabase/migrations/20260831134242_current_user_has_password.sql`.
- **Migration comments:** this repo's migrations carry a header comment explaining _why_, not just what. Match that density — see `20260902120000_add_follows_table.sql`.
- **MUI `Stack`** does not accept layout shorthands (`justifyContent`, `alignItems`) as direct props — put them in `sx` or it is a TS build error.
- **Typography** takes `variant` (`display`/`headline`/`title`/`body`/`label`) + `size`. MUI's `h1`-`h6`/`body1`/`caption` are typed `false` and will fail the build. Headings need an explicit `component="h2"`.
- **Remote images** go through `components/lazy-image.tsx`, never a raw `src` on MUI `Avatar`. Pass **hoisted** `sx` objects — `LazyImage` is memo'd and an inline object literal defeats it.
- **Never use React `cache()` for mutations.** Reads only.

---

## File Structure

**Create:**

| File                                            | Responsibility                                                |
| ----------------------------------------------- | ------------------------------------------------------------- |
| `supabase/migrations/<ts>_add_search_index.sql` | The view, the RPC, the trigram indexes                        |
| `lib/search/types.ts`                           | `SearchKind`, `SearchResult`, `SearchFacet` — shared types    |
| `lib/search/routing.ts`                         | `kind` → destination URL, incl. facet params                  |
| `lib/search/facets.ts`                          | Tokenizing, claiming facet terms from a query                 |
| `lib/search/query.ts`                           | Query normalization; re-exports escaping from `follow-search` |
| `hooks/data/search.ts`                          | The `search_all` RPC call                                     |
| `components/search/search-results.tsx`          | Container-agnostic grouped result list                        |
| `components/search/search-dialog.tsx`           | The modal: input state, debounce, ⌘K                          |
| `components/search/obtained-toggle.tsx`         | Per-row obtained toggle (Task 8b)                             |
| `lib/search/obtained.ts`                        | Maps a result to its `toggle_obtained_*` RPC (Task 8b)        |
| `app/search/search-page-results.tsx`            | Client results wrapper for `/search` (Task 8)                 |
| `app/search/page.tsx`                           | Full uncapped results, reads `?q=`                            |

**Modify:**

- `components/search/search-collection.tsx` — the existing stub becomes the dialog trigger.
- `components/navbar/layout-shell.tsx` — mount the dialog once, app-wide (verify the exact mount point when you get there).
- `lib/types/supabase.ts` — regenerate after the migration; do not hand-edit.

Tasks 1–6 ship a working modal. Tasks 7, 8 and 8b are additive; Task 9 is deferred.

---

### Task 1: The search view and RPC

**Files:**

- Create: `supabase/migrations/<timestamp>_add_search_index.sql`
- Modify: `lib/types/supabase.ts` (regenerated, not hand-edited)

**Interfaces:**

- Consumes: nothing — first task.
- Produces: view `public.search_index` with columns `(kind text, slug text, title text, subtitle text, image_url text, parent_slug text, filter_value text, haystack text)`; RPC `public.search_all(q text)` returning `setof` that same shape plus `obtained boolean` and `rank real`.

**Context you need:**

`pg_trgm` 1.6 is **already installed** in the `public` schema — do not add `create extension`. `public.unaccent_fallback(text)` **already exists**, is `IMMUTABLE`, and folds accents via `translate()`. The `unaccent` extension is NOT installed; use `unaccent_fallback`.

Column gotchas confirmed against the live DB — these differ per table:

- `eureka_variants` has **no `title`**. Compose one from `color` + `category`.
- `custom_looks` uses **`name`**, not `title`.
- `profiles` has **no `slug`**; `username` fills that slot, `display_name` is the title.
- `outfit_sets` rows with `base_set IS NOT NULL` are evolutions (449 of 750) — they get `kind = 'outfit_evolution'` and link to their base set.

- [ ] **Step 1: Create the migration file**

Name it with a current UTC timestamp: `supabase/migrations/20260912HHMMSS_add_search_index.sql`.

```sql
-- Cross-table keyword search.
--
-- One view unioning every user-facing table into a common shape, plus one RPC
-- that searches it. A VIEW rather than a MATERIALIZED VIEW: at ~9,200 total
-- rows a view over indexed base tables is fast enough, and it can never go
-- stale -- a matview would need a refresh trigger on every admin edit to all
-- 14 source tables, which is far more machinery than the query cost it saves.
--
-- `haystack` is the single matched column: accent-folded via the existing
-- IMMUTABLE unaccent_fallback(), title first. Descriptions are deliberately
-- EXCLUDED -- they are long prose and would flood trigram similarity with
-- weak matches that crowd out real title hits.
--
-- `parent_slug` is null when a row is its own destination, and set when it
-- resolves to a parent page (pieces and evolutions have no page of their own).

create or replace view public.search_index as
  -- Base outfit sets: their own page at /outfits/[slug].
  select 'outfit_set' as kind,
         slug,
         title,
         subtitle,
         image_url,
         null::text as parent_slug,
         null::text as filter_value,
         public.unaccent_fallback(
           coalesce(title, '') || ' ' || coalesce(subtitle, '') || ' ' ||
           coalesce(style, '') || ' ' || coalesce(label, '')
         ) as haystack
    from public.outfit_sets
   where base_set is null

  union all

  -- Evolutions have no page of their own; they resolve to their base set.
  select 'outfit_evolution', slug, title, subtitle, image_url, base_set, null::text,
         public.unaccent_fallback(coalesce(title, '') || ' ' || coalesce(subtitle, ''))
    from public.outfit_sets
   where base_set is not null

  union all

  -- 4,693 of 7,087 outfit_variants have a title and every one is distinct,
  -- so pieces are real search targets rather than noise duplicating the set.
  select 'outfit_piece', slug, title, outfit_category, image_url, outfit_set, null::text,
         public.unaccent_fallback(coalesce(title, '') || ' ' || coalesce(outfit_category, ''))
    from public.outfit_variants
   where title is not null and btrim(title) <> ''

  union all

  select 'eureka_set', slug, title, style, null::text, null::text, null::text,
         public.unaccent_fallback(
           coalesce(title, '') || ' ' || coalesce(style, '') || ' ' || coalesce(label, '')
         )
    from public.eureka_sets

  union all

  -- eureka_variants has NO title column -- compose one from color + category,
  -- and fold the parent set's title into the haystack so a variant is findable
  -- by its set name too ("moon iridescent").
  select 'eureka_variant',
         v.slug,
         initcap(replace(coalesce(v.color, ''), '_', ' ')) || ' ' ||
           initcap(replace(coalesce(v.category, ''), '_', ' ')),
         s.title,
         v.image_url,
         v.eureka_set,
         -- The bare color slug, which is what the detail page's ?color=
         -- validates against -- v.slug is `{set}-{category}-{color}` and
         -- would silently fail that check.
         v.color,
         public.unaccent_fallback(
           coalesce(s.title, '') || ' ' || coalesce(v.category, '') || ' ' || coalesce(v.color, '')
         )
    from public.eureka_variants v
    join public.eureka_sets s on s.slug = v.eureka_set

  union all

  select 'makeup_set', slug, title, style, image_url, null::text, null::text,
         public.unaccent_fallback(coalesce(title, '') || ' ' || coalesce(style, ''))
    from public.makeup_sets

  union all

  select 'makeup_variant', slug, title, makeup_category, image_url, makeup_set, null::text,
         public.unaccent_fallback(coalesce(title, '') || ' ' || coalesce(makeup_category, ''))
    from public.makeup_variants
   where title is not null and btrim(title) <> ''

  union all

  select 'momo_cloak', slug, title, style, image_url, null::text, null::text,
         public.unaccent_fallback(coalesce(title, '') || ' ' || coalesce(style, ''))
    from public.momo_cloaks

  union all

  select 'season', slug, title, location, image_url, null::text, null::text,
         public.unaccent_fallback(coalesce(title, '') || ' ' || coalesce(location, ''))
    from public.seasons

  union all

  select 'trial', slug, title, realm, image_url, null::text, null::text,
         public.unaccent_fallback(coalesce(title, '') || ' ' || coalesce(realm, ''))
    from public.trials

  union all

  -- custom_looks uses `name`, not `title`.
  select 'custom_look', slug, name, null::text, image_url, null::text, null::text,
         public.unaccent_fallback(coalesce(name, ''))
    from public.custom_looks

  union all

  -- profiles has no slug; username IS the /u/[username] path segment.
  select 'profile', username, coalesce(display_name, username), null::text, avatar_url, null::text, null::text,
         public.unaccent_fallback(coalesce(display_name, '') || ' ' || coalesce(username, ''))
    from public.profiles;
```

- [ ] **Step 2: Add the RPC to the same migration**

```sql
-- Two passes in one round-trip.
--
-- The fuzzy pass runs ONLY when the strict pass is thin. This is the core
-- behavioral rule: a query with good exact matches never shows mystery
-- results, while a typo still gets rescued. Both constants are calibration
-- knobs expected to need tuning against real queries.
--
-- SECURITY INVOKER (the default, stated explicitly) is what makes RLS apply:
-- custom_looks and profiles rows are filtered to what the caller may see,
-- with no filtering logic in this function at all.
create or replace function public.search_all(q text)
returns table (
  kind text,
  slug text,
  title text,
  subtitle text,
  image_url text,
  parent_slug text,
  filter_value text,
  rank real
)
language plpgsql
security invoker
set search_path to ''
stable
as $function$
declare
  -- Tuning knobs. FUZZY_THRESHOLD: below this many strict hits, try fuzzy.
  -- SIMILARITY_MIN: pg_trgm score a fuzzy candidate must clear.
  fuzzy_threshold constant int := 5;
  similarity_min constant real := 0.3;
  folded text := public.unaccent_fallback(btrim(lower(coalesce(q, ''))));
  strict_count int;
begin
  if folded = '' then
    return;
  end if;

  create temp table strict_hits on commit drop as
    select s.kind, s.slug, s.title, s.subtitle, s.image_url, s.parent_slug, s.filter_value,
           -- A match at position 1 outranks one mid-string, so a prefix hit
           -- sorts above an incidental substring.
           (1.0 / position(folded in lower(s.haystack)))::real as rank
      from public.search_index s
     where lower(s.haystack) like '%' || folded || '%';

  select count(*) into strict_count from strict_hits;

  return query select * from strict_hits order by rank desc, title asc;

  if strict_count < fuzzy_threshold then
    return query
      select s.kind, s.slug, s.title, s.subtitle, s.image_url, s.parent_slug, s.filter_value,
             similarity(s.haystack, folded) as rank
        from public.search_index s
       where similarity(s.haystack, folded) > similarity_min
         and not exists (
           select 1 from strict_hits h where h.kind = s.kind and h.slug = s.slug
         )
       order by rank desc, s.title asc;
  end if;
end;
$function$;

grant execute on function public.search_all(text) to anon, authenticated;
```

- [ ] **Step 3: Add the trigram indexes to the same migration**

```sql
-- GIN over gin_trgm_ops serves BOTH ILIKE and similarity(), so one index per
-- title expression covers the strict and fuzzy passes alike. Indexed on the
-- unaccent_fallback() expression because that is exactly what the view's
-- haystack computes -- an index on the raw column would not be used.
create index if not exists outfit_sets_search_trgm
  on public.outfit_sets using gin (public.unaccent_fallback(title) gin_trgm_ops);
create index if not exists outfit_variants_search_trgm
  on public.outfit_variants using gin (public.unaccent_fallback(title) gin_trgm_ops);
create index if not exists eureka_sets_search_trgm
  on public.eureka_sets using gin (public.unaccent_fallback(title) gin_trgm_ops);
create index if not exists makeup_sets_search_trgm
  on public.makeup_sets using gin (public.unaccent_fallback(title) gin_trgm_ops);
create index if not exists makeup_variants_search_trgm
  on public.makeup_variants using gin (public.unaccent_fallback(title) gin_trgm_ops);
create index if not exists momo_cloaks_search_trgm
  on public.momo_cloaks using gin (public.unaccent_fallback(title) gin_trgm_ops);
```

- [ ] **Step 4: Apply the migration**

Load the `git-workflow` skill first — it covers the Supabase CLI gotchas for this repo.

Run: `yarn supabase db push` (or apply via the Supabase MCP `apply_migration`).

Expected: applies cleanly. If it fails on `unaccent_fallback` not existing, stop — that means you are pointed at a different project than `ykfuevyqpjvtxidjnhxm`.

- [ ] **Step 5: Verify the behavior that motivated the design**

Run these three queries against the DB and read the output:

```sql
-- 1. Strict match works and ranks prefix hits first.
select kind, title, rank from public.search_all('bloom') limit 10;

-- 2. Fuzzy rescue: a typo still finds its target.
select kind, title, rank from public.search_all('blooom') limit 5;

-- 3. Accent folding: an unaccented query finds an accented title.
select kind, title from public.search_all('eclair') limit 5;
```

Expected: (1) returns titles containing "Bloom", prefix matches first. (2) returns Bloom-ish titles via similarity. (3) finds accented titles if any exist in your data — if none do, confirm instead that `select public.unaccent_fallback('Éclair')` returns `Eclair`.

- [ ] **Step 6: Regenerate the DB types**

```bash
yarn supabase gen types typescript --project-id ykfuevyqpjvtxidjnhxm > lib/types/supabase.ts
```

Then `yarn tsc --noEmit` to confirm nothing broke. `search_all` should now appear under `Functions`.

- [ ] **Step 7: Commit**

```bash
git add supabase/migrations lib/types/supabase.ts
git commit -m "feat(search): add search_index view and search_all RPC"
```

---

### Task 2: Query normalization

**Files:**

- Create: `lib/search/query.ts`
- Test: `lib/__tests__/search-query.test.ts`

**Interfaces:**

- Consumes: `escapeFilterValue` from `@/lib/follow-search`.
- Produces: `normalizeQuery(raw: string): string`, `isSearchableQuery(raw: string): boolean`, `MIN_QUERY_LENGTH: 2`.

**Context:** `lib/follow-search.ts` already exports `escapeFilterValue`, which strips `,.%()*_`. Reuse it — do not write a second escaper. Here the value reaches Postgres as a **parameterized RPC argument**, not an interpolated filter string, so escaping is defense in depth (stripping `%`/`_` so a bare wildcard cannot match every row), not the only guard.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest'
import { MIN_QUERY_LENGTH, isSearchableQuery, normalizeQuery } from '@/lib/search/query'

describe('normalizeQuery', () => {
  it('lowercases and collapses whitespace', () => {
    expect(normalizeQuery('  Moon   Iridescent ')).toBe('moon iridescent')
  })

  // Reuses follow-search's escaper: `%` is an ilike wildcard, and a bare one
  // would match every row rather than narrowing anything.
  it('strips wildcard characters', () => {
    expect(normalizeQuery('%moon%')).toBe('moon')
  })
})

describe('isSearchableQuery', () => {
  it('rejects a query shorter than the minimum', () => {
    expect(isSearchableQuery('a')).toBe(false)
  })

  it('accepts a query at the minimum length', () => {
    expect(isSearchableQuery('ab')).toBe(true)
    expect(MIN_QUERY_LENGTH).toBe(2)
  })

  // The case that matters: punctuation-only input escapes down to nothing.
  // Without this guard it would reach the RPC as '' and match everything.
  it('rejects a query that is empty after escaping', () => {
    expect(isSearchableQuery('%%%')).toBe(false)
  })
})
```

- [ ] **Step 2: Run it and verify it fails**

Run: `yarn test lib/__tests__/search-query.test.ts`
Expected: FAIL — cannot resolve `@/lib/search/query`.

- [ ] **Step 3: Implement**

```ts
import { escapeFilterValue } from '@/lib/follow-search'

// Two characters is the shortest query worth a round-trip: a single letter
// matches a large fraction of a 9,200-row corpus and tells the user nothing.
export const MIN_QUERY_LENGTH = 2

// Lowercase, collapse runs of whitespace, and strip the wildcard/structural
// characters escapeFilterValue handles. Accent folding is NOT done here --
// Postgres does it via unaccent_fallback() so the query and the indexed
// haystack are folded by exactly the same code.
export function normalizeQuery(raw: string): string {
  return escapeFilterValue(raw).toLowerCase().trim().replace(/\s+/g, ' ')
}

export function isSearchableQuery(raw: string): boolean {
  return normalizeQuery(raw).length >= MIN_QUERY_LENGTH
}
```

- [ ] **Step 4: Run tests and verify they pass**

Run: `yarn test lib/__tests__/search-query.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/search/query.ts lib/__tests__/search-query.test.ts
git commit -m "feat(search): add query normalization"
```

---

### Task 3: Result types and routing

**Files:**

- Create: `lib/search/types.ts`, `lib/search/routing.ts`
- Test: `lib/__tests__/search-routing.test.ts`

**Interfaces:**

- Consumes: nothing.
- Produces: `SearchKind`, `SearchResult`, `SEARCH_KINDS`, `KIND_LABELS`, `destinationFor(result, facets?): string | null`.

**Context:** These params are **not new**. `app/eureka/[slug]/eureka-set-detail.tsx:29` already reads `?color=` and validates it against that set's own colors. `app/outfits/[slug]/outfit-set-detail.tsx:45` and `app/makeup/[slug]/makeup-set-detail.tsx:37` already read `?evolution=`. Reuse them; do not invent a new param.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest'
import { SEARCH_KINDS } from '@/lib/search/types'
import { destinationFor } from '@/lib/search/routing'

const base = {
  title: 'X',
  subtitle: null,
  image_url: null,
  parent_slug: null,
  filter_value: null,
  obtained: null,
  rank: 1,
}

describe('destinationFor', () => {
  it('sends a set to its own page', () => {
    expect(destinationFor({ ...base, kind: 'outfit_set', slug: 'moon' })).toBe('/outfits/moon')
  })

  // Evolutions and pieces have no page of their own -- they resolve to the
  // parent set, reusing the ?evolution= param that page already reads.
  it('sends a piece to its parent set with the evolution param', () => {
    expect(
      destinationFor({ ...base, kind: 'outfit_piece', slug: 'hairpin', parent_slug: 'moon' })
    ).toBe('/outfits/moon?evolution=hairpin')
  })

  it('sends a profile to its username path', () => {
    expect(destinationFor({ ...base, kind: 'profile', slug: 'julie' })).toBe('/u/julie')
  })

  // The motivating case: a claimed color facet narrows the eureka destination.
  it('attaches a color facet to a eureka destination', () => {
    expect(
      destinationFor({ ...base, kind: 'eureka_set', slug: 'moon' }, [
        { type: 'color', value: 'iridescent', label: 'Iridescent' },
      ])
    ).toBe('/eureka/moon?color=iridescent')
  })

  // A facet that means nothing to this destination is dropped, not appended
  // as a dead param the page would ignore anyway.
  it('drops a facet that is meaningless for the destination', () => {
    expect(
      destinationFor({ ...base, kind: 'season', slug: 'winter' }, [
        { type: 'color', value: 'iridescent', label: 'Iridescent' },
      ])
    ).toBe('/seasons/winter')
  })

  // Guard: a newly indexed table must not silently produce dead rows.
  it('has a routing decision for every kind', () => {
    for (const kind of SEARCH_KINDS) {
      const dest = destinationFor({ ...base, kind, slug: 's', parent_slug: 'p' })
      expect(dest === null || dest.startsWith('/')).toBe(true)
    }
  })
})
```

- [ ] **Step 2: Run it and verify it fails**

Run: `yarn test lib/__tests__/search-routing.test.ts`
Expected: FAIL — cannot resolve `@/lib/search/types`.

- [ ] **Step 3: Write `lib/search/types.ts`**

```ts
export const SEARCH_KINDS = [
  'outfit_set',
  'outfit_evolution',
  'outfit_piece',
  'eureka_set',
  'eureka_variant',
  'makeup_set',
  'makeup_variant',
  'momo_cloak',
  'season',
  'trial',
  'custom_look',
  'profile',
] as const

export type SearchKind = (typeof SEARCH_KINDS)[number]

// Section headers in the grouped results, in display order (SEARCH_KINDS order).
export const KIND_LABELS: Record<SearchKind, string> = {
  outfit_set: 'Outfits',
  outfit_evolution: 'Evolutions',
  outfit_piece: 'Outfit Pieces',
  eureka_set: 'Eureka',
  eureka_variant: 'Eureka Variants',
  makeup_set: 'Makeup',
  makeup_variant: 'Makeup Pieces',
  momo_cloak: 'Momo Cloaks',
  season: 'Seasons',
  trial: 'Trials',
  custom_look: 'Custom Looks',
  profile: 'Players',
}

export type SearchResult = {
  kind: SearchKind
  slug: string
  title: string
  subtitle: string | null
  image_url: string | null
  parent_slug: string | null
  // The filter value a result carries to its destination, when its own slug is
  // not that value. Eureka variants need it: the slug is
  // `{set}-{category}-{color}` but the detail page's ?color= validates against
  // bare color slugs. Null for every other kind.
  filter_value: string | null
  // Collection state for the four collectible kinds, resolved by the RPC for
  // the rows on screen only. Null for non-collectible kinds (seasons, trials,
  // profiles) and null for signed-out viewers, since RLS returns them no rows.
  obtained: boolean | null
  rank: number
}

// A closed-vocabulary attribute claimed out of the query (see lib/search/facets.ts).
export type FacetType = 'style' | 'label' | 'ability' | 'location' | 'color' | 'category'

export type SearchFacet = {
  type: FacetType
  value: string
  label: string
}
```

- [ ] **Step 4: Write `lib/search/routing.ts`**

```ts
import type { SearchFacet, SearchKind, SearchResult } from './types'

// Which facet types each destination can actually act on. A facet not listed
// here is dropped rather than appended -- the page would ignore an unknown
// param anyway, and a dead param in a shared URL is just noise.
const FACETS_BY_KIND: Partial<Record<SearchKind, SearchFacet['type'][]>> = {
  eureka_set: ['color', 'category'],
  eureka_variant: ['color', 'category'],
}

function withFacets(path: string, kind: SearchKind, facets: SearchFacet[]): string {
  const allowed = FACETS_BY_KIND[kind] ?? []
  const params = new URLSearchParams()
  for (const facet of facets) {
    if (allowed.includes(facet.type)) params.set(facet.type, facet.value)
  }
  const query = params.toString()
  return query ? `${path}?${query}` : path
}

// Returns null when a result has no reachable page. Callers MUST render such
// a row as non-navigating rather than linking to null.
export function destinationFor(result: SearchResult, facets: SearchFacet[] = []): string | null {
  const { kind, slug, parent_slug, filter_value } = result

  switch (kind) {
    case 'outfit_set':
      return withFacets(`/outfits/${slug}`, kind, facets)
    // Neither evolutions nor pieces have a page; both resolve to the parent
    // set and highlight themselves with the ?evolution= param it already reads.
    case 'outfit_evolution':
    case 'outfit_piece':
      return parent_slug ? `/outfits/${parent_slug}?evolution=${slug}` : null
    case 'eureka_set':
      return withFacets(`/eureka/${slug}`, kind, facets)
    // NOT `slug` -- a eureka variant slug is `{set}-{category}-{color}`
    // (e.g. `innocent_slumber-head-blue`), while the detail page validates
    // ?color= against its own color slugs (`blue`) and silently ignores
    // anything else. The bare color column is the only value that filters.
    case 'eureka_variant':
      return parent_slug && filter_value ? `/eureka/${parent_slug}?color=${filter_value}` : null
    case 'makeup_set':
      return withFacets(`/makeup/${slug}`, kind, facets)
    case 'makeup_variant':
      return parent_slug ? `/makeup/${parent_slug}?evolution=${slug}` : null
    case 'momo_cloak':
      return `/momo-cloaks/${slug}`
    case 'season':
      return `/seasons/${slug}`
    case 'trial':
      return `/eureka/trials/${slug}`
    case 'custom_look':
      return `/looks/${slug}`
    case 'profile':
      return `/u/${slug}`
  }
}
```

Note the `switch` has no `default`. That is deliberate: adding a `SearchKind` without a case becomes a TypeScript error (the function stops returning `string | null` on all paths) rather than a silently dead row.

- [ ] **Step 5: Run tests and verify they pass**

Run: `yarn test lib/__tests__/search-routing.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 6: Type-check and commit**

```bash
yarn tsc --noEmit
git add lib/search/ lib/__tests__/search-routing.test.ts
git commit -m "feat(search): add result types and destination routing"
```

---

### Task 4: The data hook

**Files:**

- Create: `hooks/data/search.ts`

**Interfaces:**

- Consumes: `SearchResult` from `@/lib/search/types`; `normalizeQuery`/`isSearchableQuery` from `@/lib/search/query`.
- Produces: `searchAll(query: string): Promise<SearchResult[]>`.

**Context:** This runs from a Client Component, so use `lib/supabase/client.ts`'s `createClient()`. Do **not** wrap it in React `cache()` — that is for server reads, and this takes a changing argument on every keystroke.

- [ ] **Step 1: Implement**

```ts
import { createClient } from '@/lib/supabase/client'
import { isSearchableQuery, normalizeQuery } from '@/lib/search/query'
import type { SearchResult } from '@/lib/search/types'

// Client-side: the query changes on every keystroke, so this is deliberately
// NOT React cache()'d. The debounce lives in the dialog, not here.
export async function searchAll(query: string): Promise<SearchResult[]> {
  if (!isSearchableQuery(query)) return []

  const supabase = createClient()
  const { data, error } = await supabase.rpc('search_all', { q: normalizeQuery(query) })

  if (error) {
    console.error('search_all failed', error)
    return []
  }

  return (data ?? []) as SearchResult[]
}
```

- [ ] **Step 2: Type-check**

Run: `yarn tsc --noEmit`
Expected: clean. If `search_all` is not found on `rpc`, Task 1 Step 6 (type regeneration) did not happen — go back and do it.

- [ ] **Step 3: Commit**

```bash
git add hooks/data/search.ts
git commit -m "feat(search): add searchAll data hook"
```

---

### Task 5: Grouped results component

**Files:**

- Create: `components/search/search-results.tsx`
- Test: `components/__tests__/search-results.test.tsx`

**Interfaces:**

- Consumes: `SearchResult`, `SearchFacet`, `KIND_LABELS`, `SEARCH_KINDS`, `destinationFor`.
- Produces: default export `SearchResults`, props `{ results: SearchResult[]; facets?: SearchFacet[]; limitPerKind?: number; onNavigate?: () => void }`.

**Context:** This component is container-agnostic — it is what makes the `/search` page nearly free. It must not reference the dialog, `useRouter`, or any modal state. `onNavigate` lets the dialog close itself on click; the page omits it.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import SearchResults from '@/components/search/search-results'
import type { SearchResult } from '@/lib/search/types'

const result = (
  over: Partial<SearchResult> & Pick<SearchResult, 'kind' | 'slug'>
): SearchResult => ({
  title: over.slug,
  subtitle: null,
  image_url: null,
  parent_slug: null,
  filter_value: null,
  obtained: null,
  rank: 1,
  ...over,
})

describe('SearchResults', () => {
  it('groups results under a header per kind', () => {
    render(
      <SearchResults
        results={[
          result({ kind: 'outfit_set', slug: 'moon' }),
          result({ kind: 'season', slug: 'winter' }),
        ]}
      />
    )
    expect(screen.getByText('Outfits')).toBeInTheDocument()
    expect(screen.getByText('Seasons')).toBeInTheDocument()
  })

  it('caps each section at limitPerKind and shows the true total', () => {
    render(
      <SearchResults
        limitPerKind={2}
        results={[
          result({ kind: 'outfit_set', slug: 'a' }),
          result({ kind: 'outfit_set', slug: 'b' }),
          result({ kind: 'outfit_set', slug: 'c' }),
        ]}
      />
    )
    expect(screen.getByText('a')).toBeInTheDocument()
    expect(screen.getByText('b')).toBeInTheDocument()
    expect(screen.queryByText('c')).not.toBeInTheDocument()
    // The header still reports 3 so the cap never hides how much matched.
    expect(screen.getByText('Outfits')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('renders an empty state when there are no results', () => {
    render(<SearchResults results={[]} />)
    expect(screen.getByText(/no results/i)).toBeInTheDocument()
  })

  it('links each result to its destination', () => {
    render(<SearchResults results={[result({ kind: 'outfit_set', slug: 'moon' })]} />)
    expect(screen.getByRole('link', { name: /moon/ })).toHaveAttribute('href', '/outfits/moon')
  })
})
```

- [ ] **Step 2: Run it and verify it fails**

Run: `yarn test components/__tests__/search-results.test.tsx`
Expected: FAIL — cannot resolve the component.

- [ ] **Step 3: Implement**

Remember the house rules: `Typography` takes `variant`/`size` (never `h6`/`body2`), `Stack` shorthands go in `sx`, and any `LazyImage` `sx` must be hoisted to module scope.

```tsx
'use client'

import Link from 'next/link'
import { Box, Chip, List, ListItemButton, ListItemText, Stack, Typography } from '@mui/material'

import { destinationFor } from '@/lib/search/routing'
import { KIND_LABELS, SEARCH_KINDS, type SearchFacet, type SearchResult } from '@/lib/search/types'

export default function SearchResults({
  results,
  facets = [],
  limitPerKind,
  onNavigate,
}: {
  results: SearchResult[]
  facets?: SearchFacet[]
  limitPerKind?: number
  onNavigate?: () => void
}) {
  if (results.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body" sx={{ color: 'text.secondary' }}>
          No results found.
        </Typography>
      </Box>
    )
  }

  // Grouped in SEARCH_KINDS order rather than by rank, so section order is
  // stable as the user types instead of reshuffling on every keystroke.
  const sections = SEARCH_KINDS.map((kind) => ({
    kind,
    matches: results.filter((r) => r.kind === kind),
  })).filter((section) => section.matches.length > 0)

  return (
    <Box>
      {sections.map(({ kind, matches }) => {
        const shown = limitPerKind ? matches.slice(0, limitPerKind) : matches

        return (
          <Box key={kind} sx={{ mb: 2 }}>
            <Stack sx={{ flexDirection: 'row', alignItems: 'center', gap: 1, px: 2, py: 1 }}>
              <Typography component="h2" variant="label" sx={{ color: 'text.secondary' }}>
                {KIND_LABELS[kind]}
              </Typography>
              {/* The true match count, not the capped one -- the cap must
                  never hide how much actually matched. */}
              <Chip label={matches.length} size="small" />
            </Stack>

            <List dense disablePadding>
              {shown.map((match) => {
                const href = destinationFor(match, facets)
                if (!href) return null

                return (
                  <ListItemButton
                    key={`${match.kind}-${match.slug}`}
                    component={Link}
                    href={href}
                    onClick={onNavigate}
                  >
                    <ListItemText primary={match.title} secondary={match.subtitle} />
                  </ListItemButton>
                )
              })}
            </List>
          </Box>
        )
      })}
    </Box>
  )
}
```

- [ ] **Step 4: Run tests and verify they pass**

Run: `yarn test components/__tests__/search-results.test.tsx`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add components/search/search-results.tsx components/__tests__/search-results.test.tsx
git commit -m "feat(search): add grouped results component"
```

---

### Task 6: The search dialog

**Files:**

- Create: `components/search/search-dialog.tsx`
- Modify: `components/search/search-collection.tsx`, `components/navbar/layout-shell.tsx`

**Interfaces:**

- Consumes: `searchAll`, `SearchResults`, `isSearchableQuery`.
- Produces: default export `SearchDialog` with props `{ open: boolean; onClose: () => void }`.

**Context:** The query lives in **local state only** — no router involvement, so typing cannot pollute browser history. That is a deliberate requirement, not an oversight. Debounce ~250ms. Read `components/navbar/layout-shell.tsx` before modifying to find where a global dialog should mount.

- [ ] **Step 1: Implement the dialog**

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Dialog,
  DialogContent,
  InputAdornment,
  TextField,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { Search } from '@mui/icons-material'

import { searchAll } from '@/hooks/data/search'
import { isSearchableQuery } from '@/lib/search/query'
import SearchResults from './search-results'
import type { SearchResult } from '@/lib/search/types'

const DEBOUNCE_MS = 250

export default function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))

  // Query is local state ONLY -- no router, so typing never creates history
  // entries. The /search page is the surface that owns a URL.
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  // Guards against a slow early request resolving after a fast later one and
  // overwriting fresher results.
  const latest = useRef(0)

  useEffect(() => {
    if (!isSearchableQuery(query)) {
      setResults([])
      return
    }

    const token = ++latest.current
    const timer = setTimeout(async () => {
      const found = await searchAll(query)
      if (latest.current === token) setResults(found)
    }, DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [query])

  // Reset on close so reopening starts clean rather than showing stale hits.
  useEffect(() => {
    if (!open) {
      setQuery('')
      setResults([])
    }
  }, [open])

  return (
    <Dialog open={open} onClose={onClose} fullScreen={fullScreen} fullWidth maxWidth="sm">
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          placeholder="Search outfits, pieces, seasons…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            },
          }}
        />
        {isSearchableQuery(query) && (
          <SearchResults results={results} limitPerKind={5} onNavigate={onClose} />
        )}
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Wire the trigger with ⌘K**

Replace `components/search/search-collection.tsx` entirely:

```tsx
'use client'

import { useEffect, useState } from 'react'
import { IconButton, Tooltip } from '@mui/material'
import { Search } from '@mui/icons-material'

import SearchDialog from './search-dialog'

export default function SearchCollection() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      // metaKey for macOS, ctrlKey elsewhere.
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault()
        setOpen((prev) => !prev)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <>
      <Tooltip title="Search">
        <IconButton onClick={() => setOpen(true)} aria-label="Search">
          <Search />
        </IconButton>
      </Tooltip>
      <SearchDialog open={open} onClose={() => setOpen(false)} />
    </>
  )
}
```

- [ ] **Step 3: Verify it is mounted**

Run: `grep -rn "SearchCollection" app components`

If nothing imports it, add it to the navbar toolbar so it appears app-wide. Read `components/navbar/layout-shell.tsx` first and follow whatever pattern the neighboring toolbar buttons use.

- [ ] **Step 4: Verify in the real app**

```bash
yarn dev
```

Check all four by hand:

1. Clicking the icon opens the dialog.
2. ⌘K (or Ctrl+K) opens and closes it.
3. Typing `bloom` shows grouped results after a short pause.
4. Clicking a result navigates and the dialog closes.

- [ ] **Step 5: Type-check, lint, and commit**

```bash
yarn tsc --noEmit && yarn lint
git add components/search components/navbar
git commit -m "feat(search): add search dialog with cmd-K trigger"
```

---

### Task 7: Facet claiming

**Files:**

- Create: `lib/search/facets.ts`
- Test: `lib/__tests__/search-facets.test.ts`
- Modify: `components/search/search-dialog.tsx`

**Interfaces:**

- Consumes: `SearchFacet`, `FacetType`.
- Produces: `claimFacets(query: string, vocabulary: FacetVocabulary): { facets: SearchFacet[]; remainder: string }`, `type FacetVocabulary = Record<FacetType, { value: string; label: string }[]>`.

**Context — the rule that matters:** claiming runs **only when the literal pass is thin**. `sweet bloom` must find the set "Sweet Bloom Dreams" literally, and must NOT split into `style=sweet` + `bloom`. This is the same "strict first, clever only on rescue" rule as the fuzzy fallback.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest'
import { claimFacets, type FacetVocabulary } from '@/lib/search/facets'

const vocabulary: FacetVocabulary = {
  style: [{ value: 'sweet', label: 'Sweet' }],
  label: [],
  ability: [],
  location: [],
  color: [{ value: 'iridescent', label: 'Iridescent' }],
  category: [{ value: 'dress', label: 'Dress' }],
}

describe('claimFacets', () => {
  // The motivating case: a set name plus an attribute.
  it('claims a color term and leaves the rest as the entity query', () => {
    const { facets, remainder } = claimFacets('moon iridescent', vocabulary)
    expect(facets).toEqual([{ type: 'color', value: 'iridescent', label: 'Iridescent' }])
    expect(remainder).toBe('moon')
  })

  it('claims every term when the query is facets only', () => {
    const { facets, remainder } = claimFacets('iridescent dress', vocabulary)
    expect(facets).toHaveLength(2)
    expect(remainder).toBe('')
  })

  it('claims nothing when no term matches the vocabulary', () => {
    const { facets, remainder } = claimFacets('blooming dreams', vocabulary)
    expect(facets).toEqual([])
    expect(remainder).toBe('blooming dreams')
  })

  // Only whole terms are claimed. Substring claiming would let "sweetheart"
  // surrender "sweet" and search for "heart".
  it('does not claim a term that merely contains a facet value', () => {
    const { facets, remainder } = claimFacets('sweetheart', vocabulary)
    expect(facets).toEqual([])
    expect(remainder).toBe('sweetheart')
  })
})
```

- [ ] **Step 2: Run it and verify it fails**

Run: `yarn test lib/__tests__/search-facets.test.ts`
Expected: FAIL — cannot resolve `@/lib/search/facets`.

- [ ] **Step 3: Implement**

```ts
import type { FacetType, SearchFacet } from './types'

export type FacetVocabulary = Record<FacetType, { value: string; label: string }[]>

// Splits a query into facet terms and everything left over.
//
// Whole terms only: a term is claimed when it equals a vocabulary value, never
// when it merely contains one. Substring claiming would let "sweetheart"
// surrender "sweet" and search for "heart".
//
// CALLERS: run this only when the literal whole-query search came back thin.
// Claiming eagerly would break "sweet bloom", which should find the set
// "Sweet Bloom Dreams" rather than splitting into style=sweet + "bloom".
export function claimFacets(
  query: string,
  vocabulary: FacetVocabulary
): { facets: SearchFacet[]; remainder: string } {
  const facets: SearchFacet[] = []
  const unclaimed: string[] = []

  for (const term of query.split(' ').filter(Boolean)) {
    let claimed = false

    for (const type of Object.keys(vocabulary) as FacetType[]) {
      const entry = vocabulary[type].find((candidate) => candidate.value === term)
      if (entry) {
        facets.push({ type, value: entry.value, label: entry.label })
        claimed = true
        break
      }
    }

    if (!claimed) unclaimed.push(term)
  }

  return { facets, remainder: unclaimed.join(' ') }
}
```

- [ ] **Step 4: Run tests and verify they pass**

Run: `yarn test lib/__tests__/search-facets.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Wire it into the dialog's search effect**

Replace the body of the debounced callback in `components/search/search-dialog.tsx` so the split is attempted only on a thin literal pass:

```tsx
// Thin literal pass -> retry with facet terms claimed. Same rule as the
// RPC's fuzzy fallback: strict first, clever only on rescue.
const FACET_RETRY_THRESHOLD = 5

const timer = setTimeout(async () => {
  const literal = await searchAll(query)

  if (literal.length >= FACET_RETRY_THRESHOLD) {
    if (latest.current === token) {
      setResults(literal)
      setFacets([])
    }
    return
  }

  const { facets: claimed, remainder } = claimFacets(query, vocabulary)
  // Nothing claimed, or nothing left to search on -- keep the literal answer.
  if (claimed.length === 0 || remainder === '') {
    if (latest.current === token) {
      setResults(literal)
      setFacets([])
    }
    return
  }

  const narrowed = await searchAll(remainder)
  if (latest.current === token) {
    setResults(narrowed.length > 0 ? narrowed : literal)
    setFacets(narrowed.length > 0 ? claimed : [])
  }
}, DEBOUNCE_MS)
```

Add `const [facets, setFacets] = useState<SearchFacet[]>([])` alongside the other state, and pass `facets={facets}` to `SearchResults`.

The vocabulary itself comes from the existing lookup hooks (`getStyles`, `getLabels`, `getEurekaColors`, `getEurekaCategories`). Fetch it once when the dialog first opens and hold it in state — it is a handful of rows and does not change during a session.

- [ ] **Step 6: Verify the motivating case by hand**

```bash
yarn dev
```

Type `moon iridescent`. Expected: the Moon eureka set appears, and clicking it lands on `/eureka/moon?color=iridescent` with the Iridescent filter already applied.

Then type `sweet bloom`. Expected: a literal set match — NOT a style-filtered result.

- [ ] **Step 7: Type-check and commit**

```bash
yarn tsc --noEmit && yarn test
git add lib/search/facets.ts lib/__tests__/search-facets.test.ts components/search/search-dialog.tsx
git commit -m "feat(search): claim facet terms from multi-term queries"
```

---

### Task 8: The `/search` page

**Files:**

- Create: `app/search/page.tsx`

**Interfaces:**

- Consumes: `SearchResults`, `searchAll`.
- Produces: the `/search?q=` route.

**Context:** The `?q=` param is this page's **only input** — it is not a sharing feature. A "See all results" link has to carry the query somehow, and a page reachable only via the modal would break on refresh. Shareability is a side effect.

- [ ] **Step 1: Add the "See all" footer to the dialog**

In `components/search/search-dialog.tsx`, below `SearchResults`:

```tsx
{
  results.length > 5 && (
    <Button
      component={Link}
      href={`/search?q=${encodeURIComponent(query)}`}
      onClick={onClose}
      fullWidth
    >
      See all {results.length} results
    </Button>
  )
}
```

Shown only when something was actually capped — otherwise the modal already shows everything and the link is noise.

- [ ] **Step 2: Create the page**

```tsx
import { Suspense } from 'react'
import type { Metadata } from 'next'

import PageShell from '@/components/page-shell'
import SearchPageResults from './search-page-results'

export const metadata: Metadata = { title: 'Search' }

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams

  return (
    <PageShell>
      <Suspense>
        <SearchPageResults query={q ?? ''} />
      </Suspense>
    </PageShell>
  )
}
```

Create `app/search/search-page-results.tsx` as a `'use client'` component that calls `searchAll(query)` on mount and renders `<SearchResults results={results} />` with **no** `limitPerKind`. Per the colocation rule in `CLAUDE.md`, it lives beside the page rather than in `components/`, since only this route uses it.

- [ ] **Step 3: Verify**

```bash
yarn dev
```

1. Search something with many matches; the "See all" button appears.
2. Click it — `/search?q=…` shows every result, uncapped.
3. **Reload that URL directly.** It must render the same results, since the param is the page's only input.

- [ ] **Step 4: Type-check, test, commit**

```bash
yarn tsc --noEmit && yarn test && yarn lint
git add app/search components/search/search-dialog.tsx
git commit -m "feat(search): add /search page for full results"
```

---

### Task 8b: Obtained toggle on search results

**Files:**

- Create: `lib/search/obtained.ts`, `components/search/obtained-toggle.tsx`
- Modify: `components/search/search-results.tsx`
- Test: `lib/__tests__/search-obtained.test.ts`

**Interfaces:**

- Consumes: `SearchResult` (now carrying `obtained: boolean | null`).
- Produces: `toggleObtainedFor(result): Promise<void>`, `isCollectible(result): boolean`, and the
  `ObtainedToggle` component.

**Context:** `search_all` already returns `obtained` per row (Task 1's migration). All four
`toggle_obtained_*` RPCs already exist and take the keys below — do not write new ones. This task
adds NO filter, sort, or progress UI: search stays a finding surface (see the spec's Non-Goals).

| Kind | RPC | Args |
|---|---|---|
| `outfit_piece` | `toggle_obtained_outfit` | `p_outfit_set` = parent_slug, `p_outfit_category` = subtitle, `p_outfit_variant` = slug |
| `eureka_variant` | `toggle_obtained` | `p_eureka_set` = parent_slug, `p_category` = subtitle, `p_color` = filter_value |
| `makeup_variant` | `toggle_obtained_makeup` | `p_makeup_set` = parent_slug, `p_makeup_category` = subtitle, `p_makeup_variant` = slug |
| `momo_cloak` | `toggle_obtained_momo_cloak` | `p_momo_cloak` = slug |

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest'
import { isCollectible, rpcArgsFor } from '@/lib/search/obtained'

const base = {
  title: 'X', subtitle: 'head', image_url: null, parent_slug: 'moon',
  filter_value: null, obtained: false, rank: 1,
}

describe('isCollectible', () => {
  it('is true for the four collectible kinds', () => {
    expect(isCollectible({ ...base, kind: 'outfit_piece', slug: 'a' })).toBe(true)
    expect(isCollectible({ ...base, kind: 'momo_cloak', slug: 'a' })).toBe(true)
  })

  // A season has no obtained state -- it must render no toggle at all.
  it('is false for a non-collectible kind', () => {
    expect(isCollectible({ ...base, kind: 'season', slug: 'a' })).toBe(false)
  })
})

describe('rpcArgsFor', () => {
  it('maps an outfit piece to the outfit RPC', () => {
    expect(rpcArgsFor({ ...base, kind: 'outfit_piece', slug: 'pin' })).toEqual({
      fn: 'toggle_obtained_outfit',
      args: { p_outfit_set: 'moon', p_outfit_category: 'head', p_outfit_variant: 'pin' },
    })
  })

  // Eureka keys on the bare color, not the slug -- same reason routing does.
  it('maps a eureka variant to the eureka RPC keyed on filter_value', () => {
    expect(
      rpcArgsFor({ ...base, kind: 'eureka_variant', slug: 'moon-head-blue', filter_value: 'blue' })
    ).toEqual({
      fn: 'toggle_obtained',
      args: { p_eureka_set: 'moon', p_category: 'head', p_color: 'blue' },
    })
  })

  it('returns null for a non-collectible kind', () => {
    expect(rpcArgsFor({ ...base, kind: 'season', slug: 'a' })).toBeNull()
  })
})
```

- [ ] **Step 2: Run it and verify it fails**

Run: `yarn test lib/__tests__/search-obtained.test.ts`
Expected: FAIL — cannot resolve `@/lib/search/obtained`.

- [ ] **Step 3: Implement `lib/search/obtained.ts`**

```ts
import { createClient } from '@/lib/supabase/client'
import type { SearchResult } from './types'

type RpcCall =
  | { fn: 'toggle_obtained_outfit'; args: { p_outfit_set: string; p_outfit_category: string; p_outfit_variant: string } }
  | { fn: 'toggle_obtained'; args: { p_eureka_set: string; p_category: string; p_color: string } }
  | { fn: 'toggle_obtained_makeup'; args: { p_makeup_set: string; p_makeup_category: string; p_makeup_variant: string } }
  | { fn: 'toggle_obtained_momo_cloak'; args: { p_momo_cloak: string } }

// Only these four kinds have collection state. Everything else renders no
// toggle at all rather than a disabled one.
export function isCollectible(result: SearchResult): boolean {
  return rpcArgsFor(result) !== null
}

export function rpcArgsFor(result: SearchResult): RpcCall | null {
  const { kind, slug, parent_slug, subtitle, filter_value } = result

  switch (kind) {
    case 'outfit_piece':
      if (!parent_slug) return null
      return {
        fn: 'toggle_obtained_outfit',
        args: { p_outfit_set: parent_slug, p_outfit_category: subtitle ?? '', p_outfit_variant: slug },
      }
    // Keys on the bare color, not the slug -- the slug is
    // `{set}-{category}-{color}` and obtained_eureka.color holds only the color.
    case 'eureka_variant':
      if (!parent_slug || !filter_value) return null
      return {
        fn: 'toggle_obtained',
        args: { p_eureka_set: parent_slug, p_category: subtitle ?? '', p_color: filter_value },
      }
    case 'makeup_variant':
      if (!parent_slug) return null
      return {
        fn: 'toggle_obtained_makeup',
        args: { p_makeup_set: parent_slug, p_makeup_category: subtitle ?? '', p_makeup_variant: slug },
      }
    case 'momo_cloak':
      return { fn: 'toggle_obtained_momo_cloak', args: { p_momo_cloak: slug } }
    default:
      return null
  }
}

export async function toggleObtainedFor(result: SearchResult): Promise<void> {
  const call = rpcArgsFor(result)
  if (!call) return

  const supabase = createClient()
  const { error } = await supabase.rpc(call.fn, call.args)
  if (error) throw error
}
```

- [ ] **Step 4: Run tests and verify they pass**

Run: `yarn test lib/__tests__/search-obtained.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Add the toggle component**

`components/search/obtained-toggle.tsx` — a `'use client'` `IconButton` in a `ListItemSecondaryAction`,
optimistic via `useTransition`, `notistack` snackbar on failure, matching how the grid cards toggle.
Filled icon when obtained, outline when not. It must render nothing when `isCollectible` is false,
and nothing when `obtained` is null (signed out).

Wire it into `search-results.tsx` as the row's secondary action. The row keeps its existing link
behavior — the toggle must call `event.preventDefault()` and `event.stopPropagation()` so ticking a
piece does not also navigate away from the results.

- [ ] **Step 6: Verify by hand**

```bash
yarn dev
```

Search a piece you do not own. Expected: an outline icon; clicking fills it immediately and does
NOT navigate; the row stays in the list; reopening search shows it still obtained. Signed out:
no toggles render at all.

- [ ] **Step 7: Type-check and commit**

```bash
yarn tsc --noEmit && yarn test
git add lib/search/obtained.ts components/search lib/__tests__/search-obtained.test.ts
git commit -m "feat(search): toggle obtained state from search results"
```

---

### Task 9: Filter params on the grid routes (deferred)

**Status:** Deliberately staged last. This is the only task that touches existing filter plumbing.

Facet-only queries (a bare `iridescent` with no entity term) should link to a filtered **grid** — `/eureka?color=iridescent`. Today the grid routes keep filters in provider state and user preferences, not the URL: `app/eureka/page.tsx` renders `FilterEureka` with no `searchParams` involvement at all.

Doing this means teaching `eureka-data-provider.tsx` / `outfit-data-provider.tsx` to seed their initial filter state from a URL param, which interacts with the preference-loading path — preferences currently win, and a param would have to override them for that request without persisting.

**Do not start this task without re-reading the spec's Facets section and confirming the approach.** Tasks 1–8 deliver a complete, working search without it; a facet-only query simply lands on the unfiltered grid in the meantime.

---

## Self-Review Notes

**Spec coverage:** view + RPC (T1), fuzzy fallback (T1 S2), query escaping (T2), routing incl. reused `?color=`/`?evolution=` params (T3), RPC client (T4), grouped results + capping (T5), modal + ⌘K (T6), facet claiming with the `sweet bloom` guard (T7), `/search` page (T8), grid params (T9, deferred per spec's Rollout step 6).

**Known deviations from the spec, both deliberate:**

1. The spec's "Filters" section for facet-only queries is folded into Task 9 — it cannot render a useful link until the grid routes accept params.
2. `eureka_variant` carries a `filter_value` column (the bare color) rather than routing on its own slug. Verified against live data during planning: a variant slug is `{set}-{category}-{color}` (e.g. `innocent_slumber-head-blue`), but the detail page validates `?color=` against bare color slugs (`blue`) and silently ignores anything else — so routing on `slug` would have rendered unfiltered with no error.

**Type consistency:** `SearchResult`, `SearchFacet`, `FacetType`, `SearchKind` are defined once in `lib/search/types.ts` and imported everywhere. `destinationFor(result, facets)` keeps the same signature in T3, T5, and T7.
