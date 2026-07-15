# Looks Builder Stepper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the tab + category-drill-in picker in the Looks Builder with a vertical MUI `Stepper` where each category is a skippable step and picking a variant auto-advances.

**Architecture:** Single-file refactor of the client component `app/looks/look-builder.tsx`. The picker panel becomes a vertical, non-linear MUI `Stepper`: a Details step (name + description) plus one step per non-empty category, grouped under Pieces / Accessories / Eureka header rows. Picking a variant keeps the one-per-category replacement rule and auto-advances to the next enabled step. Disabled (conflicting) category steps are skipped. The composer sidebar keeps the selected-items summary, image upload, and save error; name/description move into the Details step.

**Tech Stack:** Next.js 16 (client component), React 19, MUI v9 (`Stepper`, `Step`, `StepLabel`, `StepContent`, `StepButton`), TypeScript.

## Global Constraints

- Package manager: **Yarn**. Verification: `yarn tsc --noEmit` and `yarn lint` (no unit-test runner in this repo).
- Code style: no semicolons, single quotes, 2-space indent, 100-char width, trailing commas (ES5). Prettier + ESLint run automatically via PostToolUse hooks after every Edit/Write.
- Only `app/looks/look-builder.tsx` may be modified. No changes to types, server actions, or other files.
- Never commit to `main`. Work happens on branch `feat/looks-builder-stepper` (already created and checked out).
- Preserve existing behavior: one-piece-per-category-per-type replacement (`selectPiece`), dress-vs-tops/bottoms conflict rule (`isCategoryDisabled` / `outfitConflictReason`), empty-category dropping, selected-items summary sections, save logic and free-limit error handling.
- `MUI Stack` layout shorthands (`justifyContent`, `alignItems`, etc.) must live in `sx`, not as direct props (TS build error otherwise).

---

### Task 1: Convert the picker panel to a vertical Stepper

**Files:**

- Modify: `app/looks/look-builder.tsx`

**Interfaces:**

- Consumes (existing, unchanged): `selectPiece(slug: string)`, `removeSlug(slug: string)`, `categoryGroups: Map<string, { title: string; variants: FlatVariant[] }>`, `currentCategories`/`currentVariants` grouping inputs, `selectedSlugs: Set<string>`, `selectedOutfitCategorySlugs: string[]`, `hasDressSelected`, `outfitConflictReason: string`, `isCategoryDisabled`, `DRESS_SLUGS`, `VariantCard`, `selectedSection`, `sortByCategory`, `handleSave`, `name`/`setName`, `description`/`setDescription`.
- Produces: a self-contained rewritten `pickerPanel` plus a new `steps` structure and `activeStep` state. No exported-symbol changes — `LookBuilder` default export keeps the same props.

- [ ] **Step 1: Add Stepper imports, remove dead imports**

In the `@mui/material` import block, add `Stepper, Step, StepLabel, StepContent, StepButton` and remove `Tab, Tabs` (no longer used). Remove the now-unused icon imports `ArrowBackIcon` (`@mui/icons-material/ArrowBack`) and `SearchIcon` (`@mui/icons-material/Search`). Keep `CheckroomIcon`, `WatchOutlinedIcon`, `DiamondOutlinedIcon`, `CategoryIcon`, `CloseIcon`, `DoNotDisturbIcon` (still used elsewhere). `InputAdornment` is only used by the removed search box — remove it too.

- [ ] **Step 2: Remove the `CategoryRow` component and `CategoryRowProps` type**

Delete the entire `CategoryRow` function (lines ~149-238 in the original) and its `CategoryRowProps` type. It is replaced by step labels. `Tooltip`, `Avatar`, `Chip` imports: `Tooltip` and `Avatar` are only used by `CategoryRow` — remove those two imports. `Chip` stays (used for the selected-label on steps below). Verify by grep that `Avatar`/`Tooltip` have no other references before removing.

- [ ] **Step 3: Replace tab/search/drill-in state with `activeStep`**

Remove these state hooks and derived values: `const [tab, setTab] = useState<TabKey>('pieces')`, `const [search, setSearch] = useState('')`, `const [activeCategorySlug, setActiveCategorySlug] = useState<string | null>(null)`, the `TabKey` type, `currentVariants`/`currentCategories` (which depended on `tab`), `filteredCategorySlugs`, and `activeCategoryVariants`. Add:

