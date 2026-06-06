# Alt Image URL Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an `alt_image_url` column to `outfit_sets`, `outfit_variants`, and `evolutions` — editable via inline DataGrid cells and full edit forms.

**Architecture:** Three DB migrations add the column; the `ImageUpload` component gains a `column` prop so it can write to either `image_url` or `alt_image_url`; types, data hooks, DataGrid tables, and edit forms each get minimal targeted additions following existing patterns.

**Tech Stack:** Next.js 15 App Router, Supabase (Postgres + Storage), MUI X DataGrid, TypeScript

---

### Task 1: Database migrations

**Files:**

- Create: `supabase/migrations/20260605000002_add_alt_image_url_to_outfit_sets.sql`
- Create: `supabase/migrations/20260605000003_add_alt_image_url_to_outfit_variants.sql`
- Create: `supabase/migrations/20260605000004_add_alt_image_url_to_evolutions.sql`

- [ ] **Step 1: Create migration files**

`supabase/migrations/20260605000002_add_alt_image_url_to_outfit_sets.sql`:

```sql
ALTER TABLE outfit_sets ADD COLUMN alt_image_url text;
```

`supabase/migrations/20260605000003_add_alt_image_url_to_outfit_variants.sql`:

```sql
ALTER TABLE outfit_variants ADD COLUMN alt_image_url text;
```

`supabase/migrations/20260605000004_add_alt_image_url_to_evolutions.sql`:

```sql
ALTER TABLE evolutions ADD COLUMN alt_image_url text;
```

- [ ] **Step 2: Push migrations**

```bash
supabase db push --include-all
```

Expected: three migrations applied, no errors.

- [ ] **Step 3: Regenerate TypeScript types**

```bash
supabase gen types typescript --project-id $(cat supabase/.temp/project-ref) > lib/types/supabase.ts
```

