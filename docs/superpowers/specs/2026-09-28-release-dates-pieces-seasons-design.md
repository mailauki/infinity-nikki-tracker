# Release dates, "pieces" wording, and eureka + cloaks on season pages

Date: 2026-09-28

## Goal

1. Every collectable carries a **release date and version**, managed per season (and per trial for
   eureka), with optional per-row overrides for mid-season releases. The existing **date** sort uses
   it instead of row `id`.
2. Outfit and makeup variants are called **pieces** in the UI. Eureka keeps "variants".
3. Eureka sets appear on the **first season of their region** under the existing
   `eureka_collection` season category: 27 on Exploration Season (Wishfield), 13 on Terra's Call
   (Itzaland).
4. Momo's Cloaks appear on season pages inside their own season category, **excluded from every
   season total**.

Non-goals: a separate "version" sort axis; renaming DB tables, columns, TypeScript names, file names
or admin URLs; release overrides on individual eureka variants.

## 1. Data model

One migration. Every new column is nullable, so nothing needs filling before it ships.

| Table                                    | New columns                                                                         | Role                                  |
| ---------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------- |
| `seasons`                                | `released_at date`, `version text`                                                  | Source of truth for most rows         |
| `trials`                                 | `released_at date`, `version text`                                                  | Source of truth for eureka            |
| `outfit_sets` (base, evolution, glow-up) | `released_at date`, `version text`                                                  | Override                              |
| `outfit_variants`                        | `released_at date`, `version text`                                                  | Override (mainly standalone pieces)   |
| `makeup_sets`, `makeup_variants`         | `released_at date`, `version text`                                                  | Override                              |
| `eureka_sets`                            | `released_at date`, `version text`                                                  | Override (the two sets with no trial) |
| `eureka_sets`                            | `seasons text` FK → `seasons.slug`, `ON UPDATE CASCADE`                             | Which season page lists the set       |
| `momo_cloaks`                            | `released_at date`, `version text`                                                  | Override                              |
| `user_preferences`                       | `season_hide_eureka bool`, `season_hide_cloaks bool`, both `NOT NULL DEFAULT false` | Season toggles                        |

`version` is free text such as `1.5` or `2.0`. It is compared numerically, segment by segment.

### Backfill `eureka_sets.seasons`

A set's region is the `location` of the **earliest** trial it appears in, ordered by trial `id`
until trials have dates. Sets that appear in both Wishfield and Itzaland trials therefore resolve to
Wishfield. The two sets with no trial are fixed by hand. The region then maps to its first season:
`wishfield` → `exploration_season`, `itzaland` → `terras_call`.

- Wishfield (27): the 16 sets that appear only in Wishfield trials, the 10 shared sets
  (`heart_kiss`, `lullaby`, `masked_magic`, `melted_snow`, `meteorite`, `rosefall`, `silvermoon`,
  `starlight`, `sweet_candy`, `winds_rhythm`), and `moon_laurel_rabbit`.
- Itzaland (13): the 12 sets that appear only in Itzaland trials, and `essence_of_tears`.

The migration asserts the 27 / 13 split and raises an error if it doesn't hold. From then on the
column is authored in the eureka set admin form. It is not re-derived.

### Inheritance (`hooks/release.ts`)

This is a pure function. Date and version resolve **independently**, and the first non-null value
wins:

- **Outfit or makeup piece in a set:** piece → its state row (the evolution or glow-up) → the base
  set → the base set's season.
- **Standalone piece** (inside the `standalone_pieces` container or the makeup standalone
  container): piece → the piece's own season.
- **Set card** (a base, evolution or glow-up): state row → base set → season.
- **Eureka set, and each of its variants:** `eureka_sets` override → the trial with the earliest
  `released_at` among its trials, whose `version` comes with it.
- **Cloak:** cloak → its season.

Nothing is materialized. The data hooks embed the season's `released_at, version` through the
existing `seasons` foreign key, and each eureka set's trials' `released_at, version` through
`eureka_set_trials`. Because the `seasons` column shares its name with the table, the embed needs
an alias and an explicit `!<fkey>` hint.

`hooks/release.ts` also exports `compareVersions(a, b)`, so that `1.10` sorts after `1.9`, and
`compareRelease(a, b)`, the comparator described in section 2.

### Admin

