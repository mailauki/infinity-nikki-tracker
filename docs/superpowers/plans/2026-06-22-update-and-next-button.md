# "Update & next item" Button Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an "Update & next item" button to all 7 admin edit forms that saves the current item and navigates to the next item alphabetically by title.

**Architecture:** A new `showUpdateNext` flag in the shared form-config context gates a new button in the shared `FormToolBar`. The button submits with `name="update_next"`. Each edit server action, on seeing that flag, queries the table for the next row (ordered by title, slug tie-break) and `redirect()`s to its edit URL — or to the list page if there is none. The redirect re-mounts the edit form with fresh data, so no client reset logic is needed.

**Tech Stack:** Next.js 16 App Router (Server Actions), React 19 (`useActionState`), MUI v9, Supabase JS client.

## Global Constraints

- Package manager: **Yarn** (never npm/pnpm).
- Code style: no semicolons, single quotes, 2-space indent, 100 char width (Prettier auto-runs via PostToolUse hook).
- Path alias `@/` = project root.
- Button label, verbatim: **`Update & next item`** (and `Saving...` while pending, matching sibling buttons).
- Submit flag name, verbatim: **`update_next`**, value `"true"`.
- No test framework exists in this repo. The verification gate for every task is: `yarn dlx tsc --noEmit` passes and `yarn lint` passes. There are NO unit tests to write.
- `redirect()` from `next/navigation` throws — it must stay outside any try/catch and run after all DB work in the action.
- The new next-item query block goes **after** the existing `if (formData.get('update_only') === 'true') return { ... }` line and **before** the final `redirect(backUrl)` in each edit action.
- Order rule: next item = first row whose `(orderCol, slug)` sorts strictly after the just-saved item, ordered ascending, limit 1. `orderCol` is `title` for every entity **except eureka variants**, which use `slug` (no title column). Tie-break query: `.gt(orderCol, savedValue).order(orderCol, { ascending: true }).order('slug', { ascending: true }).limit(1).maybeSingle()`.

---

### Task 1: Add `showUpdateNext` to form config + toolbar button

This is the shared plumbing every edit form depends on. Adding the flag without wiring any form means the button never renders yet (default `false`), so this task is safe to land alone.

**Files:**

- Modify: `app/admin/form-context.tsx`
- Modify: `app/admin/form-toolbar.tsx`

**Interfaces:**

- Produces: `FormConfig.showUpdateNext?: boolean` (consumed by every edit form in later tasks via `setFormConfig`). A button in `FormToolBar` that submits `update_next=true` when `showUpdateNext` is truthy.

- [ ] **Step 1: Add `showUpdateNext` to the `FormConfig` interface**

In `app/admin/form-context.tsx`, add the field to the `FormConfig` interface (after `showUpdateOnly`):

```tsx
interface FormConfig {
  formId: string
  backUrl: string
  pending: boolean
  showAddAnother?: boolean
  showUpdateOnly?: boolean
  showUpdateNext?: boolean
  savedTitle?: string
}
```

- [ ] **Step 2: Add `showUpdateNext` to the context default and provider initial state**

In the same file, add `showUpdateNext: false,` to BOTH the `createContext` default object and the `useState<FormConfig>` initial object (each currently lists `showAddAnother: false, showUpdateOnly: false,`):

```tsx
const FormContext = createContext<FormContextValue>({
  formId: '',
  backUrl: '',
  pending: false,
  showAddAnother: false,
  showUpdateOnly: false,
  showUpdateNext: false,
  savedTitle: undefined,
  setFormConfig: () => {},
})
```

```tsx
const [config, setConfig] = useState<FormConfig>({
  formId: '',
  backUrl: '',
  pending: false,
  showAddAnother: false,
  showUpdateOnly: false,
  showUpdateNext: false,
  savedTitle: undefined,
})
```

- [ ] **Step 3: Destructure `showUpdateNext` in the toolbar**

In `app/admin/form-toolbar.tsx`, add `showUpdateNext` to the destructure from `useFormConfig()`:

```tsx
const {
  formId,
  backUrl,
  pending,
  showAddAnother,
  showUpdateOnly,
  showUpdateNext,
  savedTitle,
  setFormConfig,
} = useFormConfig()
```

- [ ] **Step 4: Render the "Update & next item" button**

