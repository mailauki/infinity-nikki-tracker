# Derived glow-up variant titles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Glow-up outfit variants with no stored title display (and pre-fill in the admin form) a title derived as `{base variant title}: {glow-up set title}`.

**Architecture:** A pure helper in `hooks/outfit.ts` builds the derived title. `createOutfitSet()` applies it at transform time for the display path (no DB write). The admin variant edit page computes it server-side and passes it as the form's initial `title` value so a plain Save persists it.

**Tech Stack:** Next.js 16 App Router, TypeScript, Supabase, MUI. Package manager **Yarn**.

## Global Constraints

- No semicolons, single quotes, 2-space indent, 100-char width (Prettier). Path alias `@/` = project root.
- **No test runner exists in this repo.** Verification per task = `yarn tsc --noEmit` (clean) + `yarn lint` (clean), plus the manual/DB checks each task specifies. Do NOT add a test framework.
- Derived title format is exactly `` `${baseVariantTitle}: ${glowupSetTitle}` `` — base variant title first, single `": "` separator.
- Scope is **glow-up state only** (`order === 0`, i.e. `isGlowup(row)`). Regular evolutions are untouched.
- Derive only when the variant's own `title` is empty AND a non-empty base same-category variant title exists. A stored/manual title always wins.
- Display path writes nothing to the DB. `outfit_variants.title` and the `OutfitVariant` type (`title: string | null`) are unchanged.
- Commit on branch `feat/derived-glowup-variant-titles` (already checked out). End commit messages with the `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>` trailer.

---

### Task 1: Pure `deriveGlowupVariantTitle` helper

**Files:**

- Modify: `hooks/outfit.ts` (add exported function near `isGlowup`, around line 22-31)

**Interfaces:**

- Produces: `deriveGlowupVariantTitle(args: { baseVariantTitle: string | null | undefined; glowupSetTitle: string | null | undefined }): string | null` — returns `` `${baseVariantTitle}: ${glowupSetTitle}` `` when both are non-empty after trimming, else `null`.

- [ ] **Step 1: Add the helper**

Add to `hooks/outfit.ts`, immediately after the `evolutionSortKey` function (after line 31):

```ts
// Derived default title for a glow-up variant with no stored title:
// "{base variant title}: {glow-up set title}", e.g. "Gifted Sunlight: Light Pursuer".
// Returns null when the base variant has no usable title (or the glow-up set has
// no title) — callers then leave the variant title untouched.
export function deriveGlowupVariantTitle({
  baseVariantTitle,
  glowupSetTitle,
}: {
  baseVariantTitle: string | null | undefined
  glowupSetTitle: string | null | undefined
}): string | null {
  const base = baseVariantTitle?.trim()
  const glowup = glowupSetTitle?.trim()
  if (!base || !glowup) return null
  return `${base}: ${glowup}`
}
```

- [ ] **Step 2: Type-check and lint**

Run: `yarn tsc --noEmit && yarn lint`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add hooks/outfit.ts
git commit -m "$(cat <<'EOF'
feat: add deriveGlowupVariantTitle helper

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Apply derived titles in `createOutfitSet()` (display path)

**Files:**

- Modify: `hooks/outfit.ts` — `createOutfitSet()`, lines 76-111

**Interfaces:**

- Consumes: `deriveGlowupVariantTitle` (Task 1), `isGlowup` (existing, line 22).
- Produces: `createOutfitSet()` returns an `OutfitSet` whose glow-up-state variants have derived titles when empty. No signature change.

Context: inside `createOutfitSet`, `resolvedEvolutions` (line 88) are full `Evolution` rows with `slug`, `title`, `order`, `outfit_variants`. Base-state variants have `outfit_set === baseSlug`. `allVariants` (line 95) already merges base + evolution variants.

- [ ] **Step 1: Build lookups and derive titles before the return**

In `hooks/outfit.ts`, replace the `allVariants` block (lines 95-98):

```ts
const allVariants = [
  ...outfitSet.outfit_variants,
  ...resolvedEvolutions.flatMap((e) => e.outfit_variants ?? []),
]
```

