# StickyBar — Page-Scoped Sticky Sub-Toolbar Design

**Date:** 2026-07-25
**Status:** Approved (pending spec review)
**Branch:** layout-shell-consolidation (continues the layout-shell work; PR #278)

## Goal

Add a sticky sub-toolbar that lives **inside the `<main>` content column**, pins just below
the fixed AppBar as the page scrolls, and holds page-scoped content — results counts and
tabs/toggles. It is a separate strip from the AppBar's existing second row (the `ToolbarSlot`
target): the AppBar row holds actions/filters and is full-width fixed chrome; this new bar is
content-scoped (respects the drawer widths and `<main>` gutter) and holds counts/tabs.

This task delivers only the **mechanism** — the `StickyBar` portal component, its context
registration, and the shell slot. Page wiring (placing `<StickyBar>` with real results-count
and tab content) is done separately, later.

## Chosen decisions (from brainstorming)

- **Relationship to the AppBar second row:** in addition to it, not replacing it. The AppBar
  keeps its `ToolbarSlot` second row; this is a distinct strip for counts/tabs.
- **Location:** inside the `<main>` column (not the fixed AppBar), so it respects the gutter
  and drawer widths and scrolls within the content area — pinned via `position: sticky`.
- **Injection:** portal pattern, identical to `ToolbarSlot`/`SidebarBody`. Pages render
  `<StickyBar>…</StickyBar>` from under their own providers; content portals into a single
  target the shell renders.
- **Sticky offset:** derived from the shell's existing `hasToolbar` state and the existing
  `shellToolbarTop` / `TOOLBAR_ROW_2_HEIGHT` constants — exact for both the 1-row and 2-row
  AppBar heights. No new magic numbers.
- **Gating:** rendered (and its space reserved) only when a page has mounted a `<StickyBar>`
  (`hasStickyBar`), mirroring `hasToolbar`/`hasBody`.
- **Visual:** a plain, opaque solid strip with a bottom border — NOT the AppBar's
  gradient/blur/mask. Uses `background.paper` + `borderBottom: 1, borderColor: 'divider'`.
- **Name:** `StickyBar` component + `useStickyBar` context hook, consistent with
  `ToolbarSlot`/`useToolbar` and `SidebarBody`/`useSidebar`.

## Architecture

Four coordinated pieces, mirroring the existing toolbar/sidebar portal idiom.

### 1. Context — `components/navbar/navbar-toolbar-context.tsx` (extended)

Add a `StickyBarContext` alongside the existing nav/sidebar/toolbar contexts under
`DrawerStateProvider`:

- `stickyBarTarget: HTMLElement | null`, `setStickyBarTarget(el)`
- `hasStickyBar: boolean`, `registerStickyBar()`, `unregisterStickyBar()`

Count-based `hasStickyBar` (a `stickyBarCount` state, `> 0`), register/unregister as
`useCallback`s — identical to the existing `registerToolbar`/`registerBody` pattern. Export a
`useStickyBar()` hook that throws outside the provider, like the others.

### 2. `components/sticky-bar.tsx` (new)

The `toolbar-slot.tsx` twin:

```tsx
'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { useStickyBar } from '@/components/navbar/navbar-toolbar-context'

// Renders its children into the root LayoutShell's sticky sub-toolbar target (inside
// the <main> column, pinned under the AppBar). Registers presence so the shell knows
// a sticky bar exists (hasStickyBar). Rendered by a page UNDER its own data providers,
// so its content's hooks (useEurekaData, useOutfitData, etc.) still work. Mirrors
// components/toolbar-slot.tsx and components/sidebar/sidebar-body.tsx.
export default function StickyBar({ children }: { children: React.ReactNode }) {
  const { stickyBarTarget, registerStickyBar, unregisterStickyBar } = useStickyBar()

  React.useEffect(() => {
    registerStickyBar()
    return unregisterStickyBar
  }, [registerStickyBar, unregisterStickyBar])

  if (!stickyBarTarget) return null
  return createPortal(children, stickyBarTarget)
}
```

### 3. `components/layout-shell.tsx` (edited)

- Consume `useStickyBar()`.
- Add a callback ref `setStickyBarNode` publishing the target (same idiom as
  `setToolbarNode`/`setSidebarNode`).
- Compute `stickyTop` — a responsive sx `top` value equal to the AppBar's rendered height:
  - Base: `shellToolbarTop` (responsive 56/48/64, the row-1 height).
  - Plus the mask spacer (16px, `theme.spacing(2)`).
  - Plus, when `hasToolbar`, the row-2 height (`TOOLBAR_ROW_2_HEIGHT`).

  Expressed as a responsive object built from `shellToolbarTop`'s breakpoint values so it stays
  exact across breakpoints (not a hardcoded 56). See "Offset math" below.

- Inside `<main>`, ABOVE `{children}` (and after the existing `<DrawerHeader />` / `hasToolbar`
  spacer / mask-spacer `Box`), render the sticky container only when `hasStickyBar`:

```tsx
{
  hasStickyBar && (
    <Box
      sx={{
        position: 'sticky',
        top: stickyTop,
        zIndex: (t) => t.zIndex.appBar - 1,
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
        mx: -2, // cancel the <main> px:2 gutter so the strip spans the full content width
        px: 2,
      }}
    >
      <Box ref={setStickyBarNode} />
    </Box>
  )
}
```

Note the `mx: -2 / px: 2`: `<main>` applies `px: 2`; the sticky strip should span the full
content column width (edge to edge of `<main>`), so it negates the gutter on the wrapper and
re-applies it inside. If the strip should instead sit within the gutter, drop `mx: -2`.
(Default: full-width strip.)

### 4. Pages (separate, later)