```tsx
const [activeStep, setActiveStep] = useState(0)
```

- [ ] **Step 4: Build the grouped, ordered `categoryGroups` across all buckets**

The old `categoryGroups` was scoped to the active tab. Replace it with three grouped maps (one per bucket) so the stepper can show all categories at once. Add, in place of the old `categoryGroups`/`currentCategories`/`currentVariants` memos:

```tsx
// Group a bucket's variants by category, in canonical category order; drop
// empty categories. Mirrors the previous per-tab grouping, now per bucket.
function groupByCategory(cats: { slug: string; title: string }[], variants: FlatVariant[]) {
  const map = new Map<string, { title: string; variants: FlatVariant[] }>()
  for (const c of cats) map.set(c.slug, { title: c.title, variants: [] })
  for (const v of variants) {
    if (!v.category) continue
    const group = map.get(v.category)
    if (group) group.variants.push(v)
    else map.set(v.category, { title: v.categoryTitle, variants: [v] })
  }
  for (const [slug, group] of map) {
    if (group.variants.length === 0) map.delete(slug)
  }
  return map
}

const piecesGroups = useMemo(
  () =>
    groupByCategory(
      outfitCategories.filter((c) => c.part === PIECES_PART),
      outfitVariants.filter((v) => v.part === PIECES_PART)
    ),
  [outfitCategories, outfitVariants]
)
const accessoriesGroups = useMemo(
  () =>
    groupByCategory(
      outfitCategories.filter((c) => c.part === ACCESSORIES_PART),
      outfitVariants.filter((v) => v.part === ACCESSORIES_PART)
    ),
  [outfitCategories, outfitVariants]
)
const eurekaGroups = useMemo(
  () => groupByCategory(eurekaCategories, eurekaVariants),
  [eurekaCategories, eurekaVariants]
)
```

Note: `groupByCategory` is a plain function (not a hook) called inside `useMemo`, so it needs no dependency wiring itself. `EurekaCategory`/`OutfitCategory` both have `slug` and `title`, satisfying the param type.

- [ ] **Step 5: Flatten the groups into an ordered `steps` array**

Add a memo that produces the ordered step descriptors. Step 0 is Details; the rest are category steps carrying their bucket, disabled flag, reason, selected variant, and variant list. Bucket boundaries are derived by comparing each step's bucket to the previous step's.

```tsx
type StepBucket = 'pieces' | 'accessories' | 'eureka'
type CategoryStep = {
  kind: 'category'
  bucket: StepBucket
  slug: string
  title: string
  variants: FlatVariant[]
  selectedVariant?: FlatVariant
  disabled: boolean
  disabledReason?: string
}
type BuilderStep = { kind: 'details' } | CategoryStep

const steps = useMemo<BuilderStep[]>(() => {
  const out: BuilderStep[] = [{ kind: 'details' }]
  const buckets: { bucket: StepBucket; groups: typeof piecesGroups }[] = [
    { bucket: 'pieces', groups: piecesGroups },
    { bucket: 'accessories', groups: accessoriesGroups },
    { bucket: 'eureka', groups: eurekaGroups },
  ]
  for (const { bucket, groups } of buckets) {
    for (const [slug, group] of groups) {
      const selectedVariant = group.variants.find((v) => selectedSlugs.has(v.slug))
      // Conflict rule only applies to the outfit Pieces bucket.
      const disabled =
        bucket === 'pieces' &&
        isCategoryDisabled({ slug } as OutfitCategory, selectedOutfitCategorySlugs)
      out.push({
        kind: 'category',
        bucket,
        slug,
        title: group.title,
        variants: group.variants,
        selectedVariant,
        disabled,
        disabledReason: disabled ? outfitConflictReason : undefined,
      })
    }
  }
  return out
}, [
  piecesGroups,
  accessoriesGroups,
  eurekaGroups,
  selectedSlugs,
  selectedOutfitCategorySlugs,
  outfitConflictReason,
])
```

- [ ] **Step 6: Add the auto-advance / skip helper**