The season, trial, outfit set, evolution, outfit piece, makeup set, makeup piece, eureka set and
cloak forms, and their DataGrids, each gain a `<input type="date">` and a version text field. On an
override field, the placeholder shows the inherited value (for example "inherits 1.5 · Apr 29,
2025"), so a blank field reads as intentional. The eureka set form also gains a season select.

Adding the two `user_preferences` columns needs all five lockstep updates. See the memory
`preference-column-five-lockstep-updates`: `hooks/data/preferences.ts` is the one that usually gets
missed.

## 2. Sorting and display

**The date axis** (`SortAxis 'date'`) sorts on the resolved `released_at`:

1. Rows with no resolved date sort **last in both directions**.
2. Rows are ordered by `released_at` in the chosen direction.
3. Ties are broken by `compareVersions` in the same direction.
4. Remaining ties are broken by `id` ascending, so the order is stable and same-day releases keep
   the order they were authored in.

This applies to the outfits grid, makeup grid, eureka grid, trials view, the Momo's Cloaks page,
and the within-category ordering on season pages (`sortSeasonEntries`). The seasons index sorts on
season `released_at`, falling back to `id`.

The data hooks keep `.order('id')`, because outfit-variants pagination depends on it. Release
sorting happens only in the existing client-side comparators.

**Display:**

- The set detail and cloak detail pages show a "Released" line, for example `v1.5 · Apr 29, 2025`,
  using the resolved values. It is hidden when both values are null.
- The season banner/overview shows the season's version and date.
- Cards are unchanged.

## 3. Season pages

### Providers

`app/seasons/layout.tsx` also mounts `EurekaDataProvider` and `MomoCloakDataProvider`. Season pages
render the same `EurekaColorSetCard` and cloak card used on `/eureka` and `/momo-cloaks`, with live
toggles. The index skeleton gate from #358 waits on all four providers.

### Entry kinds (`season-entries.ts`)

`SeasonEntry` gains two kinds:

- `{ kind: 'eureka', key, set }`: one card per eureka set whose `seasons` matches the page. It is
  always pushed into the `eureka_collection` category. It counts as obtained when every variant is
  obtained. It contributes **1** to the season totals, not one per variant.
- `{ kind: 'momo-cloak', key, cloak }`: one card per cloak whose `seasons` matches the page. It is
  pushed into the cloak's `season_category`, or into `MOMO_CLOAKS_CATEGORY` ("Momo's Cloaks") when
  that is null, never into "Other".

### Counting rules

- `entryVariants` for `eureka` returns a single synthetic `{ obtained }`, where `obtained` means
  every variant is obtained. This keeps "1 per set" automatic in `countEntries`,
  `countCountableEntries` and the progress bar.
- `momo-cloak` entries are removed before any counting. A helper `countedEntries(entries)` filters
  them out, and every counter (`countEntries`, `countCountableEntries`, `countEntryCards`,
  `countEntryKinds`, the category progress chips, the sidebar collected counts, and
  `season-card.tsx` on the index) calls it. A category that contains only cloaks shows no progress
  chip.
- `countEntryKinds` gains an `eureka` bucket, so the composition chip reads
  "8 outfits · 50 pieces · 27 eureka".
- The seasons index card includes eureka in its totals, so the index total still equals the page
  total (the #357 invariant).

### Filters and toggles

- The obtained, rarity and style filters and the sort apply to both kinds. Rarity and style come
  from the eureka set or the cloak row.
- `hideEureka` and `hideCloaks` join `SeasonFilterProvider`, persisted as `season_hide_eureka` and
  `season_hide_cloaks`, and are included in the show/hide-all switch and the "is default" check.
- The contents sidebar lists "Eureka Collection" and "Momo's Cloaks" like any other category.

### Tests (`app/seasons/__tests__`)

- A eureka set counts as 1 card and 1 unit, and as obtained only when all its variants are.
- Cloaks are absent from every counter but still pass or fail the obtained filter.
- A cloak with no category lands in "Momo's Cloaks".
- The index total equals the page total with eureka included.
- `hooks/release.ts`: the inheritance chain, date and version resolving independently, the earliest
  trial, `compareVersions('1.10', '1.9') > 0`, and nulls sorting last in both directions.

## 4. Rename: "variants" → "pieces" (UI text only)

This changes user-visible strings about outfit or makeup items:

- About page feature lists.
- Grouping, toggle and filter labels ("view pieces individually").
- Image `alt` fallbacks (`'Outfit Variant'` → `'Outfit Piece'`).
- Search result type labels.
- Profile chart labels (the makeup `'Variants'` ring → `'Pieces'`).
- Admin list titles ("Outfit Piece", "Makeup Piece"), admin nav entries, `pageTitle()` strings,
  gap-queue labels, and the variant-columns toggle's `aria-label`.

These are unchanged: everything under eureka; the DB; TypeScript identifiers; file names; code
comments; `formId`s; and admin URLs (`/admin/outfits/variants`, `/admin/makeup/variants`).

Check afterwards: a grep for user-visible `[Vv]ariant` string literals outside eureka paths and
outside identifiers should come back empty.

## Delivery

There are four PRs, in order:

1. **Release data:** the migration (columns, the `eureka_sets.seasons` backfill with its assertion,
   and the two preference columns), type regeneration, `hooks/release.ts` with its tests, and the
   admin fields.
2. **Date sort:** comparators across every grid and the seasons index, plus the "Released" display
   lines.
3. **Season pages:** the providers, the `eureka` and `momo-cloak` entry kinds, the counters, the
   toggles and the tests.
4. **Rename:** the UI text pass.
