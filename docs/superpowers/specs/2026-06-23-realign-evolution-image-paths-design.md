# Realign evolution image storage paths with merged `outfit_sets`

**Date:** 2026-06-23
**Status:** Approved

## Background

Migration `20260622000001_merge_evolutions_into_outfit_sets.sql` folded the
`evolutions` and `evolution_carousel_images` tables into `outfit_sets` and
`outfit_set_carousel_images`. Every outfit state (base, glow-up, evolution) is
now an `outfit_sets` row.

That migration copied image URLs verbatim (`e.image_url`, `eci.image_url`), so
the stored images and their DB URLs still live under the **old** storage path
prefixes:

- `images/evolutions/{slug}/{uuid}.{ext}`
- `images/evolution_carousel_images/{slug}/{uuid}.{ext}`

The upload code (`components/forms/image-upload.tsx`,
`app/admin/outfits/carousel-image-upload.tsx`) already writes to the new
`{table}/{slug}/{uuid}.{ext}` pattern — evolution edit forms pass
`table="outfit_sets"` / `table="outfit_set_carousel_images"`. So **new** uploads
conform; only the **existing data** is out of pattern.

## Scope (data only — no code changes)

The convention is `{table}/{slug}/{uuid}.{ext}`. Because evolution rows are now
`outfit_sets` rows, the correct location for their images is
`outfit_sets/{slug}/...` (and `outfit_set_carousel_images/{slug}/...` for
gallery images). The slug segment in each old path already exactly matches the
row's current slug, so the fix is a clean prefix swap.

State to migrate (verified 2026-06-23):

| Layer                                  | Old location                        | Count |
| -------------------------------------- | ----------------------------------- | ----- |
| `storage.objects.name`                 | `evolutions/...`                    | 657   |
| `storage.objects.name`                 | `evolution_carousel_images/...`     | 23    |
| `outfit_sets.image_url`                | `.../evolutions/...`                | 397   |
| `outfit_sets.alt_image_url`            | `.../evolutions/...`                | 257   |
| `outfit_set_carousel_images.image_url` | `.../evolution_carousel_images/...` | 22    |

`outfit_variants` images are already clean (0 stale) — the merge mapped variants
onto state slugs but variant images were always stored under `outfit_variants/`.

The remaining `evolutions` references in application code
(`app/admin/outfits/sets/outfit-set-table.tsx`, `hooks/outfit.ts`,
`lib/nav-links.tsx`) are the domain concept (the array of evolution rows, the
admin nav link) — not storage paths. They are correct and unchanged.

## Pitfall: a SQL `storage.objects.name` rename does NOT move the bytes

The first attempt renamed `storage.objects.name` directly in SQL, on the
assumption that the bytes are keyed by `id`/`version` and `path_tokens` (a
generated column) would recompute. **This is wrong and broke every image.**

Supabase Storage stores the actual file bytes in the S3 backend under a key
derived from `bucket_id/name`. Renaming `name` in the metadata table updates the
pointer but leaves the bytes at the old S3 key, so neither the old nor the new
path resolves (HTTP 400 / `Not found`). The bytes are not lost — they remain at
the original `evolutions/` key — but the metadata no longer points at them.

Recovery was to revert the `name` rename (and the URL repoint), which restored
rendering, then move the objects the correct way.

## Approach (what actually works)

Two steps, in order:

### 1. Move the storage objects via the Storage API

A one-off Node script (`@supabase/supabase-js`, service-role key) calls
`supabase.storage.from('images').move(from, to)` for every object under the two
old prefixes. `move()` performs a real S3 copy + delete, so the bytes actually
relocate:

- `evolutions/{slug}/…` → `outfit_sets/{slug}/…`
- `evolution_carousel_images/{slug}/…` → `outfit_set_carousel_images/{slug}/…`

The script lists recursively (Storage `list` is per-folder), is idempotent /
resumable (if a source is gone but the destination exists, it counts as
already-done), and retries transient 5xx / Gateway Timeout responses. It lives
outside the migration history (storage moves can't be expressed in SQL) and is
deleted after the run. Result: moved=680, failed=0.

### 2. Repoint the DB URLs (migration `20260623000002_repoint_evolution_image_urls.sql`)

After the objects are physically at the new paths, `replace()` the path
substring in the public URLs, in one transaction:

- `/evolutions/` → `/outfit_sets/` in `outfit_sets.image_url` and
  `outfit_sets.alt_image_url`
- `/evolution_carousel_images/` → `/outfit_set_carousel_images/` in
  `outfit_set_carousel_images.image_url`

Order matters: move bytes first, repoint URLs second. Between the two steps the
site shows broken evolution images (DB → old path, object → new path), so run
them back-to-back.

## Verification

All of these held after completion:

- The three stale-URL counts return 0.
- `storage.objects` shows 0 objects under `evolutions/` and
  `evolution_carousel_images/`; counts folded into `outfit_sets/` (538 → 1195,
  +657) and `outfit_set_carousel_images/` (8 → 31, +23).
- Real DB-stored URLs (set image, alt image, carousel image) fetch HTTP 200 with
  valid image bytes.

## Out of scope

- Upload route / component changes — already conform.
- `lib/types/supabase.ts` regeneration — no schema (DDL) change, so types are
  unaffected.