Add a helper that advances to the next enabled step (skipping disabled category steps), stopping at the last step. Place it near `selectPiece`:

```tsx
// Advance to the next non-disabled step after `from`. Stays put if none.
function advanceFrom(from: number) {
  for (let i = from + 1; i < steps.length; i++) {
    const s = steps[i]
    if (s.kind === 'category' && s.disabled) continue
    setActiveStep(i)
    return
  }
}

// Pick a variant, then move to the next available step.
function pickAndAdvance(slug: string, stepIndex: number) {
  selectPiece(slug)
  advanceFrom(stepIndex)
}
```

- [ ] **Step 7: Rewrite `pickerPanel` as the Stepper**

Replace the entire `pickerPanel` block (the `Tabs` + drill-in JSX) with a vertical, non-linear `Stepper`. The Details step holds the name/description fields; each category step shows its group header (rendered when the bucket changes) via a lightweight label, then a `VariantCard` grid and a Skip button in `StepContent`.

```tsx
// ── Picker panel (stepper) ───────────────────────────────────────────────
const pickerPanel = (
  <Stepper activeStep={activeStep} nonLinear orientation="vertical">
    {steps.map((step, index) => {
      if (step.kind === 'details') {
        return (
          <Step key="details" completed={!!name.trim()}>
            <StepButton onClick={() => setActiveStep(index)}>
              <StepLabel optional={<Typography variant="caption">Name and notes</Typography>}>
                Details
              </StepLabel>
            </StepButton>
            <StepContent>
              <Stack spacing={2} sx={{ pt: 1 }}>
                <TextField
                  fullWidth
                  required
                  label="Look name"
                  placeholder="e.g. Moonlit Wanderer"
                  size="small"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <TextField
                  fullWidth
                  multiline
                  label="Description"
                  maxRows={3}
                  minRows={2}
                  placeholder="Optional notes about this look…"
                  size="small"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <Box>
                  <Button size="small" variant="contained" onClick={() => advanceFrom(index)}>
                    Continue
                  </Button>
                </Box>
              </Stack>
            </StepContent>
          </Step>
        )
      }

      // Category step. Show the bucket header when the bucket changes.
      const prev = steps[index - 1]
      const showHeader = prev.kind !== 'category' || prev.bucket !== step.bucket
      const bucketLabel =
        step.bucket === 'pieces'
          ? 'Pieces'
          : step.bucket === 'accessories'
            ? 'Accessories'
            : 'Eureka'

      return (
        <Step
          key={`${step.bucket}:${step.slug}`}
          completed={!!step.selectedVariant}
          disabled={step.disabled}
        >
          {showHeader && (
            <Typography
              color="textSecondary"
              sx={{ pt: 1, pb: 0.5, textTransform: 'uppercase', letterSpacing: 0.5 }}
              variant="caption"
            >
              {bucketLabel}
            </Typography>
          )}
          <StepButton disabled={step.disabled} onClick={() => setActiveStep(index)}>
            <StepLabel
              icon={<ToggleIcon category={step.slug} size="sm" />}
              optional={
                step.disabled ? (
                  <Typography color="textDisabled" variant="caption">
                    {step.disabledReason}
                  </Typography>
                ) : step.selectedVariant ? (
                  <Chip
                    color="success"
                    label={step.selectedVariant.setTitle}
                    size="small"
                    sx={{ maxWidth: 160 }}
                    variant="outlined"
                  />
                ) : (
                  <Typography color="textSecondary" variant="caption">
                    {step.variants.length} piece{step.variants.length !== 1 ? 's' : ''}
                  </Typography>
                )
              }
            >
              {step.title}
            </StepLabel>
          </StepButton>
          <StepContent>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                gap: 1,
                pt: 1,
              }}
            >
              {step.variants.map((v) => (
                <VariantCard
                  key={v.slug}
                  selected={selectedSlugs.has(v.slug)}
                  variant={v}
                  onToggle={(slug) => pickAndAdvance(slug, index)}
                />
              ))}
            </Box>
            <Box sx={{ pt: 1.5 }}>
              <Button size="small" onClick={() => advanceFrom(index)}>
                Skip
              </Button>
            </Box>
          </StepContent>
        </Step>
      )
    })}
  </Stepper>
)
```

