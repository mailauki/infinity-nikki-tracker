# Restrict Standalone-Pieces Set Form Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** For the `standalone-pieces` set only, restrict the outfit set edit form to Title, Slug, Description, Set Images, and per-variant image cards — hiding all generation fields — and make the save action write only those fields for that set.

**Architecture:** Two layers on the existing config-driven set edit form. The client form (`edit-outfit-set-form.tsx`) gates the standalone-hidden sections and their hidden inputs behind `!isStandalone`. The server action (`editOutfitSet`) branches the base-row update for the standalone set to write only `{title, slug, description, updated_at}`, reusing the `STANDALONE_PIECES_SLUG` sentinel already in the file.

**Tech Stack:** Next.js 16 App Router, React (client form + server action), MUI, Supabase. Package manager: **Yarn**.

## Global Constraints

- Package manager is **Yarn**. Never npm/pnpm.
- Prettier: no semicolons, single quotes, 2-space indent, 100 char width. PostToolUse hook runs `yarn format && yarn lint:fix` then `yarn tsc --noEmit` after each edit.
- **No test framework.** Per-task verification is `yarn tsc --noEmit` (0 errors) and `yarn lint` (no NEW errors; 2 known pre-existing warnings — unused `Toolbar` in `app/outfits/[slug]/outfit-evolution-variants.tsx`, unused `CardContent` in `components/quick-access.tsx` — are allowed).
- Scope is the **edit form for the `standalone-pieces` set only**. The new-set form and all other sets are unchanged.
- The set is identified by slug `standalone-pieces`; the constant `STANDALONE_PIECES_SLUG` already exists in `app/admin/outfits/sets/actions.ts` (not exported — `'use server'` file).
- Shown for standalone: Title, Slug, Description, Set Images (main+alt), per-variant image cards. Hidden: Rarity, Style, Labels, Ability, Season, Season Category, Categories, handhelds toggle, Evolution editor, Gallery images.
- `outfit_sets.rarity` is NOT NULL — the action must not write a null rarity for the standalone set.
- `git add` paths with `[slug]` brackets MUST be single-quoted (zsh): `git add 'app/.../[slug]/file.tsx'`.
- Branch: `feat/restrict-standalone-set-form` (already created, rebased on main which has #239's `STANDALONE_PIECES_SLUG` + `isManualVariantSet`). Commit per task; do NOT push/PR until asked.

---

### Task 1: Action — restrict the standalone base-row update

**Files:**

- Modify: `app/admin/outfits/sets/actions.ts` (`editOutfitSet`, base-row update ~line 196-207)

**Interfaces:**

- Consumes: existing `STANDALONE_PIECES_SLUG` const (line 14), `previousSlug` (line 189), `slug`, `title`, `description`, `sharedFields`, `handheldBaseOnly`.
- Produces: standalone base-row update writes only `{title, slug, description, updated_at}`.

- [ ] **Step 1: Add an early standalone check + branch the base-row update**

In `app/admin/outfits/sets/actions.ts`, the base-row update currently reads:

```typescript
// Update the base row.
const { error } = await supabase
  .from('outfit_sets')
  .update({
    title,
    slug,
    description,
    ...sharedFields,
    handheld_base_only: handheldBaseOnly,
    updated_at: new Date().toISOString(),
  })
  .eq('id', id)

if (error) return { error: error.message }
```

Replace that block with a standalone-aware version (compute the check from the same slug logic used later for `isManualVariantSet`):

```typescript
// The standalone-pieces set exposes only title/slug/description/images in its
// edit form (its other set-level fields are hidden and meaningless), so persist
// only those — never overwrite its cosmetic fields with the now-absent inputs
// (rarity is NOT NULL and would fail).
const isStandaloneSet = slug === STANDALONE_PIECES_SLUG || previousSlug === STANDALONE_PIECES_SLUG

// Update the base row.
const { error } = await supabase
  .from('outfit_sets')
  .update(
    isStandaloneSet
      ? { title, slug, description, updated_at: new Date().toISOString() }
      : {
          title,
          slug,
          description,
          ...sharedFields,
          handheld_base_only: handheldBaseOnly,
          updated_at: new Date().toISOString(),
        }
  )
  .eq('id', id)

if (error) return { error: error.message }
```

Note: the existing `isManualVariantSet` (defined later, ~line 308) computes the same expression. Leave it as-is — do NOT hoist/rename it; a second local named for its own use here keeps each block readable. (If tsc/lint flags an unused-var or you prefer DRY, you may hoist `isManualVariantSet` above the base-row update and reuse it — but that is optional and must not change behavior.)

- [ ] **Step 2: Type-check**

Run: `yarn tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 3: Lint**

Run: `yarn lint`
Expected: no new errors (only the 2 known pre-existing warnings).

- [ ] **Step 4: Commit**

```bash
git add app/admin/outfits/sets/actions.ts
git commit -m "feat(admin/outfits): standalone set save writes only title/slug/description

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Form — hide non-standalone fields for the standalone set

**Files:**

- Modify: `app/admin/outfits/sets/edit/[slug]/edit-outfit-set-form.tsx`

**Interfaces:**

- Consumes: `outfitSet.slug` (to derive `isStandalone`). The action (Task 1) already ignores the hidden fields for this set.
- Produces: standalone edit form renders only Title, Slug, Description, Set Images, Variant Images.

- [ ] **Step 1: Derive `isStandalone`**

In `app/admin/outfits/sets/edit/[slug]/edit-outfit-set-form.tsx`, after the state hooks (near the top of the component body, e.g. just after `const baseSlug = outfitSet.slug ?? ''`), add:

```typescript
const isStandalone = outfitSet.slug === 'standalone-pieces'
```

- [ ] **Step 2: Gate the Style ToggleField, Labels, Ability, Season, Season Category, Categories, and handhelds toggle**

In the JSX, wrap this contiguous run in `{!isStandalone && ( ... )}`. The affected blocks are (in order): the `ToggleField` for Style, the two Labels hidden `<input>`s + Labels `FormControl`, the Ability `FormControl`, the Season `FormControl`, the Season Category `FormControl`, the Categories `FormControl`, and the handhelds `FormControlLabel` switch. Description sits BETWEEN Labels and Ability in the current markup, and Description must stay visible — so gate in two runs, not one:

Run A — wrap the Style `ToggleField` + Labels inputs/`FormControl` (everything between `<RarityField .../>` and the `<TextField ... label="Description" ...>`):

```tsx
{
  !isStandalone && (
    <>
      <ToggleField label="Style" name="style" options={styles} value={style} onChange={setStyle} />

      <input name="label" type="hidden" value={labelSelect[0] ?? ''} />
      <input name="label_2" type="hidden" value={labelSelect[1] ?? ''} />
      <FormControl>
        <InputLabel>Labels</InputLabel>
        {/* ...existing Labels Select unchanged... */}
      </FormControl>
    </>
  )
}
```

Run B — wrap everything from the Ability `FormControl` through the handhelds `FormControlLabel` (i.e. Ability, Season, Season Category, Categories, and the `{categorySelect.includes('handhelds') && ...}` switch), which sits AFTER the Description `TextField`:

```tsx
{
  !isStandalone && (
    <>
      <FormControl>
        <InputLabel>Ability</InputLabel>
        {/* ...Ability Select... */}
      </FormControl>
      <FormControl>
        <InputLabel>Season</InputLabel>
        {/* ...Season Select... */}
      </FormControl>
      <FormControl>
        <InputLabel>Season Category</InputLabel>
        {/* ...Season Category Select... */}
      </FormControl>
      <FormControl>
        <InputLabel>Categories</InputLabel>
        {/* ...Categories Select... */}
      </FormControl>
      {categorySelect.includes('handhelds') && evolutionDrafts.length > 0 && (
        <FormControlLabel
          control={
            <Switch
              checked={handheldBaseOnly}
              onChange={(e) => setHandheldBaseOnly(e.target.checked)}
            />
          }
          label="Handhelds exclusive to base set"
        />
      )}
    </>
  )
}
```

Keep the inner JSX of each block byte-for-byte identical to what's there now — only add the `{!isStandalone && (<>...</>)}` wrappers. Also leave `<RarityField>` — it is gated separately in Step 3.

- [ ] **Step 3: Gate RarityField**

Wrap the `<RarityField value={rarity} onChange={setRarity} />` line:

```tsx
{
  !isStandalone && <RarityField value={rarity} onChange={setRarity} />
}
```

- [ ] **Step 4: Gate the Evolution editor + Gallery + trailing hidden inputs**

Wrap the `EvolutionEditor` block:

```tsx
{
  !isStandalone && (
    <EvolutionEditor
      glowupEvolutionOrder={glowupEvolutionOrder}
      initialDrafts={initialDrafts}
      maxEvolutions={maxEvolutions}
      onChange={setEvolutionDrafts}
      onGlowupChange={setGlowupEvolutionOrder}
    />
  )
}
```

Wrap the Gallery Images `Stack`:

```tsx
{
  !isStandalone && (
    <Stack spacing={1}>
      <Typography variant="subtitle2">Gallery Images</Typography>
      <CarouselImageUpload
        images={carouselImages}
        slug={outfitSet.slug ?? ''}
        table="outfit_set_carousel_images"
        onChange={setCarouselImages}
      />
    </Stack>
  )
}
```

Wrap the four trailing hidden inputs at the end of the `<Stack>` (`evolution_drafts`, `glowup_evolution_order`, `handheld_base_only`, `outfit_categories`) so the standalone form submits none of them:

```tsx
{
  !isStandalone && (
    <>
      <input name="evolution_drafts" type="hidden" value={JSON.stringify(evolutionDrafts)} />
      <input name="glowup_evolution_order" type="hidden" value={glowupEvolutionOrder} />
      <input name="handheld_base_only" type="hidden" value={handheldBaseOnly ? 'true' : ''} />
      <input
        name="outfit_categories"
        type="hidden"
        value={JSON.stringify(categorySelect.map((s) => ({ slug: s })))}
      />
    </>
  )
}
```

Leave Title, Slug, Description, the Set Images `Stack` (`ImageUploadPair`), and the Variant Images `Stack` OUTSIDE any gate — they always render.

- [ ] **Step 5: Type-check**

Run: `yarn tsc --noEmit`
Expected: 0 errors. (Some state setters like `setStyle`, `setSeason`, `setCategorySelect`, `setHandheldBaseOnly`, `setGlowupEvolutionOrder`, `setEvolutionDrafts` are still referenced inside the gated JSX, so they remain "used" — no unused-var errors. If tsc DOES report an unused variable, that state/handler is now dead for the standalone path but still used for the normal path inside the gate, so it should not happen; investigate before deleting anything.)

- [ ] **Step 6: Lint**

Run: `yarn lint`
Expected: no new errors (only the 2 known warnings). If lint flags a now-unused import, confirm it truly has zero references across BOTH branches before removing (most imports — `ToggleField`, `EvolutionEditor`, `CarouselImageUpload`, `Switch`, `FormControlLabel`, etc. — are still used inside the `!isStandalone` gate, so nothing should become unused).

- [ ] **Step 7: Commit**

```bash
git add 'app/admin/outfits/sets/edit/[slug]/edit-outfit-set-form.tsx'
git commit -m "feat(admin/outfits): hide generation fields on standalone set form

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Manual verification

**Files:** none (verification only).

- [ ] **Step 1: Full type-check + lint**

Run: `yarn tsc --noEmit && yarn lint`
Expected: tsc 0 errors; lint 0 errors (2 known warnings).

- [ ] **Step 2: Manual browser check (report results)**

Start `yarn dev` (or use a running server). Logged in as admin:

- Edit `/admin/outfits/sets/edit/standalone-pieces`: the form shows ONLY Title, Slug, Description, Set Images, and the 8 variant image cards. No Rarity/Style/Labels/Ability/Season/Season Category/Categories/handhelds toggle/Evolution editor/Gallery.
- Save the standalone set (change the description): it succeeds, the 8 variants remain (still 8, not deleted), and the set's rarity/style are unchanged in the DB.
- Edit a DIFFERENT (normal) set, e.g. any regular outfit set: the full form still shows all fields (regression check).
- Confirm variant add/delete is NOT possible from the standalone set form, and adding a new standalone piece is still done from the variant form.

Report what you observed. If the standalone set save deletes variants or nulls rarity, STOP — the action guard didn't apply.

- [ ] **Step 3: Commit (only if any fix was needed)**

If Steps 1-2 surfaced a fix, commit it; otherwise no commit for this task.

---

## Notes for the implementer

- The variant-sync (create/delete) is ALREADY skipped for standalone-pieces via `isManualVariantSet` (from PR #239, now on this branch). This plan does NOT touch that — it only hides fields and restricts the base-row update.
- Do not hoist state out of the component or delete "unused" setters — they're used inside the `!isStandalone` gate for the normal-set path.
- Keep every gated block's inner JSX identical to the current code; the only change is adding `{!isStandalone && (...)}` wrappers.
