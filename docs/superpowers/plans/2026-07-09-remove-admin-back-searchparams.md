# Remove Admin `?back=` SearchParams Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Delete the `?back=` query param and the `backUrl` value it feeds, so every admin form's Cancel button and post-save redirect goes to `/admin`.

**Architecture:** `backUrl` currently travels from a query string into both a React context (for Cancel's `href`) and a bound server-action argument (for `redirect()`). It becomes a single exported constant, `ADMIN_DASHBOARD`, read directly by its two consumers. Nothing is passed.

**Tech Stack:** Next.js 16 App Router, React Server Components, Server Actions, TypeScript, MUI v9.

**Spec:** `docs/superpowers/specs/2026-07-09-remove-admin-back-searchparams-design.md`

## Global Constraints

- **This repo has no test framework.** No `vitest`/`jest`/`playwright`, no `*.test.*` files, no `test` script. Do not write tests. The verification gate for every task is `yarn tsc --noEmit` plus the greps specified in that task.
- **Package manager is Yarn.** Never `npm` or `pnpm`.
- **Prettier:** no semicolons, single quotes, 2-space indent, 100 char width. A PostToolUse hook runs `yarn format && yarn lint:fix` then `yarn tsc --noEmit` after every Edit/Write — expect files to be reformatted under you.
- **Never commit to `main`.** Work is already on branch `claude/remove-admin-back-searchparams`.
- **`git add` paths containing `[slug]` must be single-quoted** — zsh glob-expands the brackets otherwise. Every `git add` below is already quoted; keep it that way.
- **Unused imports fail `yarn lint`.** Twelve of the touched files use `navLinksData` exactly once (import + one reference). When you delete that reference, delete the import on the same edit.
- `redirect()` throws to signal — never wrap it in `try`/`catch`.

## The one trap in this plan

`redirect(navLinksData.admin.*.list)` appears **17 times** across the action files, in two functionally different roles that are textually identical:

| Role                                    | Count | Location                                                         | Fate                       |
| --------------------------------------- | ----- | ---------------------------------------------------------------- | -------------------------- |
| Create-save (end of an `addX` function) | 8     | column 3, top-level                                              | **→ `ADMIN_DASHBOARD`**    |
| `update_next` exhaustion fallback       | 9     | column 5, inside `if (formData.get('update_next') === 'true') {` | **must survive unchanged** |

Distinguish by **indentation and enclosing block**, never by the callee. Task 8 enumerates the 8 by file:line. Task 9 asserts exactly 9 survive.

## File Structure

| File                                                                     | Responsibility after change                                                    |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| `app/admin/form-context.tsx`                                             | Owns `ADMIN_DASHBOARD`; `FormConfig` no longer carries `backUrl`               |
| `app/admin/form-toolbar.tsx`                                             | Cancel hrefs the constant directly                                             |
| `app/admin/entity-form.tsx`                                              | No `backUrl` prop                                                              |
| `app/admin/admin-toolbar.tsx`                                            | No `backUrl` in its reset payload                                              |
| `app/admin/list-row.tsx`, `hooks/data/admin/recents.ts`, 4 `*-table.tsx` | Emit bare edit hrefs                                                           |
| 9 `edit/[slug]/page.tsx` + 3 `*-form.tsx`                                | No `back` local, no `searchParams`, no `backUrl` prop                          |
| 9 action files                                                           | Edit actions lose the `backUrl` param; create actions redirect to the constant |

---

### Task 1: Introduce `ADMIN_DASHBOARD` and drop `backUrl` from the form context

Establishes the constant every later task imports. Removing the field from `FormConfig` immediately breaks `form-toolbar.tsx`, `entity-form.tsx`, and `admin-toolbar.tsx`, so this task fixes all four files together — they are one unit and a reviewer could not accept the type change without them.

**Files:**

- Modify: `app/admin/form-context.tsx`
- Modify: `app/admin/form-toolbar.tsx`
- Modify: `app/admin/entity-form.tsx:94,107,154,156`
- Modify: `app/admin/admin-toolbar.tsx:22`

**Interfaces:**

- Consumes: nothing
- Produces: `export const ADMIN_DASHBOARD = '/admin'` from `@/app/admin/form-context`. Every later task imports this. `FormConfig` no longer has a `backUrl: string` field; `EntityForm` no longer accepts a `backUrl` prop.

- [ ] **Step 1: Export the constant and remove `backUrl` from `FormConfig`**

In `app/admin/form-context.tsx`, add the export directly below the `'use client'` / import block:

```tsx
export const ADMIN_DASHBOARD = '/admin'
```

Then delete the `backUrl: string` line from `interface FormConfig`, and the `backUrl: ''` line from **both** default objects — the `createContext` default and the `useState` initializer inside `FormProvider`.

- [ ] **Step 2: Point Cancel at the constant**

In `app/admin/form-toolbar.tsx`, remove `backUrl,` from the `useFormConfig()` destructure, import the constant, and change the Cancel button:

```tsx
import { ADMIN_DASHBOARD, useFormConfig } from './form-context'
```

```tsx
<Button component="a" href={ADMIN_DASHBOARD} variant="outlined">
  Cancel
</Button>
```

- [ ] **Step 3: Remove the `backUrl` prop from `EntityForm`**

In `app/admin/entity-form.tsx`, delete `backUrl,` from the destructured params (line 94) and `backUrl: string` from the prop type (line 107). Then update the config push (lines 153-156):

```tsx
// Push config into the shared FormContext that FormToolbar reads.
useEffect(() => {
  setFormConfig({ formId, pending, showAddAnother, showUpdateOnly, showUpdateNext })
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [pending])
```

The dep array drops `backUrl` and keeps `[pending]`. The existing eslint-disable stays.

- [ ] **Step 4: Remove `backUrl` from the toolbar reset**

In `app/admin/admin-toolbar.tsx`, delete the `backUrl: '',` line from the `setFormConfig({ ... })` reset payload (line 22). Leave the other five fields.

- [ ] **Step 5: Typecheck**

Run: `yarn tsc --noEmit`

Expected: FAILS, with roughly 20 errors of the form `Object literal may only specify known properties, and 'backUrl' does not exist in type ...` and `Property 'backUrl' is missing`. These point at exactly the call sites Tasks 2-8 fix. **This failure is the expected state at the end of this task** — the codebase does not typecheck again until Task 8 lands. Read the error list and confirm every path in it appears somewhere in Tasks 2-8. If a path appears that no later task covers, stop and report it.

- [ ] **Step 6: Commit**

```bash
git add app/admin/form-context.tsx app/admin/form-toolbar.tsx app/admin/entity-form.tsx app/admin/admin-toolbar.tsx
git commit -m "refactor(admin): add ADMIN_DASHBOARD, drop backUrl from form context"
```

---

### Task 2: Stop producing `?back=` in edit links

Six call sites build the query string. None of them are typechecked against `EntityForm`, so this task is independent of Task 1 and leaves the tree no more broken than it found it.

**Files:**

- Modify: `app/admin/list-row.tsx:28-29`
- Modify: `hooks/data/admin/recents.ts:15`
- Modify: `app/admin/outfits/abilities/outfit-ability-table.tsx:21`
- Modify: `app/admin/outfits/season-categories/outfit-season-category-table.tsx:21`
- Modify: `app/admin/outfits/seasons/outfit-season-table.tsx:21`
- Modify: `app/admin/outfits/evolutions/outfit-evolution-table.tsx:28`

**Interfaces:**

- Consumes: nothing
- Produces: edit hrefs with no query string.

- [ ] **Step 1: `list-row.tsx`**

Replace the two lines:

```tsx
const backUrl = list ? `/${list}` : undefined
const editHref = `/${list}/edit/${slug}${backUrl ? `?back=${encodeURIComponent(backUrl)}` : ''}`
```

with:

```tsx
const editHref = `/${list}/edit/${slug}`
```

- [ ] **Step 2: `hooks/data/admin/recents.ts`**

Delete the constant at line 15:

```ts
const backDashboard = `?back=${encodeURIComponent('/admin')}`
```

Then find every `editHref` in this file that concatenates `backDashboard` and remove the concatenation, leaving the bare path. Grep to find them: `grep -n backDashboard hooks/data/admin/recents.ts`. If removing it orphans the `navLinksData` import, delete the import too — check with `grep -c navLinksData hooks/data/admin/recents.ts` (a result of `1` means import-only; delete it).

- [ ] **Step 3: The four outfit table files**

Each has one line building an edit href. Drop the `?back=...` suffix, keeping the template literal otherwise identical. For `outfit-ability-table.tsx:21`:

```tsx
;`${navLinksData.admin.outfits.abilities.edit}/${row.slug}`
```

Apply the same shape to `outfit-season-category-table.tsx:21` (`...seasonCategories.edit`), `outfit-season-table.tsx:21` (`...seasons.edit`), and `outfit-evolution-table.tsx:28` (`...evolutions.edit`). Each still references `navLinksData` for the `.edit` base, so **keep** those imports.

- [ ] **Step 4: Verify no producer remains**

Run: `grep -rn "?back=" --include='*.ts' --include='*.tsx' app hooks`

Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add app/admin/list-row.tsx hooks/data/admin/recents.ts app/admin/outfits/abilities/outfit-ability-table.tsx app/admin/outfits/season-categories/outfit-season-category-table.tsx app/admin/outfits/seasons/outfit-season-table.tsx app/admin/outfits/evolutions/outfit-evolution-table.tsx
git commit -m "refactor(admin): stop appending ?back= to edit links"
```

---

### Task 3: Drop `searchParams` from the four edit pages that read `back`

These four pages take `searchParams`, validate `back` against a `/admin/` prefix, and fall back to their entity list. All of it goes.

**Files:**

- Modify: `app/admin/outfits/abilities/edit/[slug]/page.tsx`
- Modify: `app/admin/outfits/seasons/edit/[slug]/page.tsx`
- Modify: `app/admin/outfits/season-categories/edit/[slug]/page.tsx`
- Modify: `app/admin/outfits/evolutions/edit/[slug]/page.tsx`

**Interfaces:**

- Consumes: `ADMIN_DASHBOARD` is _not_ needed here — these pages stop referencing a back target entirely. The action they bind loses its `backUrl` arg in Task 7.
- Produces: page components taking only `{ params }`.

- [ ] **Step 1: Rewrite `abilities/edit/[slug]/page.tsx`**

Both the outer page and the inner async component thread `searchParams`; both signatures shrink. The full file after the change:

```tsx
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { Stack } from '@mui/material'
import { Metadata } from 'next'
import { getAbilityRaw } from '@/hooks/data/admin/abilities'
import EntityForm from '@/app/admin/entity-form'
import { editAbility } from './actions'

export const metadata: Metadata = {
  title: 'Edit Ability',
}

export default function EditAbilityPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense>
      <Stack spacing={3} sx={{ flexGrow: 1, py: 3 }}>
        <EditAbility params={params} />
      </Stack>
    </Suspense>
  )
}

