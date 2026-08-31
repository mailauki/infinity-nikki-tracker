# Variant Recategorization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make changing a variant's category a single safe operation that moves the database row and its storage images together, instead of orphaning the images.

**Architecture:** Extract the pure logic (slug derivation, URL↔object-path conversion) into unit-tested modules under `lib/`, then build a thin Supabase-calling helper on top that copies images to the new folder and updates the row in one statement. Wire it into both variant edit actions. Old storage objects are never deleted, so no failure ordering can lose an image.

**Tech Stack:** Next.js 16 App Router, TypeScript, Supabase (Postgres + Storage), vitest, MUI.

**Spec:** `docs/superpowers/specs/2026-08-30-variant-recategorization-design.md`

## Global Constraints

- Package manager is **Yarn**. Tests run with `yarn test` (vitest). Type-check with `yarn tsc --noEmit`.
- Prettier: no semicolons, single quotes, 2-space indent, 100 char width, ES5 trailing commas.
- Path alias `@/` maps to the project root.
- Never delete a storage object in the recategorization path. Copy only.
- Storage bucket is `images`. Object paths are `{table}/{slug}/{column}.webp`.
- Every stored image URL currently carries a `?v=` cache-buster; the object path is the URL path only, query string stripped.
- Do not set `alt_slug` or `default` by hand — database triggers own both.
- `git add` with `[slug]` paths must be quoted (zsh glob expansion).
- Branch from `main` before committing; never push to `main`.

---

### Task 1: Storage path and URL helpers

Pure functions converting between a stored public URL and its bucket object path. No Supabase import, so this is directly unit-testable.

**Files:**

- Create: `lib/storage-paths.ts`
- Test: `lib/__tests__/storage-paths.test.ts`

**Interfaces:**

- Consumes: nothing.
- Produces:
  - `objectPathFromUrl(url: string): string | null` — `https://…/images/outfit_variants/a-b/image_url.webp?v=1` → `outfit_variants/a-b/image_url.webp`. Returns `null` for a malformed URL or one not under `/images/`.
  - `variantFolder(table: string, slug: string): string` — → `outfit_variants/a-b`
  - `objectPathFor(table: string, slug: string, column: 'image_url' | 'alt_image_url'): string` — → `outfit_variants/a-b/image_url.webp`
  - `publicUrlFor(baseUrl: string, objectPath: string): string` — builds `{baseUrl}/storage/v1/object/public/images/{objectPath}?v={Date.now()}`

- [ ] **Step 1: Write the failing test**

Create `lib/__tests__/storage-paths.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { objectPathFromUrl, objectPathFor, publicUrlFor, variantFolder } from '@/lib/storage-paths'

const BASE = 'https://ykfuevyqpjvtxidjnhxm.supabase.co'
const PUBLIC = `${BASE}/storage/v1/object/public/images`

describe('objectPathFromUrl', () => {
  it('strips the ?v= cache-buster every stored URL carries', () => {
    expect(
      objectPathFromUrl(`${PUBLIC}/outfit_variants/moonlit-hair/image_url.webp?v=1786140993123`)
    ).toBe('outfit_variants/moonlit-hair/image_url.webp')
  })

  it('handles a URL with no query string', () => {
    expect(objectPathFromUrl(`${PUBLIC}/outfit_variants/moonlit-hair/alt_image_url.webp`)).toBe(
      'outfit_variants/moonlit-hair/alt_image_url.webp'
    )
  })

  it('decodes percent-encoded segments', () => {
    expect(objectPathFromUrl(`${PUBLIC}/outfit_variants/a%20b-hair/image_url.webp`)).toBe(
      'outfit_variants/a b-hair/image_url.webp'
    )
  })

  it('returns null for a non-storage URL', () => {
    expect(objectPathFromUrl('https://example.com/nope.webp')).toBeNull()
  })

  it('returns null for a malformed URL', () => {
    expect(objectPathFromUrl('not-a-url')).toBeNull()
  })
})

describe('variantFolder / objectPathFor', () => {
  it('builds the folder from table and slug', () => {
    expect(variantFolder('outfit_variants', 'moonlit-hair')).toBe('outfit_variants/moonlit-hair')
  })

  it('builds a full object path per column', () => {
    expect(objectPathFor('makeup_variants', 'glow-lips', 'alt_image_url')).toBe(
      'makeup_variants/glow-lips/alt_image_url.webp'
    )
  })
})

describe('publicUrlFor', () => {
  it('builds a public URL with a fresh cache-buster', () => {
    const url = publicUrlFor(BASE, 'outfit_variants/moonlit-hair/image_url.webp')
    expect(url.startsWith(`${PUBLIC}/outfit_variants/moonlit-hair/image_url.webp?v=`)).toBe(true)
  })

  it('round-trips with objectPathFromUrl', () => {
    const path = 'outfit_variants/moonlit-hair/image_url.webp'
    expect(objectPathFromUrl(publicUrlFor(BASE, path))).toBe(path)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test lib/__tests__/storage-paths.test.ts`
