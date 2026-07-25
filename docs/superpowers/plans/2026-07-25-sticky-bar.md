# StickyBar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a page-scoped sticky sub-toolbar that lives inside `<main>`, pins just below the fixed AppBar on scroll, and is fed by pages via a portal — the mechanism only (no page wiring).

**Architecture:** A new `StickyBar` portal component (twin of `ToolbarSlot`/`SidebarBody`) registers presence and portals its children into a single target the shell renders inside `<main>`, above `{children}`. The container is `position: sticky` with a `top` derived from the shell's existing `hasToolbar` state; it renders only when a page has mounted a `StickyBar` (`hasStickyBar`). Visual: opaque `background.paper` strip with a bottom divider.

**Tech Stack:** Next.js 16 App Router, React 19, MUI v9, `react-dom` `createPortal`, TypeScript.

## Global Constraints

- **No test framework in the repo.** Every task's gate is `yarn tsc --noEmit` and `yarn lint` clean, plus the task's manual check. Do NOT scaffold a test framework.
- **Package manager: Yarn.** Never npm/pnpm.
- **Prettier:** no semicolons, single quotes, 2-space indent, 100-char width. The PostToolUse hook runs `yarn format && yarn lint:fix` then `yarn tsc --noEmit` after every edit — let it.
- **Path alias:** `@/` = project root.
- **Branch:** work on `layout-shell-consolidation` (already checked out). Never push to `main`.
- **Mirror the existing idiom exactly.** `StickyBar`/`useStickyBar` must match the shape of `ToolbarSlot`/`useToolbar` and `SidebarBody`/`useSidebar` already in the codebase — count-based `hasStickyBar`, `useCallback` register/unregister, callback-ref target publish, `useX` hook throws outside the provider.
- **Mechanism only.** Do NOT wire any real page (no results counts, no tabs). A throwaway test `StickyBar` is used for manual verification and removed before the final commit.

## File Structure

- `components/navbar/navbar-toolbar-context.tsx` (modify) — add `StickyBarContext` + state + `useStickyBar`.
- `components/sticky-bar.tsx` (create) — the portal component.
- `components/layout-shell.tsx` (modify) — consume `useStickyBar`, add callback ref, compute `stickyTop`, render the gated sticky container in `<main>`.

---

## Task 1: Add StickyBar state to the context

**Files:**

- Modify: `components/navbar/navbar-toolbar-context.tsx`

**Interfaces:**

- Produces: `useStickyBar(): { stickyBarTarget: HTMLElement | null; setStickyBarTarget: (el: HTMLElement | null) => void; hasStickyBar: boolean; registerStickyBar: () => void; unregisterStickyBar: () => void }`. All existing hooks (`useNavDrawer`, `useSidebar`, `useToolbar`) unchanged.

- [ ] **Step 1: Add the StickyBar context type**

In `components/navbar/navbar-toolbar-context.tsx`, after the `ToolbarContextType` definition (the block ending at the `}` before `export const NavDrawerContext`), add:

```tsx
type StickyBarContextType = {
  stickyBarTarget: HTMLElement | null
  setStickyBarTarget: (el: HTMLElement | null) => void
  hasStickyBar: boolean
  registerStickyBar: () => void
  unregisterStickyBar: () => void
}
```

- [ ] **Step 2: Add the context object**

Immediately after the line `export const ToolbarContext = React.createContext<ToolbarContextType | null>(null)`, add:

```tsx
export const StickyBarContext = React.createContext<StickyBarContextType | null>(null)
```

- [ ] **Step 3: Add the provider state**

In `DrawerStateProvider`, after the toolbar state block (the lines defining `toolbarTarget`, `toolbarCount`, `registerToolbar`, `unregisterToolbar`, `hasToolbar`), add:

```tsx
const [stickyBarTarget, setStickyBarTarget] = React.useState<HTMLElement | null>(null)
const [stickyBarCount, setStickyBarCount] = React.useState(0)
const registerStickyBar = React.useCallback(() => setStickyBarCount((n) => n + 1), [])
const unregisterStickyBar = React.useCallback(
  () => setStickyBarCount((n) => Math.max(0, n - 1)),
  []
)
const hasStickyBar = stickyBarCount > 0
```

- [ ] **Step 4: Wrap children in the provider**

Replace the `<ToolbarContext.Provider …>{children}</ToolbarContext.Provider>` block so a `StickyBarContext.Provider` nests inside it around `{children}`:

```tsx
<ToolbarContext.Provider
  value={{
    toolbarTarget,
    setToolbarTarget,
    hasToolbar,
    registerToolbar,
    unregisterToolbar,
  }}
>
  <StickyBarContext.Provider
    value={{
      stickyBarTarget,
      setStickyBarTarget,
      hasStickyBar,
      registerStickyBar,
      unregisterStickyBar,
    }}
  >
    {children}
  </StickyBarContext.Provider>
</ToolbarContext.Provider>
```

