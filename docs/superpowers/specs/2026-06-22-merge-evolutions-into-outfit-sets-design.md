# Merge `evolutions` into `outfit_sets` — design

**Date:** 2026-06-22
**Status:** Approved (design). Branch: `feat/fold-evolutions-into-outfit-sets`
**Supersedes:** Option C in `2026-06-22-base-evolution-data-model-findings.md`.

## Goal

Unify the `outfit_sets` and `evolutions` tables into a single `outfit_sets` table where every row is an "outfit state" — a base set or one of its evolutions. This removes the 266 placeholder `{set}-base` evolution rows, the parallel `evolution_carousel_images` table, and the `{set}-base` string pattern scattered across the codebase, while keeping evolution order and all relational links (variants, obtained records, carousel images).

## Why this shape

`evolutions` and `outfit_sets` already have near-identical shape (`slug`, `title`, `description`, `image_url`, `alt_image_url`, timestamps). Evolutions function like sets that share a parent set's attributes. Merging them makes "set" and "evolution" the same kind of entity, distinguished only by position, and lets variants/obtained/carousel point at a single table.

## Target schema

### `outfit_sets` — one row per outfit state

**New columns:**

- `order int not null default 1` — position within a set. **Glow-up = 0, base = 1, regular evolutions = 2, 3, …**
- `base_set text null` — self-FK → `outfit_sets(slug)` `on update cascade`. **NULL on base rows**; set to the base row's (clean) slug on evolution and glow-up rows.

**Dropped column:**

- `glowup_evolution` — removed. The glow-up is now identified positionally as the sibling row with `order = 0` (see Row roles).

**Existing columns unchanged:** `id, slug, title, description, rarity, style, label, label_2, ability, seasons, season_category, image_url, alt_image_url, created_at, updated_at`.

### Row roles (derived, no `kind`/`is_base` column)

| Condition          | Role                   |
| ------------------ | ---------------------- |
| `base_set IS NULL` | base set (`order` = 1) |
| `order = 0`        | glow-up evolution      |
| `order >= 2`       | regular evolution      |

A row is a top-level **set** iff `base_set IS NULL`. The `/outfits` grid, the admin sets list, and season grouping filter to base rows; evolution/glow-up rows are reached via `base_set`.

### Slugs (decided: base keeps clean slug)

- **Base rows keep their current clean slug** (`froggy_fashion`) — no rename, no public-URL changes, no `ON UPDATE CASCADE` storm.
- **Evolution / glow-up rows keep their existing `{set}-{subtitle}` slugs** (unchanged from today's `evolutions.slug`).
- Consequence: base-state references that currently use `{set}-base` migrate to the clean `{set}` slug (see Data migration step 3).

### Constraints

- **Drop `outfit_sets_title_key` (unique on `title`).** Evolution subtitles repeat across sets (e.g. "New Bud"), so a merged table cannot keep `title` globally unique. Identity stays on `slug` (still unique). This mirrors `20260603000001`, which dropped the same constraint on the `evolutions` table. (Verified: no FK references `outfit_sets(title)` and no app code looks sets up by title.)
- `unique (base_set, "order") where base_set is not null` — one row per (set, position); enforces a single glow-up (`order = 0`) and single base linkage per evolution position.
- `base_set` self-FK `on update cascade`.
- Existing lookup FKs (`style`, `label`, `ability`, `seasons`, `season_category`, …) now also apply to evolution/glow-up rows, which carry copied values that already satisfy them.

### Trigger column dependency

The existing `trg_enforce_base_variant_default` trigger fires `before insert or update of "evolution", "default"`, so it has a column dependency on `outfit_variants.evolution`. The migration must **drop the trigger before dropping the `evolution` column**, then recreate it (firing on `outfit_set`/`default`) after the order-based function is in place.

## Reference re-pointing (FKs)

After `evolutions` is dropped, everything pointing at it points at `outfit_sets`.

### `outfit_variants` — collapse two FK columns into one

Today a variant has both `outfit_set` (→ set) and `evolution` (nullable, → evolution). Collapse to a single `outfit_set` FK → `outfit_sets(slug)` holding the **specific state slug**:

- base variants: `outfit_set = {set}` (clean slug; migrated from `evolution = '{set}-base'`)
- evolution variants: `outfit_set = {evolution-slug}` (migrated from `evolution`)
- **Drop `outfit_variants.evolution`.**

### `obtained_outfit` — collapse two FK columns into one

Today: `(user_id, outfit_set, outfit_category, evolution-nullable)` with two partial unique indexes (`…_with_evo`, `…_no_evo`). **Data reality (verified against production):** `evolution` is never null — base obtained rows store `evolution = '{set}-base'` (4535 rows) and evolution rows store `evolution = '{set}-{sub}'` (3028 rows); zero rows have `evolution IS NULL`. Collapse so `outfit_set` holds the **state slug**:

- For every row: `outfit_set = evolution`, but **strip the `-base` suffix for base rows** so they land on the clean `{set}` slug (base rows keep clean slugs). Do this in one statement (a `CASE`), not two passes — an intermediate `{set}-base` value would violate the `outfit_set` FK.
- **Drop `obtained_outfit.evolution`**, drop both partial indexes, add `unique (user_id, outfit_set, outfit_category)`. (Verified: zero duplicate `(user_id, outfit_set, outfit_category)` groups after collapse.)
- `toggle_obtained_outfit(p_outfit_set, p_outfit_category)` — drop the `p_evolution` parameter.

`outfit_variants` collapses identically: `outfit_set = evolution`, stripping `-base` for base variants, in one statement.

### Carousel — merge into one table

- Fold `evolution_carousel_images` rows into `outfit_set_carousel_images` (keyed on `outfit_set` → `outfit_sets(slug)`; values are the evolution slugs, now `outfit_sets` rows).
- **Drop `evolution_carousel_images`.**

### `outfit_variants.default` trigger

Keep the `default` column. Rewrite `enforce_base_variant_default` so `default = (the variant's owning outfit_sets row has order = 1)` — i.e. base variants are `default = true`. The trigger looks up the owning row's `order` (the variant's `outfit_set` slug → `outfit_sets.order`).

