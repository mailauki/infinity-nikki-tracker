# Standalone Pieces: pin, default, mixed-bag — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the "Standalone Pieces" set behave as a pinned, mixed-bag catch-all: always last on the outfits page, the default (top-pinned) option in the add-variant form posting `outfit_set='standalone-pieces'`, with per-variant rarities honored by the rarity filter.

**Architecture:** No new tables/columns. A one-off migration re-points the single orphaned `null`-set variant to `'standalone-pieces'`. The add-variant form defaults/pins Standalone and stops back-filling set-level rarity/style/labels for it. The outfits page pins Standalone last in its existing comparator and filters standalone variants by their own `rarity`. `rarity` is added to the public variant projection so the client can filter on it.

**Tech Stack:** Next.js 16 App Router, Supabase (Postgres), MUI, TypeScript. Package manager: **Yarn**. No test runner is configured in this repo — verification is `yarn tsc --noEmit`, `yarn lint`, a targeted SQL check for the migration, and manual UI verification via `yarn dev`.

## Global Constraints

- Package manager is **Yarn** — never npm/pnpm.
- Prettier: no semicolons, single quotes, 2-space indent, 100 char width.
- Path alias `@/` = project root.
- `main` is protected. Work happens on branch `feat/standalone-pieces-pin-mixed-bag` (already created; the design doc is already committed there).
- Migration filenames: `YYYYMMDDHHMMSS_description.sql` under `supabase/migrations/`. Use a timestamp later than `20260702051043`.
- The standalone set slug is the literal string `'standalone-pieces'`. Define it once per file as a local `const` rather than repeating the literal.
- `git add` paths containing `[slug]` brackets must be single-quoted in zsh.
- No test framework — do NOT write `*.test.ts` files or invoke a test runner. "Verify" steps use `yarn tsc --noEmit`, `yarn lint`, SQL, or manual browser checks as specified.

---

## File Structure

- `supabase/migrations/<ts>_recover_orphan_null_outfit_variant.sql` — **create.** Re-point the orphaned null-set variant.
- `lib/types/outfit.ts` — **modify.** Add `'rarity'` to the `OutfitVariant` `Pick`.
- `hooks/data/outfit-variants.ts` — **modify.** Add `rarity` to `PUBLIC_VARIANT_SELECT`.
- `app/admin/outfits/variants/variant-custom-fields.tsx` — **modify.** Default + pin Standalone in `GroupedOutfitSetSelect`; skip back-fill for standalone.
- `app/admin/outfits/variants/fields.tsx` — **modify.** Standalone slug from title+category; title stays required for standalone.
- `app/outfits/filter-outfits.tsx` — **modify.** Pin Standalone last; mixed-bag rarity filter.

---

## Task 1: Add `rarity` to the public variant projection and type

Enables the client-side rarity filter to see each variant's own rarity. Pure additive plumbing; no behavior change yet.

**Files:**

- Modify: `lib/types/outfit.ts` (the `OutfitVariant` `Pick`, ~lines 65-75)
- Modify: `hooks/data/outfit-variants.ts:6-7` (`PUBLIC_VARIANT_SELECT`)

**Interfaces:**

- Produces: `OutfitVariant` now includes `rarity: number | null`. `getOutfitVariantsBySet()` returns variants carrying `rarity`. Consumed by Task 4.

- [ ] **Step 1: Add `rarity` to the `OutfitVariant` type**

In `lib/types/outfit.ts`, add `'rarity'` to the `Pick` union:

```typescript
export type OutfitVariant = Pick<
  Tables<'outfit_variants'>,
  | 'id'
  | 'slug'
  | 'outfit_set'
  | 'outfit_category'
  | 'title'
  | 'image_url'
  | 'alt_image_url'
  | 'default'
  | 'rarity'
> & { obtained?: boolean }
```

- [ ] **Step 2: Add `rarity` to the select string**

In `hooks/data/outfit-variants.ts`, update the projection:

```typescript
const PUBLIC_VARIANT_SELECT =
  'id, slug, outfit_set, outfit_category, title, image_url, alt_image_url, default, rarity'
```

- [ ] **Step 3: Verify types compile**

Run: `yarn tsc --noEmit`
Expected: no errors (exit 0). The added `rarity` field is a valid `outfit_variants` column, so the `Pick` and the PostgREST select both type-check.

- [ ] **Step 4: Commit**

```bash
git add lib/types/outfit.ts hooks/data/outfit-variants.ts
git commit -m "feat(outfits): include variant rarity in public projection"
```

---

## Task 2: Migration — recover the orphaned null-set variant

One variant has `outfit_set IS NULL` and never renders. Re-point it to `'standalone-pieces'` so all standalone variants share one set slug.

**Files:**

- Create: `supabase/migrations/<ts>_recover_orphan_null_outfit_variant.sql`

**Interfaces:**

- Produces: after this migration, `SELECT count(*) FROM outfit_variants WHERE outfit_set IS NULL` = 0.

- [ ] **Step 1: Verify the current orphan count (pre-state)**

Run this SQL against the project (via the Supabase MCP `execute_sql` or the dashboard SQL editor):

```sql
SELECT count(*) AS null_set FROM outfit_variants WHERE outfit_set IS NULL;
```

Expected: `null_set = 1`. (If it is already 0, skip the migration — note that in the commit and move to Task 3.)

- [ ] **Step 2: Write the migration file**

Create `supabase/migrations/<ts>_recover_orphan_null_outfit_variant.sql` (replace `<ts>` with a fresh `YYYYMMDDHHMMSS` timestamp later than `20260702051043`):

```sql
-- The add-variant form historically posted outfit_set = NULL for "standalone"
-- pieces, but the Standalone Pieces set uses outfit_set = 'standalone-pieces'.
-- A NULL-set variant is grouped under '' and never rendered on the outfits page.
-- Re-point any remaining orphan to the real set so it renders and is tracked.
UPDATE outfit_variants
SET outfit_set = 'standalone-pieces'
WHERE outfit_set IS NULL;
```

- [ ] **Step 3: Apply the migration**

Run: `supabase db push --include-all`
Expected: the new migration applies without error. (If local migrations predate remote history, `--include-all` is the documented workaround for this repo.)

- [ ] **Step 4: Verify the post-state**

Run this SQL:

```sql
SELECT count(*) AS null_set FROM outfit_variants WHERE outfit_set IS NULL;
```