with:

```ts
const baseVariants = outfitSet.outfit_variants

// Map each base-state category to its (non-empty) variant title, so a glow-up
// variant can inherit "{base title}: {glow-up set title}" when it has none.
const baseTitleByCategory = new Map<string, string>()
for (const v of baseVariants) {
  const title = v.title?.trim()
  if (v.outfit_set === baseSlug && v.outfit_category && title) {
    baseTitleByCategory.set(v.outfit_category, title)
  }
}

// Glow-up state slug -> that glow-up set's title.
const glowupTitleBySlug = new Map<string, string | null>()
for (const e of resolvedEvolutions) {
  if (isGlowup(e)) glowupTitleBySlug.set(e.slug, e.title)
}

const withDerivedTitles = resolvedEvolutions.flatMap((e) =>
  (e.outfit_variants ?? []).map((v) => {
    if (v.title?.trim() || !glowupTitleBySlug.has(v.outfit_set ?? '')) return v
    const derived = deriveGlowupVariantTitle({
      baseVariantTitle: baseTitleByCategory.get(v.outfit_category ?? ''),
      glowupSetTitle: glowupTitleBySlug.get(v.outfit_set ?? ''),
    })
    return derived ? { ...v, title: derived } : v
  })
)

const allVariants = [...baseVariants, ...withDerivedTitles]
```

- [ ] **Step 2: Type-check and lint**

Run: `yarn tsc --noEmit && yarn lint`
Expected: no new errors.

- [ ] **Step 3: Manual verification — run the app**

Start the dev server (`yarn dev`) and open `/outfits/dreamtime_bestowed`. Select the glow-up state ("✦ Light Pursuer"). Confirm the Hair card title reads `Gifted Sunlight: Light Pursuer`, and other categories show `{base title}: Light Pursuer`. Confirm regular evolutions (Hollow Rumor, Blazing Heart) still show no title. Confirm the base state titles are unchanged.

- [ ] **Step 4: Commit**

```bash
git add hooks/outfit.ts
git commit -m "$(cat <<'EOF'
feat: derive glow-up variant titles from base variant + glow-up set title

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Server helper to fetch a base same-category variant title

**Files:**

- Modify: `hooks/data/admin/outfit-variants.ts` (add an exported query beside `getOutfitVariantRaw`)

**Interfaces:**

- Produces: `getBaseVariantTitle(baseSetSlug: string, outfitCategory: string): Promise<string | null>` — returns the base set's same-category variant `title`, or `null` if none/empty.

Context: existing `getOutfitVariantRaw` (this file) shows the query pattern — `createClient()`, `.from('outfit_variants').select(...).eq(...).maybeSingle()`, wrapped in React `cache()`. `cache` is already imported.

- [ ] **Step 1: Add the query**

Append to `hooks/data/admin/outfit-variants.ts`:

```ts
// Base-set variant title for a given category — used to pre-fill a glow-up
// variant's title in the admin edit form.
export const getBaseVariantTitle = cache(
  async (baseSetSlug: string, outfitCategory: string): Promise<string | null> => {
    const supabase = await createClient()

    const { data } = await supabase
      .from('outfit_variants')
      .select('title')
      .eq('outfit_set', baseSetSlug)
      .eq('outfit_category', outfitCategory)
      .maybeSingle()

    const title = data?.title?.trim()
    return title ? title : null
  }
)
```

- [ ] **Step 2: Type-check and lint**

Run: `yarn tsc --noEmit && yarn lint`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add hooks/data/admin/outfit-variants.ts
git commit -m "$(cat <<'EOF'
feat: add getBaseVariantTitle query for admin glow-up title prefill

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Pre-fill the glow-up title in the admin edit form

**Files:**

- Modify: `app/admin/outfits/variants/edit/[slug]/page.tsx`

**Interfaces:**

- Consumes: `getBaseVariantTitle` (Task 3), `deriveGlowupVariantTitle` + `isGlowup` (Tasks 1 / existing), `getOutfitSetsRaw` (already imported in this page).

Context: the page (lines 33-76) fetches `variant` via `getOutfitVariantRaw(slug)` and `outfitSets` via `getOutfitSetsRaw()`, then renders `EntityForm` with `initialValues.title: variant.title ?? ''`. The glow-up set row is `outfitSets.find(s => s.slug === variant.outfit_set)`; it's a glow-up when `order === 0` (use `isGlowup`), and its base set is that row's `base_set`.

- [ ] **Step 1: Add imports**

In `app/admin/outfits/variants/edit/[slug]/page.tsx`, add to the imports:

```ts
import { deriveGlowupVariantTitle, isGlowup } from '@/hooks/outfit'
import { getBaseVariantTitle } from '@/hooks/data/admin/outfit-variants'
```

(Extend the existing `getOutfitVariantRaw` import line to also import `getBaseVariantTitle`, or add a separate import — either is fine.)

- [ ] **Step 2: Compute the derived title after the `notFound()` guard**

After `if (!variant) notFound()` (line 47), insert:

```ts
// For a glow-up variant with no stored title, pre-fill the Title field with
// "{base variant title}: {glow-up set title}". Persisted only when the admin
// saves — nothing is written here.
let prefillTitle = variant.title ?? ''
const glowupSet = outfitSets.find((s) => s.slug === variant.outfit_set)
if (!prefillTitle.trim() && glowupSet && isGlowup(glowupSet) && glowupSet.base_set) {
  const baseVariantTitle = await getBaseVariantTitle(
    glowupSet.base_set,
    variant.outfit_category ?? ''
  )
  prefillTitle =
    deriveGlowupVariantTitle({
      baseVariantTitle,
      glowupSetTitle: glowupSet.title,
    }) ?? ''
}
```

- [ ] **Step 3: Use `prefillTitle` in `initialValues`**

Change the `initialValues.title` line (line 65) from:

```ts
        title: variant.title ?? '',
