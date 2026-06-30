# ImageUploadPair component — design

## Problem

The "Default + Alternative" two-`ImageUpload` row is duplicated in three places, each a
`<Stack direction="row" justifyContent="space-between">` wrapping a default upload
(`image_url`) and an alt upload (`column="alt_image_url"`) that share `table`, `slug`, and `size`:

1. **Set Images** — `app/admin/outfits/sets/edit/[slug]/edit-outfit-set-form.tsx` (~L438–456),
   `table="outfit_sets"`, `size="xl"`, captions `"Default"` / `"Alternative"`.
2. **Evolution Set Images** — `app/admin/outfits/evolutions/edit/[slug]/edit-evolution-form.tsx`
   (~L135–153), `table="outfit_sets"`, currently `size="lg"` (will change to `size="xl"` to match
   Set Images), captions `"Default"` / `"Alternative"`.
3. **Variant card** — `components/outfits/outfit-variant-image-card.tsx` (~L58–77),
   `table="outfit_variants"`, `size="lg"`. Emits a hidden
   `<input name={`variant*image*${slug}`}>` before the default upload so the server action reads
   the image on submit. Currently captions the uploads with the category title
   (`categoryTitle` / `Alt ${categoryTitle}`).

## Solution

Extract a single shared component, `ImageUploadPair`, that renders the common row. It stays
**controlled** — parents keep holding state and pass change callbacks; nothing about how server
actions read submitted values changes.

### Placement

`components/forms/image-upload-pair.tsx`, next to `image-upload.tsx`. Imported by 2+ unrelated
routes (outfit-set form, evolution form) plus the shared variant card, so `components/` is correct
per the colocation rule.

### Interface

```tsx
'use client'

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
  table: ImageUploadTable // exported from image-upload.tsx
  slug: string | undefined
  image: string | null
  altImage: string | null
  onImageChange: (url: string) => void
  onAltImageChange: (url: string) => void
  size?: AvatarSize
  hiddenInputName?: string // renders <input type="hidden"> before the default upload when set
})
```

Renders:

- a `<Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between' }}>`
- the hidden `<input type="hidden" name={hiddenInputName} value={image ?? ''}>` only when
  `hiddenInputName` is set
- the default `ImageUpload` — `caption="Default"`, `url={image}`, `onUpload={onImageChange}`
- the alt `ImageUpload` — `caption="Alternative"`, `column="alt_image_url"`, `url={altImage}`,
  `onUpload={onAltImageChange}`

Both inner uploads share `table`, `slug`, and `size`.

### Supporting change

Export the `table` prop's union type from `image-upload.tsx` as `ImageUploadTable` so both
components reference one source of truth instead of re-declaring the literal union. The original
`ImageUpload` is updated to use the named type for its `table` prop.

## Captions: now consistent

All three call sites use `"Default"` / `"Alternative"`. The variant card drops its
category-title captions (`categoryTitle` / `Alt ${categoryTitle}`) — the category is already
shown by the card header (avatar + title), so the upload captions were redundant. `categoryTitle`
is still used for the card header; only the upload captions change.

## Call sites after refactor

```tsx
// outfit-variant-image-card.tsx (replaces L58–77)
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

// edit-outfit-set-form.tsx (replaces L438–456)
<ImageUploadPair
  altImage={altSetImage}
  image={setImage}
  size="xl"
  slug={outfitSet.slug}
  table="outfit_sets"
  onAltImageChange={setAltSetImage}
  onImageChange={setSetImage}
/>

// edit-evolution-form.tsx (replaces L135–153)
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

Note the set-image parents pass `Dispatch<string | null>` setters (`setSetImage`, etc.), which are
assignable to `(url: string) => void` — no change needed there.

## Non-goals

- Not changing the controlled/state model in any parent.
- Not touching the per-variant card grid or the four `Record<string, ...>` state maps + after-save
  re-sync boilerplate in the two forms. That is a separate, larger duplication, out of scope here.

## Verification

- `yarn dlx tsc --noEmit` clean; `yarn lint` clean.
- Visually confirm all three sections render identically: Default/Alt uploads, the new consistent
  captions, the correct sizes (`xl` for both set-image rows, `lg` for the variant card), and that
  the variant
  card's hidden input still submits the image on save.