Expected: FAIL — cannot resolve `@/lib/storage-paths`.

- [ ] **Step 3: Write minimal implementation**

Create `lib/storage-paths.ts`:

```ts
// Storage object paths are `{table}/{slug}/{column}.webp` — see
// components/forms/image-upload.tsx, which builds the same shape on upload.
// The slug is the storage key, so renaming a variant's slug strands its files
// unless they are copied to the new folder first.

const BUCKET_SEGMENT = '/images/'

export type ImageColumn = 'image_url' | 'alt_image_url'

/**
 * Turn a stored public URL into its bucket object path.
 *
 * Every stored URL carries a `?v=` cache-buster (image-upload.tsx appends one
 * so a replaced image is not served stale), and a handful of relinked rows
 * carry none — both must work. The query string is not part of the object
 * path, so it is dropped.
 */
export function objectPathFromUrl(url: string): string | null {
  let pathname: string
  try {
    pathname = decodeURIComponent(new URL(url).pathname)
  } catch {
    return null
  }
  const index = pathname.indexOf(BUCKET_SEGMENT)
  if (index === -1) return null
  return pathname.slice(index + BUCKET_SEGMENT.length)
}

export function variantFolder(table: string, slug: string): string {
  return `${table}/${slug}`
}

export function objectPathFor(table: string, slug: string, column: ImageColumn): string {
  return `${variantFolder(table, slug)}/${column}.webp`
}

/**
 * Build the public URL for an object path, with a fresh cache-buster so the
 * CDN cannot serve a stale object under the new path.
 */
export function publicUrlFor(baseUrl: string, objectPath: string): string {
  return `${baseUrl}/storage/v1/object/public/images/${objectPath}?v=${Date.now()}`
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test lib/__tests__/storage-paths.test.ts`
Expected: PASS (11 assertions across 9 tests).

- [ ] **Step 5: Type-check and commit**

```bash
yarn tsc --noEmit
git add lib/storage-paths.ts lib/__tests__/storage-paths.test.ts
git commit -m "feat(storage): add pure URL <-> object-path helpers"
```

---

### Task 2: Shared slug derivation

Both variant admins keep their own private `deriveSlug()` — `app/admin/outfits/variants/fields.tsx`
and `app/admin/makeup/variants/fields.tsx` implement the same rule twice. Extract one shared,
tested copy and have both field configs import it.

**Why this task exists.** The recategorization helper does not call it: the slug arrives from the
form's hidden field, already derived client-side. What this task buys is the guarantee behind
Task 4's `existing.slug !== slug` condition — that the slug the form submits after a category
change is exactly `{set}-{new_category}`. That rule is currently asserted by two independent
implementations and tested by none. If they ever drift, the recategorization branch silently stops
firing and the old orphaning behaviour returns. One tested implementation is what makes the
condition trustworthy.

If Step 5 shows the field configs cannot import the shared module cleanly, stop and report rather
than leaving two copies plus a third unused one — an unconsumed helper is worse than the
duplication it was meant to remove.

**Files:**

- Create: `lib/variant-slug.ts`
- Test: `lib/__tests__/variant-slug.test.ts`

**Interfaces:**