```

to:

```ts
        title: prefillTitle,
```

- [ ] **Step 4: Type-check and lint**

Run: `yarn tsc --noEmit && yarn lint`
Expected: no new errors. (Note: `OutfitSetRaw` includes `order` and `base_set`, so `isGlowup(glowupSet)` and `glowupSet.base_set` type-check.)

- [ ] **Step 5: Manual verification — run the app**

With `yarn dev` running, open the admin edit form for a glow-up variant that has no stored title, e.g. `/admin/outfits/variants/edit/dreamtime_bestowed-light_pursuer-hair`. Confirm the Title field is pre-filled with `Gifted Sunlight: Light Pursuer`. Confirm that opening a glow-up variant that DOES have a manual title shows that manual title (not the derived one), and that a non-glow-up evolution variant's Title field stays empty. Do not save unless intentionally persisting.

- [ ] **Step 6: Commit**

```bash
git add 'app/admin/outfits/variants/edit/[slug]/page.tsx'
git commit -m "$(cat <<'EOF'
feat: pre-fill derived title in admin glow-up variant edit form

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Self-Review

**Spec coverage:**

- Format `{base}: {glow-up}` → Task 1. ✓
- Display path in `createOutfitSet`, glow-up only, empty-title + base-title-present conditions, no DB write → Task 2. ✓
- Admin pre-fill only when stored title empty, glow-up only, persists only on Save, no changes to `EntityForm`/`fields.tsx`/save action → Tasks 3-4. ✓
- Base variant title sourcing (not in `getOutfitSetsRaw`) → Task 3's dedicated query. ✓
- Unchanged: types, `OutfitVariantCard`, DB — respected (no such files modified). ✓

**Placeholder scan:** No TBD/TODO/vague steps — every code step shows full code. ✓

**Type consistency:** `deriveGlowupVariantTitle` signature identical in Tasks 1, 2, 4. `getBaseVariantTitle(baseSetSlug, outfitCategory)` identical in Tasks 3, 4. `isGlowup` used on rows with `order` (both `Evolution` and `OutfitSetRaw` have it). ✓