## Data migration (single forward-only migration, ordered)

Pre-migration: take a DB backup/snapshot (Supabase dashboard or `pg_dump`). No down migration is written; recovery is restore-from-backup. Recommended: dry-run on a Supabase branch/copy and verify row counts before applying to production.

Run in this order so FKs never break mid-flight:

1. **Add columns** `outfit_sets.order int` (nullable for now), `outfit_sets.base_set text`. Backfill existing sets: `order = 1`, `base_set = NULL`.
2. **Copy non-base evolution rows into `outfit_sets`** (`evolutions` where `subtitle != 'base'`): `slug` = evolution slug; `title` = `subtitle`; `order` = the evolution's existing `order` value carried over unchanged (today these are already 2, 3, … because the old `addOutfitSet` reserved order 1 for base) — only the glow-up is remapped to 0 later, in step 7; `base_set` = evolution's `outfit_set` (clean base slug); copy `rarity, style, ability, seasons, season_category, label, label_2, description, image_url, alt_image_url` from the matching base set row; carry `created_at`/`updated_at` from the evolution. Skip base evolution rows.
3. **Repoint base-state references `{set}-base` → `{set}`:** `outfit_variants` rows with `evolution = '{set}-base'` → `outfit_set = {set}` (clean). (`obtained_outfit` base rows already use `outfit_set = {set}`; no change.) Repoint any base `evolution_carousel_images` to `{set}` if present.
4. **Collapse variant FK:** for evolution variants set `outfit_set = evolution`; for base variants `outfit_set = {set}` (from step 3). Drop `outfit_variants.evolution`. Confirm `outfit_variants.outfit_set` FK targets `outfit_sets(slug)`.
5. **Collapse obtained FK:** evolution obtained rows `outfit_set = evolution`; base rows unchanged. Drop `obtained_outfit.evolution`; drop the two partial unique indexes; add `unique (user_id, outfit_set, outfit_category)`.
6. **Merge carousel:** insert `evolution_carousel_images` into `outfit_set_carousel_images` (keyed on the evolution slug). Drop `evolution_carousel_images`.
7. **Glow-up remap:** for each base set whose old `glowup_evolution` pointed at an evolution, set that evolution row's `order = 0`. Then drop `outfit_sets.glowup_evolution`.
8. **Constraints & triggers:** add `base_set` self-FK; add `unique (base_set, "order") where base_set is not null`; set `outfit_sets.order` `NOT NULL`. Rewrite `enforce_base_variant_default` (order-based) and `toggle_obtained_outfit` (drop `p_evolution`).
9. **Drop `evolutions`** (now unreferenced).
10. **Regenerate types:** `supabase gen types typescript … > lib/types/supabase.ts`.

Insert/update ordering within the migration: base rows exist before evolution rows reference them via `base_set`; glow-up `order = 0` is stamped after evolution rows exist. (No self-FK cycle now that `glowup_evolution` is gone.)

## Application code changes (full cutover, same PR)

### Types (`lib/types/`)

- Regenerate `supabase.ts` (drops `evolutions`/`evolution_carousel_images`; `outfit_sets` gains `order`/`base_set`, loses `glowup_evolution`; `outfit_variants`/`obtained_outfit` lose `evolution`).
- `lib/types/outfit.ts`: `Evolution` becomes an `outfit_sets` row with `order != 1`; `OutfitSet`/`OutfitVariant` lose `evolution`, gain `base_set`/`order`.

