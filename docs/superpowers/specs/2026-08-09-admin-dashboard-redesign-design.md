# Admin dashboard redesign

**Date:** 2026-08-09
**Status:** Approved, not yet implemented

## Problem

`app/admin/page.tsx` renders twelve `StatCard`s (one integer each) plus Recently
Added / Recently Edited. Three things are wrong with it:

1. **It answers only "how many?"** There is no way to see that 2,579 outfit
   variants have no image, let alone reach them. Finding a record with a gap
   means opening a list page and scrolling.
2. **It fetches every row of twelve tables to render twelve numbers.** The
   `Promise.all` at `page.tsx:49` calls `getOutfitSets()`, `getOutfitVariantsRaw()`,
   `getMakeupVariantsRaw()` and nine more, then calls `.length` on each. That is
   ~8,500 rows over the wire per dashboard load.
3. **Twelve equal-weight cards bury the signal.** Eight of the twelve entities
   are 100% complete; they occupy two thirds of the grid saying nothing.

## Measured baseline (2026-08-09)

Counts at time of writing. Implementation asserts against these.

| Entity            | Total | No title | No image | Any gap | No description |
| ----------------- | ----: | -------: | -------: | ------: | -------------: |
| Outfit Sets       |   292 |        0 |        0 |       0 |             10 |
| Evolutions        |   437 |        0 |        0 |       0 |            292 |
| Outfit Variants   | 6,534 |    2,643 |    2,579 |   2,699 |          6,499 |
| Makeup Sets       |    87 |        0 |       14 |      14 |             85 |
| Makeup Variants   |   446 |       20 |      281 |     281 |            281 |
| Momo's Cloaks     |   119 |        0 |        0 |       0 |              0 |
| Eureka Sets       |    38 |        0 |        — |       0 |              1 |
| Eureka Variants   |   456 |        — |       16 |      16 |              — |
| Trials            |    15 |        0 |        0 |       0 |              0 |
| Seasons           |    21 |        0 |        0 |       0 |             19 |
| Season Categories |    18 |        0 |        — |       0 |             18 |
| Abilities         |    47 |        0 |        — |       0 |              — |
| **Total**         | 8,510 |    2,663 |    2,890 |   3,010 |          7,195 |

Overall completeness: **5,500 of 8,510 (65%)**.

Two findings shaped the design:

- **Only four entities have gaps** — Outfit Variants, Makeup Variants, Makeup
  Sets, Eureka Variants. The other eight are whole.
- **`description` is effectively unused** (7,195 of 8,510 empty). It is a
  backfill-eventually field, not a gap. It is tracked but visually subordinate,
  and never counted in "gaps".

`season_categories` and `abilities` have no images at all by design — they are
lookup rows. `image_url` is **not** a tracked field for them. Likewise
`eureka_variants` has no `title` column, and `eureka_sets` / `season_categories`
/ `abilities` have no meaningful image.

## Completeness definition

A row is **incomplete** when a _tracked_ field is null or whitespace-only.
Tracked fields per entity:

| Entity                       | Tracked              |
| ---------------------------- | -------------------- |
| Outfit Sets, Evolutions      | `title`, `image_url` |
| Outfit Variants              | `title`, `image_url` |
| Makeup Sets, Makeup Variants | `title`, `image_url` |
| Momo's Cloaks                | `title`, `image_url` |
| Eureka Sets                  | `title`              |
| Eureka Variants              | `image_url`          |
| Trials, Seasons              | `title`, `image_url` |
| Season Categories, Abilities | `title`              |

`description` is tracked separately and **excluded from gap counts**.

Nothing here is enforced. No `NOT NULL` constraint is added, and no form field
becomes required — a save must never be blocked by an empty title or image.
This is reporting only.

## Design

Four stacked sections at `/admin`.

### 1. Totals strip

Five tiles. The first is all entries plus a completeness chip; the other four
are domains, each leading with its **variant** count, with sets and the domain's
other entity as outlined chips beneath.

    ┌ All entries ─┐ ┌ Outfits ────┐ ┌ Eureka ─────┐ ┌ Makeup ─────┐ ┌ Momo's ─────┐
    │ 8,510        │ │ 6,534       │ │ 456         │ │ 446         │ │ 119         │
    │ [65% done]   │ │ variants    │ │ variants    │ │ variants    │ │ cloaks      │
    │              │ │ [292 sets]  │ │ [38 sets]   │ │ [87 sets]   │ │ [no sets]   │
    │              │ │ [437 evo]   │ │ [15 trials] │ │             │ │             │
    └──────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘

Chips are links that set `?entity=` on the queue.

**The domain tiles do not sum to 8,510** — they report variants, not domain
totals (Outfits shows 6,534, not 7,263). Only "All entries" is a true total.
This is deliberate: variants are the working surface. The lookup entities
(abilities, seasons, season categories) appear only in the all-entries figure
and in the completeness list.

Momo's Cloaks has no set/variant split and shows a single figure with a muted
"no sets" chip.

### 2. Completeness list

One row per entity **that has gaps**, sorted by total descending, with a
proportional bar. The eight complete entities collapse into one expandable
summary row.

    Entity            Complete              Gaps                    Total
    Outfit Variants   ████████░░░░░░  59%   [2,643 title][2,579 img]  6,534
    Eureka Variants   ██████████████  96%   [16 img]                    456
    Makeup Variants   █████░░░░░░░░░  37%   [20 title][281 img]         446
    Makeup Sets       ████████████░░  84%   [14 img]                     87
    ▸ 8 entities complete  ██████████ 100%  [none]                      987

Total stays bold on the right; gaps read as the unfilled remainder rather than
a competing number. Gap chips link into the queue with `?entity=&gap=`.

### 3. Needs attention (queue)

One entity at a time, chosen from a dropdown. Filter chips for `image`,
`title`, `description` (dashed and muted), and `duplicate`. A paginated list of
matching rows; each links to that record's existing edit form. An "Add" button
for the selected entity, and "Start fixing →" which jumps to the first row's
edit form.

**Page size is 10 rows.** Enough to feel like a work queue, small enough that
the query stays trivial.

**The dropdown lists all 12 entities**, not just the four with gaps — an entity
being complete is worth being able to confirm. Complete entities render the
"Nothing needs attention" empty state.

**Chips render only where the gap is meaningful.** An entity shows a `title`
chip only if `title` is tracked for it, and an `image` chip only if `image_url`
is. Eureka Variants therefore has no title chip; Abilities and Season
Categories have no image chip. A chip for an untracked field would imply a
backlog that cannot exist.

The `duplicate` filter computes `toSlug(title) || '-' || category` collisions on
the fly and applies to the **variant entities only** (outfit, makeup, eureka) —
they are the ones with the two-slug-scheme problem. It currently reports 0 and
needs no schema change; see Out of scope.

### 4. Recents

`AdminRecentsList` for Recently Added and Recently Edited, **unchanged**.

## Architecture

### Data layer

**New: `admin_entity_stats` SQL view.** The dashboard needs ~48 aggregates
(12 entities × total / no-title / no-image / no-description). A view returns
them in one round trip; the alternative is ~48 `head: true` count queries.

Shape of one branch; the real view is twelve of these joined by `union all`,
one per entity, with untracked columns written as literal `null`:

```sql
create view admin_entity_stats as
  select 'outfit-sets' as entity,
         count(*) as total,
         count(*) filter (where title is null or btrim(title) = '') as no_title,
         count(*) filter (where image_url is null or btrim(image_url) = '') as no_image,
         count(*) filter (where description is null or btrim(description) = '') as no_description,
         count(*) filter (where (title is null or btrim(title) = '')
                             or (image_url is null or btrim(image_url) = '')) as gaps
    from outfit_sets where base_set is null
  union all
  select 'abilities', count(*),
         count(*) filter (where title is null or btrim(title) = ''),
         null, null,                    -- image and description untracked here
         count(*) filter (where title is null or btrim(title) = '')
    from abilities
  union all
  -- … ten more branches, one per entity
```

Note `outfit_sets` contributes **two** branches — `base_set is null` for Outfit
Sets and `base_set is not null` for Evolutions — matching how the existing hooks
split them.

Untracked fields report `null`, not `0`, so the UI can distinguish "none
missing" from "not applicable" (abilities' `no_image` must not render as a
green "complete" claim about a column nobody fills).

RLS: the view is admin-read-only, consistent with the `is_admin` RPC. It
exposes only aggregate counts, no row data.