- Consumes: `toSlug` from `@/lib/utils`.
- Produces: `deriveVariantSlug(input: { set: string | null; category: string | null; title: string | null }): string` — returns `{set}-{category}` for a real set, `{toSlug(title)}-{category}` for a bag set (null set or `standalone_pieces`).

- [ ] **Step 1: Write the failing test**

Create `lib/__tests__/variant-slug.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { deriveVariantSlug } from '@/lib/variant-slug'

describe('deriveVariantSlug', () => {
  it('uses set + category for a real set', () => {
    expect(
      deriveVariantSlug({ set: 'dawning_heartlight', category: 'headwear', title: 'Anything' })
    ).toBe('dawning_heartlight-headwear')
  })

  it('uses title + category for the standalone bag set', () => {
    expect(
      deriveVariantSlug({ set: 'standalone_pieces', category: 'hair', title: 'Silverplume Wings' })
    ).toBe('silverplume_wings-hair')
  })

  it('uses title + category when there is no set at all', () => {
    expect(deriveVariantSlug({ set: null, category: 'hair', title: 'Silverplume' })).toBe(
      'silverplume-hair'
    )
  })

  it('changes only the category segment when recategorizing', () => {
    const before = deriveVariantSlug({
      set: 'hymn_to_dusk',
      category: 'outerwear',
      title: 'Torrent of Fate',
    })
    const after = deriveVariantSlug({
      set: 'hymn_to_dusk',
      category: 'back_pieces',
      title: 'Torrent of Fate',
    })
    expect(before).toBe('hymn_to_dusk-outerwear')
    expect(after).toBe('hymn_to_dusk-back_pieces')
  })

  it('omits empty segments rather than leaving a dangling separator', () => {
    expect(deriveVariantSlug({ set: 'moonlit', category: null, title: null })).toBe('moonlit')
  })

  // 437 of 729 outfit_sets rows are evolutions whose slug legitimately contains
  // a hyphen (`dustwoven_tribute-expedition`). Running toSlug() over the set
  // segment would rewrite that hyphen to an underscore and produce a slug that
  // matches no storage folder, so the set segment is used verbatim. Only the
  // bag-set title stem is slugged.
  it('leaves a hyphenated evolution set slug intact', () => {
    expect(
      deriveVariantSlug({
        set: 'dustwoven_tribute-expedition',
        category: 'gloves',
        title: null,
      })
    ).toBe('dustwoven_tribute-expedition-gloves')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test lib/__tests__/variant-slug.test.ts`
Expected: FAIL — cannot resolve `@/lib/variant-slug`.

- [ ] **Step 3: Write minimal implementation**

Create `lib/variant-slug.ts`:

```ts
import { toSlug } from '@/lib/utils'

export const STANDALONE_PIECES_SLUG = 'standalone_pieces'

/**
 * A "bag" set (standalone, or no set at all) holds many pieces per category,
 * so its variants derive their slug from the title to stay unique. A real
 * base/evolution set has one variant per category, so set + category suffices.
 *
 * Mirrors the per-domain deriveSlug() in the variant admin field configs; the
 * shared copy exists so a recategorization computes exactly the slug a fresh
 * add would, rather than a second implementation that can drift.
 */
export function deriveVariantSlug(input: {
  set: string | null
  category: string | null
  title: string | null
}): string {
  const isBagSet = !input.set || input.set === STANDALONE_PIECES_SLUG
  const stem = isBagSet ? toSlug(input.title ?? '') : input.set
  return [stem, input.category].filter(Boolean).join('-')
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test lib/__tests__/variant-slug.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Point both field configs at the shared module**

In `app/admin/outfits/variants/fields.tsx`, replace the local `isBagSet` / `deriveSlug` pair with
the shared implementation, keeping the `FieldValues` signature the field config expects:

```ts
import { deriveVariantSlug, STANDALONE_PIECES_SLUG } from '@/lib/variant-slug'

function isBagSet(v: FieldValues): boolean {
  return !v.outfit_set || v.outfit_set === STANDALONE_PIECES_SLUG
}