- [ ] **Step 5: Add the hook**

After the `useToolbar()` function at the end of the file, add:

```tsx
export function useStickyBar() {
  const ctx = React.useContext(StickyBarContext)
  if (!ctx) throw new Error('useStickyBar must be used within DrawerStateProvider')
  return ctx
}
```

- [ ] **Step 6: Typecheck + lint**

Run: `yarn tsc --noEmit && yarn lint`
Expected: clean. Existing hooks still compile (only additions were made).

- [ ] **Step 7: Commit**

```bash
git add components/navbar/navbar-toolbar-context.tsx
git commit -m "feat(layout): add StickyBar registration to the shell context"
```

---

## Task 2: Create the StickyBar portal component

**Files:**

- Create: `components/sticky-bar.tsx`

**Interfaces:**

- Consumes: `useStickyBar()` (Task 1).
- Produces: `export default function StickyBar({ children }: { children: React.ReactNode })`.

- [ ] **Step 1: Write the component**

Create `components/sticky-bar.tsx`:

```tsx
'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { useStickyBar } from '@/components/navbar/navbar-toolbar-context'

// Renders its children into the root LayoutShell's sticky sub-toolbar target (inside
// the <main> column, pinned under the AppBar). Registers presence so the shell knows a
// sticky bar exists (hasStickyBar). Rendered by a page UNDER its own data providers, so
// its content's hooks (useEurekaData, useOutfitData, etc.) still work while the DOM
// lands in the shell. Mirrors components/toolbar-slot.tsx and sidebar/sidebar-body.tsx.
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

- [ ] **Step 2: Typecheck + lint**

Run: `yarn tsc --noEmit && yarn lint`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add components/sticky-bar.tsx
git commit -m "feat(layout): add StickyBar portal component"
```

---

## Task 3: Render the sticky container in the shell's main column

**Files:**

- Modify: `components/layout-shell.tsx`

**Interfaces:**

- Consumes: `useStickyBar()` (Task 1); the existing `hasToolbar`, `theme`, `shellToolbarTop` is NOT imported here — build the responsive `top` inline from breakpoint values (see below).

Context for the implementer — the CURRENT shell `<main>` (do not assume older versions):

```tsx
<Stack
  component="main"
  sx={{ flexGrow: 1, minHeight: '100vh', minWidth: { xs: 0, md: 320 }, px: 2 }}
>
  <DrawerHeader />
  {hasToolbar && <Toolbar />}
  <Box sx={{ height: theme.spacing(2) }} /> {/* Box spacer for AppBar mask */}
  {children}
  <Footer />
</Stack>
```

The top spacers here are: `<DrawerHeader />` (height = `theme.mixins.toolbar`, i.e. the responsive 56/48/64 toolbar height), a conditional `<Toolbar />` when `hasToolbar` (another 56/48/64), and a 16px mask `Box`. The sticky bar sits AFTER these spacers, so its `top` must equal the fixed AppBar's on-screen height, which is the same composition: row1 (+ row2 when hasToolbar) + 16px mask.

NOTE for the implementer: the row-2 height is the responsive `<Toolbar />` height (56/48/64 per breakpoint), NOT the `TOOLBAR_ROW_2_HEIGHT` constant. `TOOLBAR_ROW_2_HEIGHT` (fixed 56) is currently unused in the shell; do NOT reintroduce it here — matching the actual `<Toolbar />` height per breakpoint (as Step 3 does) is intentional and more correct.

- [ ] **Step 1: Consume useStickyBar and add the callback ref**

In `components/layout-shell.tsx`, find the destructure `const { setToolbarTarget, hasToolbar } = useToolbar()` and add a `useStickyBar` call right after it:

```tsx
const { setToolbarTarget, hasToolbar } = useToolbar()
const { setStickyBarTarget, hasStickyBar } = useStickyBar()
```

Add the import to the existing context import line. Change:

```tsx
import { useNavDrawer, useSidebar, useToolbar } from './navbar/navbar-toolbar-context'
```

to:

```tsx
import { useNavDrawer, useSidebar, useStickyBar, useToolbar } from './navbar/navbar-toolbar-context'
```

- [ ] **Step 2: Add the callback ref**

Next to the existing `setToolbarNode` callback ref, add:

```tsx
const setStickyBarNode = React.useCallback(
  (node: HTMLDivElement | null) => setStickyBarTarget(node),
  [setStickyBarTarget]
)
```

- [ ] **Step 3: Compute the sticky top offset**

Before the `return (` of `LayoutShell`, after the existing derived values (e.g. after `const sidebarDrawerOpen = …`), add:

```tsx
// The fixed AppBar's on-screen height: row 1 (responsive 56/48/64) + a 16px mask
// spacer, plus row 2 (another 56/48/64) only when a page injected a ToolbarSlot.
// The sticky bar pins flush beneath it, so its `top` mirrors that composition across
// the same breakpoints the toolbar height uses.
const MASK_SPACER = 16
const row2 = hasToolbar ? 56 : 0
const stickyTop = {
  top: 56 + MASK_SPACER + row2,
  '@media (orientation: landscape)': { top: 48 + MASK_SPACER + (hasToolbar ? 48 : 0) },
  '@media (min-width:600px)': { top: 64 + MASK_SPACER + (hasToolbar ? 64 : 0) },
}
```

- [ ] **Step 4: Render the gated sticky container in `<main>`**

In the `<main>` `Stack`, insert the sticky container between the mask-spacer `Box` and `{children}`:

```tsx
        <DrawerHeader />
        {hasToolbar && <Toolbar />}
        <Box sx={{ height: theme.spacing(2) }} /> {/* Box spacer for AppBar mask */}
        {hasStickyBar && (
          <Box
            sx={{
              position: 'sticky',
              top: stickyTop,
              zIndex: (t) => t.zIndex.appBar - 1,
              bgcolor: 'background.paper',
              borderBottom: 1,
              borderColor: 'divider',
              mx: -2,
              px: 2,
            }}
          >
            <Box ref={setStickyBarNode} />
          </Box>
        )}
        {children}
        <Footer />
```

- [ ] **Step 5: Typecheck + lint**

Run: `yarn tsc --noEmit && yarn lint`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add components/layout-shell.tsx
git commit -m "feat(layout): render StickyBar sticky container in the main column"
```

---

## Task 4: Manual verification with a throwaway StickyBar; resolve the sticky/overflow risk

**Files:**

- Temporarily edit (then revert): `app/eureka/page.tsx` (or any page) to mount a test `StickyBar`.
- Possibly modify: `components/layout-shell.tsx` (only if the overflow mitigation is needed).

This task has NO commit unless the overflow mitigation (Step 4) is required.

- [ ] **Step 1: Add a throwaway StickyBar**

In `app/eureka/page.tsx`, import and render a test bar inside the page (under its providers):

```tsx
import StickyBar from '@/components/sticky-bar'
// …inside the returned JSX, e.g. just inside <PageShell> or above the content:
;<StickyBar>
  <div style={{ padding: 8 }}>Sticky bar test — results count / tabs go here</div>
</StickyBar>
```

- [ ] **Step 2: Run the app and verify pinning**

Run: `yarn dev`, open `http://localhost:3000/eureka`, scroll the page.
Expected: the test strip appears below the AppBar and PINS there as you scroll (stays put while content scrolls under it). Solid `background.paper` bg + bottom divider. Spans the content column width; no horizontal overflow; does not underlap the drawers.

- [ ] **Step 3: Verify the offset on 1-row vs 2-row AppBar**

`/eureka` mounts a `ToolbarSlot` (2-row AppBar) — confirm the sticky bar sits flush below the SECOND row, no overlap, no gap. Then temporarily mount the test `StickyBar` on a page WITHOUT a ToolbarSlot (e.g. `/about`) and confirm it sits flush below the SINGLE row.

- [ ] **Step 4: If it does NOT pin — apply the overflow mitigation**

If the strip scrolls away instead of sticking, the root shell `Box`'s `overflowX: 'hidden'` made it a scroll container (its `overflow-y` computed to `auto`). Fix in `components/layout-shell.tsx`: change the root Box

```tsx
    <Box sx={{ display: 'flex', minHeight: '100vh', overflowX: 'hidden' }}>
```

to

```tsx
    <Box sx={{ display: 'flex', minHeight: '100vh', overflowX: 'clip' }}>
```

`overflow-x: clip` clips horizontal overflow WITHOUT establishing a scroll container, so document-level scroll resumes and sticky works. Re-run Step 2. Verify the horizontal clipping the shell relied on still holds (no horizontal scrollbar appears; drawers/content don't spill).

If the mitigation was applied, commit it:

```bash
git add components/layout-shell.tsx
git commit -m "fix(layout): use overflow-x clip so sticky positioning works in main"
```

- [ ] **Step 5: Remove the throwaway StickyBar**

Revert the test edit to `app/eureka/page.tsx` (restore it to its committed state):

```bash
git checkout app/eureka/page.tsx
```

Confirm `git status` shows no stray changes to `page.tsx`.

- [ ] **Step 6: Final gate**

Run: `yarn tsc --noEmit && yarn lint && yarn build`
Expected: all clean; build exit 0. Confirm `git status` is clean except any intended mitigation commit from Step 4.

---

## Sequencing note

Tasks 1→2→3 are the mechanism and each ends green and committed. Task 4 is verification; its only possible code change is the `overflow-x: clip` mitigation, which commits separately if needed. Page wiring (results counts, tabs) is intentionally out of scope and done later by the user.
