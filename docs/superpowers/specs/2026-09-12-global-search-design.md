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
- Multi-term queries that mix a name with an attribute — `moon iridescent` lands on the Moon set
  already filtered to Iridescent, reusing the `?color=` param that page already reads.

## Non-Goals

Explicitly out of scope for this pass:

- Filter/sort controls on search results, and collection progress chips. Search results carry an
  obtained toggle (see Obtained State) but deliberately none of the browsing machinery the grid
  pages own — a combined cross-domain browsing surface would need all four domain providers
  mounted at once (1,145 lines of provider fetching every set and every obtained row before the
  page is useful), which is the opposite of what a search surface is for. That belongs in its own
  spec as a "collections" page.
- Facets beyond the closed vocabularies listed under Facets — notably rarity, season, and obtained
  status, none of which are matched as query terms in this pass.
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

| `kind`                                     | Destination                               |
| ------------------------------------------ | ----------------------------------------- |
| `outfit_set`                               | `/outfits/[slug]`                         |
| `outfit_evolution`                         | `/outfits/[parent_slug]`                  |
| `outfit_piece`                             | `/outfits/[parent_slug]?evolution=[slug]` |
| `eureka_set`                               | `/eureka/[slug]`                          |
| `eureka_variant`                           | `/eureka/[parent_slug]?color=[color]`     |
| `makeup_set`                               | `/makeup/[slug]`                          |
| `makeup_variant`                           | `/makeup/[parent_slug]?evolution=[slug]`  |
| `momo_cloak`                               | `/momo-cloaks/[slug]`                     |
| `season`                                   | `/seasons/[slug]`                         |
| `trial`                                    | `/eureka/trials/[slug]`                   |
| `custom_look`                              | `/looks/[slug]`                           |
| `profile`                                  | `/u/[username]`                           |
| `ability` / `style` / `label` / `location` | a facet, not an entity — see Facets       |

### Reusing the existing detail-page params

These params are **not new**. The detail pages already read them, so a search result is just a link
someone could already have constructed by hand:

- `app/eureka/[slug]/eureka-set-detail.tsx:29` reads `?color=` and validates it against that set's
  own colors (`colors.some((c) => c.slug === colorParam)`), falling back to `null` when it does not
  match. It drives real filtering — both the variant grid and the progress chip narrow to the
  selected color.
- `app/outfits/[slug]/outfit-set-detail.tsx:45` and `app/makeup/[slug]/makeup-set-detail.tsx:37`
  read `?evolution=`.

Because each page validates the param against its own data, a stale or wrong value degrades to the
unfiltered page rather than erroring. An earlier draft of this design invented a `?piece=` param;
it is dropped in favor of the conventions already in the codebase.

## Facets

Some query terms name a _filter_, not a thing. `ability`, `style`, `label` and `location` have no
detail page, and eureka `color` / `category` are variant attributes rather than entities. All are
small closed vocabularies — 5 styles, 30 labels, 48 abilities, 2 locations, plus the eureka color
and category sets — so they can be loaded once and matched against query terms directly.

### Multi-term resolution

A query like `moon iridescent` is not one keyword. `moon` names a set; `iridescent` names a color.
The result should be the Moon set's page _already filtered_ to Iridescent —
`/eureka/moon?color=iridescent` — not two unrelated rows.

The pipeline, in order:

1. **Whole-query literal pass.** Run the full query as an entity search, exactly as described
   above.
2. **Facet split, only if that pass is thin.** Tokenize, claim any term that exactly matches a
   facet value, and run the remaining terms as the entity search. Attach the claimed facets to each
   result's destination as query params.
3. **Combine**, literal matches first.

Deferring the split until the literal pass is thin is the same rule already governing the fuzzy
fallback: strict first, clever only on rescue. It resolves the ambiguous case by itself — `sweet
bloom` finds the set "Sweet Bloom Dreams" literally, so it never splits into `style=sweet` +
`bloom`. Only when there is no such set does `sweet` get claimed as a style facet.

A claimed facet is applied only where it is meaningful: a `color` facet narrows eureka
destinations, and is ignored for a season or profile result rather than appended as a dead param.

### Facet-only queries

