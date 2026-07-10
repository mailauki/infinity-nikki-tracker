# Remove `?back=` search params from admin forms

**Date:** 2026-07-09
**Status:** Approved, not yet implemented

## Problem

Admin edit links carry a `?back=<url>` search param that flows into the form
plumbing as a `backUrl` value and becomes both the Cancel button's `href` and
the post-save `redirect()` target.

The mechanism is half-wired. Six call sites produce `?back=`, but only four
edit pages read it. The other five edit pages ignore the param and hardcode
`back` to their own list route — so an edit opened from the dashboard's
"recents" list (which appends `?back=/admin`) silently returns the user to the
entity list instead of the dashboard.

Because `backUrl` is threaded as a bound server-action argument, it also means
`redirect()` receives a URL-decoded value straight from the query string.

## Decision

All post-save and Cancel navigation in the admin section goes to `/admin`.

`backUrl` stops being data. There is no query param, no prop, and no bound
action argument — only a shared constant read directly by the two consumers.

### Destinations after this change

| Form           | Control            | Destination                   |
| -------------- | ------------------ | ----------------------------- |
| `new/`         | Cancel             | `/admin`                      |
| `new/`         | Save               | `/admin` (changed from list)  |
| `new/`         | Save & add another | stays on form (unchanged)     |
| `edit/[slug]/` | Cancel             | `/admin`                      |
| `edit/[slug]/` | Save               | `/admin`                      |
| `edit/[slug]/` | Update             | stays on form (unchanged)     |
| `edit/[slug]/` | Update & next item | next record, else entity list |

`Update & next item`'s exhaustion fallback keeps redirecting to the entity's
own list. It is a deliberate, already-explicit target — "you finished walking
this list" is a different event from "you finished this record" — and it never
used `?back=`. Out of scope.

## Architecture

Today `backUrl` travels two parallel paths from one source:

    ?back=  →  page searchParams  →  EntityForm prop  →  form context  →  <Button href>
    ?back=  →  .bind(null, …, back)  →  server action  →  redirect(backUrl)

After: no value, no travel. Both consumers read one constant.

    ADMIN_DASHBOARD  →  FormToolBar: <Button href={ADMIN_DASHBOARD}>Cancel</Button>
    ADMIN_DASHBOARD  →  server action: redirect(ADMIN_DASHBOARD)

### The constant

Export `ADMIN_DASHBOARD = '/admin'` from `app/admin/form-context.tsx`.

Rejected: adding a `dashboard` field to `navLinksData.admin`. That object is a
map of per-entity `{ list, add, edit }` groups typed as `AdminLinks`; a
top-level scalar would require changing the type to accommodate a value that is
admin-form-specific. Both consumers already live under `app/admin/`.

### Data flow after

    Edit link (no query string)
      → edit page (params only)
        → EntityForm (no backUrl prop)
          → FormProvider ──→ FormToolBar: Cancel → ADMIN_DASHBOARD
          → <form action={editX.bind(null, id)}>
                                  │
                                  ├─ add_another  → { addAnother }      (stay)
                                  ├─ update_only  → { savedTitle }      (stay)
                                  ├─ update_next  → next record | list  (unchanged)
                                  └─ plain save   → redirect(ADMIN_DASHBOARD)

The open-redirect surface disappears as a side effect: `redirect()` no longer
takes a URL-decoded query value.

## Changes

### 1. Delete the `?back=` producers (6)

- `app/admin/list-row.tsx:28-29` — drop the `backUrl` local and the `?back=`
  suffix; `editHref` becomes `` `/${list}/edit/${slug}` ``
- `hooks/data/admin/recents.ts:15` — delete the `backDashboard` constant and
  its concatenation onto each item's `editHref`
- `app/admin/outfits/abilities/outfit-ability-table.tsx:21`
- `app/admin/outfits/season-categories/outfit-season-category-table.tsx:21`
- `app/admin/outfits/seasons/outfit-season-table.tsx:21`
- `app/admin/outfits/evolutions/outfit-evolution-table.tsx:28`

### 2. Delete the `?back=` consumers (4)

Remove the `searchParams` prop, its type, and the `await searchParams`
destructure. Each threads `searchParams` through an outer page → inner async
component pair, so **both** signatures shrink.

- `app/admin/outfits/abilities/edit/[slug]/page.tsx`
- `app/admin/outfits/evolutions/edit/[slug]/page.tsx`
- `app/admin/outfits/season-categories/edit/[slug]/page.tsx`
- `app/admin/outfits/seasons/edit/[slug]/page.tsx`

### 3. Delete the hardcoded `const back = '…'` locals (5)

- `app/admin/eureka/sets/edit/[slug]/page.tsx:29`
- `app/admin/eureka/trials/edit/[slug]/page.tsx:30`
- `app/admin/eureka/variants/edit/[slug]/page.tsx:42`
- `app/admin/outfits/sets/edit/[slug]/page.tsx:32`
- `app/admin/outfits/variants/edit/[slug]/page.tsx:49`

### 4. Delete the prop/param plumbing

- `app/admin/form-context.tsx` — remove `backUrl` from `FormConfig` and from
  both default objects; add the `ADMIN_DASHBOARD` export
- `app/admin/entity-form.tsx:94,107,154,156` — remove the `backUrl` prop, its
  type, its `setFormConfig` payload entry, and its `useEffect` dep
