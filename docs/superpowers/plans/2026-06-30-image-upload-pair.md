# ImageUploadPair Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract the duplicated "Default + Alternative" two-`ImageUpload` row into one shared, controlled `ImageUploadPair` component used by the outfit-set edit form, the evolution edit form, and the variant card.

**Architecture:** A single `'use client'` presentational component in `components/forms/` that renders a `Stack` of two `ImageUpload`s (default `image_url` + alt `alt_image_url`) sharing `table`/`slug`/`size`, with hardcoded `"Default"`/`"Alternative"` captions and an optional hidden input. Parents stay controlled (keep their state and pass change callbacks). The `table` prop union is hoisted to a named `ImageUploadTable` export so both components share one source of truth.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, MUI v9. Package manager Yarn.

## Global Constraints

- Prettier: no semicolons, single quotes, 2-space indent, 100 char width, ES5 trailing commas. Copied verbatim from CLAUDE.md.
- Path alias `@/` maps to project root.
- No test framework exists; verification per task is `yarn dlx tsc --noEmit` (clean) + `yarn lint` (clean), plus a visual check in `yarn dev` at the end.
- Component stays **controlled** — do NOT add internal state for image/altImage; parents own it.
- Do NOT touch the per-variant grid or the four `Record<string, ...>` state maps / after-save re-sync in the forms — out of scope.
- The PostToolUse hook runs `yarn format && yarn lint:fix` then `yarn tsc --noEmit` after every Edit/Write; expect auto-formatting.
- Branch already exists: `refactor/image-upload-pair`. Never commit to `main`.

---

### Task 1: Export `ImageUploadTable` type and create `ImageUploadPair`

**Files:**

- Modify: `components/forms/image-upload.tsx` (hoist the `table` union to a named exported type; line ~28–35 of the props object)
- Create: `components/forms/image-upload-pair.tsx`

**Interfaces:**

- Produces: `export type ImageUploadTable = 'eureka_variants' | 'outfit_variants' | 'trials' | 'outfit_sets' | 'abilities' | 'seasons' | 'custom_looks'` from `image-upload.tsx`.
- Produces: `ImageUploadPair` default export with props `{ table: ImageUploadTable; slug: string | undefined; image: string | null; altImage: string | null; onImageChange: (url: string) => void; onAltImageChange: (url: string) => void; size?: AvatarSize; hiddenInputName?: string }`.

- [ ] **Step 1: Hoist the table union to a named type in `image-upload.tsx`**

Add this exported type above the `ImageUpload` function (after the imports, before `export default function ImageUpload`):

```tsx
export type ImageUploadTable =
  | 'eureka_variants'
  | 'outfit_variants'
  | 'trials'
  | 'outfit_sets'
  | 'abilities'
  | 'seasons'
  | 'custom_looks'
```

Then replace the inline `table:` union in the props type with the named type. The props block changes from:

```tsx
  table:
    | 'eureka_variants'
    | 'outfit_variants'
    | 'trials'
    | 'outfit_sets'
    | 'abilities'
    | 'seasons'
    | 'custom_looks'
```

to:

```tsx
table: ImageUploadTable
```

- [ ] **Step 2: Create the `ImageUploadPair` component**

Write `components/forms/image-upload-pair.tsx`:

```tsx
'use client'

import { Stack } from '@mui/material'
import { AvatarSize } from '@/lib/types/props'
import ImageUpload, { ImageUploadTable } from '@/components/forms/image-upload'

export default function ImageUploadPair({
  table,
  slug,
  image,
  altImage,
  onImageChange,
  onAltImageChange,
  size = 'md',
  hiddenInputName,
}: {
  table: ImageUploadTable
  slug: string | undefined
  image: string | null
  altImage: string | null
  onImageChange: (url: string) => void
  onAltImageChange: (url: string) => void
  size?: AvatarSize
  hiddenInputName?: string
}) {
  return (
    <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between' }}>
      {hiddenInputName && <input name={hiddenInputName} type="hidden" value={image ?? ''} />}
      <ImageUpload
        caption="Default"
        size={size}
        slug={slug}
        table={table}
        url={image}
        onUpload={onImageChange}
      />
      <ImageUpload
        caption="Alternative"
        column="alt_image_url"
        size={size}
        slug={slug}
        table={table}
        url={altImage}
        onUpload={onAltImageChange}
      />
    </Stack>
  )
}
```

- [ ] **Step 3: Type-check and lint**

Run: `yarn dlx tsc --noEmit && yarn lint`
Expected: no errors. (`image-upload.tsx` still compiles with the named type; the new file has no consumers yet but must type-check.)

- [ ] **Step 4: Commit**

