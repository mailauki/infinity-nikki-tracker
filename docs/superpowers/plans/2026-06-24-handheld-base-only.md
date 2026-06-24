# Handheld base-exclusive toggle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let an admin mark a set's `handhelds` category as exclusive to the base outfit so handheld variants are not generated for evolution states.

**Architecture:** A boolean column `handheld_base_only` on the base `outfit_sets` row drives variant generation. In the add/edit Server Actions, evolution states skip the `handhelds` category when the flag is on; the edit action's existing expected-vs-DB variant diff deletes any stale evolution-state handheld variants on save. A MUI `Switch` in both forms sets the flag, shown only when it is meaningful (`handhelds` selected AND the set has ≥1 evolution).

**Tech Stack:** Next.js 16 App Router, Supabase (Postgres), MUI v9, TypeScript, Yarn.

## Global Constraints

- Package manager: **Yarn** (never npm/pnpm).
- Prettier: no semicolons, single quotes, 2-space indent, 100 char width.
- Path alias `@/` = project root.
- `git add` with `[slug]` paths must be quoted (zsh glob).
- Type-check with `yarn dlx tsc --noEmit` (no `tsc` package script).
- This work happens on branch `feat/handheld-base-only` (already created; spec already committed there).
- `lib/types/supabase.ts` is generated — regenerate, do not hand-edit, **except** the one fallback in Task 1 Step 3 if CLI regeneration is unavailable.
- The flag is meaningful only on the base row (`base_set IS NULL`); evolution sibling rows ignore it.

---

### Task 1: Add `handheld_base_only` column + regenerate types

**Files:**

- Create: `supabase/migrations/20260624000001_add_handheld_base_only_to_outfit_sets.sql`
- Modify: `lib/types/supabase.ts` (regenerated)

**Interfaces:**

- Consumes: nothing.
- Produces: column `outfit_sets.handheld_base_only boolean NOT NULL DEFAULT false`, surfaced in generated types as `handheld_base_only: boolean` on the `outfit_sets` Row, and `handheld_base_only?: boolean` on Insert/Update.

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/20260624000001_add_handheld_base_only_to_outfit_sets.sql`:

```sql
ALTER TABLE public.outfit_sets
  ADD COLUMN handheld_base_only boolean NOT NULL DEFAULT false;
```

- [ ] **Step 2: Apply the migration**

Run: `supabase db push --include-all`
Expected: migration applies cleanly; no error. (If local migrations predate remote, `--include-all` is required per CLAUDE.md.)

- [ ] **Step 3: Regenerate generated types**

Run: `supabase gen types typescript --project-id $(cat supabase/.temp/project-ref) > lib/types/supabase.ts`
Expected: `lib/types/supabase.ts` now contains `handheld_base_only: boolean` in the `outfit_sets` Row block and `handheld_base_only?: boolean` in its Insert/Update blocks.

If the CLI is unavailable in this environment, hand-edit `lib/types/supabase.ts` instead: in the `outfit_sets` table definition add `handheld_base_only: boolean` to `Row`, and `handheld_base_only?: boolean` to both `Insert` and `Update`. Place it alphabetically near `base_set`/`glowup`-adjacent fields to match surrounding style.

- [ ] **Step 4: Type-check**

Run: `yarn dlx tsc --noEmit`
Expected: PASS (no errors). The new column existing in types is required by later tasks; nothing references it yet, so this only confirms the regeneration did not break the file.

- [ ] **Step 5: Commit**

```bash
git add 'supabase/migrations/20260624000001_add_handheld_base_only_to_outfit_sets.sql' lib/types/supabase.ts
git commit -m "feat(outfits): add handheld_base_only column to outfit_sets

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Persist the flag and skip handhelds for evolution states in Server Actions

**Files:**

- Modify: `app/admin/outfits/sets/actions.ts` (both `addOutfitSet` and `editOutfitSet`)

**Interfaces:**

- Consumes: `outfit_sets.handheld_base_only` column (Task 1); form field `handheld_base_only` (string `'true'`/absent) submitted by Tasks 3 & 4.
- Produces: variant generation that omits `outfit_category = 'handhelds'` for evolution states when the flag is on; the base row's `handheld_base_only` persisted on insert/update.