A page renders, from under its providers:

```tsx
<StickyBar>
  <ResultsCount />
  <SomeTabs />
</StickyBar>
```

Not part of this task.

## Offset math

`shellToolbarTop` (in `lib/layout-constants.ts`) is a responsive sx object:
`{ top: 56, '@media (orientation: landscape)': { top: 48 }, '@media (min-width:600px)': { top: 64 } }`.

The sticky `top` must equal row-1 + mask-spacer (+ row-2 when `hasToolbar`). Build it in the
shell from the same breakpoints so it stays exact:

```tsx
const MASK_SPACER = 16 // theme.spacing(2), the AppBar's gradient-mask fade spacer
const row2 = hasToolbar ? TOOLBAR_ROW_2_HEIGHT : 0
const stickyTop = {
  top: 56 + MASK_SPACER + row2,
  '@media (orientation: landscape)': { top: 48 + MASK_SPACER + row2 },
  '@media (min-width:600px)': { top: 64 + MASK_SPACER + row2 },
}
```

(If a shared helper is preferred, add a `shellToolbarTopWith(extra: number)` to
`layout-constants.ts` that returns this shape; optional — inline in the shell is acceptable
since it's the only consumer.)

## z-index

The sticky bar sits BELOW the fixed AppBar (`zIndex.drawer + 1`) but ABOVE scrolling page
content. It lives inside `<main>` and never overlaps the drawers, so `theme.zIndex.appBar - 1`
is safe: clearly under the AppBar, clearly above cards/content (beating MUI card elevations).

## Visual

Opaque solid strip: `bgcolor: 'background.paper'`, `borderBottom: 1, borderColor: 'divider'`.
NOT the AppBar's gradient/blur/mask. Being opaque, it cleanly covers content scrolling beneath
it. Reads correctly in light and dark via the `background.paper` / `divider` theme tokens.

## Files

- Modify: `components/navbar/navbar-toolbar-context.tsx` — add StickyBar context + `useStickyBar`.
- Create: `components/sticky-bar.tsx` — portal component.
- Modify: `components/layout-shell.tsx` — consume `useStickyBar`, add `setStickyBarNode` callback
  ref, compute `stickyTop`, render the gated sticky container in `<main>` above `{children}`.

## Edge cases

1. **Offset tracks AppBar row count.** `stickyTop` must include the row-2 height only when
   `hasToolbar`. A page that mounts BOTH a `ToolbarSlot` and a `StickyBar` → 2-row AppBar → the
   sticky bar must offset by the taller height, or it underlaps the AppBar.
2. **Gutter span.** `<main>` has `px: 2`. The strip spans full content width via `mx: -2 / px: 2`;
   verify it aligns to the content column edges and does not underlap the drawers (it is inside
   `<main>`, so it cannot — but confirm no horizontal overflow).
3. **Gating.** No `hasStickyBar` → nothing renders, no reserved space, no empty strip.
4. **Provider boundary.** `StickyBar` content (results counts) reads page hooks; it must render
   via the portal (in the page tree), which it does.
5. **Sticky vs. the root `overflowX: 'hidden'` (LOAD-BEARING — verify first).** The root shell
   `Box` (`layout-shell.tsx`, the outer `<Box sx={{ display: 'flex', minHeight: '100vh',
overflowX: 'hidden' }}>`) sets `overflow-x: hidden`. Per CSS, setting one axis of `overflow`
   to `hidden` computes the OTHER axis from `visible` to `auto` — so this Box's `overflow-y`
   becomes `auto`, making it a potential scroll container. `position: sticky` sticks relative to
   the nearest scroll-container ancestor, so if the page actually scrolls inside this Box rather
   than on the document/viewport, the sticky bar would pin to the wrong container (or not at all).
   MITIGATION / verification order:
   (a) First determine where scrolling happens: if the Box is `minHeight: 100vh` (not a fixed
   height) and its content can exceed the viewport, the document/`<body>` is usually the
   scroller and sticky works — but this MUST be confirmed in-browser, not assumed.
   (b) If sticky misbehaves, the fix is to stop the root Box from being a scroll container:
   change `overflowX: 'hidden'` to `overflowX: 'clip'` (clips overflow WITHOUT establishing
   a scroll container / without forcing `overflow-y: auto`). `overflow-x: clip` is the modern
   replacement for exactly this pattern and is broadly supported. Verify the horizontal-clip
   behavior the shell relies on is preserved after the switch.
   (c) Do NOT move the sticky bar out of `<main>` to work around this — the design requires it in
   the content column. Fix the overflow context instead.
   This is the single highest-risk item in the design; validate it before wiring pages.

## Testing

No test framework — static + manual.

- `yarn tsc --noEmit` and `yarn lint` clean.
- Temporary throwaway `<StickyBar>Test</StickyBar>` on `/eureka` to verify:
  - **Pins flush under the AppBar on scroll** — this is the make-or-break check for edge case
    #5 (the root `overflowX: 'hidden'` scroll-container risk). If it scrolls away with the page
    instead of sticking, apply the `overflowX: 'clip'` mitigation and re-test.
  - Offset correct on a 1-row page (no ToolbarSlot) vs a 2-row page (with ToolbarSlot) — no
    overlap, no gap.
  - Collapses to nothing when no page mounts a StickyBar.
  - Solid `background.paper` bg + bottom border render correctly in light and dark.
  - Spans the content column width, respects the gutter, does not underlap the drawers or
    cause horizontal overflow.
  - Remove the throwaway before committing the mechanism (or keep it behind the real page
    wiring done separately).

## Out of scope

- Page wiring (results counts, tabs) — done separately per the user's plan.
- Any change to the existing `ToolbarSlot` / AppBar second row.