Expected: `lib/types/supabase.ts` updated; `outfit_sets`, `outfit_variants`, and `evolutions` rows now include `alt_image_url: string | null`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260605000002_add_alt_image_url_to_outfit_sets.sql
git add supabase/migrations/20260605000003_add_alt_image_url_to_outfit_variants.sql
git add supabase/migrations/20260605000004_add_alt_image_url_to_evolutions.sql
git add lib/types/supabase.ts
git commit -m "feat: add alt_image_url column to outfit_sets, outfit_variants, evolutions"
```

---

### Task 2: Add `column` prop to `ImageUpload`

**Files:**

- Modify: `components/forms/image-upload.tsx`

Currently the component hardcodes `.update({ image_url: data.publicUrl })`. Adding an optional `column` prop (defaulting to `'image_url'`) makes it reusable for `alt_image_url`.

- [ ] **Step 1: Update the component signature and upload logic**

In `components/forms/image-upload.tsx`, change the props interface and the DB update call:

```tsx
export default function ImageUpload({
  url,
  table,
  slug,
  onUpload,
  caption,
  column = 'image_url',
}: {
  url: string | null
  table: 'eureka_variants' | 'outfit_variants' | 'trials' | 'outfit_sets' | 'evolutions'
  slug: string | undefined
  onUpload: (url: string) => void
  caption?: string
  column?: string
}) {
```

Then replace line 62's hardcoded update:

```tsx
const { error: dbError } = await supabase
  .from(table)
  .update({ [column]: data.publicUrl })
  .eq('slug', slug)
```

- [ ] **Step 2: Type-check**

```bash
yarn tsc --noEmit
```

Expected: no errors (all existing callers omit `column` and get the default).

- [ ] **Step 3: Commit**

```bash
git add components/forms/image-upload.tsx
git commit -m "feat: add column prop to ImageUpload, default image_url"
```

---

### Task 3: Update TypeScript types

**Files:**

- Modify: `lib/types/outfit.ts`

- [ ] **Step 1: Add `alt_image_url` to all four Pick types**

In `lib/types/outfit.ts`:

```ts
export type Evolution = Pick<
  Tables<'evolutions'>,
  | 'slug'
  | 'title'
  | 'subtitle'
  | 'description'
  | 'order'
  | 'outfit_set'
  | 'image_url'
  | 'alt_image_url'
>

export type OutfitSet = Tables<'outfit_sets'> & {
  image_url: string | null | undefined
  outfit_variants: OutfitVariant[]
  outfit_categories: OutfitCategory[]
  evolutions: Evolution[]
}

export type OutfitSetRaw = Pick<
  Tables<'outfit_sets'>,
  | 'id'
  | 'slug'
  | 'title'
  | 'description'
  | 'rarity'
  | 'style'
  | 'label'
  | 'label_2'
  | 'ability'
  | 'image_url'
  | 'alt_image_url'
  | 'glowup_evolution'
  | 'updated_at'
>

export type OutfitVariant = Pick<
  Tables<'outfit_variants'>,
  | 'id'
  | 'slug'
  | 'outfit_set'
  | 'evolution'
  | 'outfit_category'
  | 'image_url'
  | 'alt_image_url'
  | 'default'
> & { obtained?: boolean }

export type OutfitVariantRaw = Pick<
  Tables<'outfit_variants'>,
  | 'id'
  | 'slug'
  | 'outfit_set'
  | 'evolution'
  | 'outfit_category'
  | 'image_url'
  | 'alt_image_url'
  | 'default'
  | 'updated_at'
> & {
  outfit_sets: { title: string } | null
  outfit_categories: { title: string } | null
  evolutions: { title: string | null } | null
}
```

- [ ] **Step 2: Type-check**

```bash
yarn tsc --noEmit
```

Expected: errors about `alt_image_url` not being in select strings — these will be fixed in Task 4.

- [ ] **Step 3: Commit**

```bash
git add lib/types/outfit.ts
git commit -m "feat: add alt_image_url to outfit type definitions"
```

---

### Task 4: Update data hooks

**Files:**

- Modify: `hooks/data/admin/outfit-sets.ts`
- Modify: `hooks/data/admin/outfit-variants.ts`
- Modify: `hooks/data/evolutions.ts`

- [ ] **Step 1: Update `hooks/data/admin/outfit-sets.ts`**

Add `alt_image_url` to both select strings:

```ts
export const getOutfitSetsRaw = cache(async () => {
  const supabase = await createClient()
  const { data: outfitSets } = await supabase
    .from('outfit_sets')
    .select(
      'id, slug, title, description, rarity, style, label, label_2, ability, glowup_evolution, image_url, alt_image_url, updated_at'
    )
    .order('updated_at', { ascending: false, nullsFirst: false })
  return (outfitSets ?? []) as OutfitSetRaw[]
})

export const getOutfitSetRaw = cache(async (slug: string) => {
  const supabase = await createClient()
  const { data: outfitSet } = await supabase
    .from('outfit_sets')
    .select(
      'id, slug, title, description, rarity, style, label, label_2, ability, glowup_evolution, image_url, alt_image_url, updated_at'
    )
    .eq('slug', slug)
    .maybeSingle()
  return outfitSet as OutfitSetRaw | null
})
```

- [ ] **Step 2: Update `hooks/data/admin/outfit-variants.ts`**

Add `alt_image_url` to both select strings (the multiline format used in this file):

```ts
export const getOutfitVariantsRaw = cache(async () => {
  const supabase = await createClient()
  const { data: outfitVariants } = await supabase
    .from('outfit_variants')
    .select(
      `
      id,
      slug,
      outfit_set,
      evolution,
      outfit_category,
      image_url,
      alt_image_url,
      default,
      updated_at,
      outfit_sets ( title ),
      outfit_categories ( title ),
      evolutions ( title )
      `
    )
    .order('id', { ascending: false })
  return (outfitVariants ?? []) as OutfitVariantRaw[]
})

export const getOutfitVariantRaw = cache(async (slug: string) => {
  const supabase = await createClient()
  const { data: outfitVariant } = await supabase
    .from('outfit_variants')
    .select(
      `
      id,
      slug,
      outfit_set,
      evolution,
      outfit_category,
      image_url,
      alt_image_url,
      default,
      updated_at,
      outfit_sets ( title ),
      outfit_categories ( title ),
      evolutions ( title )
      `
    )
    .eq('slug', slug)
    .maybeSingle()
  return outfitVariant as OutfitVariantRaw | null
})
```

- [ ] **Step 3: Update `hooks/data/evolutions.ts`**

Add `alt_image_url` to both select strings in `getEvolutions` and `getEvolutionsBySet`:

```ts
export const getEvolutions = cache(async () => {
  const supabase = await createClient()
  const { data: evolutions } = await supabase
    .from('evolutions')
    .select('slug, title, subtitle, description, order, outfit_set, image_url, alt_image_url')
    .order('order', { ascending: true })
  return (evolutions ?? []) as Evolution[]
})

export const getEvolutionsBySet = cache(async (outfitSetSlug: string) => {
  const supabase = await createClient()
  const { data: evolutions } = await supabase
    .from('evolutions')
    .select('slug, title, subtitle, description, order, outfit_set, image_url, alt_image_url')
    .eq('outfit_set', outfitSetSlug)
    .order('order', { ascending: true })
  return (evolutions ?? []) as Evolution[]
})
```

- [ ] **Step 4: Type-check**

```bash
yarn tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add hooks/data/admin/outfit-sets.ts hooks/data/admin/outfit-variants.ts hooks/data/evolutions.ts
git commit -m "feat: select alt_image_url in outfit data hooks"
```

---

### Task 5: Update outfit sets DataGrid table

**Files:**

- Modify: `app/(admin)/dashboard/outfits/sets/outfit-set-table.tsx`

- [ ] **Step 1: Add `ImageUpload` import and remove `image_url` from `LOCKED_FIELDS`**

At the top of the file, add the import:

```tsx
import ImageUpload from '@/components/forms/image-upload'
```

Change `LOCKED_FIELDS`:

```ts
const LOCKED_FIELDS = ['slug', 'evolutions', 'glowup_evolution', 'updated_at']
```

(`image_url` removed; `alt_image_url` is not locked either so it is never added.)

- [ ] **Step 2: Replace `image_url` renderCell with `ImageUpload`**

Replace the existing `image_url` column definition (the one with `LazyAvatar`) with:

```tsx
{
  field: 'image_url',
  headerName: 'Image',
  width: 100,
  sortable: false,
  renderCell: ({ row }: GridRenderCellParams<Row>) => (
    <Stack sx={{ flex: 1, height: 100, justifyContent: 'center' }}>
      <ImageUpload
        column="image_url"
        slug={row.slug ?? undefined}
        table="outfit_sets"
        url={row.image_url ?? null}
        onUpload={(url) => setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, image_url: url } : r)))}
      />
    </Stack>
  ),
},
```

- [ ] **Step 3: Add `alt_image_url` column after `image_url`**

Insert this column definition immediately after the `image_url` column:

```tsx
{
  field: 'alt_image_url',
  headerName: 'Alt Image',
  width: 100,
  sortable: false,
  renderCell: ({ row }: GridRenderCellParams<Row>) => (
    <Stack sx={{ flex: 1, height: 100, justifyContent: 'center' }}>
      <ImageUpload
        column="alt_image_url"
        slug={row.slug ?? undefined}
        table="outfit_sets"
        url={row.alt_image_url ?? null}
        onUpload={(url) => setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, alt_image_url: url } : r)))}
      />
    </Stack>
  ),
},
```

- [ ] **Step 4: Set `rowHeight={100}` on the DataGrid**

In the `<DataGrid>` JSX at the bottom of the file, add `rowHeight={100}`:

```tsx
<DataGrid
  disableRowSelectionOnClick
  columns={columns}
  editMode="row"
  getRowId={(row) => row.id}
  initialState={{ pagination: { paginationModel: { pageSize: 15 } } }}
  isCellEditable={({ field }) => !LOCKED_FIELDS.includes(field)}
  pageSizeOptions={[6, 8, 15, 20, 30, 50, 100]}
  processRowUpdate={processRowUpdate}
  rowHeight={100}
  rowModesModel={rowModesModel}
  rows={rows}
  sx={{ border: 0, bgcolor: 'transparent' }}
  onRowModesModelChange={setRowModesModel}