This task has no unit test harness in the repo (Server Actions hit Supabase; the project ships no test runner). Verification is by reading + a type-check + a manual smoke test in Task 5. Make the edits, then type-check.

- [ ] **Step 1: Read the current actions file**

Read `app/admin/outfits/sets/actions.ts` in full so the edits below land in the right places.

- [ ] **Step 2: Parse and persist `handheld_base_only` in `addOutfitSet`**

In `addOutfitSet`, after the line that parses `outfitCategories` (the `JSON.parse(... 'outfit_categories' ...)` assignment), add:

```ts
const handheldBaseOnly = formData.get('handheld_base_only') === 'true'
```

Then in the base-row insert object (the `supabase.from('outfit_sets').insert([{ ... order: 1, base_set: null }])` call), add `handheld_base_only: handheldBaseOnly,` alongside the other fields.

- [ ] **Step 3: Skip handhelds for evolution variants in `addOutfitSet`**

In `addOutfitSet`, the `evoVariants` builder currently maps every category for every evolution row:

```ts
const evoVariants = evolutionRows.flatMap((evo) =>
  outfitCategories.map((cat) => ({
    outfit_set: evo.slug,
    outfit_category: cat.slug,
    slug: `${evo.slug}-${cat.slug}`,
    default: false,
  }))
)
```

Replace the inner `.map(...)` source with a filtered list so handhelds is dropped for evolutions when the flag is on:

```ts
const evoVariants = evolutionRows.flatMap((evo) =>
  outfitCategories
    .filter((cat) => !(handheldBaseOnly && cat.slug === 'handhelds'))
    .map((cat) => ({
      outfit_set: evo.slug,
      outfit_category: cat.slug,
      slug: `${evo.slug}-${cat.slug}`,
      default: false,
    }))
)
```

The `baseVariants` builder is left unchanged — the base always gets all categories.

- [ ] **Step 4: Parse and persist `handheld_base_only` in `editOutfitSet`**

In `editOutfitSet`, after the `outfitCategories` `JSON.parse` assignment, add:

```ts
const handheldBaseOnly = formData.get('handheld_base_only') === 'true'
```

Then in the base-row update object (the `.update({ title, slug, description, ...sharedFields, updated_at: ... })` call), add `handheld_base_only: handheldBaseOnly,` to the updated fields.

- [ ] **Step 5: Skip handhelds for evolution states in `editOutfitSet`'s expected-variant diff**

In `editOutfitSet`, the `expectedVariants` builder iterates `stateSlugs` (base slug first, then sibling slugs) × `outfitCategories`:

```ts
const expectedVariants = stateSlugs.flatMap((stateSlug) =>
  outfitCategories.map((cat) => ({
    outfit_set: stateSlug,
    outfit_category: cat.slug,
    slug: `${stateSlug}-${cat.slug}`,
    default: stateSlug === slug,
  }))
)
```

Replace it so evolution states (every `stateSlug` except the base `slug`) drop handhelds when the flag is on:

```ts
const expectedVariants = stateSlugs.flatMap((stateSlug) =>
  outfitCategories
    .filter((cat) => !(handheldBaseOnly && stateSlug !== slug && cat.slug === 'handhelds'))
    .map((cat) => ({
      outfit_set: stateSlug,
      outfit_category: cat.slug,
      slug: `${stateSlug}-${cat.slug}`,
      default: stateSlug === slug,
    }))
)
```

Because `toDelete` is computed as DB variants whose slug is not in `expectedSlugs`, dropping the evolution-state handheld variants from `expectedVariants` makes the existing delete step remove them on save. No new delete code is needed.

- [ ] **Step 6: Type-check**

Run: `yarn dlx tsc --noEmit`
Expected: PASS (no errors).

- [ ] **Step 7: Commit**

