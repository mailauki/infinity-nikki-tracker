# Alt Image URL — Design Spec

**Date:** 2026-06-05

## Overview

Add an `alt_image_url` column to `outfit_sets`, `outfit_variants`, and `evolutions` to store an alternative image of the same item. Both `image_url` and `alt_image_url` are editable directly in the admin DataGrid (via inline `ImageUpload` cells) and in the full edit forms.

---

## 1. Database Migrations

Three migrations, one per table. All columns are `text`, nullable, no default.

- `20260605000002_add_alt_image_url_to_outfit_sets.sql`
  ```sql
  ALTER TABLE outfit_sets ADD COLUMN alt_image_url text;
  ```

- `20260605000003_add_alt_image_url_to_outfit_variants.sql`
  ```sql
  ALTER TABLE outfit_variants ADD COLUMN alt_image_url text;
  ```

- `20260605000004_add_alt_image_url_to_evolutions.sql`
  ```sql
  ALTER TABLE evolutions ADD COLUMN alt_image_url text;
  ```

After running migrations: regenerate Supabase types with `supabase gen types typescript`.

---

## 2. `ImageUpload` Component

**File:** `components/forms/image-upload.tsx`

Add an optional `column?: string` prop (default `'image_url'`). Use it in the `.update()` call instead of the hardcoded `image_url`:

```ts
.update({ [column]: data.publicUrl })
```

This is the only change needed to support writing `alt_image_url` from both the DataGrid cells and the edit forms.

---

## 3. TypeScript Types

**File:** `lib/types/outfit.ts`

Add `alt_image_url` to these `Pick` types:

- `Evolution` — add `'alt_image_url'`
- `OutfitSetRaw` — add `'alt_image_url'`
- `OutfitVariantRaw` — add `'alt_image_url'`
- `OutfitVariant` — add `'alt_image_url'`

---

## 4. Data Hooks

**Files:** `hooks/data/admin/outfit-sets.ts`, `hooks/data/admin/outfit-variants.ts`

Add `alt_image_url` to the `.select()` strings in all four functions:
- `getOutfitSetsRaw`, `getOutfitSetRaw`
- `getOutfitVariantsRaw`, `getOutfitVariantRaw`

The evolutions table has no dedicated admin data hook — evolutions are fetched via `hooks/data/evolutions.ts` and passed through the outfit sets query. Add `alt_image_url` to the `Evolution` pick in `hooks/data/evolutions.ts` and to the evolutions select in `hooks/data/outfit-sets.ts` if it joins evolutions.

---

## 5. Admin DataGrid Tables

Both `image_url` and `alt_image_url` are editable directly in the DataGrid via `ImageUpload` rendered in `renderCell`. Neither column uses `LockedCell`.

### `outfit-set-table.tsx`

- Remove `image_url` from `LOCKED_FIELDS` (add `alt_image_url` is never in it)
- Replace the existing `image_url` renderCell (`LazyAvatar` in a `Stack`) with an `ImageUpload` that calls `onUpload` to update local row state via `setRows`
- Add a new `alt_image_url` column with the same `ImageUpload` pattern, using `column="alt_image_url"`
- `processRowUpdate` does not need to handle image columns — uploads write directly to Supabase from the client

### `outfit-variant-table.tsx`

Same pattern: remove `image_url` from locked fields, replace renderCell with `ImageUpload`, add `alt_image_url` column.

### `outfit-evolution-table.tsx`

The evolutions table is currently read-only (no inline editing, no `processRowUpdate`). To support image uploads:
- Replace the `image_url` `LazyAvatar` renderCell with `ImageUpload` (no `setRows` needed — upload writes directly to Supabase; local state update via a `useState` rows copy initialized from props)
- Add `alt_image_url` column with the same pattern
- No row edit mode needed; uploads are self-contained

**DataGrid row height:** `ImageUpload` renders at 90×90px. The DataGrid default row height (52px) must be increased to fit. Use `rowHeight={100}` on all three tables that show image columns (already needed for the existing `image_url` column; confirm the current value and adjust if needed).

---

## 6. Edit Forms

Each form gets an "Alt Image" `ImageUpload` section below the existing image section.

### `edit-outfit-set-form.tsx`

Below the "Set Image" `ImageUpload`:
```tsx
const [altSetImage, setAltSetImage] = useState<string | null>(outfitSet.alt_image_url ?? null)
// ...
<Stack spacing={1}>
  <Typography variant="subtitle2">Alt Image</Typography>
  <ImageUpload
    slug={outfitSet.slug}
    table="outfit_sets"
    column="alt_image_url"
    url={altSetImage}
    onUpload={(url) => setAltSetImage(url)}
  />
</Stack>
```

No hidden input needed — `ImageUpload` writes directly to Supabase on upload. The server action (`editOutfitSet`) does not need to handle `alt_image_url`.

### `edit-outfit-variant-form.tsx`

Below the existing `ImageUpload`:
```tsx
const [altImageUrl, setAltImageUrl] = useState<string | null>(variant.alt_image_url ?? null)
// ...
<ImageUpload
  slug={currentSlug || undefined}
  table="outfit_variants"
  column="alt_image_url"
  url={altImageUrl}
  onUpload={(url) => setAltImageUrl(url)}
/>
```

Same pattern — no hidden input, server action unchanged.

### `edit-evolution-form.tsx`

Below the "Evolution Set Image" `ImageUpload`:
```tsx
<Stack spacing={1}>
  <Typography variant="subtitle2">Alt Image</Typography>
  <ImageUpload
    slug={evolution.slug}
    table="evolutions"
    column="alt_image_url"
    url={evolution.alt_image_url ?? null}
    onUpload={() => {}}
  />
</Stack>
```

Mirrors the existing `image_url` upload pattern in this form (stateless, writes directly).

---

## 7. Server Actions

No server action changes are required. All `alt_image_url` writes happen directly from the `ImageUpload` client component via the Supabase browser client. The form actions (`editOutfitSet`, `editOutfitVariant`, `editEvolution`, `addOutfitSet`, `addOutfitVariant`) do not need to handle this field.

---

## Build Sequence

1. Run migrations → regenerate types
2. Update `ImageUpload` with `column` prop
3. Update TypeScript types
4. Update data hooks (select strings)
5. Update DataGrid tables (image columns)
6. Update edit forms (alt image sections)
