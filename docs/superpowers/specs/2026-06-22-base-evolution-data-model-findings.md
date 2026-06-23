# Base evolutions: data-model findings & reorganization options

**Date:** 2026-06-22
**Status:** Investigation only — no code changes. Decision pending.

## Question

Base evolutions (`evolutions` rows with `subtitle = 'base'`, slug `{set}-base`) hold the same information as the parent outfit set but live on a different table. Should this be reorganized?

## What a base evolution actually is

Every `outfit_sets` row auto-creates one `evolutions` row:

- `slug = '{set_slug}-base'`, `subtitle = 'base'`, `order = 1`, `title = <set title>`, `outfit_set = <set slug>`.
- Created in `addOutfitSet` (`app/admin/outfits/sets/actions.ts:61-74`); kept in sync (title, slug rename) in `editOutfitSet`.
- Its **image lives on the `outfit_sets` row, not the base evolution row** (per `outfit-evolution-view.tsx:18-21`). The base evolution's own `image_url`/`description` columns are effectively unused.

So the base evolution is **not** a true duplicate of the set's content. It is mostly an empty placeholder whose real job is to be a **join anchor**: the `evolution` FK target for the set's base-state `outfit_variants` (and for `obtained_outfit` records on those variants).

### Columns that overlap with `outfit_sets`

| evolutions column | base row holds | also on outfit_sets? | duplicated?                               |
| ----------------- | -------------- | -------------------- | ----------------------------------------- |
| `title`           | set title      | yes (`title`)        | **yes** (kept in sync by `editOutfitSet`) |
| `image_url`       | usually null   | yes (`image_url`)    | no (base image lives on the set)          |
| `description`     | usually null   | yes (`description`)  | no                                        |
| `subtitle`        | `'base'`       | —                    | no (marker)                               |
| `order`           | `1`            | —                    | no (marker)                               |
| `outfit_set`      | set slug       | — (it's the FK)      | no                                        |

The only real _data_ duplication is `title`. The rest is structural: the row exists so base variants/obtained records have an `evolution` to point at.

## Why it is load-bearing (the constraint that dominates every option)

`outfit_variants.evolution` → `evolutions.slug` (FK `outfit_variants_evolution_fkey`).
`obtained_outfit.evolution` → `evolutions.slug` (FK `obtained_outfit_evolution_fkey`).

The second FK is the important one: **base evolution rows are referenced by user collection records**, not just by catalog variants. Any migration that removes or restructures base evolution rows must preserve or migrate `obtained_outfit` rows, or it loses user data.

## Where the `{set}-base` pattern is relied on (≈12 files)

The `{set}-base` slug is computed inline or filtered in many places. A migration touches all of them:

**Admin (writes & editor):**

- `app/admin/outfits/sets/actions.ts` — creates/renames/syncs the base evolution and base variants (the densest user of the pattern: lines 61, 95, 136, 209-243, 304-315, 417).
- `app/admin/outfits/sets/edit/[slug]/page.tsx:81` — excludes base from the evolution editor.
- `app/admin/outfits/sets/edit/[slug]/edit-outfit-set-form.tsx:113-179` — `isBaseVariant` = `evolution === '{set}-base' || default`.
- `app/admin/outfits/sets/outfit-set-table.tsx:204-211` — base-variant lookup per category.
- `app/admin/outfits/evolutions/outfit-evolution-view.tsx:21` — list hides base.
- `app/admin/outfits/evolutions/edit/[slug]/actions.ts:105` — "Update & next item" skips base (added this PR).

**Read paths / API:**

- `app/api/obtained-outfit/route.ts:18`, `app/api/outfits/route.ts:49` — base variants carry the concrete `{set}-base` slug end-to-end.
- `hooks/outfit.ts:74-93` — `createOutfitSet()` resolves base: excludes the base evolution from the evolution list, derives the set thumbnail from base variants.

**Public / profile / looks:**

- `app/outfits/seasons/[slug]/season-outfit-list.tsx:19-33`, `components/outfits/filter-outfits.tsx:127-136` — build a synthetic "base" group keyed by `{set}-base`.
- `app/profile/outfit-collection-charts.tsx:442`, `app/profile/profile-stats.tsx:18-19` — completion math filters base variants by `{set}-base`.
- `components/looks/look-builder.tsx:72-78` — treats the unevolved state as `'base'`.

Note: there is an existing memory note "Base evolution normalization" — base is `{set}-base` in DB but `null` for client code, resolved via `createOutfitSet()`. Any change must keep that contract or update it everywhere.

## Options

### Option A — Leave the schema; remove only the real duplication (low risk)

Keep base evolution rows as the join anchor, but stop treating `title` as duplicated data and centralize the scattered `{set}-base` logic.

- Drop the `title` sync on base rows (it's only read via the set anyway), OR make base rows' redundant columns explicitly ignored.
- Extract a single `baseEvoSlug(setSlug)` helper + `isBaseEvolution(e)` / `isBaseVariant(v)` helpers in `hooks/outfit.ts` and replace the ~12 inline `\`${slug}-base\``/`subtitle === 'base'` checks. One source of truth, no schema migration, no user-data risk.
- **Cost:** small, mechanical, low risk. **Benefit:** kills the inline-duplication and the only true data dup; doesn't change the storage model.

### Option B — Make base a first-class nullable evolution (medium)

Stop creating a base evolution _row_; let base variants reference the set's base state via `evolution IS NULL` (or a sentinel), and resolve "base" purely in `createOutfitSet()`.

- Requires: migrate `outfit_variants.evolution` and `obtained_outfit.evolution` from `{set}-base` → `NULL` (or sentinel); relax/drop the FK or repoint it; backfill existing rows; update all ~12 read sites and the admin writer; update the client normalization contract.
- **Cost:** real migration with `obtained_outfit` backfill (user data) + RLS/FK review + touching every base-aware file. **Benefit:** removes the placeholder rows entirely; "base" becomes a derived concept, not a stored one.
- **Risk:** the `obtained_outfit` FK and base-variant slug format (`{set}-{cat}` vs `{set}-{cat}-{evo}`) are load-bearing across public/profile/looks math — high blast radius.

### Option C — Fold evolutions into outfit_sets (high)

Treat the base state as the outfit set itself; only non-base evolutions remain as `evolutions` rows.

- Largest restructure: base variants point at the set, non-base at evolutions; two variant shapes; rewrite completion math, season grouping, look-builder, API serializers, admin editor.
- **Cost:** highest. **Benefit:** conceptually cleanest (no base rows at all). **Risk:** highest — not recommended unless a broader outfits refactor is already planned.

## Recommendation

**Option A.** The only genuine data duplication is the base row's `title`; everything else is a structural join anchor that the whole app (including user `obtained_outfit` records) depends on. Option A removes the real duplication and the scattered inline `{set}-base` logic for low risk and no migration. Options B/C are real schema migrations whose main cost is the `obtained_outfit` user-data backfill and the ~12 read sites — only worth it as part of a deliberate, separately-scoped outfits refactor, not as cleanup riding this PR.

## Out of scope of this doc

- The actual implementation of any option (would get its own spec → plan).
- "Update & next item" base-skip — already shipped this PR (`app/admin/outfits/evolutions/edit/[slug]/actions.ts`).
