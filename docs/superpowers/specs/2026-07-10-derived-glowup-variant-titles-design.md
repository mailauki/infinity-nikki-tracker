# Derived glow-up variant titles

## Problem

Glow-up outfit states (an `outfit_sets` row with `order = 0`, `base_set` set) carry
variants whose `title` is `null` — see `dreamtime_bestowed-light_pursuer`, whose Hair
variant has no title. The corresponding base-set variant _does_ have a title (base
`dreamtime_bestowed` Hair = "Gifted Sunlight"). We want the glow-up variant to display
a title by default without an admin having to type one per category.

## Goal

A glow-up variant with no stored title should display a title derived from:

```
{base variant title of same category}: {glow-up set title}
```

Example — glow-up "Light Pursuer" (of base "Dreamtime Bestowed"), Hair category:

- base Hair variant title = `Gifted Sunlight`
- glow-up set title = `Light Pursuer`
- derived title = **`Gifted Sunlight: Light Pursuer`**

## Rules

- **Format:** `{base variant title}: {glow-up set title}` — base variant title first.
- **Scope:** glow-up state only (`order === 0` / `isGlowup`). Regular evolutions
  (Hollow Rumor, Blazing Heart, …) are untouched and keep showing no title unless set
  manually.
- **Derive only when both hold:**
  - the glow-up variant's own stored `title` is empty (a manual title always wins), **and**
  - the base set has a same-`outfit_category` variant **with a non-empty title**. If the
    base variant title is missing/empty, the glow-up variant shows no title (unchanged
    behavior).
- **Display is display-only:** nothing is written to the DB. Computed during the client
  transform. The DB `title` stays `null`, so admin still sees the true stored value and
  can set a manual override that wins.

## Design

### Shared helper — `hooks/outfit.ts`

Add pure helpers reused by both the display path and the admin form:

- `deriveGlowupVariantTitle({ baseVariantTitle, glowupSetTitle }): string | null`
  — returns `` `${baseVariantTitle}: ${glowupSetTitle}` `` when `baseVariantTitle` is
  non-empty, else `null`.
- A helper to look up the base set's same-category variant title from a list of
  variants (used to build the category → base-title map).

Both are pure and have no Supabase/React dependency.

### Part 1 — Display (client, no DB write)

Extend `createOutfitSet()` in `hooks/outfit.ts`. At that point `allVariants` already
holds base-state variants (`outfit_set === baseSlug`) plus each evolution's variants,
and `resolvedEvolutions` are full set rows with `title` + `order`.

1. Build `Map<outfit_category, baseVariantTitle>` from base-state variants
   (`outfit_set === baseSlug`) that have a non-empty `title`.
2. Identify glow-up evolution slugs via `isGlowup(e)`, mapping each glow-up state slug →
   its set `title`.
3. When assembling the merged variant list, for any variant whose `outfit_set` is a
   glow-up state slug and whose own `title` is empty: set
   `title = deriveGlowupVariantTitle({ baseVariantTitle: map.get(category), glowupSetTitle })`
   when a base title exists for that category; otherwise leave `title` as-is.

This flows automatically to every `OutfitVariantCard` consumer (set detail, evolution
variants, missing filter, section, charts). No change to `OutfitVariantCard`
(`title={outfitVariant.title || undefined}` already), the `OutfitVariant` type
(`title` stays `string | null`), or the DB.

### Part 2 — Admin edit form (pre-fill, persists only on Save)

Goal: when editing a glow-up variant with no stored title, the Title field is
pre-filled with the derived value so a plain Save persists it — but nothing is written
until Save.

- **Compute server-side** in `app/admin/outfits/variants/edit/[slug]/page.tsx`. When the
  edited variant is a glow-up variant — i.e. its `outfit_set`'s row has `order === 0` —
  and its stored `title` is empty, resolve the base set (the glow-up set's `base_set`)
  and its same-`outfit_category` variant title, then compute the derived title with the
  shared helper.
- **Pre-fill** by passing the derived value as `initialValues.title` **only when the
  stored title is empty**. The generic `EntityForm` binds `values.title` to the Title
  text field, so it renders pre-filled; a plain Save submits `values.title` and persists
  it. Nothing is written until Save. An existing manual title is never overwritten.
- **Scope:** glow-up variants only — matches the display feature.
- No change to `EntityForm`, `app/admin/outfits/variants/fields.tsx`, or the
  `editOutfitVariant` action — only the server page computes and passes the initial
  value. Sourcing the base variant title may require the page to fetch the base set's
  variants (the current `getOutfitSetsRaw` lookup carries set-level columns only, no
  variant titles).

## Explicitly unchanged

- DB schema and migrations (`title` stays `null` in the DB).
- `OutfitVariant` / `OutfitVariantRaw` types.
- `OutfitVariantCard`.
- The `editOutfitVariant` / add-variant save actions.
- All non-glow-up evolution states.