In `app/admin/form-toolbar.tsx`, add this block immediately after the existing `{showUpdateOnly && (...)}` button block and before the primary `Save` button:

```tsx
{
  showUpdateNext && (
    <Button
      disabled={pending}
      form={formId}
      name="update_next"
      type="submit"
      value="true"
      variant="outlined"
    >
      {pending ? 'Saving...' : 'Update & next item'}
    </Button>
  )
}
```

- [ ] **Step 5: Verify type-check and lint pass**

Run: `yarn dlx tsc --noEmit && yarn lint`
Expected: no errors. The button does not render anywhere yet because no form sets `showUpdateNext: true`.

- [ ] **Step 6: Commit**

```bash
git add app/admin/form-context.tsx app/admin/form-toolbar.tsx
git commit -m "feat(admin): add showUpdateNext flag and 'Update & next item' toolbar button

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Wire trials edit (next-by-title)

Trials is the simplest entity (single-table update, `title` column). It establishes the exact action + form pattern reused in Tasks 3–8.

**Files:**

- Modify: `app/admin/eureka/trials/actions.ts` (the `editTrial` function)
- Modify: `app/admin/eureka/trials/edit/[slug]/edit-trial-form.tsx`

**Interfaces:**

- Consumes: `FormConfig.showUpdateNext` from Task 1; `navLinksData.admin.eureka.trials.edit` (`'/admin/eureka/trials/edit'`).
- Produces: the reference pattern (next-item query block + `showUpdateNext: true` form config) for all later edit tasks.

- [ ] **Step 1: Import `navLinksData` if not already imported**

`app/admin/eureka/trials/actions.ts` already imports `navLinksData` (used in `addTrial`). No change needed — confirm the import line exists:

```tsx
import { navLinksData } from '@/lib/nav-links'
```

- [ ] **Step 2: Add the next-item redirect block to `editTrial`**

In `app/admin/eureka/trials/actions.ts`, replace the tail of `editTrial` (currently `if (formData.get('update_only') === 'true') return { savedTitle: title }` followed by `redirect(backUrl)`) with:

```tsx
if (formData.get('update_only') === 'true') return { savedTitle: title }

