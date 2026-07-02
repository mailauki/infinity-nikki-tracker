# Restrict the standalone-pieces set edit form

## Problem

The `standalone-pieces` set is a container of individually-authored variants (all
category `hair`, own slugs) managed via the standalone-variant admin. Most of the
outfit **set** edit form's fields are meaningless for it — rarity/style/labels/
ability/season/categories/evolutions are set-level generation inputs that don't
apply to a hand-authored collection. Worse, submitting those fields feeds the
set-row update (and previously the variant-sync, now guarded) in ways that don't
fit this set.

We want the standalone-pieces set edit form to expose **only** the fields that
make sense for it: Title, Slug, Description, Set Images, and the per-variant
image cards (edit existing pieces' image/alt/title/description). Adding and
deleting standalone variants stays exclusively on the **variant** form — the set
form never creates or deletes variants for this set (already enforced by the
variant-sync guard from the prior fix).

## Decisions (from brainstorming)

- **Scope: edit form for the `standalone-pieces` set only.** The "new set" form and
  every other set are unchanged. There is no way to create a new standalone-pieces
  set (it is a singleton that already exists), so only the edit path needs the
  restriction.
- **Shown for standalone:** Title, Slug, Description, Set Images (main + alt), and
  the per-variant image cards.
- **Hidden for standalone:** Rarity, Style, Labels, Ability, Season, Season
  Category, Categories, the "handhelds exclusive to base" toggle, the Evolution
  editor, and Gallery (carousel) images.
- **Variant editing stays on the set form; add/delete stays on the variant form.**
  The variant image cards remain visible so existing pieces can be edited; the
  variant-sync (create/delete) is already skipped for this set.
- **Identify the set by slug** `standalone-pieces` (the existing
  `STANDALONE_PIECES_SLUG` sentinel in `app/admin/outfits/sets/actions.ts`).

## Scope

### In scope

#### 1. Form — `app/admin/outfits/sets/edit/[slug]/edit-outfit-set-form.tsx`

- Derive `const isStandalone = outfitSet.slug === 'standalone-pieces'`.
- Gate the standalone-hidden sections behind `{!isStandalone && ( ... )}`:
  - `RarityField`
  - Style `ToggleField`
  - Labels `FormControl` **and** its two hidden inputs (`label`, `label_2`)
  - Ability `FormControl`
  - Season `FormControl`
  - Season Category `FormControl`
  - Categories `FormControl` **and** the `outfit_categories` hidden input
  - the handhelds `Switch` `FormControlLabel`
  - `EvolutionEditor` **and** the `evolution_drafts` / `glowup_evolution_order` /
    `handheld_base_only` hidden inputs
  - Gallery Images `Stack` (`CarouselImageUpload`)
- Always shown: Title, Slug, Description, Set Images (`ImageUploadPair`), and the
  Variant Images cards block.
- Gating the hidden inputs matters: if they still submit, the action would receive
  stale/blank values. Hiding both the control and its hidden input(s) means the
  form sends nothing for those fields, and the action (below) ignores them for
  this set anyway — defense in depth.

#### 2. Action — `editOutfitSet` in `app/admin/outfits/sets/actions.ts`

- Reuse the existing `isManualVariantSet` computation (already `slug ===
STANDALONE_PIECES_SLUG || previousSlug === STANDALONE_PIECES_SLUG`), but it is
  computed _after_ the base-row update today. Compute a standalone check earlier
  (right after `previousSlug` is resolved) so the base-row update can branch on it.
- For the standalone set, the base-row `outfit_sets` update writes **only**
  `{ title, slug, description, updated_at }` — omit `sharedFields`
  (rarity/style/ability/seasons/season_category/label/label_2) and
  `handheld_base_only`. This prevents hidden/absent form fields from nulling the
  row, and specifically avoids violating `outfit_sets.rarity NOT NULL`.
- The sibling-evolution and variant-sync blocks are already skipped for this set
  (no evolutions submitted; `isManualVariantSet` no-op). The variant image/title/
  description update loop (from `variant_image_` / `variant_title_` /
  `variant_description_` inputs) runs unchanged so the visible variant cards still
  save.

### Out of scope

- The "new set" form (`add-outfit-set-form.tsx`) — unchanged.
- Any change to how standalone variants are added/deleted (variant form) — already
  correct.
- Generalizing to a configurable per-set field policy — YAGNI; this is a single
  known singleton set.

## Risks / notes

- The variant image cards filter on `isBaseVariant` (`v.outfit_set === baseSlug`).
  For standalone-pieces all variants have `outfit_set = 'standalone-pieces'` =
  baseSlug, so all pieces show — correct.
- Because the action stops writing `sharedFields` for standalone, the set row's
  cosmetic rarity/style stay at their current values (rarity 2) rather than being
  overwritten — intended.
- No DB or type changes. Verification is `yarn tsc --noEmit` + `yarn lint`, plus a
  manual check that editing the standalone set shows only the restricted fields and
  saving preserves its 8 variants.