```bash
git add app/admin/outfits/sets/actions.ts
git commit -m "feat(outfits): drop handheld variants for evolutions when base-only

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Add the toggle to the edit form (+ pass initial value from the page)

**Files:**

- Modify: `app/admin/outfits/sets/edit/[slug]/page.tsx` (select the column, pass to form)
- Modify: `app/admin/outfits/sets/edit/[slug]/edit-outfit-set-form.tsx`

**Interfaces:**

- Consumes: `outfit_sets.handheld_base_only` (Task 1); the `handheld_base_only` form field is read by `editOutfitSet` (Task 2).
- Produces: a `handheld_base_only` hidden input submitted by the edit form, initialized from the base row.

- [ ] **Step 1: Select the column in the edit page query**

In `app/admin/outfits/sets/edit/[slug]/page.tsx`, the base-set query selects an explicit column list. Add `handheld_base_only` to that select string. The line currently reads:

```ts
.select(
  'id, slug, title, description, rarity, style, label, label_2, ability, seasons, season_category, image_url, alt_image_url, "order", base_set, updated_at'
)
```

Change it to include the new column:

```ts
.select(
  'id, slug, title, description, rarity, style, label, label_2, ability, seasons, season_category, image_url, alt_image_url, "order", base_set, handheld_base_only, updated_at'
)
```

- [ ] **Step 2: Pass the initial value to the form**

In the same file, in the `<EditOutfitSetForm ... />` render, add the prop (keep props alphabetized as the file does — place it after `initialGlowupEvolutionOrder`):

```tsx
initialHandheldBaseOnly={outfitSet.handheld_base_only ?? false}
```

- [ ] **Step 3: Widen `OutfitSetRaw` to include the column**

The form types `outfitSet` as `OutfitSetRaw` (`lib/types/outfit.ts`), which is a `Pick<>` that does not list `handheld_base_only`. Add `'handheld_base_only'` to that Pick so `outfitSet.handheld_base_only` type-checks. In `lib/types/outfit.ts`, the `OutfitSetRaw` Pick union currently ends with `| 'base_set' | 'updated_at'`. Insert the field:

```ts
  | 'base_set'
  | 'handheld_base_only'
  | 'updated_at'
```

- [ ] **Step 4: Accept the prop and add state in the edit form**

In `app/admin/outfits/sets/edit/[slug]/edit-outfit-set-form.tsx`:

(a) Add `Switch` and `FormControlLabel` to the existing `@mui/material` import list (add `FormControlLabel,` and `Switch,` to the named imports).

(b) Add the prop to the destructured params (after `initialGlowupEvolutionOrder = '',`):

```ts
  initialHandheldBaseOnly = false,
```

(c) Add it to the props type block (after `initialGlowupEvolutionOrder?: number | ''`):

```ts
  initialHandheldBaseOnly?: boolean
```

(d) Add state near the other category state (after the `categorySelect` `useState`):

```ts
const [handheldBaseOnly, setHandheldBaseOnly] = useState(initialHandheldBaseOnly)
```

- [ ] **Step 5: Render the toggle below the Categories FormControl**

Compute visibility and render the switch immediately after the closing `</FormControl>` of the Categories `Select` (the one just before `<EvolutionEditor ... />`). The toggle is meaningful only when `handhelds` is selected AND the set has at least one evolution:

```tsx
{
  categorySelect.includes('handhelds') && evolutionDrafts.length > 0 && (
    <FormControlLabel
      control={
        <Switch
          checked={handheldBaseOnly}
          onChange={(e) => setHandheldBaseOnly(e.target.checked)}
        />
      }
      label="Handhelds exclusive to base set"
    />
  )
}
```

- [ ] **Step 6: Submit the value as a hidden input**

Next to the other hidden inputs at the bottom of the form (near `name="outfit_categories"`), add:

```tsx
<input name="handheld_base_only" type="hidden" value={handheldBaseOnly ? 'true' : ''} />
```

- [ ] **Step 7: Type-check**

Run: `yarn dlx tsc --noEmit`
Expected: PASS (no errors).

- [ ] **Step 8: Commit**

```bash
git add 'app/admin/outfits/sets/edit/[slug]/page.tsx' 'app/admin/outfits/sets/edit/[slug]/edit-outfit-set-form.tsx' lib/types/outfit.ts
git commit -m "feat(outfits): add handhelds base-only toggle to set edit form

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Mirror the toggle in the add form

**Files:**

- Modify: `app/admin/outfits/sets/new/add-outfit-set-form.tsx`

**Interfaces:**

- Consumes: nothing new (defaults to `false`); the `handheld_base_only` field is read by `addOutfitSet` (Task 2).
- Produces: a `handheld_base_only` hidden input on the add form, defaulting to off.

- [ ] **Step 1: Add imports and state**

