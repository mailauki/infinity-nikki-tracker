# Variant Recategorization Design

**Date:** 2026-08-30
**Status:** Approved

## Problem

Fixing a miscategorized variant — a piece filed under `hair_accessories` that is really
`headwear` — has no safe path through the admin. The category select is editable, but using it
either leaves the record inconsistent or silently orphans the variant's images. The workaround
admins fall back on, deleting the variant and re-adding it under the right category, is what
actually loses the images.

Three facts combine to cause this:

1. **The slug encodes the category.** `deriveSlug()` in
   `app/admin/outfits/variants/fields.tsx` builds `{set}-{category}` for a set-owned variant
   (`toSlug(title)-{category}` for a standalone piece). Makeup does the same through
   `toSlugMakeup(set, category)`.
2. **The storage path encodes the slug.** `components/forms/image-upload.tsx` uploads to
   `` `${table}/${slug}` `` — so `outfit_variants/dawning_heartlight-headwear/image_url.webp`.
   The slug is the storage key.
3. **The edit action never touches storage.** `editOutfitVariant` updates `slug` and
   `outfit_category` in one `update()` and returns. Nothing copies, moves, or repoints the
   objects those columns just stopped pointing at.

A fourth detail decides which of the two bad outcomes you get. `deriveOnEdit` is set only for
eureka variants (`app/admin/eureka/variants/fields.ts`), so in outfit and makeup edit mode the
slug does **not** re-derive when the category changes (`app/admin/entity-form.tsx`, the
auto-derive effect). Therefore:

- **Change the category alone** → the row keeps a slug that contradicts its own category
  (`…-hair_accessories` on a `headwear` row). Images still resolve, but the slug now lies, and
  `alt_slug` — the duplicate-detection key — is recomputed from the new category against the old
  title-derived stem.
- **Change the category and hand-edit the slug** → the row is consistent, and every image
  404s, because the files are still at the old path.

This is not hypothetical. On 2026-08-30 three outfit folders
(`dawning_heartlight-hair_accessories`, `hymn_to_dusk-outerwear`,
`gold_seeking_night-chokers`) were found holding images with no owning row — residue from exactly
this workaround. See `docs/queries/2026-08-30-variant-storage-remediation.sql`.

## Goals

- Changing a variant's category is one operation that moves the row **and** its images together.
- A variant's slug always matches its category. No drift.
- No image is ever destroyed by a recategorization.
- A slug collision fails loudly and actionably, never silently merges or suffixes.
- Works identically for outfit and makeup variants.

## Non-Goals

- **No undo.** Because nothing is deleted, reverting is just recategorizing back; the old files
  are still in place. A dedicated undo would be redundant.
- **No bulk recategorization.** One variant at a time. Bulk is a different risk profile and no
  current workflow needs it.
- **No cleanup of pre-existing orphans.** Already handled as a one-off; the verify queries in
  `docs/queries/2026-08-30-variant-storage-remediation.sql` cover detection going forward.
- **No change to how uploads build paths.** `{table}/{slug}` stays the contract. This design makes
  slug changes safe rather than decoupling storage from the slug, which would be a far larger
  migration for no additional benefit.

## Approach

A server-side helper invoked from the existing edit actions when — and only when — the computed
slug actually changes. Five steps, ordered so every failure mode is safe.

### 1. Compute the target slug

Reuse the domain's existing derivation rather than reimplementing it, so the slug a
recategorization produces is byte-identical to what a fresh add would produce. If the new slug
equals the current slug, do nothing and fall through to the normal update path.

### 2. Guard the collision

```sql
select id, title from outfit_variants where slug = :new_slug
```

If a row comes back, abort before touching anything and return an error naming it:

> `dawning_heartlight-headwear` already exists ("Weightless Dream"). Resolve that variant first.