```bash
git add components/forms/image-upload.tsx components/forms/image-upload-pair.tsx
git commit -m "feat(forms): add ImageUploadPair and export ImageUploadTable type

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Adopt `ImageUploadPair` in the variant card

**Files:**

- Modify: `components/outfits/outfit-variant-image-card.tsx` (replace the hidden input + two-`ImageUpload` `Stack`, current ~L58–77; drop the now-unused `ImageUpload` import)

**Interfaces:**

- Consumes: `ImageUploadPair` from Task 1.

- [ ] **Step 1: Replace the import**

In `components/outfits/outfit-variant-image-card.tsx`, change the `ImageUpload` import line:

```tsx
import ImageUpload from '@/components/forms/image-upload'
```

to:

```tsx
import ImageUploadPair from '@/components/forms/image-upload-pair'
```

- [ ] **Step 2: Replace the hidden input + uploads block**

Replace this block (the hidden input and the `Stack` of two `ImageUpload`s):

```tsx
          <input name={`variant_image_${variant.slug}`} type="hidden" value={image ?? ''} />
          <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', pb: 1 }}>
            <ImageUpload
              caption={categoryTitle}
								size='lg'
              slug={slug}
              table="outfit_variants"
              url={image}
              onUpload={onImageChange}
            />
            <ImageUpload
              caption={categoryTitle && `Alt ${categoryTitle}`}
              column="alt_image_url"
								size='lg'
              slug={slug}
              table="outfit_variants"
              url={altImage}
              onUpload={onAltImageChange}
            />
          </Stack>
```

with:

```tsx
<Box sx={{ pb: 1 }}>
  <ImageUploadPair
    altImage={altImage}
    hiddenInputName={`variant_image_${variant.slug}`}
    image={image}
    size="lg"
    slug={slug}
    table="outfit_variants"
    onAltImageChange={onAltImageChange}
    onImageChange={onImageChange}
  />
</Box>
```

Note: the original `Stack` carried `pb: 1`; preserve that bottom padding by wrapping in a `Box sx={{ pb: 1 }}` since `ImageUploadPair` owns its own `Stack`. Add `Box` to the `@mui/material` import in this file (currently imports `Card, CardContent, CardHeader, Stack, TextField`). The `Stack` import is still used by the outer `<Stack spacing={1.5}>`, so keep it.

- [ ] **Step 3: Type-check and lint**

Run: `yarn dlx tsc --noEmit && yarn lint`
Expected: no errors. No unused-import warning for `ImageUpload` (removed) or `categoryTitle` (still used in `CardHeader title`).

- [ ] **Step 4: Commit**

```bash
git add components/outfits/outfit-variant-image-card.tsx
git commit -m "refactor(outfits): use ImageUploadPair in variant card

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Adopt `ImageUploadPair` in the outfit-set edit form

**Files:**

- Modify: `app/admin/outfits/sets/edit/[slug]/edit-outfit-set-form.tsx` (replace the Set Images `Stack`, current ~L438–456; remove the `ImageUpload` import if no longer used elsewhere in the file)

**Interfaces:**

- Consumes: `ImageUploadPair` from Task 1.

- [ ] **Step 1: Add the `ImageUploadPair` import**

In `app/admin/outfits/sets/edit/[slug]/edit-outfit-set-form.tsx`, the file currently imports `ImageUpload`:

```tsx
import ImageUpload from '@/components/forms/image-upload'
```

`ImageUpload` is used only in the Set Images section in this file. Replace the import line with:

```tsx
import ImageUploadPair from '@/components/forms/image-upload-pair'
```

- [ ] **Step 2: Replace the Set Images uploads block**

Replace this inner `Stack` (inside the `Set Images` section):

```tsx
<Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between' }}>
  <ImageUpload
    caption="Default"
    size="xl"
    slug={outfitSet.slug}
    table="outfit_sets"
    url={setImage}
    onUpload={(url) => setSetImage(url)}
  />
  <ImageUpload
    caption="Alternative"
    column="alt_image_url"
    size="xl"
    slug={outfitSet.slug}
    table="outfit_sets"
    url={altSetImage}
    onUpload={(url) => setAltSetImage(url)}
  />
</Stack>
```

with:

```tsx
<ImageUploadPair
  altImage={altSetImage}
  image={setImage}
  size="xl"
  slug={outfitSet.slug}
  table="outfit_sets"
  onAltImageChange={setAltSetImage}
  onImageChange={setSetImage}
/>
```

- [ ] **Step 3: Type-check and lint**

Run: `yarn dlx tsc --noEmit && yarn lint`
Expected: no errors. `setSetImage`/`setAltSetImage` are `Dispatch<SetStateAction<string | null>>`, assignable to `(url: string) => void`.

- [ ] **Step 4: Commit**