### Core transforms (`hooks/outfit.ts`)

- `createOutfitSet()` — rewrite: a set is a row with `base_set IS NULL`; its evolutions are sibling rows where `base_set = set.slug`; its variants are those whose `outfit_set` is the set slug or any sibling slug. Remove all `{set}-base` string logic and the `evolution → null` normalization.
- **Display order helper:** sort states by `order` with `0` treated as last — sort key `order === 0 ? Infinity : order`. So display is base (1) → evolutions (2,3,…) → glow-up (0, last).
- `isGlowup(row) = row.order === 0` replaces every `set.glowup_evolution === evolution.slug` check.
- Rekey `sortOutfitVariants`, `isEvolutionVisible`, `buildObtainedKeySet`, `applyObtainedKeys`, etc. from `(set, cat, evolution)` to `(state-slug, cat)`.

### Data hooks (`hooks/data/`)

- `getOutfitSets`/`getOutfitSet` — fetch base rows (`base_set IS NULL`) plus their sibling states (`base_set = slug`) and variants.
- `getEvolutions*` (`hooks/data/evolutions.ts`) — re-expressed as `outfit_sets where base_set is not null`, or removed if no longer needed.

### Admin

- `app/admin/outfits/sets/actions.ts` — `addOutfitSet`/`editOutfitSet` rewrite: no base-evolution creation; evolutions/glow-up are sibling `outfit_sets` rows with copied set-fields, `order`, `base_set`. The glow-up selector writes `order = 0` to the chosen sibling instead of stamping `glowup_evolution`. The dense `{set}-base` logic collapses.
- `app/admin/outfits/sets/edit/[slug]/{page.tsx,edit-outfit-set-form.tsx}`, `evolution-editor.tsx` — base/glow-up identified by `order`/`base_set`; `isBaseVariant` rekeyed to the owning row's `order`.
- `app/admin/outfits/sets/outfit-set-table.tsx` — base-variant lookup + the `glowup_evolution` column rekeyed (Glow-Up column reads `order === 0`).
- `app/admin/outfits/evolutions/*` — operates on `outfit_sets` rows with `base_set is not null`; list/edit read/write `outfit_sets`. "Update & next item" query retargets to those rows (keep base/glow-up skip semantics as appropriate).

### Read paths

- `app/api/outfits/route.ts`, `app/api/obtained-outfit/route.ts` — serialize from the unified model; drop `{set}-base` logic. Update the obtained toggle call to drop the evolution arg.
- `app/outfits/seasons/[slug]/season-outfit-list.tsx`, `components/outfits/filter-outfits.tsx` — the synthetic "base" group becomes the `base_set IS NULL` row; `isGlowup` via `order === 0`.
- `app/profile/outfit-collection-charts.tsx`, `app/profile/profile-stats.tsx` — base variants identified by owning-row `order = 1`.
- `components/looks/look-builder.tsx` — base/evolution state derived from `order`/`base_set`.

### Memory / docs

- The "Base evolution normalization" memory (base = `{set}-base` in DB, null in client) is now obsolete — update it to the new model (base = `base_set IS NULL`, clean slug; glow-up = `order 0`).

## Error handling & edge cases

- **Sets with no evolutions:** just the base row (`order = 1`, `base_set = NULL`); no sibling rows. Reads must handle an empty evolution list.
- **Glow-up with no separate evolution:** if a set's glow-up was its only "evolution," it becomes the single `order = 0` sibling; base + glow-up only.
- **Obtained uniqueness:** after collapse, `(user_id, outfit_set, outfit_category)` is unique — confirm no dupes exist pre-migration (the old partial indexes guaranteed this per-evolution; collapsing the evolution value into `outfit_set` preserves distinctness because state slugs are distinct).
- **`base_set`/`order` integrity:** `unique (base_set, order)` prevents two glow-ups or two rows at the same position per set.

## Verification

- `./node_modules/.bin/tsc --noEmit` clean; `yarn lint` clean; `yarn build` succeeds.
- Post-migration data checks (dry-run on a branch): row counts (base sets unchanged; evolution rows = old non-base evolutions; no `{set}-base` rows remain); every variant/obtained row resolves to an `outfit_sets` row; carousel rows preserved; obtained row count unchanged.
- Manual (logged-in): `/outfits` grid shows only base sets; an outfit detail shows base → evolutions → glow-up (last); obtained toggles persist; season pages and profile completion math unchanged; admin add/edit a set with an evolution + glow-up round-trips.

## Out of scope

- Reworking non-base evolution attributes to _reference_ the base instead of copying them (the copy/denormalization is the accepted tradeoff of this design).
- Any change to the `/outfits` or season UI beyond what the data-model change requires.
