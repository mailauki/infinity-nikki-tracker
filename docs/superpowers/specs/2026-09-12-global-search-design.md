# Global Search Design

**Date:** 2026-09-12
**Status:** Approved

## Problem

`components/search/search-collection.tsx` is a stub — an `IconButton` with a `Search` icon and no
handler:

```tsx
export default function SearchCollection() {
  return (
    <IconButton>
      <Search />
    </IconButton>
  )
}
```

There is no way to find anything by name. The app has six public detail routes (`outfits`,
`eureka`, `makeup`, `momo-cloaks`, `seasons`, `looks`) and ~9,200 searchable rows spread across
14 tables, but the only path to any of them is browsing the grid for the domain you already
guessed. A player who remembers a piece is called "Sweet Bloom Hairpin" has no way to find which
set it belongs to.

`lib/follow-search.ts` is the only existing search code. It searches `profiles` alone, client-side,
via a PostgREST `.or()` filter, and its `escapeFilterValue` helper is reused here.

## Goals

- One search across every user-facing table, matched primarily on keywords in titles.
- Results grouped by type, each row navigating to the relevant detail page.
- Typo and accent tolerance — `blooom` and `eclair` find `Blooming Dreams` and `Éclair`.
- A modal as the primary surface, showing the top 5 per type.
- A `/search` page for the full, uncapped result list.

## Non-Goals

Explicitly out of scope for this pass:

- Faceted filtering inside search (by rarity, season, obtained status).
- Search history or saved/recent searches.
- Typeahead suggestions or autocomplete of query terms.
- Searching admin-only tables (`feedback`, `user_preferences`, `admin_preferences`).
- Ranking personalization (boosting sets the viewer already owns).
- Indexing `description` prose beyond the single `haystack` column described below.

None requires reworking what this design builds.

## Key Findings

Verified against the live project (`ykfuevyqpjvtxidjnhxm`) during design:

- **`pg_trgm` 1.6 is already installed** in the `public` schema. Fuzzy matching needs no new
  extension, only an index.
- **`unaccent_fallback(text)` already exists** as an `IMMUTABLE` SQL function that folds accented
  characters via `translate()`. It is already used by `variant_to_slug`. Being `IMMUTABLE`, it is
  usable inside a generated column and an index expression. The `unaccent` extension itself is
  _not_ installed and is not needed.
- **Scale is small.** 7,087 `outfit_variants`, 750 `outfit_sets`, 463 `makeup_variants`, 456
  `eureka_variants`, 122 `momo_cloaks`, 102 `profiles`, 91 `makeup_sets`, 48 `abilities`, 38
  `eureka_sets`, 30 `labels`, 22 `seasons`, 15 `trials`, 6 `custom_looks`, 5 `styles`, 2
  `locations`.
- **Variant titles are real, distinct piece names.** 4,693 of 7,087 `outfit_variants` have a
  title, and all 4,693 are distinct. Only 3 duplicate their parent set's title. Indexing pieces
  adds genuine search targets rather than noise.
- **449 of 750 `outfit_sets` are evolutions** (`base_set IS NOT NULL`). `app/outfits/[slug]/page.tsx`
  resolves a slug through `getOutfitSet(slug)`; evolutions do not get their own browsable page in
  the grid, so evolution rows must link to their base set.

## Design

### Why Postgres and not the client

At 9,200 rows the whole corpus is roughly 1MB and could be cached client-side for instant search.
Rejected: the payload grows with the database, this is a PWA frequently loaded on mobile data, and
`custom_looks`/`profiles` rows are RLS-scoped and must not be shipped wholesale to every client.

The alternative — a client-side `.or(ilike)` fan-out in the style of `follow-search.ts` — would mean
14 round-trips per query with no cross-table ranking. A single view plus one RPC is both less code
and better behaved.

### `search_index` view

A `VIEW` (not a materialized view) unioning the searchable tables into one shape. At this row count
a view over indexed base tables is fast enough, and it can never go stale — which a matview would,
on every admin edit, requiring refresh triggers this design does not want to own.