Expected: `null_set = 0`.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/
git commit -m "fix(outfits): recover orphaned null-set variant into standalone-pieces"
```

---

## Task 3: Add-variant form — default, pin, and skip back-fill for Standalone

Make Standalone the default set and pin it to the top of the picker, posting `outfit_set='standalone-pieces'`. Do NOT back-fill rarity/style/labels when Standalone is selected (mixed bag). Keep the slug title-derived and title required for standalone.

**Files:**

- Modify: `app/admin/outfits/variants/variant-custom-fields.tsx` (`GroupedOutfitSetSelect`)
- Modify: `app/admin/outfits/variants/fields.tsx` (`deriveSlug`, `title` field `required`)

**Interfaces:**

- Consumes: `GroupedOutfitSetSelect({ values, setValue, outfitSets, mode })` and `outfitVariantFields(mode)` — existing signatures, unchanged.
- Produces: submitting the add form with the default selection posts `outfit_set='standalone-pieces'`; the slug is `{toSlug(title)}-{category}` for standalone pieces.

- [ ] **Step 1: Define the standalone slug constant and skip back-fill**

In `app/admin/outfits/variants/variant-custom-fields.tsx`, near the top of the module (after imports), add:

```typescript
const STANDALONE_SLUG = 'standalone-pieces'
```

Inside `GroupedOutfitSetSelect`, change the default value resolution and the back-fill guard. Replace:

```typescript
  const value = String(values.outfit_set ?? '')

  function applyBackfill(nextSlug: string) {
    const set = outfitSets.find((s) => s.slug === nextSlug)
    if (set) {
```

with:

```typescript
  // In add mode, default the picker to the Standalone Pieces bag. Edit mode uses
  // the variant's own saved set (which may be any set, including standalone).
  const value = String(values.outfit_set ?? (mode === 'add' ? STANDALONE_SLUG : ''))

  function applyBackfill(nextSlug: string) {
    // Standalone is a mixed bag: each piece carries its own rarity/style/labels,
    // so selecting it must NOT back-fill set-level fields. Treat it like the old
    // empty option — clear inherited fields in add mode, leave them in edit mode.
    if (nextSlug === STANDALONE_SLUG) {
      if (mode === 'add') {
        setValue('rarity', '')
        setValue('style', '')
        setValue('label', '')
        setValue('label_2', '')
      }
      return
    }
    const set = outfitSets.find((s) => s.slug === nextSlug)
    if (set) {
```

- [ ] **Step 2: Pin the Standalone item to the top of the picker**

In the same file, replace the empty menu item:

```typescript
        <MenuItem value="">— Standalone piece —</MenuItem>
```

with the pinned standalone item:

```typescript
        <MenuItem value={STANDALONE_SLUG}>Standalone Pieces</MenuItem>
```

Note: the `outfitSets` list passed to this component may already contain a
`standalone-pieces` base row (it is `base_set === null`). If it does, it would
also appear in the `baseSets` mapping below and render a second time. Filter it
out of `baseSets` so it only appears as the pinned top item. Replace:

```typescript
const baseSets = outfitSets
  .filter((s) => s.base_set === null)
  .sort((a, b) => (a.title ?? '').localeCompare(b.title ?? ''))
```

with:

```typescript
const baseSets = outfitSets
  .filter((s) => s.base_set === null && s.slug !== STANDALONE_SLUG)
  .sort((a, b) => (a.title ?? '').localeCompare(b.title ?? ''))
```

- [ ] **Step 3: Update `deriveSlug` and `title` required in `fields.tsx`**

In `app/admin/outfits/variants/fields.tsx`, add the constant and treat standalone like the no-set (title-based) case. Replace the whole `deriveSlug` function:

```typescript
function deriveSlug(v: FieldValues): string {
  const category = String(v.outfit_category ?? '')
  if (v.outfit_set) {
    return [String(v.outfit_set), category].filter(Boolean).join('-')
  }
  return [toSlug(String(v.title ?? '')), category].filter(Boolean).join('-')
}
```

with:

```typescript
const STANDALONE_SLUG = 'standalone-pieces'

// A "bag" set (standalone or no set) derives its slug from title + category so
// multiple pieces in the same category don't collide (e.g. `silverplume-hair`).
// A real base/evolution set derives from set + category (e.g. `moonlit-dress-hair`).
function isBagSet(v: FieldValues): boolean {
  return !v.outfit_set || v.outfit_set === STANDALONE_SLUG
}

function deriveSlug(v: FieldValues): string {
  const category = String(v.outfit_category ?? '')
  if (!isBagSet(v)) {
    return [String(v.outfit_set), category].filter(Boolean).join('-')
  }
  return [toSlug(String(v.title ?? '')), category].filter(Boolean).join('-')
}
```

Then update the `title` field's `required` predicate. Replace:

```typescript
    { type: 'text', name: 'title', label: 'Title', required: (v) => !v.outfit_set },
```

with:

```typescript
    { type: 'text', name: 'title', label: 'Title', required: (v) => isBagSet(v) },
```

- [ ] **Step 4: Verify types + lint**

Run: `yarn tsc --noEmit && yarn lint`
Expected: no errors.

- [ ] **Step 5: Manual verification in the browser**

Run: `yarn dev`, then as an admin go to the add-variant form (`/admin/outfits/variants/new`).
Expected:

- The Outfit Set picker defaults to "Standalone Pieces" and it is the first item.
- "Standalone Pieces" appears exactly once (not duplicated in the base list).
- Selecting a category + typing a title produces a slug like `{title}-{category}`.
- Rarity/style/labels are NOT auto-filled when Standalone is selected; values you pick persist.
- Selecting a real set (e.g. any base set) still back-fills its rarity/style/labels and derives the slug from the set.

- [ ] **Step 6: Commit**

```bash
git add app/admin/outfits/variants/variant-custom-fields.tsx app/admin/outfits/variants/fields.tsx
git commit -m "feat(admin/outfits): default and pin Standalone Pieces in add-variant form"
```

---

## Task 4: Outfits page — pin Standalone last + mixed-bag rarity filter

Standalone Pieces always renders dead last regardless of sort axis/direction. When a rarity is selected, Standalone stays visible if it has any variant of that rarity, showing only matching variants; other sets keep their set-level rarity match.

**Files:**

- Modify: `app/outfits/filter-outfits.tsx` (rarity filter ~line 124; sort comparator ~lines 181-203; per-variant culling ~lines 166-177)

**Interfaces:**

- Consumes: `OutfitVariant.rarity` from Task 1; `getOutfitVariantsBySet` carrying rarity from Task 2's data. `set.slug`, `set.rarity`, `set.outfit_variants` on each set.
- Produces: none downstream — this is the leaf UI.

- [ ] **Step 1: Add the standalone constant**

In `app/outfits/filter-outfits.tsx`, after the imports, add:

```typescript
const STANDALONE_SLUG = 'standalone-pieces'
```

- [ ] **Step 2: Mixed-bag rarity filter on the set list**

Replace the set-level rarity filter line:

```typescript
    .filter((set) => !selectedRarity || set.rarity === selectedRarity)
```

with a version that treats Standalone as a bag (keep it if ANY variant matches):

```typescript
    .filter((set) => {
      if (!selectedRarity) return true
      // Standalone is a mixed bag: keep it if any of its pieces match the rarity.
      // Every other set has a single set-level rarity.
      if (set.slug === STANDALONE_SLUG) {
        return set.outfit_variants.some((v) => v.rarity === selectedRarity)
      }
      return set.rarity === selectedRarity
    })
```

- [ ] **Step 3: Cull non-matching standalone variants under a rarity filter**

In the `.map((set) => { ... })` block, the final `culledVariants` chain (currently ending with the obtained-filter `.filter(...)`) must also drop standalone variants whose rarity doesn't match the selected rarity. Locate:

```typescript
const culledVariants = inMatchingGroup
  .filter(
    (v) =>
      selectedOutfitCategory.length === 0 ||
      (v.outfit_category !== null && selectedOutfitCategory.includes(v.outfit_category))
  )
  .filter((v) => {
    if (groupLevelObtained) return true
    if (selectedObtainedFilter === 'obtained') return v.obtained === true
    if (selectedObtainedFilter === 'missing') return v.obtained !== true
    return true
  })
```

and append one more `.filter` to the chain:

```typescript
const culledVariants = inMatchingGroup
  .filter(
    (v) =>
      selectedOutfitCategory.length === 0 ||
      (v.outfit_category !== null && selectedOutfitCategory.includes(v.outfit_category))
  )
  .filter((v) => {
    if (groupLevelObtained) return true
    if (selectedObtainedFilter === 'obtained') return v.obtained === true
    if (selectedObtainedFilter === 'missing') return v.obtained !== true
    return true
  })
  // Standalone is a mixed bag: when a rarity is selected, show only the
  // matching pieces. Other sets are single-rarity, so this is a no-op for them.
  .filter((v) => !selectedRarity || set.slug !== STANDALONE_SLUG || v.rarity === selectedRarity)
```

- [ ] **Step 4: Pin Standalone last in the sort comparator**

In the `.sort((a, b) => { ... })` block, add a short-circuit at the very top of the comparator body, before the `progress` helper / `switch`. Locate:

```typescript
    .sort((a, b) => {
      const progress = (s: (typeof filteredSets)[number]) => {
```

and insert the pin check immediately inside the comparator:

```typescript
    .sort((a, b) => {
      // Standalone Pieces is a catch-all bucket — always render it dead last,
      // regardless of sort axis or direction. Only one standalone set exists,
      // so both-standalone never happens.
      if (a.slug === STANDALONE_SLUG) return 1
      if (b.slug === STANDALONE_SLUG) return -1
      const progress = (s: (typeof filteredSets)[number]) => {
```

- [ ] **Step 5: Verify types + lint**

Run: `yarn tsc --noEmit && yarn lint`
Expected: no errors.

- [ ] **Step 6: Manual verification in the browser**

Run: `yarn dev`, open `/outfits` (logged in as a user with some obtained data helps but is not required).
Expected:

- Standalone Pieces appears **last** in the grid under every sort axis (date, rarity, progress, title) and after toggling sort direction.
- With no rarity filter, Standalone shows all its pieces.
- Set the rarity filter to a value present among standalone pieces (e.g. one you added in Task 3) → Standalone stays visible and shows only pieces of that rarity.
- Set the rarity filter to a rarity NOT present among standalone pieces → Standalone disappears; other sets of that rarity still show correctly and remain sorted above where Standalone would be.

- [ ] **Step 7: Commit**

```bash
git add app/outfits/filter-outfits.tsx
git commit -m "feat(outfits): pin Standalone Pieces last and filter it as a mixed bag"
```

---

## Task 5: Final verification & PR

**Files:** none (verification + PR only).

- [ ] **Step 1: Full type-check and lint**

Run: `yarn tsc --noEmit && yarn lint`
Expected: both clean.

- [ ] **Step 2: Confirm the DB post-state**

Run this SQL:

```sql
SELECT
  count(*) FILTER (WHERE outfit_set IS NULL) AS null_set,
  count(*) FILTER (WHERE outfit_set = 'standalone-pieces') AS standalone_set
FROM outfit_variants;
```

Expected: `null_set = 0`, `standalone_set >= 9` (the original 8 plus the recovered orphan, plus any you added while testing).

- [ ] **Step 3: Push and open a PR**

```bash
git push -u origin feat/standalone-pieces-pin-mixed-bag
```

Then open a PR against `main` with a summary of the four behavior changes (migration, default/pin form, mixed-bag rarity, pin-last). Do not merge — `main` requires a review + Vercel check.

---

## Self-Review (completed by plan author)

**Spec coverage:**

- Migration (recover orphan) → Task 2. ✓
- Form default + pin top + post `standalone-pieces` → Task 3 Steps 1-2. ✓
- Mixed bag: no back-fill → Task 3 Step 1. ✓
- Standalone slug from title+category, title required → Task 3 Step 3. ✓
- Pin to bottom of outfits page → Task 4 Step 4. ✓
- Mixed-bag rarity filter (show matching variants) → Task 4 Steps 2-3. ✓
- Per-variant rarity plumbing (type + select) → Task 1. ✓
- Out-of-scope items (no new fields, no edit-form change, no title-sort exception) → honored (no tasks touch them). ✓

**Placeholder scan:** No TBD/TODO. The only `<ts>` / `<filename>` placeholders are timestamp/branch tokens the engineer fills with a real value, with explicit instructions. ✓

**Type consistency:** `STANDALONE_SLUG` defined per-file (variant-custom-fields.tsx, fields.tsx, filter-outfits.tsx) — intentional, no cross-file import needed. `OutfitVariant.rarity` added in Task 1 is consumed by Task 4's `v.rarity` checks. `isBagSet` defined and used within fields.tsx only. ✓