function deriveSlug(v: FieldValues): string {
  return deriveVariantSlug({
    set: (v.outfit_set as string | null) ?? null,
    category: (v.outfit_category as string | null) ?? null,
    title: (v.title as string | null) ?? null,
  })
}
```

Do the same in `app/admin/makeup/variants/fields.tsx`, reading `makeup_set` / `makeup_category`.
Keep each file's local `isBagSet` — the `required` predicate on the title field still uses it.

- [ ] **Step 6: Verify nothing changed behaviourally**

```bash
yarn tsc --noEmit
yarn lint
yarn test
```

Expected: all clean. The extraction is a refactor; no test should change.

- [ ] **Step 7: Commit**

```bash
yarn tsc --noEmit
git add lib/variant-slug.ts lib/__tests__/variant-slug.test.ts \
  app/admin/outfits/variants/fields.tsx app/admin/makeup/variants/fields.tsx
git commit -m "refactor(admin): extract shared variant slug derivation"
```

---

### Task 3: The recategorization helper

The Supabase-calling layer. Built on Tasks 1–2, kept thin so its logic lives in tested modules.

**Files:**

- Create: `lib/variant-recategorize.ts`

**Interfaces:**

- Consumes: `objectPathFromUrl`, `objectPathFor`, `publicUrlFor`, `ImageColumn` (Task 1). The
  helper takes `newSlug` as an argument rather than deriving it, so it does not import Task 2 —
  the caller supplies the slug the form already computed.
- Produces:

  ```ts
  type RecategorizeConfig = {
    table: 'outfit_variants' | 'makeup_variants'
    obtainedTable: 'obtained_outfit' | 'obtained_makeup'
    categoryColumn: 'outfit_category' | 'makeup_category'
    variantColumn: 'outfit_variant' | 'makeup_variant'
  }
  async function recategorizeVariant(
    supabase: SupabaseClient,
    config: RecategorizeConfig,
    args: { id: number; currentSlug: string; newSlug: string; newCategory: string }
  ): Promise<{ error: string } | { newSlug: string }>
  ```

- [ ] **Step 1: Write the implementation**

Create `lib/variant-recategorize.ts`:

```ts
import { SupabaseClient } from '@supabase/supabase-js'
import { ImageColumn, objectPathFor, objectPathFromUrl, publicUrlFor } from '@/lib/storage-paths'

const IMAGE_COLUMNS: ImageColumn[] = ['image_url', 'alt_image_url']

export type RecategorizeConfig = {
  table: 'outfit_variants' | 'makeup_variants'
  obtainedTable: 'obtained_outfit' | 'obtained_makeup'
  categoryColumn: 'outfit_category' | 'makeup_category'
  variantColumn: 'outfit_variant' | 'makeup_variant'
}

/**
 * Move a variant to a new category, carrying its slug and its storage objects.
 *
 * The slug encodes the category and the storage path encodes the slug (see
 * lib/storage-paths.ts), so changing a category without moving the files
 * orphans every image — the failure this function exists to prevent.
 *
 * Ordering is chosen so no failure can lose an image:
 *   1. block on slug collision (before anything is written)
 *   2. copy objects to the new folder (before the DB is touched)
 *   3. update the row in one statement
 *   4. leave the old objects alone, always
 *
 * A crash at any point leaves either the original state or an unreferenced
 * folder that costs disk and is caught by the verify queries in docs/queries/.
 */