/>
```

- [ ] **Step 5: Type-check**

```bash
yarn tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add 'app/(admin)/dashboard/outfits/sets/outfit-set-table.tsx'
git commit -m "feat: add inline image upload columns to outfit sets DataGrid"
```

---

### Task 6: Update outfit variants DataGrid table

**Files:**

- Modify: `app/(admin)/dashboard/outfits/variants/outfit-variant-table.tsx`

- [ ] **Step 1: Add `ImageUpload` import and remove `image_url` from `LOCKED_FIELDS`**

Add the import:

```tsx
import ImageUpload from '@/components/forms/image-upload'
```

Change `LOCKED_FIELDS`:

```ts
const LOCKED_FIELDS = ['slug', 'updated_at']
```

(`image_url` removed.)

- [ ] **Step 2: Replace `image_url` renderCell with `ImageUpload`**

Replace the existing `image_url` column definition (the one with `LazyAvatar` + `LockedCell`) with:

```tsx
{
  field: 'image_url',
  headerName: 'Image',
  width: 100,
  sortable: false,
  renderCell: ({ row }: GridRenderCellParams<Row>) => (
    <Stack sx={{ flex: 1, height: 100, justifyContent: 'center' }}>
      <ImageUpload
        column="image_url"
        slug={row.slug ?? undefined}
        table="outfit_variants"
        url={row.image_url ?? null}
        onUpload={(url) => setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, image_url: url } : r)))}
      />
    </Stack>
  ),
},
```

- [ ] **Step 3: Add `alt_image_url` column after `image_url`**

```tsx
{
  field: 'alt_image_url',
  headerName: 'Alt Image',
  width: 100,
  sortable: false,
  renderCell: ({ row }: GridRenderCellParams<Row>) => (
    <Stack sx={{ flex: 1, height: 100, justifyContent: 'center' }}>
      <ImageUpload
        column="alt_image_url"
        slug={row.slug ?? undefined}
        table="outfit_variants"
        url={row.alt_image_url ?? null}
        onUpload={(url) => setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, alt_image_url: url } : r)))}
      />
    </Stack>
  ),
},
```

- [ ] **Step 4: Set `rowHeight={100}` on the DataGrid**

Add `rowHeight={100}` to the `<DataGrid>` props.

- [ ] **Step 5: Type-check**

```bash
yarn tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add 'app/(admin)/dashboard/outfits/variants/outfit-variant-table.tsx'
git commit -m "feat: add inline image upload columns to outfit variants DataGrid"
```

---

### Task 7: Update evolutions DataGrid table

**Files:**

- Modify: `app/(admin)/dashboard/outfits/evolutions/outfit-evolution-table.tsx`

The evolutions table is currently read-only (no row edit mode). Uploads write directly to Supabase, so a local `rows` state is needed to reflect the new URL without a page reload.

- [ ] **Step 1: Add state and imports**

Add to imports:

```tsx
import { useState } from 'react'
import ImageUpload from '@/components/forms/image-upload'
```

At the top of `OutfitEvolutionTable`, initialize local rows state:

```tsx
export function OutfitEvolutionTable({ rows: initialRows }: OutfitEvolutionTableProps) {
  const [rows, setRows] = useState<Row[]>(initialRows)
  const editHref = (row: Row) => `${navLinksData.dashboard.outfits.evolutions.edit}/${row.slug}`
```

- [ ] **Step 2: Replace `image_url` renderCell with `ImageUpload`**

Replace the existing `image_url` column definition (the one with `LazyAvatar`) with:

```tsx
{
  field: 'image_url',
  headerName: 'Image',
  width: 100,
  sortable: false,
  renderCell: ({ row }: GridRenderCellParams<Row>) => (
    <Stack sx={{ flex: 1, height: 100, justifyContent: 'center' }}>
      <ImageUpload
        column="image_url"
        slug={row.slug}
        table="evolutions"
        url={row.image_url ?? null}
        onUpload={(url) => setRows((prev) => prev.map((r) => (r.slug === row.slug ? { ...r, image_url: url } : r)))}
      />
    </Stack>
  ),
},
```

- [ ] **Step 3: Add `alt_image_url` column after `image_url`**

```tsx
{
  field: 'alt_image_url',
  headerName: 'Alt Image',
  width: 100,
  sortable: false,
  renderCell: ({ row }: GridRenderCellParams<Row>) => (
    <Stack sx={{ flex: 1, height: 100, justifyContent: 'center' }}>
      <ImageUpload
        column="alt_image_url"
        slug={row.slug}
        table="evolutions"
        url={row.alt_image_url ?? null}
        onUpload={(url) => setRows((prev) => prev.map((r) => (r.slug === row.slug ? { ...r, alt_image_url: url } : r)))}
      />
    </Stack>
  ),
},
```

- [ ] **Step 4: Set `rowHeight={100}` and switch to local `rows` state**

Update the `<DataGrid>` to use the local state and set row height:

```tsx
<DataGrid
  disableRowSelectionOnClick
  columns={columns}
  getRowId={(row) => row.slug}
  initialState={{ pagination: { paginationModel: { pageSize: 15 } } }}
  pageSizeOptions={[6, 8, 15, 20, 30, 50, 100]}
  rowHeight={100}
  rows={rows}
  sx={{ border: 0, bgcolor: 'transparent' }}
/>
```

- [ ] **Step 5: Type-check**

```bash
yarn tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add 'app/(admin)/dashboard/outfits/evolutions/outfit-evolution-table.tsx'
git commit -m "feat: add inline image upload columns to evolutions DataGrid"
```

---

### Task 8: Update edit forms

**Files:**

- Modify: `app/(admin)/dashboard/outfits/sets/edit/[slug]/edit-outfit-set-form.tsx`
- Modify: `app/(admin)/dashboard/outfits/variants/edit/[slug]/edit-outfit-variant-form.tsx`
- Modify: `app/(admin)/dashboard/outfits/evolutions/edit/[slug]/edit-evolution-form.tsx`

- [ ] **Step 1: Update `edit-outfit-set-form.tsx`**

Add state below the existing `setImage` state:

```tsx
const [altSetImage, setAltSetImage] = useState<string | null>(outfitSet.alt_image_url ?? null)
```

Add the section below the "Set Image" `<Stack>` block (after the closing `</Stack>` of the Set Image section, before the variant images section):

```tsx
<Stack spacing={1}>
  <Typography variant="subtitle2">Alt Image</Typography>
  <ImageUpload
    column="alt_image_url"
    slug={outfitSet.slug}
    table="outfit_sets"
    url={altSetImage}
    onUpload={(url) => setAltSetImage(url)}
  />
</Stack>
```

- [ ] **Step 2: Update `edit-outfit-variant-form.tsx`**

Add state below `imageUrl`:

```tsx
const [altImageUrl, setAltImageUrl] = useState<string | null>(variant.alt_image_url ?? null)
```

Add the `ImageUpload` below the existing image upload (after the `</ImageUpload>` for `image_url`, before the `<input name="default" ...>`):

```tsx
<ImageUpload
  column="alt_image_url"
  slug={currentSlug || undefined}
  table="outfit_variants"
  url={altImageUrl}
  onUpload={(url) => setAltImageUrl(url)}
/>
```

- [ ] **Step 3: Update `edit-evolution-form.tsx`**

Add the section below the "Evolution Set Image" `<Stack>` block:

```tsx
<Stack spacing={1}>
  <Typography variant="subtitle2">Alt Image</Typography>
  <ImageUpload
    column="alt_image_url"
    slug={evolution.slug}
    table="evolutions"
    url={evolution.alt_image_url ?? null}
    onUpload={() => {}}
  />
</Stack>
```

Note: `evolution.alt_image_url` is available because `EvolutionRow` in this form is typed as `Pick<Tables<'evolutions'>, ...>` — after Task 1 regenerates types, `alt_image_url` is in `Tables<'evolutions'>`. Add `'alt_image_url'` to the `EvolutionRow` Pick at the top of the file:

```ts
type EvolutionRow = Pick<
  Tables<'evolutions'>,
  | 'slug'
  | 'title'
  | 'subtitle'
  | 'description'
  | 'order'
  | 'outfit_set'
  | 'image_url'
  | 'alt_image_url'
>
```

- [ ] **Step 4: Type-check**

```bash
yarn tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add 'app/(admin)/dashboard/outfits/sets/edit/[slug]/edit-outfit-set-form.tsx'
git add 'app/(admin)/dashboard/outfits/variants/edit/[slug]/edit-outfit-variant-form.tsx'
git add 'app/(admin)/dashboard/outfits/evolutions/edit/[slug]/edit-evolution-form.tsx'
git commit -m "feat: add alt image upload to outfit set, variant, and evolution edit forms"
```
