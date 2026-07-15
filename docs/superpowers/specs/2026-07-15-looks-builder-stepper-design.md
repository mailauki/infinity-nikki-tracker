# Looks Builder — Stepper Redesign

**Date:** 2026-07-15
**File touched:** `app/looks/look-builder.tsx` only. No type or server-action changes.

## Goal

Replace the tab + category-drill-in picker in the Looks Builder with a vertical MUI
`Stepper`. Each category becomes a step; a step is skippable, and picking a variant
auto-advances to the next enabled step.

## Step Model

Vertical `Stepper` (`orientation="vertical"`, `nonLinear`) with:

1. **Details** (step 0) — Look name (required) + description. Moved out of the sidebar
   into the stepper.
2. **Category steps**, in canonical order, grouped by tab bucket. Non-clickable group
   header rows are interleaved between runs of category steps:
   - `── PIECES ──` → outfit categories with `part = 'Pieces'`
   - `── ACCESSORIES ──` → outfit categories with `part = 'Accessories'`
   - `── EUREKA ──` → each Eureka category

   Only categories that actually have variants are shown (empty categories dropped, as
   today). Each category step's `StepContent` holds that category's variant grid (existing
   `VariantCard`, `repeat(auto-fill, minmax(120px, 1fr))`).

## Interaction

- **Active step** expands (`StepContent`) to show the variant grid.
- **Auto-advance on pick:** selecting a variant calls `selectPiece(slug)` (keeps the
  one-per-category, per-type replacement rule) then advances `activeStep` to the next
  **enabled** step.
- **Skip button** in each category step advances without selecting.
- A category step with a selection is marked `completed` and shows the picked variant's
  set title as a chip/label on the step (reuse `selectedLabel`).
- **Conflict rule preserved:** a disabled category step (dress vs tops/bottoms via
  `isCategoryDisabled`) renders `disabled` with its reason shown in `StepContent`.
  Auto-advance **skips over** disabled steps. Non-linear stepper so the user can still
  click any enabled step label to jump.

## Search

Removed. Steps are the navigation. Drop `search` state, the search `TextField`,
`SearchIcon`, and the category-filter logic.

## Sidebar (composer)

- **Removed from sidebar:** Look name + description `TextField`s (now the Details step).
- **Kept in sidebar:** the selected-items summary accordion (Pieces / Accessories /
  Eureka), the edit-only `ImageUpload`, the "add cover after saving" info alert, and the
  save-error `Alert`. The `TuneIcon` sidebar toggle in the toolbar stays.

## Save

Unchanged logic. Toolbar Save button reads `name` state (now driven by the Details step),
disabled until `name.trim()`. If name is empty the Details step reads as incomplete; Save
stays disabled (no new error surfacing beyond existing).

## activeStep default

- New look: `activeStep = 0` (Details).
- Edit: also `activeStep = 0` (Details) for consistency.

## Removed / changed symbols

- Remove: `Tabs`, `Tab`, `CategoryRow` component, `activeCategorySlug`, `search`,
  `ArrowBackIcon`, `SearchIcon`, the `tab`/`TabKey` machinery, category-search memo.
- Keep: `VariantCard`, `selectPiece`, `removeSlug`, conflict helpers
  (`selectedOutfitCategorySlugs`, `hasDressSelected`, `outfitConflictReason`,
  `isCategoryDisabled`), `categoryGroups` grouping, `sortByCategory`, selected sections.
- New: `activeStep` state; a flattened ordered `steps` structure describing Details +
  each category step with its group bucket, disabled flag, and reason.