Note: `StepLabel`'s `icon` prop overrides the default numbered circle with the category `ToggleIcon`, matching the old `CategoryRow`. The `StepButton` makes labels clickable (non-linear jump). Disabled steps pass `disabled` on both `Step` and `StepButton` so they render greyed and are not clickable, while auto-advance already skips them.

- [ ] **Step 8: Remove name/description from the composer sidebar**

In `composerPanel`, delete the first `CardContent` block's two `TextField`s (Look name + Description). Keep the `ImageUpload` (edit-only) and the `!initialLook` info `Alert`. So the remaining `CardContent` `Stack` contains only the image upload / alert. If removing the fields leaves an empty `Stack spacing={2}`, keep the `Stack` wrapping the image/alert so spacing is preserved. The selected-items accordion, empty-state caption, and `saveError` `Alert` below stay unchanged.

- [ ] **Step 9: Verify types and lint pass**

Run: `yarn tsc --noEmit`
Expected: no errors. (Watch for: unused-import errors from Step 1/2 removals, and any remaining reference to `tab`, `search`, `activeCategorySlug`, `CategoryRow`, `currentVariants`, `currentCategories`, `filteredCategorySlugs`, `activeCategoryVariants`, `TabKey`.)

Run: `yarn lint`
Expected: no errors/warnings on `app/looks/look-builder.tsx`.

If either fails, fix the reported issue and re-run before continuing.

- [ ] **Step 10: Drive the UI to verify behavior**

Run: `yarn dev` and open `http://localhost:3000/looks/new` (log in if required).

Verify:

1. The Details step is active first; typing a name marks it completed and enables the toolbar Save button.
2. Clicking "Continue" moves to the first Pieces category step.
3. Bucket headers (PIECES / ACCESSORIES / EUREKA) appear above the first step of each bucket.
4. Picking a variant selects it (badge on card, green chip on the step label) and auto-advances to the next step.
5. Picking a Dress disables the Top/Bottom steps (greyed, reason shown) and auto-advance skips them; removing the dress (via sidebar chip delete) re-enables them.
6. "Skip" advances without selecting.
7. Clicking an enabled step label jumps to it (non-linear).
8. The sidebar shows the selected-items summary (Pieces/Accessories/Eureka) and no longer shows name/description fields.
9. Save creates the look and redirects to `/looks`.
10. Open an existing look at `/looks/edit/[slug]` — it opens on the Details step with name/description prefilled and previously-selected categories marked completed.

- [ ] **Step 11: Commit**

```bash
git add app/looks/look-builder.tsx
git commit -m "$(cat <<'EOF'
feat(looks): stepper-based look builder

Replace the tab + category drill-in picker with a vertical MUI Stepper.
Each category is a skippable step; picking a variant auto-advances to the
next enabled step. Name/description move into a Details step. Conflict
(dress vs tops/bottoms) disabled steps are auto-skipped.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Self-Review

**Spec coverage:**

- Vertical stepper, category-per-step, grouped by bucket → Steps 4-7. ✓
- Details as first step (name/desc moved out of sidebar) → Steps 7, 8. ✓
- Auto-advance on pick + Skip → Step 6, 7. ✓
- Conflict rule preserved + disabled steps auto-skipped → Steps 5, 6, 7. ✓
- Search removed → Steps 1, 3. ✓
- Sidebar keeps selected-items summary + image + error → Step 8. ✓
- activeStep default 0 for new and edit → Step 3 (`useState(0)`). ✓
- Save logic unchanged → not touched (verified in Step 10.9). ✓

**Placeholder scan:** No TBD/TODO/"handle edge cases"; all code shown inline. ✓

**Type consistency:** `groupByCategory` param `{ slug; title }[]` is satisfied by both `EurekaCategory` and `OutfitCategory`. `CategoryStep`/`BuilderStep`/`StepBucket` used consistently across Steps 5-7. `pickAndAdvance(slug, index)` / `advanceFrom(from)` signatures match their call sites. `piecesGroups` type reused via `typeof piecesGroups` in Step 5. ✓