`outfit_variants.slug` carries a UNIQUE constraint (`outfit_variants_slug_key`; it also
participates in that table's composite primary key, though `makeup_variants` keys on `id` alone),
so the database would reject the write regardless. The point of the explicit check is to replace an
opaque constraint violation with a message that says which variant is in the way, letting the
admin decide whether it is a duplicate to delete or a genuine second piece.

### 3. Copy the images

For each non-null image column (`image_url`, `alt_image_url`), derive the object path from the
stored URL the same way `image-upload.tsx` already does —

```ts
decodeURIComponent(new URL(url).pathname).split('/images/')[1]
```

— and copy it to the new folder:

```ts
await supabase.storage.from('images').copy(oldPath, newPath)
```

`storage.copy()` is available in `@supabase/supabase-js` v2 and copies within a bucket. Any copy
error aborts here, before the database is written.

Note the stored URLs carry a `?v=` cache-buster. Strip the query string when deriving the object
path, and mint a fresh `?v=${Date.now()}` on the new URL so the CDN does not serve a stale object
under the new path.

### 4. Update the row

One statement carrying the new `slug`, the new `outfit_category`, and the rewritten
`image_url` / `alt_image_url`, so the row can never be half-migrated.

`trg_set_outfit_variant_alt_slug` then fires on its own and must **not** be set by hand — it is
declared `BEFORE INSERT OR UPDATE OF outfit_set, outfit_category, title`, so a category change
recomputes `alt_slug` automatically. `trg_set_makeup_variant_alt_slug` is declared identically.

`trg_enforce_base_variant_default` is **not** involved: it fires on
`UPDATE OF outfit_set, "default"`, and a recategorization changes neither. `default` is derived
from the owning set's order, which a category change does not affect, so leaving it untouched is
correct.

### 5. Leave the old objects in place

Never delete. A recategorization can strand a folder; it can never destroy an image. Stranded
folders are unreferenced by definition and are picked up by the verify query already committed in
`docs/queries/`.

This is the deliberate trade: recategorizing costs a duplicated object until someone sweeps it,
and in exchange no sequence of failures loses artwork. Given that the incident this design exists
to prevent was an image-loss incident, that is the correct direction to err.

## Why collection data needs no special handling

`obtained_outfit.outfit_variant` references `outfit_variants(slug)` `ON UPDATE CASCADE`, so a
slug rename propagates to every user's collection record automatically. `obtained_makeup` is
declared the same way against `makeup_variants(slug)`.

`obtained_outfit` also carries its own `outfit_category` column, which does **not** cascade. Any
`obtained_outfit` rows for the recategorized variant must have that column updated in the same
transaction as step 4, or a user's collection record will disagree with the variant it points at.

## Failure modes

| Failure                       | Result                                                                                         |
| ----------------------------- | ---------------------------------------------------------------------------------------------- |
| Target slug already taken     | Aborts at step 2. Nothing changed. Error names the conflicting variant.                        |
| Storage copy fails            | Aborts at step 3, before any DB write. Row unchanged; images still at old path.                |
| DB update fails after copy    | Row unchanged. New folder exists but is unreferenced — costs disk, caught by the verify query. |
| Crash between copy and update | Same as above.                                                                                 |

No ordering produces a row whose images are gone.

## Scope

Both domains. `app/admin/makeup/variants/actions.ts` has the identical hazard via
`toSlugMakeup(set, category)`, and its `makeup_variants.slug` is likewise UNIQUE with a matching
`alt_slug` trigger. One shared helper parameterized by table and category column, with thin
per-domain wrappers supplying the slug-derivation rule.

## Files

| File                                    | Change                                                                                                                                                                                                                                                                                                       |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `lib/variant-recategorize.ts`           | New. The shared helper.                                                                                                                                                                                                                                                                                      |
| `app/admin/outfits/variants/actions.ts` | Call the helper from `editOutfitVariant` when the slug changes.                                                                                                                                                                                                                                              |
| `app/admin/makeup/variants/actions.ts`  | Same for `editMakeupVariant`.                                                                                                                                                                                                                                                                                |
| `app/admin/entity-form.tsx`             | Possibly: let the slug preview re-derive on category change so the admin sees the new slug before saving. Needs care — `deriveOnEdit` is off for a reason (it stops unrelated edits silently rewriting a slug), so this should key on the category field specifically, not turn `deriveOnEdit` on wholesale. |

## Testing

The repo runs vitest (`yarn test`), and `lib/feedback/__tests__/` establishes the pattern for
pure-logic modules under `lib/`. This design leans on that: the parts worth testing — deriving the
target slug, turning a stored image URL into its bucket object path, and rewriting that URL for a
new folder — are pure functions with no Supabase dependency, and get real unit tests. Only the
thin layer that calls `storage.copy()` and `update()` stays untested, which is the part a unit
test would merely be asserting against a mock anyway.

Then verify end-to-end against a scratch variant on the live project:

1. Create a throwaway variant with both images and an `obtained_outfit` row.
2. Recategorize it. Confirm: slug changed, both image URLs resolve `200`, `alt_slug` recomputed
   by the trigger, `default` unchanged (its trigger does not fire on a category change), and the
   `obtained_outfit` row followed via cascade with its `outfit_category` updated.
3. Confirm the old folder still exists and is reported unreferenced by the verify query.
4. Attempt a recategorization onto an occupied slug; confirm the named error, and that the row is
   untouched.
5. Delete the scratch variant and its folders.

Run the makeup path through the same five steps.