In `app/admin/outfits/sets/new/add-outfit-set-form.tsx`:

(a) Add `FormControlLabel,` and `Switch,` to the `@mui/material` named imports.

(b) Add state next to the existing `categorySelect` `useState` (around line 65):

```ts
const [handheldBaseOnly, setHandheldBaseOnly] = useState(false)
```

- [ ] **Step 2: Render the toggle below the Categories FormControl**

After the closing `</FormControl>` of the Categories `Select` (just before `<EvolutionEditor ... />` around line 334), add the same conditional switch as the edit form:

```tsx
{
  categorySelect.includes('handhelds') && evolutionDrafts.length > 0 && (
    <FormControlLabel
      control={
        <Switch
          checked={handheldBaseOnly}
          onChange={(e) => setHandheldBaseOnly(e.target.checked)}
        />
      }
      label="Handhelds exclusive to base set"
    />
  )
}
```

- [ ] **Step 3: Submit the value as a hidden input**

Next to the existing hidden inputs (near `name="outfit_categories"` around line 349), add:

```tsx
<input name="handheld_base_only" type="hidden" value={handheldBaseOnly ? 'true' : ''} />
```

- [ ] **Step 4: Type-check**

Run: `yarn dlx tsc --noEmit`
Expected: PASS (no errors).

- [ ] **Step 5: Commit**

```bash
git add 'app/admin/outfits/sets/new/add-outfit-set-form.tsx'
git commit -m "feat(outfits): add handhelds base-only toggle to set add form

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: Manual smoke test + lint/format pass

**Files:** none modified (verification only; any fixes committed here).

**Interfaces:** consumes everything above.

- [ ] **Step 1: Lint and format**

Run: `yarn lint && yarn format`
Expected: lint passes; format reports files unchanged or formats them. If format changed files, `git add -A && git commit -m "style: format handheld base-only changes"`.

- [ ] **Step 2: Start the dev server**

Run: `yarn dev`
Expected: server up at localhost:3000.

- [ ] **Step 3: Manual test — edit an existing 5-star set as admin**

1. Log in as an admin; open a set that has `handhelds` selected and at least one evolution at `/admin/outfits/sets/edit/<slug>`.
2. Confirm the "Handhelds exclusive to base set" switch is visible.
3. Toggle it on, save.
4. In the DB (Supabase), confirm: the base row's `handheld_base_only = true`; `outfit_variants` has a `handhelds` row for the base `outfit_set` slug but none for any evolution sibling slug.
5. Confirm the public set detail page (`/outfits/<slug>`) shows the handheld for the base but not for evolutions.

Expected: all four hold. If evolution-state handheld variants remain, re-check Task 2 Step 5.

- [ ] **Step 4: Manual test — toggle hidden when not meaningful**

1. Open a set with no evolutions, or one where `handhelds` is not selected.
2. Confirm the switch is NOT rendered.

Expected: hidden in both cases.

- [ ] **Step 5: Manual test — add form**

1. Go to `/admin/outfits/sets/new`, fill required fields for a 5-star set, select `handhelds` plus other categories, add an evolution.
2. Confirm the switch appears; toggle it on; save.
3. In the DB confirm the new base row has `handheld_base_only = true` and no evolution handheld variants exist.

Expected: holds.

- [ ] **Step 6: Final type-check**

Run: `yarn dlx tsc --noEmit`
Expected: PASS.

---

## Self-review notes

- **Spec coverage:** DB column (Task 1) ✓; variant-sync skip in add+edit (Task 2) ✓; edit-form toggle with visibility rule + initial value (Task 3) ✓; add-form mirror (Task 4) ✓; delete-on-save verified via existing diff (Task 2 Step 5 + Task 5 Step 3) ✓; no display-side changes (none planned) ✓.
- **Placeholder scan:** every code step shows concrete code; no TBD/TODO.
- **Type consistency:** `handheld_base_only` (DB/snake_case) vs `handheldBaseOnly` (local var/state) and `initialHandheldBaseOnly` (prop) used consistently across Tasks 2–4; form field name `handheld_base_only` matches `formData.get('handheld_base_only')` in Task 2.
- **Note on tests:** the repo has no JS test runner, so tasks use type-check + manual smoke test instead of TDD unit tests. This matches the existing admin-action code, which ships no unit tests.