- `app/admin/form-toolbar.tsx` — stop reading `backUrl` from context; Cancel
  becomes `<Button component="a" href={ADMIN_DASHBOARD}>`
- `app/admin/admin-toolbar.tsx:22` — drop `backUrl: ''`
- Remove `backUrl={navLinksData.admin.*.list}` from the 8 `new/` call sites:
  `eureka/trials/new/page.tsx:30`, `eureka/variants/new/page.tsx:30`,
  `eureka/sets/new/add-eureka-set-form.tsx:90`,
  `outfits/variants/new/page.tsx:43`, `outfits/abilities/new/page.tsx:19`,
  `outfits/season-categories/new/page.tsx:19`,
  `outfits/sets/new/add-outfit-set-form.tsx:93`,
  `outfits/seasons/new/page.tsx:30`
- Remove `backUrl:` from the `setFormConfig` calls in
  `eureka/sets/edit/[slug]/edit-eureka-set-form.tsx:109`,
  `outfits/sets/edit/[slug]/edit-outfit-set-form.tsx:168`,
  `outfits/evolutions/edit/[slug]/edit-evolution-form.tsx:73`

### 5. Drop `backUrl` from the 9 edit actions

Remove the `backUrl: string` parameter and change the final `redirect(backUrl)`
to `redirect(ADMIN_DASHBOARD)`. The `add_another` / `update_only` /
`update_next` branches above it are untouched.

| Action file                                        | param | redirect |
| -------------------------------------------------- | ----- | -------- |
| `eureka/trials/actions.ts`                         | 32    | 76       |
| `eureka/variants/actions.ts`                       | 36    | 84       |
| `eureka/sets/actions.ts`                           | 74    | 195      |
| `outfits/variants/actions.ts`                      | 55    | 116      |
| `outfits/sets/actions.ts`                          | 152   | 502      |
| `outfits/abilities/edit/[slug]/actions.ts`         | 10    | 45       |
| `outfits/seasons/edit/[slug]/actions.ts`           | 10    | 52       |
| `outfits/season-categories/edit/[slug]/actions.ts` | 10    | 50       |
| `outfits/evolutions/edit/[slug]/actions.ts`        | 12    | 117      |

**`backUrl` is not always the second bound argument.** It is always the _last_
bound arg, immediately before `_: unknown`. Update each `.bind()` accordingly:

- `editTrial.bind(null, trial.id, back)` → `.bind(null, trial.id)`
- `editEurekaVariant.bind(null, variant.id, back)` → `.bind(null, variant.id)`
- `editEurekaSet.bind(null, eurekaSet.id, initialColors, back)` → `.bind(null, eurekaSet.id, initialColors)`
- `editOutfitVariant.bind(null, variant.id, back)` → `.bind(null, variant.id)`
- `editOutfitSet.bind(null, outfitSet.id, back)` → `.bind(null, outfitSet.id)`
- `editAbility.bind(null, ability.slug, back)` → `.bind(null, ability.slug)`
- `editSeasonCategory.bind(null, category.slug, back)` → `.bind(null, category.slug)`
- `editSeason.bind(null, season.slug, back)` → `.bind(null, season.slug)`
- `editEvolution.bind(null, currentSlug, evolution.base_set ?? '', back)` → `.bind(null, currentSlug, evolution.base_set ?? '')`

### 6. Point the 8 create-save redirects at the dashboard

These never took a `backUrl`; they hardcode the entity list. Change each to
`redirect(ADMIN_DASHBOARD)`:

- `eureka/trials/actions.ts:29`
- `eureka/variants/actions.ts:31`
- `eureka/sets/actions.ts:68`
- `outfits/variants/actions.ts:50`
- `outfits/sets/actions.ts:149`
- `outfits/abilities/new/actions.ts:28`
- `outfits/season-categories/new/actions.ts:29`
- `outfits/seasons/new/actions.ts:33`

**Do not touch the 9 indented `redirect(navLinksData.admin.*.list)` calls
inside `if (formData.get('update_next') === 'true')` blocks.** Distinguish by
indentation and enclosing block, not by the callee.

## Risks

**Argument shifting.** Each action loses a parameter from the middle of its
signature. Miss a `.bind()` call site and `prevState` / `formData` silently
shift by one. TypeScript catches the `.bind()` form, which covers all nine —
`yarn tsc --noEmit` must pass before believing the edit is complete.

**`redirect()` in try/catch.** `redirect()` throws to signal. No `redirect()`
call moves here — only its argument changes — so this should not bite, but
`outfits/sets/actions.ts:502` sits at the end of a ~350-line action worth
reading while in there.

**The two list-redirect kinds look identical.** Both are
`redirect(navLinksData.admin.*.list)`. Section 6 changes 8 of them; 9 must
survive. Grep alone cannot separate them.

## Verification

No tests cover this area.

1. `yarn tsc --noEmit` passes.
2. `grep -rn 'back' app/admin hooks/data/admin/recents.ts` returns nothing
   related to navigation (`backgroundColor` etc. will still match).
3. `grep -rn 'redirect(navLinksData' app/admin` returns exactly 9 hits, all
   indented inside `update_next` blocks.
4. Drive the app:
   - Edit a record reached from an entity list page → Cancel lands on `/admin`.
   - Edit a record reached from the dashboard's recents list → Save lands on
     `/admin`.
   - Create a record from a `new/` page → Save lands on `/admin`.
   - "Update & next item" still walks to the next record, and on the last
     record still lands on that entity's list.