This is the **only** DDL in this spec, and it is additive — no table, column, or
constraint changes.

**New: `hooks/data/admin/stats.ts`** — `getAdminStats()`, React `cache()` (it
reads cookies via the server client, so `use cache` is unavailable per the
`use cache` vs `cache()` rule). Returns one record per entity:
`{ key, title, total, noTitle, noImage, noDescription, gaps, addHref, listHref }`.
`gaps` is the count of rows missing _any_ tracked field, which is not
`noTitle + noImage` (a row can lack both) and must come from the view, not
arithmetic.

**New: `hooks/data/admin/gaps.ts`** —

- `getGapRows({ entity, gap, page, pageSize })` → `{ rows, total }`, using
  `.range()` for server-side pagination. Never selects more than `pageSize` rows.
- `getNextGapSlug({ entity, gap, afterSlug })` → the next slug in the same gap
  set, for the queue walk.

Both are React `cache()`, reads only — per the repo rule, a mutation must never
be wrapped in `cache()`.

**Changed: `app/admin/page.tsx`** — drop all twelve data-hook imports and the
`Promise.all`. It calls `getAdminStats()`, `getGapRows()`, `getRecentlyAdded()`,
`getRecentlyEdited()`. The ~8,500-row fetch disappears.

### Components

All colocated flat under `app/admin/` per the colocation rule (single-route
consumers).

| File                            | Type           | Role                               |
| ------------------------------- | -------------- | ---------------------------------- |
| `admin-totals-strip.tsx`        | server         | five tiles                         |
| `admin-completeness-list.tsx`   | server         | bars + collapsed complete row      |
| `admin-completeness-toggle.tsx` | `'use client'` | expand/collapse the 8-complete row |
| `admin-gap-queue.tsx`           | server         | dropdown, chips, rows, pagination  |
| `admin-recents-list.tsx`        | —              | **unchanged**                      |
| `stat-card.tsx`                 | —              | **deleted**                        |

`StatCard` has exactly one consumer (`app/admin/page.tsx`). `season-overview.tsx`
references it only in a comment explaining why it built its own. Safe to delete.

Layout uses CSS grid `Box`, not MUI `Grid`, per the repo convention.

### URL state

    /admin?entity=outfit-variants&gap=image&page=2

The dropdown and chips are links; the queue is server-rendered. No new context
provider and no new `admin_preferences` column — adding a preference column
costs five lockstep changes and buys nothing the URL doesn't already give
(shareable, bookmarkable, back-button-correct).

All three params are validated server-side:

- `entity` — must match one of the 12 known keys, else falls back to the first
  entity with gaps
- `gap` — one of `image` | `title` | `description` | `duplicate`, else `image`
- `page` — parsed integer, clamped to `[1, ceil(total / pageSize)]`

Invalid values fall back silently rather than erroring; this is a dashboard, not
a form.

### The fix loop

    Dashboard → click gap chip → queue filtered → row → edit form → Save → Dashboard

Save already redirects to `ADMIN_DASHBOARD` in every edit action, so the loop's
final leg exists today.

**Returning to queue position — and why not `?returnTo=`.**

The obvious approach is to pass the dashboard URL to the edit form and
`redirect()` to it after save. **We are not doing that.** The
[2026-07-09 spec](./2026-07-09-remove-admin-back-searchparams-design.md)
deliberately removed `?back=<url>` from admin forms, and one stated benefit was
that `redirect()` stopped receiving a URL-decoded query value — closing an
open-redirect surface. Reintroducing `returnTo=<url>` would reopen it.

Instead the edit link carries the three **whitelisted scalars** already
validated above:

    /admin/outfits/variants/edit/moonlit-dress-hair?entity=outfit-variants&gap=image&page=2

After save the action reconstructs the destination from a lookup:

```ts
// Never redirect(userSuppliedUrl). Rebuild from validated parts.
const dest = buildDashboardHref({ entity, gap, page }) // always '/admin?…'
redirect(dest)
```

`buildDashboardHref` lives in `lib/admin-routes.ts` beside `ADMIN_DASHBOARD` —
that module is server-safe, which matters because `form-context.tsx` is a client
module and importing the constant from there in a Server Action yields a
throwing stub. It returns `ADMIN_DASHBOARD` when params are absent or invalid,
so the destination is always `/admin` with constrained query values. No
arbitrary URL ever reaches `redirect()`.