When every term is claimed and nothing remains for the entity search, the result is the filter
itself — a single row such as "All Iridescent items" or "Style: Sweet", linking to the relevant
grid. These rows render in their own "Filters" section, above the entity sections.

**Scope note:** the _grid_ routes (`/eureka`, `/outfits`) do not currently read filter params — their
filters live in provider state and user preferences. So a facet-only row can link to a filtered
**detail** page today, but linking to a filtered **grid** requires teaching those routes to accept a
param and seed the provider from it. That work is deliberately staged last (see Rollout) and is the
one part of this design that touches existing filter plumbing.

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

## Obtained State

Search is a finding surface, but finding a piece and ticking it off is one gesture, not two. Each
result for a collectible kind carries its own obtained state and a toggle, with none of the
filter/sort/progress machinery the grid pages own.

`search_all` returns an `obtained boolean` per row, resolved in the same query via an `EXISTS`
against the relevant `obtained_*` table — scoped to the ~20 rows on screen rather than the whole
collection. It is null for non-collectible kinds (seasons, trials, profiles, styles) and null for
signed-out viewers, since RLS returns them no rows. `SECURITY INVOKER` is what enforces that: one
user can never see another's collection state.

Keying per domain, matching what each `toggle_obtained_*` RPC takes:

| Kind | Obtained table | Key |
|---|---|---|
| `outfit_piece` | `obtained_outfit` | `outfit_set` = parent, `outfit_variant` = slug |
| `eureka_variant` | `obtained_eureka` | `eureka_set` = parent, `color` = filter_value |
| `makeup_variant` | `obtained_makeup` | `makeup_set` = parent, `makeup_variant` = slug |
| `momo_cloak` | `obtained_momo_cloaks` | `momo_cloak` = slug |

Toggling calls the existing `toggle_obtained`, `toggle_obtained_outfit`, `toggle_obtained_makeup`
and `toggle_obtained_momo_cloak` RPCs — all four already exist and take exactly these keys. The
update is optimistic, matching the grid pages' `useTransition` + `notistack` pattern, and a result
never leaves the list when toggled: the missing-filter cull that `useExitHold` exists to manage has
no equivalent here, because search results are not filtered by obtained state.

## Testing

- **`lib/__tests__/search-query.test.ts`** — query normalization and the escaping reused from
  `follow-search.ts`; asserts an all-punctuation query is rejected rather than reduced to a
  match-everything filter.
- **`components/__tests__/search-results.test.tsx`** — grouping, per-kind capping, the truncation
  flag that drives the footer link, and that the Filters section renders above the entity sections.
- **`lib/__tests__/search-routing.test.ts`** — every `kind` in the view maps to a destination or is
  explicitly declared a facet. This is the guard that a newly indexed table cannot silently produce
  dead rows.
- **`lib/__tests__/search-facets.test.ts`** — the term-claiming pipeline, and the case that
  motivated it: `moon iridescent` yields the Moon set with `color=iridescent` attached, while
  `sweet bloom` stays a literal set match and does _not_ split into `style=sweet`. Also that a
  claimed facet is dropped for destinations where it is meaningless rather than appended as a dead
  param.
- **One SQL check** — that the fuzzy fallback fires only when the strict pass is thin: a query with
  many exact matches returns no low-similarity rows, and a misspelling still returns its target.

## Rollout

1. Migration: the view, the RPC, the trigram indexes.
2. `search-results.tsx` + tests.
3. `search-dialog.tsx`, wire the `search-collection.tsx` trigger and ⌘K.
4. Facet vocabulary + term-claiming, attaching params to detail destinations.
5. `/search` page.
6. Filter params on the grid routes (`/eureka`, `/outfits`), enabling facet-only rows to link to a
   filtered grid.

Steps 1–3 ship a working modal on their own. Step 4 needs no route changes — it reuses `?color=`
and `?evolution=`, which the detail pages already read. Step 6 is the only step that touches
existing filter plumbing, and is last for that reason.

## Open Questions

None blocking. Three knobs expected to need tuning against real queries once live: the `0.3`
similarity threshold, the 5-row fuzzy trigger, and the thinness threshold that decides when to
attempt a facet split.
