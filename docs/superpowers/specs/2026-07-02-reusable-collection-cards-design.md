# Reusable Collection Cards

**Date:** 2026-07-02
**Status:** Approved

## Goal

Combine the three near-parallel collection cards — `OutfitSetCard`, `OutfitVariantCard`, and `EurekaVariantCard` — into a shared, reusable system. Achieve both **visual consistency** (uniform toggle style, badge positions, spacing, animation) and **reduced duplication** (one place to maintain the common card mechanics), without changing any caller.

## Non-Goals

- No data-model, context, or Server Action changes.
- No new features or behavior changes — this is a behavior-preserving refactor.
- No changes to caller components (grids/filters). Wrapper names and call signatures stay identical.
- No unrelated refactoring of the surrounding filter/grid code.

## Current State

Three components, each a `'use client'` `Card` wrapped in `Grow`, differing in meaningful ways:

| Aspect          | OutfitSetCard                                                            | OutfitVariantCard                       | EurekaVariantCard                            |
| --------------- | ------------------------------------------------------------------------ | --------------------------------------- | -------------------------------------------- |
| Image           | Poster: `LazyImage kind="media"` (2:3) or `kind="square"` in alt mode    | Centered `LazyImage size="lg"`          | Centered `LazyImage size="lg"` (`optimized`) |
| Clickable       | Yes — `CardActionArea` + `Link` to detail page                           | No                                      | No                                           |
| Header          | `overline` title + `RarityStars` in a `Stack`                            | `CardHeader` title + category subheader | Single `caption`: `category • color`         |
| Toggle icon     | `TaskAlt` when `obtained === total`                                      | `TaskAlt` when `variant.obtained`       | `TaskAlt` when `variant.obtained`            |
| Top-left badge  | evolution / glowup `ToggleIcon`                                          | category `ToggleIcon`                   | none                                         |
| Top-right badge | `ProgressChip`                                                           | none                                    | none                                         |
| Data source     | props (`obtained`/`total`/`onToggle`)                                    | `useOutfitData()` context               | `useEurekaData()` context                    |
| Elevation       | default                                                                  | raised (`elevation={3}`) when obtained  | raised when obtained                         |
| Animation       | `grown` + `exiting` + `shouldHide` + `unmountOnExit` + `onExited` commit | simple `exiting`                        | simple `exiting`                             |

**Callers (must remain untouched):**

- `OutfitSetCard` — `app/outfits/filter-outfits.tsx`
- `OutfitVariantCard` — `app/outfits/filter-outfits.tsx`, `app/outfits/outfit-set-section.tsx`, `app/outfits/[slug]/outfit-evolution-variants.tsx`
- `EurekaVariantCard` — `app/eureka/filter-eureka.tsx`, `app/eureka/[slug]/eureka-variant-color-filter.tsx`

## Architecture

Two focused card components sharing one small shell, plus three thin domain wrappers that keep the existing file names and props.

```
components/
  card-shell.tsx      # Grow + Card + toggle IconButton + badge slots (controlled, presentational)
  set-card.tsx        # poster shape, built on CardShell
  variant-card.tsx    # avatar shape, built on CardShell (serves outfit + eureka variants)
app/outfits/outfit-set-card.tsx      # thin wrapper -> SetCard
app/outfits/outfit-variant-card.tsx  # thin wrapper -> VariantCard
app/eureka/eureka-variant-card.tsx   # thin wrapper -> VariantCard
```

Rationale for **two cards + shared shell** (rather than one `shape`-forking primitive): the poster and avatar shapes share the `Grow`/`Card` shell, the toggle button, and the badge slots — but their image layout, header, and animation complexity differ enough that a single component would fork nearly every visual region on a `shape` prop. Two focused components read better; the shell keeps the truly common parts DRY.

The primitives are **purely presentational** — no context imports, no `ProgressChip`/`ToggleIcon`/domain-icon imports. Badges are passed in as `ReactNode`. Each domain wrapper reads its context and maps to props (presentational + thin wrappers boundary).

`card-shell`, `set-card`, and `variant-card` live in `components/` because they are imported by 2+ unrelated routes (outfits + eureka), per the colocation rule.

## Components

### `CardShell` (controlled)

```ts
type CardShellProps = {
  in: boolean // Grow visibility, computed by the wrapper
  unmountOnExit?: boolean // set cards unmount when hidden by a filter
  onExited?: () => void // e.g. commit the obtained toggle after exit (missing filter)
  raised?: boolean // raise Card elevation to 3 (variant cards when obtained); else 1
  topLeft?: ReactNode // absolute top-left badge slot
  topRight?: ReactNode // absolute top-right badge slot
  children: ReactNode // shape-specific body
}
```

The shell does **not** own the toggle button — placement differs by shape (see the toggle helper below), so the toggle is built separately and placed by each shape inside `children`.

Owns:

- `<Grow in={props.in} unmountOnExit={unmountOnExit} onExited={onExited} timeout={300}>`
- `<Card elevation={raised ? 3 : 1} sx={{ position: 'relative', flexGrow: 1 }}>`
- Absolute badge slots: `topLeft` at `{ top: 12, left: 12 }`, `topRight` at `{ top: 8, right: 8 }` (each rendered only when its `ReactNode` is truthy).

### Shared toggle helper

The toggle button lives in one place but is **placed by each shape**, because placement differs: the set card renders it inline in the header `Stack` (right side); the variant cards render it in the `CardHeader` `action` slot. So `card-shell.tsx` also exports a small builder used by both shapes:

```ts
function CollectionToggle(props: {
  show: boolean // isLoggedIn && !disableToggle
  obtained: boolean // TaskAlt when true, else RadioButtonUncheckedOutlined
  label: string // aria-label
  onToggle: () => void
}): ReactNode // null when !show
```

This keeps the icon choice + `aria-label` logic in one place without `CardShell` forking on shape.

### `SetCard` (poster)

```ts
type SetCardProps = {
  href: string
  title: string
  rarity: number
  imageSrc: string
  showAlt: boolean // square (1:1) vs media (2:3) render
  fallbackSrc: string // set.image_url fallback
  obtained: number
  total: number
  isLoggedIn: boolean
  in: boolean
  unmountOnExit?: boolean
  onToggle: () => void
  onExited?: () => void
  topLeft?: ReactNode // evolution / glowup ToggleIcon
  topRight?: ReactNode // ProgressChip
}
```

Body (inside `CardShell`, `raised` omitted — set cards don't raise elevation today): `CardActionArea` + `Link href` wrapping `LazyImage` (`kind="square"` when `showAlt`, else `kind="media"` with `aspectRatio: '2 / 3'`), then a `direction="row"` `Stack` with an `overline` `Typography` title + `RarityStars`, and `<CollectionToggle>` placed inline (right side) with `obtained={obtained === total}` and label `obtained === total ? 'Mark as not obtained' : 'Mark as obtained'`.

### `VariantCard` (avatar)

```ts
type VariantCardProps = {
  imageSrc?: string | null
  imageAlt: string
  title?: string // optional variant title
  subtitle: string // "Category" (outfit) or "Category • Color" (eureka)
  obtained: boolean
  isLoggedIn: boolean
  disableToggle?: boolean
  optimized?: boolean // eureka path uses next/image
  in: boolean
  onToggle: () => void
  onExited?: () => void
  topLeft?: ReactNode // outfit: category ToggleIcon; eureka: none
}
```

Body (inside `CardShell`, `raised={obtained}` — variant cards raise elevation when obtained): centered `LazyImage size="lg"` (`color="transparent"`, `Category` fallback icon, `optimized` when set), then `CardHeader` with `title` (`subtitle2`, `noWrap`) + `subheader` (`caption`), `<CollectionToggle obtained={obtained} label={obtained ? 'Mark as not obtained' : 'Mark as obtained'} />` in the `action` slot, and `sx={{ '& .MuiCardHeader-content': { maxWidth: 'calc(100% - 40px)' } }}`. No `href`.

### Wrappers (domain logic + state stay put)

Each wrapper keeps its **current name, props, and default export**, its context hook(s), image resolution, `onToggle` semantics, and its animation state; it computes `in` and renders the appropriate card.

- **`app/outfits/outfit-set-card.tsx`** → `SetCard`. Keeps `useOutfitImageMode`, `grown`/`exiting`/`shouldHide` state, `href`/`title`/`imageSrc`/`showAlt` derivation, evolution/glowup `topLeft` `ToggleIcon`, `ProgressChip` `topRight`, `unmountOnExit`, and the missing-filter `onExited` behavior. `in = grown && !exiting`.
- **`app/outfits/outfit-variant-card.tsx`** → `VariantCard`. Keeps `useOutfitData` + `useOutfitImageMode`, `mode`-based `imageSrc`, category `ToggleIcon` `topLeft`, `categoryLabel` subtitle, simple `exiting`. `in = !exiting`.
- **`app/eureka/eureka-variant-card.tsx`** → `VariantCard`. Keeps `useEurekaData`, `"category • color"` subtitle, `optimized`, simple `exiting`, no `topLeft`. `in = !exiting`.

## Data Flow

Unchanged. Wrappers read context / props exactly as today and call the same Server Actions via context (`onToggleObtained`) or the passed `onToggle`. The primitives receive already-resolved values and emit `onToggle`/`onExited` callbacks upward. No new context, no prop drilling beyond the wrapper → card boundary.

## Error Handling

No new error paths. Image loading/retry/skeleton remains inside `LazyImage`. The existing `isObtainedError` alerts live in the filter components (callers), untouched.

## Testing / Verification

The repo has no automated test suite. Verification:

1. `yarn tsc --noEmit` — clean.
2. `yarn lint` — clean (no new warnings; the 2 pre-existing warnings in unrelated files are out of scope).
3. `yarn format` — applied.
4. `a11y-reviewer` subagent on `components/card-shell.tsx`, `set-card.tsx`, `variant-card.tsx` — confirm toggle `aria-label`s and link semantics are preserved.
5. Visual parity is implied by the unchanged caller signatures; a manual dev-server spot-check of the outfits grid, eureka grid, and an outfit set-detail page confirms poster/avatar rendering, badges, toggle, and the missing-filter exit animation.

## Build Sequence

1. Add `components/card-shell.tsx` (shell + `renderToggle` helper).
2. Add `components/variant-card.tsx` on the shell.
3. Rewrite `app/outfits/outfit-variant-card.tsx` and `app/eureka/eureka-variant-card.tsx` as wrappers; verify tsc + both variant grids.
4. Add `components/set-card.tsx` on the shell.
5. Rewrite `app/outfits/outfit-set-card.tsx` as a wrapper; verify tsc + the outfits set grid + missing-filter animation.
6. Format, lint, tsc, a11y review.
