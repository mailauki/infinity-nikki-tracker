# "Update & next item" button for admin edit forms

**Date:** 2026-06-22
**Status:** Approved

## Goal

Add an "Update & next item" button to every admin edit form. It saves the current item and then navigates to the edit form of the next available item, so an admin can work through items one after another. This mirrors the existing "Save & add another" button on the add forms, but for editing.

## Existing pattern (reference)

The admin forms share a toolbar and a form-config context:

- `app/admin/form-toolbar.tsx` — a `'use client'` `FormToolBar` rendered inside `NavBarToolbar`. It reads config from `useFormConfig()` and renders buttons. Each secondary button is a `<Button form={formId} type="submit" name="<flag>" value="true">` so clicking it injects a flag into the submitted `FormData`. A `useEffect` shows a success snackbar when `savedTitle` is set, then clears it.
- `app/admin/form-context.tsx` — `FormProvider` / `useFormConfig()`. Holds `{ formId, backUrl, pending, showAddAnother?, showUpdateOnly?, savedTitle? }`.
- Add `actions.ts`: after a successful insert, `if (formData.get('add_another') === 'true') return { addAnother: true, savedTitle }` (stay, reset client fields) else `redirect(listUrl)`.
- Edit `actions.ts`: after a successful update, `if (formData.get('update_only') === 'true') return { savedTitle }` (stay, show snackbar) else `redirect(backUrl)`.

"Save & add another" stays on the page and the **client** resets its fields (it watches `state` for `addAnother`). "Update & next item" is different: it **redirects server-side** to a different URL, so the edit form re-mounts with the next item's data — no client reset logic is needed.

## Behavior

- New button **"Update & next item"**, placed in `FormToolBar` between the existing "Update" button and the primary "Save" button. Gated by a new `showUpdateNext` flag so only edit forms show it.
- It submits the form with `name="update_next" value="true"`.
- On a successful update, the edit `actions.ts`:
  1. Computes the saved item's ordering key (the just-saved `title`, or `slug` for eureka variants).
  2. Queries the table for the next row, ordered ascending, where the row sorts strictly after the current one, limit 1.
  3. If a next row exists → `redirect(\`{editBase}/edit/${nextRow.slug}\`)`.
  4. If none → `redirect(backUrl)` (the list page) — this is the "last item" behavior.
- "Next item" ordering = **alphabetically by title** (per product decision), tie-broken by `slug` for stability.
- The existing "Update" (update-only) and "Save" (redirect to list) buttons are unchanged.

## Changes by layer

### 1. `app/admin/form-context.tsx`

Add `showUpdateNext?: boolean` to the `FormConfig` interface and to the provider's initial state and the context default.

### 2. `app/admin/form-toolbar.tsx`

- Destructure `showUpdateNext` from `useFormConfig()`.
- Add a button after the `showUpdateOnly` block:

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

### 3. Each edit `actions.ts` (7 entities)

In each `edit*` action, after the existing `if (error) return { error }` and the existing `update_only` check, and **before** the final `redirect(backUrl)`, add:

```ts
if (formData.get('update_next') === 'true') {
  const { data: next } = await supabase
    .from('<table>')
    .select('slug')
    .gt('<orderCol>', <savedOrderValue>)
    .order('<orderCol>', { ascending: true })
    .order('slug', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (next?.slug) redirect(`${EDIT_BASE}/edit/${next.slug}`)
  redirect(backUrl)
}
```

Notes:

- `<savedOrderValue>` is the value just written (the new `title`, or new `slug` for variants), so navigation advances correctly even when the title/slug changed during this save.
- The tie-break `.order('slug', ...)` after the primary `.order` makes the sequence stable when titles are not unique. (The single `.gt('<orderCol>', value)` can still skip same-title siblings; this is acceptable for the alphabetical-by-title requirement and avoids a compound-cursor query. Duplicate titles are rare in this data set.)
- `redirect()` throws, so it must stay outside any try/catch and after all DB work.
- `EDIT_BASE` comes from `navLinksData.admin.<domain>.<entity>.edit` where available; otherwise the literal base string already used as `back`.

Per-entity mapping:

| Entity          | actions.ts                                                     | table             | orderCol | edit base                                    |
| --------------- | -------------------------------------------------------------- | ----------------- | -------- | -------------------------------------------- |
| eureka sets     | `app/admin/eureka/sets/actions.ts`                             | `eureka_sets`     | `title`  | `navLinksData.admin.eureka.sets.edit`        |
| eureka variants | `app/admin/eureka/variants/actions.ts`                         | `eureka_variants` | `slug`   | `navLinksData.admin.eureka.variants.edit`    |
| trials          | `app/admin/eureka/trials/actions.ts`                           | `trials`          | `title`  | `navLinksData.admin.eureka.trials.edit`      |
| outfit sets     | `app/admin/outfits/sets/actions.ts`                            | `outfit_sets`     | `title`  | `navLinksData.admin.outfits.sets.edit`       |
| abilities       | `app/admin/outfits/abilities/new/actions.ts` (shared add+edit) | `abilities`       | `title`  | `navLinksData.admin.outfits.abilities.edit`  |
| seasons         | `app/admin/outfits/seasons/new/actions.ts` (shared add+edit)   | `seasons`         | `title`  | `navLinksData.admin.outfits.seasons.edit`    |
| evolutions      | `app/admin/outfits/evolutions/edit/[slug]/actions.ts`          | `evolutions`      | `id`     | `navLinksData.admin.outfits.evolutions.edit` |

> **Evolutions ordering note:** `evolutions.title` holds the _outfit set_ name, so every stage of a set shares one title. Ordering "next" by title would `.gt('title', …)` past all sibling stages and jump to the next set. Evolutions therefore order by `id` (matching the evolutions list/data hook in `hooks/data/evolutions.ts`), so the button walks a set's stages. The action re-reads the saved row's `id` by its post-save slug, then `.gt('id', savedId).order('id', …)`.

(Exact `actions.ts` paths for abilities/seasons to be confirmed during implementation — some entities colocate the edit action in the `new/actions.ts` file.)

### 4. Each edit form `*.tsx` (7 entities)

Add `showUpdateNext: true` to the existing `setFormConfig({ ... showUpdateOnly: true })` call in the form's mount `useEffect`. No other client changes — the redirect re-mounts the form with fresh data.

## Edge cases

- **Last item:** no next row → `redirect(backUrl)` (list page).
- **Duplicate titles:** `(title, slug)` ordering keeps the sequence stable and prevents looping; a same-title sibling may be skipped, accepted per above.
- **Slug/title changed during this save:** query uses the post-save value, so it advances from where the item now sorts.
- **Variants have no `title` column:** they order by `slug` (their identity), consistent with how the variant edit/add already key on slug.
- **Evolutions edit re-saves in place and can change its own slug:** the next-query runs after the update using the saved `id`, so it still advances; the in-place client slug-sync logic only matters for `update_only`, not `update_next` (which navigates away). Evolutions order by `id`, not `title` — see the ordering note above.

## Out of scope

- Reordering or "previous item" navigation.
- Changing the "next" definition to match per-page list sort/filter state.
- Wrapping from last back to first.

## Verification

- Type-check (`yarn dlx tsc --noEmit`) and lint pass.
- Manual: on each edit form, "Update & next item" saves and lands on the next item alphabetically; on the last item it returns to the list. The existing "Update" and "Save" buttons behave as before.