export async function recategorizeVariant(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  config: RecategorizeConfig,
  args: { id: number; currentSlug: string; newSlug: string; newCategory: string }
): Promise<{ error: string } | { newSlug: string }> {
  const { id, currentSlug, newSlug, newCategory } = args

  // 1. Collision guard. The slug column is UNIQUE, so the DB would reject this
  // anyway — the point is to name the blocking variant instead of surfacing a
  // raw constraint violation.
  const { data: clash } = await supabase
    .from(config.table)
    .select('id, title')
    .eq('slug', newSlug)
    .neq('id', id)
    .maybeSingle()

  if (clash) {
    const name = clash.title ? ` ("${clash.title}")` : ''
    return {
      error: `"${newSlug}" already exists${name}. Resolve that variant before recategorizing this one.`,
    }
  }

  // Read the current image URLs so we know which objects exist to copy.
  const { data: current, error: readError } = await supabase
    .from(config.table)
    .select('image_url, alt_image_url')
    .eq('id', id)
    .single()

  if (readError) return { error: readError.message }

  // 2. Copy each present object to the new folder. Any failure aborts before
  // the DB write, leaving the variant exactly as it was.
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const newUrls: Partial<Record<ImageColumn, string>> = {}

  for (const column of IMAGE_COLUMNS) {
    const url = (current as Record<string, string | null>)[column]
    if (!url) continue

    const from = objectPathFromUrl(url)
    if (!from) continue

    const to = objectPathFor(config.table, newSlug, column)
    if (from === to) continue

    const { error: copyError } = await supabase.storage.from('images').copy(from, to)
    if (copyError) {
      return { error: `Could not copy ${column} to the new category folder: ${copyError.message}` }
    }
    newUrls[column] = publicUrlFor(baseUrl, to)
  }

  // 3. One statement, so the row can never be half-migrated. alt_slug and
  // `default` are deliberately absent — triggers own them.
  const { error: updateError } = await supabase
    .from(config.table)
    .update({
      slug: newSlug,
      [config.categoryColumn]: newCategory,
      ...newUrls,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (updateError) return { error: updateError.message }

  // The obtained table's variant FK cascades on slug update, but its own
  // category column does not — without this a user's collection row would
  // disagree with the variant it points at.
  const { error: obtainedError } = await supabase
    .from(config.obtainedTable)
    .update({ [config.categoryColumn]: newCategory })
    .eq(config.variantColumn, newSlug)

  if (obtainedError) return { error: obtainedError.message }

  // 4. Old objects are intentionally left in place. See the docstring.
  void currentSlug

  return { newSlug }
}
```

- [ ] **Step 2: Type-check**

Run: `yarn tsc --noEmit`
Expected: no output.

- [ ] **Step 3: Verify existing tests still pass**

Run: `yarn test`
Expected: PASS, including Tasks 1–2.

- [ ] **Step 4: Commit**

```bash
git add lib/variant-recategorize.ts
git commit -m "feat(admin): add variant recategorization helper"
```

---

### Task 4: Wire into the outfit variant action

**Files:**

- Modify: `app/admin/outfits/variants/actions.ts` (the `editOutfitVariant` function)

**Interfaces:**

- Consumes: `recategorizeVariant` (Task 3). The slug arrives from the form's hidden field, so
  `deriveVariantSlug` is not called here.
- Produces: no new exports; `editOutfitVariant` keeps its signature.

- [ ] **Step 1: Read the current action**

Run: `sed -n '107,180p' app/admin/outfits/variants/actions.ts`

Note how it reads `outfit_category` and `slug` from the FormData and passes both to a single `update()`. The recategorization branch goes after the duplicate check and before that update.

- [ ] **Step 2: Add the imports**

At the top of `app/admin/outfits/variants/actions.ts`, alongside the existing imports:

```ts
import { recategorizeVariant } from '@/lib/variant-recategorize'
```

- [ ] **Step 3: Insert the recategorization branch**

In `editOutfitVariant`, immediately after the `if (duplicate) return { error: duplicate }` line and before the existing `supabase.from('outfit_variants').update({...})` call, add:

```ts
// A category change moves the slug, and the slug is the storage key — so the
// images have to move with it. recategorizeVariant does the whole move
// (collision check, storage copy, row update) and returns early; falling
// through to the plain update below would rename the row and strand every
// image at the old path.
const { data: existing } = await supabase
  .from('outfit_variants')
  .select('slug, outfit_category')
  .eq('id', id)
  .single()

if (existing && existing.outfit_category !== outfit_category && existing.slug !== slug) {
  const result = await recategorizeVariant(
    supabase,
    {
      table: 'outfit_variants',
      obtainedTable: 'obtained_outfit',
      categoryColumn: 'outfit_category',
      variantColumn: 'outfit_variant',
    },
    {
      id,
      currentSlug: existing.slug,
      newSlug: slug,
      newCategory: outfit_category ?? '',
    }
  )

  if ('error' in result) return { error: result.error }

  // Everything else on the form still needs saving.
  const { error: restError } = await supabase
    .from('outfit_variants')
    .update({
      outfit_set,
      seasons,
      season_category,
      rarity,
      style,
      label,
      label_2,
      title,
      description,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (restError) return { error: restError.message }

  if (formData.get('update_only') === 'true') return { savedTitle: result.newSlug }
  revalidatePath(ADMIN_DASHBOARD)
  redirect(ADMIN_DASHBOARD)
}
```

- [ ] **Step 4: Verify the import list**

Confirm `revalidatePath` is imported in this file. If it is not, add:

```ts
import { revalidatePath } from 'next/cache'
```

- [ ] **Step 5: Type-check, lint, and test**

```bash
yarn tsc --noEmit
yarn lint
yarn test
```

Expected: all clean.

- [ ] **Step 6: Commit**

```bash
git add app/admin/outfits/variants/actions.ts
git commit -m "feat(admin): move images when an outfit variant is recategorized"
```

---

### Task 5: Wire into the makeup variant action

Same change, makeup tables. The code is repeated rather than referenced because the column names differ throughout.

**Files:**

- Modify: `app/admin/makeup/variants/actions.ts` (the `editMakeupVariant` function)

**Interfaces:**

- Consumes: `recategorizeVariant` (Task 3).
- Produces: no new exports.

- [ ] **Step 1: Read the current action**

Run: `grep -n "export async function editMakeupVariant" -A 60 app/admin/makeup/variants/actions.ts`

Note the structural difference from the outfit action: `editMakeupVariant` reads the whole form
into a single `values` object via `readForm(formData)` and spreads it
(`.update({ ...values, updated_at: … })`), rather than destructuring individual variables. The
branch below is written against that shape — `values.slug`, `values.makeup_category` — and omits
the columns the helper already wrote.

- [ ] **Step 2: Add the import**

```ts
import { recategorizeVariant } from '@/lib/variant-recategorize'
```

- [ ] **Step 3: Insert the recategorization branch**

After the duplicate check and before the existing `update()` in `editMakeupVariant`:

```ts
// See the matching branch in app/admin/outfits/variants/actions.ts: the slug
// encodes the category and the storage path encodes the slug, so a category
// change has to carry the images with it.
const { data: existing } = await supabase
  .from('makeup_variants')
  .select('slug, makeup_category')
  .eq('id', id)
  .single()

if (
  existing &&
  existing.makeup_category !== values.makeup_category &&
  existing.slug !== values.slug
) {
  const result = await recategorizeVariant(
    supabase,
    {
      table: 'makeup_variants',
      obtainedTable: 'obtained_makeup',
      categoryColumn: 'makeup_category',
      variantColumn: 'makeup_variant',
    },
    {
      id,
      currentSlug: existing.slug,
      newSlug: values.slug,
      newCategory: values.makeup_category ?? '',
    }
  )

  if ('error' in result) return { error: result.error }

  // Save the rest of the form. `slug` and `makeup_category` are stripped
  // because recategorizeVariant already wrote them; re-writing the same values
  // would be harmless but makes it unclear which write owns them.
  // (readForm does not read image_url/alt_image_url, so the freshly-copied
  // URLs are not at risk from this spread — verify that still holds if
  // readForm ever grows image fields.)
  const { slug: _slug, makeup_category: _category, ...rest } = values
  const { error: restError } = await supabase
    .from('makeup_variants')
    .update({ ...rest, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (restError) return { error: restError.message }

  if (formData.get('update_only') === 'true') return { savedTitle: result.newSlug }
  revalidatePath(ADMIN_DASHBOARD)
  redirect(ADMIN_DASHBOARD)
}
```

Adjust the field list in the second `update()` to exactly the columns this action already writes — do not introduce columns it does not currently set.

- [ ] **Step 4: Type-check, lint, and test**

```bash
yarn tsc --noEmit
yarn lint
yarn test
```

Expected: all clean.

- [ ] **Step 5: Commit**

```bash
git add app/admin/makeup/variants/actions.ts
git commit -m "feat(admin): move images when a makeup variant is recategorized"
```

---

### Task 6: Live verification against a scratch variant

The helper's Supabase calls are not unit-tested by design, so verify the real path end-to-end. This task changes no code — it produces evidence.

**Files:** none (verification only).

**Interfaces:**

- Consumes: everything from Tasks 1–5.
- Produces: a verification record appended to the plan or PR.

- [ ] **Step 1: Create a scratch variant**

In the admin UI, add a standalone outfit variant titled `ZZ Scratch Test`, category `hair`, and upload both a main and an alt image. Note its slug (`zz_scratch_test-hair`) and confirm both images render.

- [ ] **Step 2: Record the before state**

Query, and save the output:

```sql
select id, slug, outfit_category, alt_slug, "default", image_url, alt_image_url
from outfit_variants where slug = 'zz_scratch_test-hair';
```

- [ ] **Step 3: Mark it obtained**

Toggle the variant obtained in the app as a logged-in user, then confirm:

```sql
select outfit_variant, outfit_category from obtained_outfit
where outfit_variant = 'zz_scratch_test-hair';
```

- [ ] **Step 4: Recategorize it**

In the variant edit form, change the category from `hair` to `hair_accessories` and save.

- [ ] **Step 5: Verify the result**

```sql
select id, slug, outfit_category, alt_slug, "default", image_url, alt_image_url
from outfit_variants where id = <the id from step 2>;

select outfit_variant, outfit_category from obtained_outfit
where outfit_variant = 'zz_scratch_test-hair_accessories';
```

Confirm all of:

- `slug` is now `zz_scratch_test-hair_accessories`
- `outfit_category` is `hair_accessories`
- `alt_slug` was recomputed by the trigger (ends `-hair_accessories`)
- `default` is unchanged
- both image URLs point at the new folder
- the `obtained_outfit` row followed the cascade AND its `outfit_category` reads `hair_accessories`

Then fetch both image URLs and confirm HTTP `200`.

- [ ] **Step 6: Verify the old folder survived**

```sql
select name from storage.objects
where bucket_id = 'images' and name like 'outfit_variants/zz_scratch_test-hair/%';
```

Expected: the original objects still present — the design never deletes.

- [ ] **Step 7: Verify the collision guard**

Edit the scratch variant again, this time setting the category to one already used by another variant in the same set. Confirm the form shows the named error and that the row is unchanged.

- [ ] **Step 8: Clean up**

Delete the scratch variant in the admin, then remove both its folders via the Storage API (not a `delete` on `storage.objects`, which orphans the blobs):

```bash
curl -X DELETE "$NEXT_PUBLIC_SUPABASE_URL/storage/v1/object/images" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Content-Type: application/json" \
  -d '{"prefixes":[
    "outfit_variants/zz_scratch_test-hair/image_url.webp",
    "outfit_variants/zz_scratch_test-hair/alt_image_url.webp",
    "outfit_variants/zz_scratch_test-hair_accessories/image_url.webp",
    "outfit_variants/zz_scratch_test-hair_accessories/alt_image_url.webp"]}'
```

- [ ] **Step 9: Confirm storage is consistent**

Run the outfits verify query from `docs/queries/2026-08-30-variant-storage-remediation.sql`.
Expected: `unreferenced_folders = 0`, `broken_references = 0`.

- [ ] **Step 10: Repeat steps 1–9 for a makeup variant**

Same sequence against `makeup_variants` / `obtained_makeup`, using categories `lips` → `eyelashes`.

---

## Deferred: slug preview in the edit form

The spec lists a possible `app/admin/entity-form.tsx` change so the slug preview re-derives when the category changes, letting the admin see the new slug before saving.

This is deliberately **not** a task in this plan. `deriveOnEdit` is off for outfit and makeup variants on purpose — it stops unrelated field edits silently rewriting an existing slug — and turning it on wholesale would reintroduce exactly that hazard. A correct version keys on the category field alone, which is a self-contained UI change worth its own plan once the data-safety work above is in place and verified.

The feature is fully functional without it: the recategorization computes the correct slug server-side regardless of what the form displays.