**Save & next gap.** The existing `update_next` branch redirects to the next row
ordered alphabetically by title/slug (per the
[2026-06-22 spec](./2026-06-22-update-and-next-design.md)). When the gap params
are present, "next" instead means _the next row carrying the same gap_, via
`getNextGapSlug()`. Without the params, behavior is unchanged.

Scope: the four entities that actually have gaps — `outfits/variants`,
`makeup/variants`, `makeup/sets`, `eureka/variants`. The other eight
`actions.ts` files are untouched. Generalizing later is mechanical.

### Error handling

`getAdminStats()`, the queue, and recents each sit behind their own `Suspense`
boundary so they stream independently and one failure cannot blank the page.

- Stats read fails → totals and completeness render with em-dashes plus an MUI
  `Alert`; the rest of the page still works.
- Queue read fails → inline empty state inside the card.
- Empty gap set (the goal) → "Nothing needs attention" rather than an empty table.

Nothing on this page writes, so there is no partial-failure state to unwind. The
edit forms' existing error handling is untouched.

## Risks

**The view's `gaps` column is not `no_title + no_image`.** A row missing both is
one gap, not two. Computing it in TypeScript from the two counts would overstate
Outfit Variants as 5,222 instead of 2,699. It must be a `filter (where … or …)`
in the view.

**Deleting `StatCard` while `page.tsx` still imports it** breaks the build.
Order the change: rewrite `page.tsx` first, then delete.

**`update_next` has two callers now.** The gap-aware path must not change
behavior when the params are absent — the alphabetical walk is a shipped feature
with its own approved spec. Guard on param presence, not on truthiness of a
default.

**Pagination is the whole point.** `getGapRows` must use `.range()`. Fetching
2,579 rows to show 5 would repeat the bug this spec exists to fix.

## Verification

The repo has **no test runner** — no jest, vitest, or playwright; `package.json`
scripts are only `dev`/`build`/`start`/`lint`/`format`/`lint:fix`. Verification
is type-check, build, and driving the app.

1. `yarn tsc --noEmit` and `yarn lint` pass; `yarn build` succeeds.
2. Query `admin_entity_stats` directly and assert it reproduces the **Measured
   baseline** table above — specifically Outfit Variants 6,534 / 2,643 / 2,579
   with `gaps` = 2,699 (not 5,222), Makeup Variants 446 / 20 / 281, Eureka
   Variants 456 / 16, Makeup Sets 87 / 14, and zero gaps for the other eight.
   These are as of 2026-08-09; re-measure if data has changed since.
3. Confirm the dashboard issues no full-table reads — check Supabase logs before
   and after, or confirm no `getOutfitVariantsRaw`-style import remains in
   `page.tsx`.
4. `grep -rn 'returnTo\|?back=' app/admin` returns nothing. The whitelisted
   params must not have become a URL passthrough.
5. Drive it:
   - Gap chip → queue filters to that entity and gap; count matches the chip.
   - Row → edit form → Save → back on `/admin` with the same entity, gap, and
     page still selected.
   - "Save & next gap" walks to the next row with the same gap, not the next
     alphabetically. On the last one, lands back on the dashboard.
   - An edit form opened from recents (no gap params) still saves to `/admin`,
     and its "Update & next item" still walks alphabetically.
   - Hand-edit the URL to `?entity=nonsense&gap=nonsense&page=999` → falls back
     without erroring.
   - Abilities and Season Categories show no "missing image" gap.

## Out of scope

- **`alt_slug` and duplicate prevention.** A title-derived key on variant tables
  to catch the same piece added twice — once standalone, once under its set —
  which the two slug schemes in `app/admin/outfits/variants/fields.tsx` cannot
  detect. That is a migration, a backfill, form changes across three tables, and
  a save-time check: its own spec. The `duplicate` chip here computes the key on
  the fly and currently reports 0; it would later read the real column with no
  UI change.
- Making any field required, at the DB or form level.
- Changing the 12 list pages. They stay as-is for browsing everything.
- Bulk editing from the dashboard. The loop is one record at a time through the
  existing forms.
- Generalizing "Save & next gap" to the eight entities with no gaps.