```bash
git add 'app/admin/outfits/sets/edit/[slug]/edit-outfit-set-form.tsx'
git commit -m "refactor(admin/outfits): use ImageUploadPair for Set Images

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Adopt `ImageUploadPair` in the evolution edit form (and bump size to xl)

**Files:**

- Modify: `app/admin/outfits/evolutions/edit/[slug]/edit-evolution-form.tsx` (replace the Evolution Set Images `Stack`, current ~L135–153; change `size` from `lg` to `xl`; remove the `ImageUpload` import if no longer used elsewhere in the file)

**Interfaces:**

- Consumes: `ImageUploadPair` from Task 1.

- [ ] **Step 1: Replace the import**

In `app/admin/outfits/evolutions/edit/[slug]/edit-evolution-form.tsx`, `ImageUpload` is used only in the Evolution Set Images section. Replace:

```tsx
import ImageUpload from '@/components/forms/image-upload'
```

with:

```tsx
import ImageUploadPair from '@/components/forms/image-upload-pair'
```

- [ ] **Step 2: Replace the Evolution Set Images uploads block**

Replace this inner `Stack`:

```tsx
<Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between' }}>
  <ImageUpload
    caption="Default"
    size="lg"
    slug={evolution.slug}
    table="outfit_sets"
    url={imageUrl}
    onUpload={(url) => setImageUrl(url)}
  />
  <ImageUpload
    caption="Alternative"
    column="alt_image_url"
    size="lg"
    slug={evolution.slug}
    table="outfit_sets"
    url={altImageUrl}
    onUpload={(url) => setAltImageUrl(url)}
  />
</Stack>
```

with (note `size="xl"` to match Set Images):

```tsx
<ImageUploadPair
  altImage={altImageUrl}
  image={imageUrl}
  size="xl"
  slug={evolution.slug}
  table="outfit_sets"
  onAltImageChange={setAltImageUrl}
  onImageChange={setImageUrl}
/>
```

- [ ] **Step 3: Type-check and lint**

Run: `yarn dlx tsc --noEmit && yarn lint`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add 'app/admin/outfits/evolutions/edit/[slug]/edit-evolution-form.tsx'
git commit -m "refactor(admin/outfits): use ImageUploadPair for Evolution Set Images at xl

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: Final verification

**Files:** none (verification only)

- [ ] **Step 1: Full type-check and lint**

Run: `yarn dlx tsc --noEmit && yarn lint`
Expected: both clean.

- [ ] **Step 2: Confirm no stray `ImageUpload` references remain in the three refactored files**

Run: `grep -n "from '@/components/forms/image-upload'" components/outfits/outfit-variant-image-card.tsx "app/admin/outfits/sets/edit/[slug]/edit-outfit-set-form.tsx" "app/admin/outfits/evolutions/edit/[slug]/edit-evolution-form.tsx"`
Expected: no output (all three now import `image-upload-pair`, not `image-upload`).

- [ ] **Step 3: Visual check in dev**

Run: `yarn dev`, then in the browser:

- Outfit set edit page → **Set Images**: two uploads side by side, captions "Default"/"Alternative", `xl` size.
- Evolution edit page → **Evolution Set Images**: same, now `xl` size (matching Set Images).
- Any variant card (in the outfit set edit page's Variant Images grid) → uploads captioned "Default"/"Alternative" (not the old category-title captions), `lg` size; saving the form still persists the variant image (hidden input `variant_image_<slug>` present).

Expected: all three render correctly and the variant image still submits on save.

## Self-Review

**1. Spec coverage:**

- Component placement (`components/forms/image-upload-pair.tsx`) → Task 1. ✓
- Controlled interface with exact props → Task 1. ✓
- `ImageUploadTable` named-type export → Task 1. ✓
- Hidden input via `hiddenInputName` → Task 1 (renders) + Task 2 (variant card passes it). ✓
- Consistent "Default"/"Alternative" captions, variant card drops category-title captions → Task 1 (hardcoded) + Task 2 (no captions passed). ✓
- Three call sites refactored → Tasks 2, 3, 4. ✓
- Evolution size bumped to `xl` → Task 4. ✓
- Non-goals (no state-model change, no grid/Record touch) → respected; parents keep state, only the uploads block changes. ✓
- Verification (tsc + lint + visual) → Task 5. ✓

**2. Placeholder scan:** No TBD/TODO; every code step shows full code. ✓

**3. Type consistency:** `ImageUploadTable`, `ImageUploadPair` prop names (`image`, `altImage`, `onImageChange`, `onAltImageChange`, `hiddenInputName`, `size`, `slug`, `table`) used identically across Tasks 1–4. `onUpload: (url: string) => void` matches `ImageUpload`. ✓