if (formData.get('update_next') === 'true') {
  const { data: next } = await supabase
    .from('trials')
    .select('slug')
    .gt('title', title)
    .order('title', { ascending: true })
    .order('slug', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (next?.slug) redirect(`${navLinksData.admin.eureka.trials.edit}/${next.slug}`)
  redirect(navLinksData.admin.eureka.trials.list)
}

redirect(backUrl)
```

- [ ] **Step 3: Set `showUpdateNext: true` in the trials edit form**

In `app/admin/eureka/trials/edit/[slug]/edit-trial-form.tsx`, update the mount `useEffect`'s `setFormConfig` call to include `showUpdateNext: true`:

```tsx
useEffect(() => {
  setFormConfig({
    formId: FORM_ID,
    backUrl: back,
    pending,
    showUpdateOnly: true,
    showUpdateNext: true,
  })
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [pending, back])
```

- [ ] **Step 4: Verify type-check and lint pass**

Run: `yarn dlx tsc --noEmit && yarn lint`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add app/admin/eureka/trials/actions.ts 'app/admin/eureka/trials/edit/[slug]/edit-trial-form.tsx'
git commit -m "feat(admin): 'Update & next item' on trials edit

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Wire abilities edit (next-by-title)

**Files:**

- Modify: `app/admin/outfits/abilities/edit/[slug]/actions.ts` (the `editAbility` function)
- Modify: `app/admin/outfits/abilities/edit/[slug]/edit-ability-form.tsx`

**Interfaces:**

- Consumes: `FormConfig.showUpdateNext` (Task 1); `navLinksData.admin.outfits.abilities.edit` (`'/admin/outfits/abilities/edit'`).

- [ ] **Step 1: Add the `navLinksData` import to the abilities edit action**

`app/admin/outfits/abilities/edit/[slug]/actions.ts` does NOT currently import `navLinksData`. Add it to the imports:

```tsx
import { navLinksData } from '@/lib/nav-links'
```

- [ ] **Step 2: Add the next-item redirect block to `editAbility`**

In the same file, replace the tail of `editAbility` (`if (formData.get('update_only') === 'true') return { savedTitle: title }` then `redirect(backUrl)`) with:

```tsx
if (formData.get('update_only') === 'true') return { savedTitle: title }

if (formData.get('update_next') === 'true') {
  const { data: next } = await supabase
    .from('abilities')
    .select('slug')
    .gt('title', title)
    .order('title', { ascending: true })
    .order('slug', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (next?.slug) redirect(`${navLinksData.admin.outfits.abilities.edit}/${next.slug}`)
  redirect(navLinksData.admin.outfits.abilities.list)
}

redirect(backUrl)
```

- [ ] **Step 3: Set `showUpdateNext: true` in the abilities edit form**

In `app/admin/outfits/abilities/edit/[slug]/edit-ability-form.tsx`, update the mount `useEffect`'s `setFormConfig` call to add `showUpdateNext: true` (alongside the existing `showUpdateOnly: true`):

```tsx
useEffect(() => {
  setFormConfig({
    formId: FORM_ID,
    backUrl: back ?? navLinksData.admin.outfits.abilities.list,
    pending,
    showUpdateOnly: true,
    showUpdateNext: true,
  })
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [pending, back])
```

- [ ] **Step 4: Verify type-check and lint pass**

Run: `yarn dlx tsc --noEmit && yarn lint`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add 'app/admin/outfits/abilities/edit/[slug]/actions.ts' 'app/admin/outfits/abilities/edit/[slug]/edit-ability-form.tsx'
git commit -m "feat(admin): 'Update & next item' on abilities edit

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Wire seasons edit (next-by-title)

**Files:**

- Modify: `app/admin/outfits/seasons/edit/[slug]/actions.ts` (the `editSeason` function)
- Modify: `app/admin/outfits/seasons/edit/[slug]/edit-season-form.tsx`

**Interfaces:**

- Consumes: `FormConfig.showUpdateNext` (Task 1); `navLinksData.admin.outfits.seasons.edit` (`'/admin/outfits/seasons/edit'`).

- [ ] **Step 1: Add the `navLinksData` import to the seasons edit action**

`app/admin/outfits/seasons/edit/[slug]/actions.ts` does NOT currently import `navLinksData`. Add it:

```tsx
import { navLinksData } from '@/lib/nav-links'
```

- [ ] **Step 2: Add the next-item redirect block to `editSeason`**

In the same file, replace the tail of `editSeason` (`if (formData.get('update_only') === 'true') return { savedTitle: title }` then `redirect(backUrl)`) with:

```tsx
if (formData.get('update_only') === 'true') return { savedTitle: title }

if (formData.get('update_next') === 'true') {
  const { data: next } = await supabase
    .from('seasons')
    .select('slug')
    .gt('title', title)
    .order('title', { ascending: true })
    .order('slug', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (next?.slug) redirect(`${navLinksData.admin.outfits.seasons.edit}/${next.slug}`)
  redirect(navLinksData.admin.outfits.seasons.list)
}

redirect(backUrl)
```

- [ ] **Step 3: Set `showUpdateNext: true` in the seasons edit form**

In `app/admin/outfits/seasons/edit/[slug]/edit-season-form.tsx`, update the mount `useEffect`'s `setFormConfig` call to add `showUpdateNext: true`:

```tsx
useEffect(() => {
  setFormConfig({
    formId: FORM_ID,
    backUrl: back ?? navLinksData.admin.outfits.seasons.list,
    pending,
    showUpdateOnly: true,
    showUpdateNext: true,
  })
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [pending, back])
```

- [ ] **Step 4: Verify type-check and lint pass**

Run: `yarn dlx tsc --noEmit && yarn lint`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add 'app/admin/outfits/seasons/edit/[slug]/actions.ts' 'app/admin/outfits/seasons/edit/[slug]/edit-season-form.tsx'
git commit -m "feat(admin): 'Update & next item' on seasons edit

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: Wire eureka variants edit (next-by-slug)

Variants have no `title` column, so they order by `slug` (their identity). The just-saved value is `slug` (already computed in the action).

**Files:**

- Modify: `app/admin/eureka/variants/actions.ts` (the `editEurekaVariant` function)
- Modify: `app/admin/eureka/variants/edit/[slug]/edit-eureka-variant-form.tsx`

**Interfaces:**

- Consumes: `FormConfig.showUpdateNext` (Task 1); `navLinksData.admin.eureka.variants.edit` (`'/admin/eureka/variants/edit'`).

- [ ] **Step 1: Confirm `navLinksData` import**

`app/admin/eureka/variants/actions.ts` already imports `navLinksData` (used in `addEurekaVariant`). No change needed.

- [ ] **Step 2: Add the next-item redirect block to `editEurekaVariant`**

In `app/admin/eureka/variants/actions.ts`, replace the tail of `editEurekaVariant` (`if (formData.get('update_only') === 'true') return { savedTitle: slug }` then `redirect(backUrl)`) with:

```tsx
if (formData.get('update_only') === 'true') return { savedTitle: slug }

if (formData.get('update_next') === 'true') {
  const { data: next } = await supabase
    .from('eureka_variants')
    .select('slug')
    .gt('slug', slug)
    .order('slug', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (next?.slug) redirect(`${navLinksData.admin.eureka.variants.edit}/${next.slug}`)
  redirect(navLinksData.admin.eureka.variants.list)
}

redirect(backUrl)
```

- [ ] **Step 3: Set `showUpdateNext: true` in the variant edit form**

In `app/admin/eureka/variants/edit/[slug]/edit-eureka-variant-form.tsx`, find the mount `useEffect` that calls `setFormConfig({ ... showUpdateOnly: true })` and add `showUpdateNext: true,` to that object. (Match the existing call's exact shape — it includes `formId`, `backUrl`, `pending`, `showUpdateOnly: true`.)

- [ ] **Step 4: Verify type-check and lint pass**

Run: `yarn dlx tsc --noEmit && yarn lint`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add app/admin/eureka/variants/actions.ts 'app/admin/eureka/variants/edit/[slug]/edit-eureka-variant-form.tsx'
git commit -m "feat(admin): 'Update & next item' on eureka variants edit (by slug)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: Wire eureka sets edit (next-by-title)

**Files:**

- Modify: `app/admin/eureka/sets/actions.ts` (the `editEurekaSet` function)
- Modify: `app/admin/eureka/sets/edit/[slug]/edit-eureka-set-form.tsx`

**Interfaces:**

- Consumes: `FormConfig.showUpdateNext` (Task 1); `navLinksData.admin.eureka.sets.edit` (`'/admin/eureka/sets/edit'`).

- [ ] **Step 1: Confirm `navLinksData` import**

`app/admin/eureka/sets/actions.ts` already imports `navLinksData`. No change needed.

- [ ] **Step 2: Add the next-item redirect block to `editEurekaSet`**

In `app/admin/eureka/sets/actions.ts`, replace the tail of `editEurekaSet` (`if (formData.get('update_only') === 'true') return { savedTitle: title }` then `redirect(backUrl)`) with:

```tsx
if (formData.get('update_only') === 'true') return { savedTitle: title }

if (formData.get('update_next') === 'true') {
  const { data: next } = await supabase
    .from('eureka_sets')
    .select('slug')
    .gt('title', title)
    .order('title', { ascending: true })
    .order('slug', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (next?.slug) redirect(`${navLinksData.admin.eureka.sets.edit}/${next.slug}`)
  redirect(navLinksData.admin.eureka.sets.list)
}

redirect(backUrl)
```

- [ ] **Step 3: Set `showUpdateNext: true` in the eureka set edit form**

In `app/admin/eureka/sets/edit/[slug]/edit-eureka-set-form.tsx`, find the mount `useEffect` that calls `setFormConfig({ ... showUpdateOnly: true })` and add `showUpdateNext: true,` to that object.

- [ ] **Step 4: Verify type-check and lint pass**

Run: `yarn dlx tsc --noEmit && yarn lint`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add app/admin/eureka/sets/actions.ts 'app/admin/eureka/sets/edit/[slug]/edit-eureka-set-form.tsx'
git commit -m "feat(admin): 'Update & next item' on eureka sets edit

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 7: Wire outfit sets edit (next-by-title)

`editOutfitSet` has an `update_only` early-return that returns `{ savedTitle: title, variants }`. Insert the next-item block after that return and before the final `redirect(backUrl)`.

**Files:**

- Modify: `app/admin/outfits/sets/actions.ts` (the `editOutfitSet` function)
- Modify: `app/admin/outfits/sets/edit/[slug]/edit-outfit-set-form.tsx`

**Interfaces:**

- Consumes: `FormConfig.showUpdateNext` (Task 1); `navLinksData.admin.outfits.sets.edit` (`'/admin/outfits/sets/edit'`).

- [ ] **Step 1: Confirm `navLinksData` import**

`app/admin/outfits/sets/actions.ts` already imports `navLinksData`. No change needed.

- [ ] **Step 2: Add the next-item redirect block to `editOutfitSet`**

In `app/admin/outfits/sets/actions.ts`, the tail of `editOutfitSet` currently reads:

```tsx
if (formData.get('update_only') === 'true') {
  const { data: variants } = await supabase
    .from('outfit_variants')
    .select(
      'id, slug, outfit_set, outfit_category, evolution, image_url, alt_image_url, title, description, default, updated_at'
    )
    .eq('outfit_set', slug)
    .eq('evolution', baseEvoSlug)
    .order('id', { ascending: true })

  return { savedTitle: title, variants: variants ?? [] }
}
redirect(backUrl)
```

Insert the next-item block between the closing `}` of the `update_only` branch and `redirect(backUrl)`:

```tsx
if (formData.get('update_next') === 'true') {
  const { data: next } = await supabase
    .from('outfit_sets')
    .select('slug')
    .gt('title', title)
    .order('title', { ascending: true })
    .order('slug', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (next?.slug) redirect(`${navLinksData.admin.outfits.sets.edit}/${next.slug}`)
  redirect(navLinksData.admin.outfits.sets.list)
}

redirect(backUrl)
```

- [ ] **Step 3: Set `showUpdateNext: true` in the outfit set edit form**

In `app/admin/outfits/sets/edit/[slug]/edit-outfit-set-form.tsx`, find the mount `useEffect` that calls `setFormConfig({ ... showUpdateOnly: true })` and add `showUpdateNext: true,` to that object.

- [ ] **Step 4: Verify type-check and lint pass**

Run: `yarn dlx tsc --noEmit && yarn lint`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add app/admin/outfits/sets/actions.ts 'app/admin/outfits/sets/edit/[slug]/edit-outfit-set-form.tsx'
git commit -m "feat(admin): 'Update & next item' on outfit sets edit

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 8: Wire evolutions edit (next-by-title)

`editEvolution` returns `{ savedTitle: subtitle, slug: newSlug, variants }` on `update_only`, but the next-item ordering uses the evolutions table's own `title` column (the set title, non-null on every row), not the subtitle. The block goes after the `update_only` branch and before `redirect(backUrl)`. Use `title` from the joined row: re-read it from the saved evolution since the action computes `subtitle`/`newSlug` but not `title` as a local — fetch the saved row's `title`.

**Files:**

- Modify: `app/admin/outfits/evolutions/edit/[slug]/actions.ts` (the `editEvolution` function)
- Modify: `app/admin/outfits/evolutions/edit/[slug]/edit-evolution-form.tsx`

**Interfaces:**

- Consumes: `FormConfig.showUpdateNext` (Task 1); `navLinksData.admin.outfits.evolutions.edit` (`'/admin/outfits/evolutions/edit'`).

- [ ] **Step 1: Add the `navLinksData` import to the evolutions edit action**

`app/admin/outfits/evolutions/edit/[slug]/actions.ts` does NOT currently import `navLinksData`. Add it:

```tsx
import { navLinksData } from '@/lib/nav-links'
```

- [ ] **Step 2: Add the next-item redirect block to `editEvolution`**

In `app/admin/outfits/evolutions/edit/[slug]/actions.ts`, the tail of `editEvolution` currently reads:

```tsx
if (formData.get('update_only') === 'true') {
  const { data: variants } = await supabase
    .from('outfit_variants')
    .select(
      'id, slug, outfit_category, image_url, alt_image_url, title, description, default, updated_at'
    )
    .eq('evolution', newSlug)
    .order('id', { ascending: true })

  return { savedTitle: subtitle, slug: newSlug, variants: variants ?? [] }
}
redirect(backUrl)
```

Insert the next-item block between the closing `}` of the `update_only` branch and `redirect(backUrl)`. The evolution's `title` is unchanged by this save (only `subtitle`/`slug`/`description` change), so read it from the just-saved row by its new slug:

```tsx
if (formData.get('update_next') === 'true') {
  const { data: saved } = await supabase
    .from('evolutions')
    .select('title')
    .eq('slug', newSlug)
    .maybeSingle()

  const { data: next } = await supabase
    .from('evolutions')
    .select('slug')
    .gt('title', saved?.title ?? '')
    .order('title', { ascending: true })
    .order('slug', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (next?.slug) redirect(`${navLinksData.admin.outfits.evolutions.edit}/${next.slug}`)
  redirect(navLinksData.admin.outfits.evolutions.list)
}

redirect(backUrl)
```

- [ ] **Step 3: Set `showUpdateNext: true` in the evolution edit form**

In `app/admin/outfits/evolutions/edit/[slug]/edit-evolution-form.tsx`, update the mount `useEffect`'s `setFormConfig` call to add `showUpdateNext: true`:

```tsx
useEffect(() => {
  setFormConfig({
    formId: FORM_ID,
    backUrl: back ?? navLinksData.admin.outfits.evolutions.list,
    pending,
    showUpdateOnly: true,
    showUpdateNext: true,
  })
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [pending, back])
```

- [ ] **Step 4: Verify type-check and lint pass**

Run: `yarn dlx tsc --noEmit && yarn lint`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add 'app/admin/outfits/evolutions/edit/[slug]/actions.ts' 'app/admin/outfits/evolutions/edit/[slug]/edit-evolution-form.tsx'
git commit -m "feat(admin): 'Update & next item' on evolutions edit

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 9: Manual verification pass

No automated tests exist; verify the feature in the running app.

**Files:** none (verification only).

- [ ] **Step 1: Start the dev server**

Run: `yarn dev`
Expected: server on `localhost:3000`.

- [ ] **Step 2: Verify each edit form (as an admin user)**

For at least trials, an eureka set, an eureka variant, and an outfit set:

1. Open an edit form that is NOT the alphabetically last item.
2. Click "Update & next item".
   Expected: a success snackbar is NOT required here (redirect navigates away), and the URL changes to the next item's edit page (next alphabetically by title; by slug for variants), with that item's data loaded.
3. Open the alphabetically last item's edit form and click "Update & next item".
   Expected: redirect to that entity's list page.
4. Confirm "Update" still stays on the page with a success snackbar, and "Save" still redirects to the list.

- [ ] **Step 3: Confirm no regressions on add forms**

Open an add form (e.g. new trial) and confirm "Save & add another" and "Save" still behave as before (the toolbar changes are additive and gated by `showUpdateNext`, which add forms never set).

- [ ] **Step 4: Stop the dev server.**

---

## Self-Review

**Spec coverage:**

- Button on all 7 edit forms → Tasks 2–8 (one per entity), button itself in Task 1. ✓
- Label "Update & next item" → Task 1, Step 4. ✓
- Next alphabetically by title, slug for variants → per-task queries; variants use `slug` (Task 5). ✓
- Last item → redirect to list → every task's `redirect(<list>)` fallback. ✓
- Tie-break by slug for stability → every title-ordered query adds `.order('slug', ...)`. ✓
- Slug/title changed during save → queries use post-save values (`title`/`slug` locals, or re-read `saved.title` for evolutions). ✓
- Existing "Update"/"Save" unchanged → blocks inserted after `update_only`, before `redirect(backUrl)`; toolbar additions gated. ✓

**Placeholder scan:** No TBD/TODO. Steps that change code include the code. Task 5/6/7 Step 3 reference "find the existing `setFormConfig` call and add the field" rather than quoting the whole form — acceptable because the exact field to add (`showUpdateNext: true,`) and its sibling (`showUpdateOnly: true`) are specified verbatim; the surrounding object differs per form and is left as-found.

**Type consistency:** Flag name `update_next` and config key `showUpdateNext` are used identically across Task 1 and Tasks 2–8. `navLinksData.admin.<domain>.<entity>.edit`/`.list` keys all confirmed present in `lib/nav-links.tsx`. `maybeSingle()` returns `{ data: { slug } | null }`, so `next?.slug` is the correct guard everywhere.