async function EditAbility({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const ability = await getAbilityRaw(slug)

  if (!ability) notFound()

  return (
    <EntityForm
      showUpdateNext
      showUpdateOnly
      action={editAbility.bind(null, ability.slug)}
      formId="edit-ability"
      formKind="ability"
      initialValues={{
        title: ability.title,
        slug: ability.slug,
        image_url: ability.image_url,
      }}
      mode="edit"
    />
  )
}
```

Note four removals: the `navLinksData` import (now orphaned), both `searchParams` props and their `Promise<{ back?: string }>` types, the `await searchParams` + `back` guard, and the `backUrl={back}` prop. The `.bind()` drops its trailing `back`.

- [ ] **Step 2: Apply the same four removals to the other three pages**

`seasons/edit/[slug]/page.tsx`, `season-categories/edit/[slug]/page.tsx`, and `evolutions/edit/[slug]/page.tsx` have the identical structure with different entity names. In each:

1. Delete `searchParams,` from both destructures and `searchParams: Promise<{ back?: string }>` from both type literals.
2. Delete `searchParams={searchParams}` from the inner component's JSX.
3. Delete the `const { back: backParam } = await searchParams` line and the `const back = backParam?.startsWith('/admin/') ? backParam : navLinksData...` assignment.
4. Delete `backUrl={back}` from `<EntityForm>` and the trailing `, back` from the `.bind(...)` call.
5. Delete the now-unused `import { navLinksData } from '@/lib/nav-links'`.

**Exception — `evolutions/edit/[slug]/page.tsx`:** this page renders a colocated `edit-evolution-form.tsx` rather than `EntityForm` directly, and passes `back={back}`. Delete that prop here; Task 6 removes the receiving end. Confirm whether `navLinksData` is still referenced elsewhere in the file before deleting its import — `grep -c navLinksData` on the file after your edit; delete the import only if the count is `1`.

- [ ] **Step 3: Verify the param is gone**

Run: `grep -rn "searchParams\|backParam" app/admin`

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add 'app/admin/outfits/abilities/edit/[slug]/page.tsx' 'app/admin/outfits/seasons/edit/[slug]/page.tsx' 'app/admin/outfits/season-categories/edit/[slug]/page.tsx' 'app/admin/outfits/evolutions/edit/[slug]/page.tsx'
git commit -m "refactor(admin): drop back searchParam from outfit edit pages"
```

---

### Task 4: Drop the hardcoded `const back` from the five edit pages that ignored the param

**Files:**

- Modify: `app/admin/eureka/sets/edit/[slug]/page.tsx:29,63`
- Modify: `app/admin/eureka/trials/edit/[slug]/page.tsx:30,36,37`
- Modify: `app/admin/eureka/variants/edit/[slug]/page.tsx:42,48,49`
- Modify: `app/admin/outfits/sets/edit/[slug]/page.tsx:32,105`
- Modify: `app/admin/outfits/variants/edit/[slug]/page.tsx:49,55,56`

**Interfaces:**

- Consumes: nothing.
- Produces: edit pages with no back target. `eureka/sets` and `outfits/sets` pass `back={back}` to a colocated form (Task 6 handles the receiver); the other three render `EntityForm` directly.

- [ ] **Step 1: `eureka/trials/edit/[slug]/page.tsx`**

Delete line 30 (`const back = '/admin/eureka/trials'`). Then:

```tsx
      action={editTrial.bind(null, trial.id)}
```

…and delete the `backUrl={back}` line beneath it.

- [ ] **Step 2: `eureka/variants/edit/[slug]/page.tsx` and `outfits/variants/edit/[slug]/page.tsx`**

Same three deletions in each: the `const back = '…'` line, the trailing `, back` inside `.bind(null, variant.id, back)`, and the `backUrl={back}` prop.

Resulting bind calls:

```tsx
      action={editEurekaVariant.bind(null, variant.id)}
```

```tsx
      action={editOutfitVariant.bind(null, variant.id)}
```

- [ ] **Step 3: `eureka/sets/edit/[slug]/page.tsx` and `outfits/sets/edit/[slug]/page.tsx`**

These do not call `.bind()` — they pass `back={back}` down to `edit-eureka-set-form.tsx` / `edit-outfit-set-form.tsx`. Delete the `const back = '…'` line and the `back={back}` prop from the child JSX. Task 6 removes the prop from the child.

- [ ] **Step 4: Verify**

Run: `grep -rn "const back\b\|backUrl={" app/admin`

Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add 'app/admin/eureka/sets/edit/[slug]/page.tsx' 'app/admin/eureka/trials/edit/[slug]/page.tsx' 'app/admin/eureka/variants/edit/[slug]/page.tsx' 'app/admin/outfits/sets/edit/[slug]/page.tsx' 'app/admin/outfits/variants/edit/[slug]/page.tsx'
git commit -m "refactor(admin): drop hardcoded back target from edit pages"
```

---

### Task 5: Drop `backUrl` from the eight `new/` call sites

Each passes `backUrl={navLinksData.admin.*.list}` (or sets it in a `setFormConfig` call). All eight lose their last `navLinksData` reference and must drop the import.

**Files:**

- Modify: `app/admin/eureka/trials/new/page.tsx:30`
- Modify: `app/admin/eureka/variants/new/page.tsx:30`
- Modify: `app/admin/outfits/variants/new/page.tsx:43`
- Modify: `app/admin/outfits/abilities/new/page.tsx:19`
- Modify: `app/admin/outfits/season-categories/new/page.tsx:19`
- Modify: `app/admin/outfits/seasons/new/page.tsx:30`
- Modify: `app/admin/eureka/sets/new/add-eureka-set-form.tsx:90`
- Modify: `app/admin/outfits/sets/new/add-outfit-set-form.tsx:93`

**Interfaces:**

- Consumes: `EntityForm` without a `backUrl` prop (Task 1).
- Produces: create forms whose Cancel comes from the context constant.

- [ ] **Step 1: The six `new/page.tsx` files**

In each, delete the single `backUrl={navLinksData.admin.<entity>.list}` line from the `<EntityForm>` JSX, then delete `import { navLinksData } from '@/lib/nav-links'`.

Before deleting the import, confirm it is the file's only use:

```bash
grep -c navLinksData 'app/admin/eureka/trials/new/page.tsx'
```

Expected: `2` (the import + the one prop). After your edit it must be `0`.

- [ ] **Step 2: The two `add-*-set-form.tsx` files**

These set the value inside a `setFormConfig({ ... })` object literal rather than as a prop. Delete the line:

```tsx
      backUrl: navLinksData.admin.eureka.sets.list,
```

(and the `outfits.sets.list` equivalent in `add-outfit-set-form.tsx`), leaving the sibling keys — `formId`, `showAddAnother`, `pending`, etc. — untouched. Then drop the orphaned `navLinksData` import from each.

- [ ] **Step 3: Verify no `new/` file references a back target**

Run: `grep -rn "backUrl" app/admin/*/*/new app/admin/*/*/*/new 2>/dev/null; grep -rn "backUrl" --include='add-*.tsx' app/admin`

Expected: no output.

- [ ] **Step 4: Lint (catches any import you missed)**

Run: `yarn lint`

Expected: no `'navLinksData' is defined but never used` errors. Other pre-existing warnings in untouched files are fine.

- [ ] **Step 5: Commit**

```bash
git add app/admin/eureka/trials/new/page.tsx app/admin/eureka/variants/new/page.tsx app/admin/outfits/variants/new/page.tsx app/admin/outfits/abilities/new/page.tsx app/admin/outfits/season-categories/new/page.tsx app/admin/outfits/seasons/new/page.tsx app/admin/eureka/sets/new/add-eureka-set-form.tsx app/admin/outfits/sets/new/add-outfit-set-form.tsx
git commit -m "refactor(admin): drop backUrl from create forms"
```

---

### Task 6: Drop the `back` prop from the three colocated edit forms

`edit-eureka-set-form.tsx`, `edit-outfit-set-form.tsx`, and `edit-evolution-form.tsx` receive `back` from their page (removed in Tasks 3-4), put it in `setFormConfig`, and bind it into their action.

**Files:**

- Modify: `app/admin/eureka/sets/edit/[slug]/edit-eureka-set-form.tsx:103,109`
- Modify: `app/admin/outfits/sets/edit/[slug]/edit-outfit-set-form.tsx:162,168`
- Modify: `app/admin/outfits/evolutions/edit/[slug]/edit-evolution-form.tsx:67,73`

**Interfaces:**

- Consumes: `FormConfig` without `backUrl` (Task 1).
- Produces: forms taking no `back` prop. Their bound actions lose the trailing arg; Tasks 7-8 update the action signatures to match.

- [ ] **Step 1: `edit-eureka-set-form.tsx`**

Remove `back` from the component's props and prop type. Then:

```tsx
const boundAction = editEurekaSet.bind(null, eurekaSet.id, initialColors)
```

**`backUrl` is the third bound argument here, not the second.** Keep `initialColors`.

Delete the `backUrl: back,` line from the `setFormConfig({ ... })` literal, keeping `showUpdateOnly: true` and `showUpdateNext: true`.

- [ ] **Step 2: `edit-outfit-set-form.tsx`**

Remove the `back` prop and its type. Then:

```tsx
const boundAction = editOutfitSet.bind(null, outfitSet.id)
```

Delete the `backUrl: back,` line from `setFormConfig`.

- [ ] **Step 3: `edit-evolution-form.tsx`**

Remove the `back` prop and its type. **`backUrl` is the fourth bound argument here:**

```tsx
const boundAction = editEvolution.bind(null, currentSlug, evolution.base_set ?? '')
```

Keep `currentSlug` and `evolution.base_set ?? ''`.

This file's `setFormConfig` uses a fallback — `backUrl: back ?? navLinksData.admin.outfits.evolutions.list,`. Delete the whole line. Then check whether `navLinksData` is still used:

```bash
grep -c navLinksData 'app/admin/outfits/evolutions/edit/[slug]/edit-evolution-form.tsx'
```

If the result is `1` (import only), delete the import.

- [ ] **Step 4: Verify no form passes a back target**

Run: `grep -rn "\bback\b" --include='edit-*.tsx' app/admin`

Expected: no output. (`background`, `backdrop` etc. would not match `\bback\b`.)

- [ ] **Step 5: Commit**

```bash
git add 'app/admin/eureka/sets/edit/[slug]/edit-eureka-set-form.tsx' 'app/admin/outfits/sets/edit/[slug]/edit-outfit-set-form.tsx' 'app/admin/outfits/evolutions/edit/[slug]/edit-evolution-form.tsx'
git commit -m "refactor(admin): drop back prop from colocated edit forms"
```

---

### Task 7: Remove the `backUrl` param from the four small edit actions

Split from Task 8 because these four are single-purpose files under `edit/[slug]/`, while Task 8's five are large shared `actions.ts` files also containing create actions. A reviewer can accept one and reject the other.

**Files:**

- Modify: `app/admin/outfits/abilities/edit/[slug]/actions.ts:10,45`
- Modify: `app/admin/outfits/seasons/edit/[slug]/actions.ts:10,52`
- Modify: `app/admin/outfits/season-categories/edit/[slug]/actions.ts:10,50`
- Modify: `app/admin/outfits/evolutions/edit/[slug]/actions.ts:12,117`

**Interfaces:**

- Consumes: `ADMIN_DASHBOARD` from `@/app/admin/form-context`.
- Produces: `editAbility(currentSlug, _, formData)`, `editSeason(currentSlug, _, formData)`, `editSeasonCategory(currentSlug, _, formData)`, `editEvolution(currentSlug, baseSet, _, formData)` — each one argument shorter, matching the `.bind()` calls from Tasks 3 and 6.

- [ ] **Step 1: `abilities/edit/[slug]/actions.ts`**

Add the import, drop the param, change the final redirect. The signature becomes:

```ts
export async function editAbility(currentSlug: string, _: unknown, formData: FormData) {
```

and the last line of the function:

```ts
redirect(ADMIN_DASHBOARD)
```

Import it alongside the existing ones:

```ts
import { ADMIN_DASHBOARD } from '@/app/admin/form-context'
```

**Leave lines 41-42 exactly as they are** — they are inside the `if (formData.get('update_next') === 'true')` block:

```ts
if (next?.slug) redirect(`${navLinksData.admin.outfits.abilities.edit}/${next.slug}`)
redirect(navLinksData.admin.outfits.abilities.list)
```

`navLinksData` stays imported in this file for exactly that reason.

- [ ] **Step 2: The other three**

Apply the identical three edits — add the `ADMIN_DASHBOARD` import, delete the `backUrl: string,` parameter line, change the trailing `redirect(backUrl)` to `redirect(ADMIN_DASHBOARD)`.

Resulting signatures:

```ts
export async function editSeason(currentSlug: string, _: unknown, formData: FormData) {
export async function editSeasonCategory(currentSlug: string, _: unknown, formData: FormData) {
export async function editEvolution(currentSlug: string, baseSet: string, _: unknown, formData: FormData) {
```

`editEvolution` keeps **two** leading params. In each file the indented `redirect(navLinksData.admin.*.list)` inside the `update_next` block survives untouched.

- [ ] **Step 3: Verify**

Run: `grep -rn "backUrl" app/admin/outfits/*/edit`

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add 'app/admin/outfits/abilities/edit/[slug]/actions.ts' 'app/admin/outfits/seasons/edit/[slug]/actions.ts' 'app/admin/outfits/season-categories/edit/[slug]/actions.ts' 'app/admin/outfits/evolutions/edit/[slug]/actions.ts'
git commit -m "refactor(admin): redirect small edit actions to dashboard"
```

---

### Task 8: Update the five shared `actions.ts` files — edit params out, create redirects retargeted

Each of these files holds **both** an `addX` and an `editX`. This is the task where the 17-vs-8-vs-9 trap lives. It ends with the first green typecheck since Task 1.

**Files:**

- Modify: `app/admin/eureka/trials/actions.ts` — create redirect :29, edit param :32, edit redirect :76
- Modify: `app/admin/eureka/variants/actions.ts` — create redirect :31, edit param :36, edit redirect :84
- Modify: `app/admin/eureka/sets/actions.ts` — create redirect :68, edit param :74, edit redirect :195
- Modify: `app/admin/outfits/variants/actions.ts` — create redirect :50, edit param :55, edit redirect :116
- Modify: `app/admin/outfits/sets/actions.ts` — create redirect :149, edit param :152, edit redirect :502
- Modify: `app/admin/outfits/abilities/new/actions.ts` — create redirect :28
- Modify: `app/admin/outfits/season-categories/new/actions.ts` — create redirect :29
- Modify: `app/admin/outfits/seasons/new/actions.ts` — create redirect :33

**Interfaces:**

- Consumes: `ADMIN_DASHBOARD` from `@/app/admin/form-context`.
- Produces: `editTrial(id, _, formData)`, `editEurekaVariant(id, _, formData)`, `editEurekaSet(id, initialColors, _, formData)`, `editOutfitVariant(id, _, formData)`, `editOutfitSet(id, _, formData)` — matching the `.bind()` calls from Tasks 4 and 6. All eight `addX` actions redirect to `ADMIN_DASHBOARD`.

- [ ] **Step 1: Add the import to all eight files**

```ts
import { ADMIN_DASHBOARD } from '@/app/admin/form-context'
```

- [ ] **Step 2: Retarget the eight create-save redirects**

These sit at the **end of an `addX` function, at the top level of the function body (3-space column)**. Change each to:

```ts
redirect(ADMIN_DASHBOARD)
```

The eight, by file and line: `eureka/trials/actions.ts:29`, `eureka/variants/actions.ts:31`, `eureka/sets/actions.ts:68`, `outfits/variants/actions.ts:50`, `outfits/sets/actions.ts:149`, `outfits/abilities/new/actions.ts:28`, `outfits/season-categories/new/actions.ts:29`, `outfits/seasons/new/actions.ts:33`.

**Do not touch any `redirect(navLinksData.admin.*.list)` that is indented one level deeper and preceded by a `if (next?.slug) redirect(...)` line.** That is the `update_next` fallback.

- [ ] **Step 3: Strip `backUrl` from the five edit actions**

Delete the `backUrl: string,` parameter and change the trailing `redirect(backUrl)` to `redirect(ADMIN_DASHBOARD)`. Signatures become:

```ts
export async function editTrial(id: number, _: unknown, formData: FormData) {
export async function editOutfitSet(id: number, _: unknown, formData: FormData) {
```

and, for the three that use a multi-line param list, delete just the `backUrl: string,` line, leaving:

```ts
export async function editEurekaSet(
  id: number,
  initialColors: string[],
  _: unknown,
  formData: FormData
) {
```

`editEurekaSet` keeps `initialColors` as its second param — match the type to whatever the current line 73 declares. `editEurekaVariant` and `editOutfitVariant` keep only `id`.

`outfits/sets/actions.ts` is ~500 lines; its `redirect(backUrl)` is the final statement of `editOutfitSet` at line 502. Confirm you are editing the last line of that function and not one of the two list-redirects at 149 or 500.

- [ ] **Step 4: Typecheck — this must now pass**

Run: `yarn tsc --noEmit`

Expected: **no output, exit 0.** This is the first green typecheck since Task 1. If it reports an arity error like `Expected 3 arguments, but got 4` on a `.bind()` call, a page from Tasks 3-6 still passes `back` — fix that call site, don't re-add the param.

- [ ] **Step 5: Assert exactly 9 list-redirects survive**

Run: `grep -rn "redirect(navLinksData" --include='*.ts' app/admin | grep -v "\.edit}"`

Expected: **exactly 9 lines**, each indented 4 spaces. Pipe through `wc -l` to be sure. If you see 17, Step 2 did nothing. If you see 8 or fewer, you changed an `update_next` fallback — revert it.

- [ ] **Step 6: Commit**

```bash
git add app/admin/eureka/trials/actions.ts app/admin/eureka/variants/actions.ts app/admin/eureka/sets/actions.ts app/admin/outfits/variants/actions.ts app/admin/outfits/sets/actions.ts app/admin/outfits/abilities/new/actions.ts app/admin/outfits/season-categories/new/actions.ts app/admin/outfits/seasons/new/actions.ts
git commit -m "refactor(admin): redirect all admin saves to dashboard"
```

---

### Task 9: Full verification

No code changes. Confirms the spec's four verification criteria.

**Files:** none.

**Interfaces:**

- Consumes: a fully-migrated tree.
- Produces: a go/no-go signal.

- [ ] **Step 1: Typecheck and lint**

Run: `yarn tsc --noEmit && yarn lint`

Expected: both clean. No `defined but never used` for `navLinksData`.

- [ ] **Step 2: No navigation-related `back` identifiers remain**

Run: `grep -rniE "\bbackUrl\b|\bbackParam\b|\?back=|backDashboard" app hooks lib`

Expected: no output.

- [ ] **Step 3: The `update_next` fallbacks are intact**

Run: `grep -rn "redirect(navLinksData" --include='*.ts' app/admin | grep -v "\.edit}" | wc -l`

Expected: `9`

- [ ] **Step 4: The build compiles**

Run: `yarn build`

Expected: success. This is the only check that exercises the Server Action boundary — a `.bind()` arity mismatch that `tsc` somehow tolerated would surface here.

- [ ] **Step 5: Drive the app**

Run `yarn dev`, sign in as an admin, and confirm each row:

| Action                                             | Expected landing                          |
| -------------------------------------------------- | ----------------------------------------- |
| `/admin/eureka/variants` → edit a row → **Cancel** | `/admin`                                  |
| `/admin` recents list → edit a row → **Save**      | `/admin`                                  |
| `/admin/outfits/seasons/new` → fill + **Save**     | `/admin`                                  |
| Edit a record → **Update**                         | stays on the form, success snackbar fires |
| Edit a non-last record → **Update & next item**    | the next record's edit page               |
| Edit the _last_ record → **Update & next item**    | that entity's **list** page, not `/admin` |

The last row is the regression this plan is most likely to introduce. Verify it explicitly on at least one entity (trials is smallest).

- [ ] **Step 6: Commit any formatter drift**

```bash
git status --short
```

If the PostToolUse hook reformatted anything, commit it:

```bash
git add -A && git commit -m "style: formatter pass"
```

---

## Self-Review

**Spec coverage.** Spec §1 (6 producers) → Task 2. §2 (4 consumers) → Task 3. §3 (5 hardcoded locals) → Task 4. §4 (plumbing) → Tasks 1, 5, 6. §5 (9 edit actions) → Tasks 7, 8. §6 (8 create redirects) → Task 8. Risks → Task 8 Steps 4-5, Task 9. Verification → Task 9. No gaps.

**Placeholder scan.** No TBDs. Every code step carries the code. Task 3 Step 2 and Task 8 Step 3 say "apply the same edits to the other N" — but each enumerates the exact resulting signatures rather than deferring, and the shape is shown in full in the preceding step. Acceptable.

**Type consistency.** `ADMIN_DASHBOARD` is defined in Task 1 and imported in Tasks 7-8 with the same path (`@/app/admin/form-context`) and name. The `.bind()` arities in Tasks 3, 4, 6 match the signatures produced in Tasks 7, 8: `editAbility`/`editSeason`/`editSeasonCategory` take `(currentSlug, _, formData)` and are bound with one arg; `editEvolution` takes `(currentSlug, baseSet, _, formData)` and is bound with two; `editEurekaSet` takes `(id, initialColors, _, formData)` and is bound with two; `editTrial`/`editEurekaVariant`/`editOutfitVariant`/`editOutfitSet` take `(id, _, formData)` and are bound with one.

**Known intermediate breakage.** The tree does not typecheck between Task 1 Step 5 and Task 8 Step 4. This is deliberate and stated in both places. A reviewer gating on `tsc` between Tasks 2-7 will see red; that is expected, not a defect.