```sql
create or replace view public.search_index as
  select 'outfit_set' as kind,
         slug,
         title,
         subtitle,
         image_url,
         null::text as parent_slug,
         public.unaccent_fallback(
           coalesce(title,'') || ' ' || coalesce(subtitle,'') || ' ' ||
           coalesce(style,'') || ' ' || coalesce(label,'')
         ) as haystack
    from public.outfit_sets
   where base_set is null
  union all
  select 'outfit_evolution', slug, title, subtitle, image_url, base_set,
         public.unaccent_fallback(coalesce(title,'') || ' ' || coalesce(subtitle,''))
    from public.outfit_sets
   where base_set is not null
  union all
  select 'outfit_piece', slug, title, outfit_category, image_url, outfit_set,
         public.unaccent_fallback(coalesce(title,'') || ' ' || coalesce(outfit_category,''))
    from public.outfit_variants
   where title is not null and btrim(title) <> ''
  -- … eureka_sets, eureka_variants, makeup_sets, makeup_variants, momo_cloaks,
  --    seasons, trials, abilities, styles, labels, locations, custom_looks, profiles
```

`kind` drives both the grouping header and the destination route. `parent_slug` is null for rows
that are their own destination and set for rows that resolve to a parent (pieces, evolutions).

Two tables do not fit the `title` shape and need an explicit projection:

- **`eureka_variants` has no `title` column** — only `eureka_set`, `category`, `color`, `slug`.
  Its display title is composed as `initcap(replace(color,'_',' ')) || ' ' || initcap(replace(category,'_',' '))`,
  with the parent set's title as the subtitle. Its haystack folds set title + category + color, so
  a variant is findable by its set name as well as its color.
- **`custom_looks` uses `name`, not `title`** — projected as `name as title`.
- **`profiles` has no `slug`** — `username` fills the `slug` slot (it is what `/u/[username]`
  takes), `display_name` the title, falling back to `username` when null. This reuses the same two
  fields `lib/follow-search.ts` already searches.

`haystack` is the single matched column: accent-folded, lowercase, title first. Descriptions are
deliberately excluded — they are long prose and would flood trigram similarity with weak matches.

### `search_all(q text)` RPC

One round-trip, two passes, ranking in SQL:

1. **Strict pass** — `haystack ILIKE '%' || folded_q || '%'`. Ranked by match position (a prefix
   match outranks a mid-word one), then `title`.
2. **Fuzzy fallback** — runs _only_ when the strict pass returns fewer than `FUZZY_THRESHOLD` (5)
   rows, using `similarity(haystack, folded_q) > 0.3`, ranked by similarity descending.

Fuzziness engaging only on a thin strict pass is the core behavioral decision: a query with good
exact matches never shows mystery results, and a typo still gets rescued. `0.3` and `5` are
tunable constants declared at the top of the function — the calibration knobs.

The function is `STABLE`, `SECURITY INVOKER`, and `SET search_path = ''`, matching the convention in
`unaccent_fallback` and `variant_to_slug`. `SECURITY INVOKER` is what makes RLS apply — `custom_looks`
and `profiles` rows are filtered to what the caller may see, with no filtering logic in the function
itself.

Input is escaped with the existing `escapeFilterValue` before it reaches the RPC. Note this is a
parameterized RPC argument rather than an interpolated PostgREST filter string, so the escaping is
defense in depth (stripping `%` and `_` so a bare wildcard cannot match everything), not the only
guard.

### Index

```sql
create index search_outfit_sets_trgm
  on public.outfit_sets using gin (public.unaccent_fallback(title) gin_trgm_ops);
```

One GIN trigram index per base table's title expression. GIN over `gin_trgm_ops` serves both `ILIKE`
and `similarity()`, so a single index covers both passes.

### Routing table

`kind` → destination, resolved client-side in one map:

| `kind`                                     | Destination                           |
| ------------------------------------------ | ------------------------------------- |
| `outfit_set`                               | `/outfits/[slug]`                     |
| `outfit_evolution`                         | `/outfits/[parent_slug]`              |
| `outfit_piece`                             | `/outfits/[parent_slug]?piece=[slug]` |
| `eureka_set`                               | `/eureka/[slug]`                      |
| `eureka_variant`                           | `/eureka/[parent_slug]?piece=[slug]`  |
| `makeup_set`                               | `/makeup/[slug]`                      |
| `makeup_variant`                           | `/makeup/[parent_slug]?piece=[slug]`  |
| `momo_cloak`                               | `/momo-cloaks/[slug]`                 |
| `season`                                   | `/seasons/[slug]`                     |
| `trial`                                    | `/eureka/trials/[slug]`               |
| `custom_look`                              | `/looks/[slug]`                       |
| `profile`                                  | `/u/[username]`                       |
| `ability` / `style` / `label` / `location` | no detail page — see below            |

`ability`, `style`, `label` and `location` have no detail route. They are indexed because they are
meaningful keywords, and their rows render as non-navigating context (e.g. "Style: Sweet") rather
than links. A row without a destination is not rendered as a clickable target.

### Piece highlighting

A piece result carries `?piece=<slug>` to its parent set page. The set page already renders its
variants; it reads the param and scrolls that variant into view with a transient highlight. Absent
or unmatched, the param is ignored and the page renders normally — so a stale link degrades to the
plain set page rather than erroring.

### Client components

- **`components/search/search-results.tsx`** — container-agnostic. Takes `results` and an optional
  `limitPerKind`, renders grouped sections with a count per header. Used by both surfaces; this is
  what makes the page nearly free.
- **`components/search/search-dialog.tsx`** — MUI `Dialog`, `fullScreen` on `xs`. Owns input state
  and a ~250ms debounce. Renders `search-results` with `limitPerKind={5}`. Shows
  "See all N results" only when some section is truncated.
- **`components/search/search-collection.tsx`** — the existing stub becomes the trigger. Opens the
  dialog, and registers a ⌘K / Ctrl+K listener.
- **`app/search/page.tsx`** — reads `q` from `searchParams`, renders `search-results` uncapped.

Per the colocation rule in `CLAUDE.md`, these live in `components/search/` rather than beside a
route because the dialog is mounted from the navbar (root layout) and consumed by `/search` — two
unrelated consumers.

### State vs. URL

The modal holds its query in **local state only**. No router involvement, so typing cannot pollute
history — the requested behavior, achieved by construction rather than by `router.replace`.

The `/search` page reads its query from **`?q=`**. This is not a sharing feature; it is the page's
only input. A "See all results" link must carry the query somehow, and a link that only works when
the user arrived via the modal would make the page unreachable by refresh or direct load.
Shareability is a side effect, not a goal.

## Testing

- **`lib/__tests__/search-query.test.ts`** — query normalization and the escaping reused from
  `follow-search.ts`; asserts an all-punctuation query is rejected rather than reduced to a
  match-everything filter.
- **`components/__tests__/search-results.test.tsx`** — grouping, per-kind capping, the truncation
  flag that drives the footer link, and that a `kind` with no destination renders unlinked.
- **`lib/__tests__/search-routing.test.ts`** — every `kind` in the view maps to a destination or is
  explicitly marked non-navigating. This is the guard that a newly indexed table cannot silently
  produce dead rows.
- **One SQL check** — that the fuzzy fallback fires only when the strict pass is thin: a query with
  many exact matches returns no low-similarity rows, and a misspelling still returns its target.

## Rollout

1. Migration: the view, the RPC, the trigram indexes.
2. `search-results.tsx` + tests.
3. `search-dialog.tsx`, wire the `search-collection.tsx` trigger and ⌘K.
4. `/search` page.
5. `?piece=` highlight handling on the set detail pages.

Steps 4 and 5 are additive — 1–3 ship a working modal on their own.

## Open Questions

None blocking. Two knobs expected to need tuning against real queries once live: the `0.3`
similarity threshold and the 5-row fuzzy trigger.
