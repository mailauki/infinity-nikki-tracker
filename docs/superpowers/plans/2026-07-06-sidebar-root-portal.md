# Root-Mounted Sidebar (Portal) + Sticky Toolbar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the sidebar drawer chrome to the root layout as a flex sibling of `main`, project page bodies into it via a React portal, make `NavBarToolbar` sticky instead of fixed, and remove the content-shim, the route registry, the AppBar sidebar-inset, and one layout spacer.

**Architecture:** A root-mounted `SidebarShell` renders the drawer chrome and publishes a portal-target DOM node + open/`hasBody` state through the sidebar context. Pages render a `SidebarBody` under their own data providers; it `createPortal`s its children into the shell's node and registers presence. Because the permanent drawer is a flex sibling of `main`, the push is pure flexbox — no margin math, no registry. `NavBarToolbar` becomes `position: sticky` (in-flow), auto-sizing to `main`.

**Tech Stack:** Next.js 16 App Router, MUI v9 (styled Drawer, portals via `@mui/material` / `react-dom` `createPortal`), React context, TypeScript. No unit-test framework.

## Global Constraints

- Package manager **Yarn**. Only `dev/build/start/lint/format/lint:fix` are scripts.
- Style: no semicolons, single quotes, 2-space indent, 100-char width, trailing commas ES5 (Prettier). Path alias `@/`.
- **No unit-test framework.** Verify with `yarn tsc --noEmit`, `yarn lint`, and driving the running app. PostToolUse hook runs format+lint:fix+tsc after each edit.
- Client components/hooks need `'use client'`.
- Branch `feat/dynamic-sidebar` (PR #254). This baseline does NOT have the Phase 2b refactor: `lib/sidebar-registry.ts` + `components/sidebar/sidebar-content-shim.tsx` exist; nav-bar/navbar-toolbar have INLINE inset math (no `useAppBarInsets`, no `lib/layout-constants.ts`); `NAV_DRAWER_WIDTH` is exported from `nav-drawer.tsx`; `DEFAULT_SIDEBAR_WIDTH`/`SIDEBAR_STORAGE_KEY` are private consts in `components/sidebar/sidebar.tsx`.
- **Validated prototype values (do not re-derive):** sticky `NavBarToolbar` = `position: sticky`, `sx={{ top: 80, zIndex: (theme) => theme.zIndex.appBar, borderColor: 'transparent' }}`, single `<Toolbar sx={{ mb: 2 }}>{children}</Toolbar>`.
- Known-benign: the NavBar gradient-className hydration warning pre-exists — ignore it.
- Ordering keeps the tree compiling: context → shell+body → consumers → layout+sticky → delete dead code → verify.
- `git add` for `[slug]` paths must be quoted (zsh).

## File Structure

- **Modify** `components/navbar/navbar-toolbar-context.tsx` — extend `SidebarContext` with `portalTarget`/`setPortalTarget` + `hasBody`/`registerBody`/`unregisterBody`.
- **Create** `components/sidebar/sidebar-shell.tsx` — root-mounted drawer chrome + portal target publisher.
- **Create** `components/sidebar/sidebar-body.tsx` — `createPortal` + presence registration.
- **Modify** `components/filter/filter-menu.tsx` — render toggle inline; wrap `<List>` bodies in `<SidebarBody>`; drop the registry short-circuit.
- **Modify** `app/looks/look-builder.tsx` — composer in `<SidebarBody>`; toggle stays.
- **Modify** `app/layout.tsx` — mount `SidebarShell` as sibling of `main`; drop `SidebarContentShim`; collapse two spacers to one.
- **Modify** `components/navbar/nav-bar.tsx` — drop the sidebar inset (Option A).
- **Modify** `components/navbar/navbar-toolbar.tsx` — fixed→sticky; strip inset math.
- **Delete** `components/sidebar/sidebar.tsx`, `components/sidebar/sidebar-content-shim.tsx`, `lib/sidebar-registry.ts`.

---

### Task 1: Extend the sidebar context

**Files:**

- Modify: `components/navbar/navbar-toolbar-context.tsx`

**Interfaces:**

- Produces: `useSidebar()` returns `{ sidebarOpen, setSidebarOpen, portalTarget, setPortalTarget, hasBody, registerBody, unregisterBody }`.
  - `portalTarget: HTMLElement | null`; `setPortalTarget: (el: HTMLElement | null) => void`
  - `hasBody: boolean`; `registerBody: () => void`; `unregisterBody: () => void`

- [ ] **Step 1: Add state + methods to the provider**

In `components/navbar/navbar-toolbar-context.tsx`, extend the `SidebarContextType` and the provider. Current type:

```tsx
type SidebarContextType = {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}
```

Replace with:

```tsx
type SidebarContextType = {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  portalTarget: HTMLElement | null
  setPortalTarget: (el: HTMLElement | null) => void
  hasBody: boolean
  registerBody: () => void
  unregisterBody: () => void
}
```

In the provider body (where `sidebarOpen` state lives), add:

```tsx
const [portalTarget, setPortalTarget] = React.useState<HTMLElement | null>(null)
const [bodyCount, setBodyCount] = React.useState(0)
const registerBody = React.useCallback(() => setBodyCount((n) => n + 1), [])
const unregisterBody = React.useCallback(() => setBodyCount((n) => Math.max(0, n - 1)), [])
const hasBody = bodyCount > 0
```

Add all seven fields to the `SidebarContext.Provider` `value`.

- [ ] **Step 2: Type-check**

Run: `yarn tsc --noEmit 2>&1 | grep -oE "(components|app)/[^ ]+\.tsx" | sort -u`
Expected: no errors (adding optional-consumed fields; existing `useSidebar` consumers only read `sidebarOpen`/`setSidebarOpen`, still present).

- [ ] **Step 3: Commit**

```bash
git add components/navbar/navbar-toolbar-context.tsx
git commit -m "feat(sidebar): add portal-target + hasBody registration to sidebar context"
```

---

### Task 2: SidebarShell (root-mounted drawer chrome)

**Files:**

- Create: `components/sidebar/sidebar-shell.tsx`

**Interfaces:**

- Consumes: `useSidebar()` (Task 1); `DEFAULT_SIDEBAR_WIDTH` (define locally here — see step; on this branch it is a private const in `sidebar.tsx` which is deleted in Task 7).
- Produces: default export `SidebarShell`.

- [ ] **Step 1: Create the shell**

Create `components/sidebar/sidebar-shell.tsx`. It is the drawer chrome from today's `Sidebar` (temp + permanent drawers) MINUS the toggle button and children — instead it renders a ref'd content node that becomes `portalTarget`, and only renders/pushes when `hasBody`:

```tsx
'use client'

import * as React from 'react'
import {
  CSSObject,
  Drawer as MuiDrawer,
  IconButton,
  Stack,
  styled,
  Theme,
  Toolbar,
} from '@mui/material'
import { Close } from '@mui/icons-material'
import { useSidebar } from '@/components/navbar/navbar-toolbar-context'

export const DEFAULT_SIDEBAR_WIDTH = 400

const openedMixin = (theme: Theme): CSSObject => ({
  height: 'calc(100vh - 100px)',
  border: 0,
  borderRadius: '30px',
  marginTop: 80,
  marginBottom: 20,
  width: DEFAULT_SIDEBAR_WIDTH,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
})

const closedMixin = (theme: Theme): CSSObject => ({
  height: 'calc(100vh - 100px)',
  border: 0,
  borderRadius: '30px',
  marginTop: 80,
  marginBottom: 20,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: 0,
})

const PermanentDrawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme }) => ({
    width: DEFAULT_SIDEBAR_WIDTH,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    variants: [
      {
        props: ({ open }) => open,
        style: { ...openedMixin(theme), '& .MuiDrawer-paper': openedMixin(theme) },
      },
      {
        props: ({ open }) => !open,
        style: { ...closedMixin(theme), '& .MuiDrawer-paper': closedMixin(theme) },
      },
    ],
  })
)

// Root-mounted sidebar chrome: a temporary overlay drawer below `sm` and a
// permanent, content-pushing drawer at `sm`+. Renders nothing until a page mounts
// a <SidebarBody> (hasBody). Publishes its content node as the portal target so the
// page body (rendered under its own data providers) can portal in.
//
// Portal-target correctness: only ONE `<div ref={contentRef}>` exists. It is
// rendered inside whichever drawer is currently active for the viewport
// (temporary below `sm`, permanent at `sm`+), chosen by `useMediaQuery`. Because
// only one drawer is shown at a time, the single ref reattaches to the visible
// drawer's node on breakpoint change, and the layout effect re-publishes it.
export default function SidebarShell() {
  const { sidebarOpen, setSidebarOpen, setPortalTarget, hasBody } = useSidebar()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const contentRef = React.useRef<HTMLDivElement | null>(null)

  // Re-publish the target whenever the active drawer (breakpoint) changes, so the
  // portal always points at the mounted node. `isMobile` in the dep array forces
  // the effect to re-run after the ref reattaches to the other drawer.
  React.useLayoutEffect(() => {
    setPortalTarget(contentRef.current)
    return () => setPortalTarget(null)
  }, [setPortalTarget, isMobile])

  const header = (
    <Toolbar>
      <Stack
        direction="row"
        sx={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', mt: 0.5 }}
      >
        <IconButton onClick={() => setSidebarOpen(false)}>
          <Close />
        </IconButton>
      </Stack>
    </Toolbar>
  )

  const target = <div ref={contentRef} />

  // The drawer opens/pushes only when a body is present and the sidebar is open.
  const open = hasBody && sidebarOpen

  return (
    <>
      <MuiDrawer
        anchor="right"
        open={open}
        slotProps={{ root: { disableScrollLock: true } }}
        sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { width: '100%' } }}
        variant="temporary"
        onClose={() => setSidebarOpen(false)}
      >
        {header}
        {isMobile && target}
      </MuiDrawer>
      <PermanentDrawer
        anchor="right"
        open={open}
        sx={{ display: { xs: 'none', sm: 'block' } }}
        variant="permanent"
      >
        {header}
        {!isMobile && target}
      </PermanentDrawer>
    </>
  )
}
```

Add `useMediaQuery, useTheme` to the `@mui/material` import at the top of the file (alongside `Drawer as MuiDrawer, IconButton, Stack, styled, Theme, Toolbar` and `CSSObject`).

Why this is correct: `{isMobile && target}` / `{!isMobile && target}` guarantees the single `contentRef` div is mounted in exactly one drawer — the visible one. On a breakpoint cross, React unmounts it from one drawer and mounts it in the other; the `useLayoutEffect` (keyed on `isMobile`) re-publishes the new node as `portalTarget`, and `SidebarBody` re-portals. No dual node, no empty-drawer bug.

- [ ] **Step 2: Confirm the single-target structure**

Verify the file renders exactly one `<div ref={contentRef} />` via the `target` variable, gated `{isMobile && target}` in the temporary drawer and `{!isMobile && target}` in the permanent drawer, and that `useMediaQuery`/`useTheme` are imported.

- [ ] **Step 3: Type-check**

Run: `yarn tsc --noEmit 2>&1 | grep 'sidebar-shell' || echo "sidebar-shell clean"`
Expected: `sidebar-shell clean`.

- [ ] **Step 4: Commit**

```bash
git add components/sidebar/sidebar-shell.tsx
git commit -m "feat(sidebar): add root-mounted SidebarShell with portal target"
```

---

### Task 3: SidebarBody (portal + presence)

**Files:**

- Create: `components/sidebar/sidebar-body.tsx`

**Interfaces:**

- Consumes: `useSidebar()` (Task 1).
- Produces: default export `SidebarBody({ children })`.

- [ ] **Step 1: Create the body**

Create `components/sidebar/sidebar-body.tsx`:

```tsx
'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { useSidebar } from '@/components/navbar/navbar-toolbar-context'

// Renders its children into the root SidebarShell's portal target. Registers
// presence so the shell knows a body exists (hasBody). Rendered by a page UNDER
// its own data providers, so the body's hooks (useEurekaData, etc.) still work.
export default function SidebarBody({ children }: { children: React.ReactNode }) {
  const { portalTarget, registerBody, unregisterBody } = useSidebar()

  React.useEffect(() => {
    registerBody()
    return unregisterBody
  }, [registerBody, unregisterBody])

  if (!portalTarget) return null
  return createPortal(children, portalTarget)
}
```

- [ ] **Step 2: Type-check**

Run: `yarn tsc --noEmit 2>&1 | grep 'sidebar-body' || echo "sidebar-body clean"`
Expected: `sidebar-body clean`.

- [ ] **Step 3: Commit**

```bash
git add components/sidebar/sidebar-body.tsx
git commit -m "feat(sidebar): add SidebarBody portal component"
```

---

### Task 4: FilterMenu → toggle inline + SidebarBody

**Files:**

- Modify: `components/filter/filter-menu.tsx`

**Interfaces:**

- Consumes: `SidebarBody` (Task 3); `useSidebar()` (`setSidebarOpen`).
- Produces: `FilterMenu` renders a `FilterList` toggle `IconButton` + `<SidebarBody>` bodies.

- [ ] **Step 1: Replace `<Sidebar>` wrappers with toggle + SidebarBody**

In `components/filter/filter-menu.tsx`:

- Remove `import Sidebar from '@/components/sidebar/sidebar'`; add `import SidebarBody from '@/components/sidebar/sidebar-body'`, `import { FilterList } from '@mui/icons-material'` (if not already imported), and ensure `IconButton` is imported from `@mui/material`.
- Delete the `if (!sidebarConfigFor(pathname)) return null` line and the `import { sidebarConfigFor } from '@/lib/sidebar-registry'`. (`pathname`/`usePathname` may still be used for the `isOutfits` branch — keep those.)
- Get `setSidebarOpen` from `useSidebar()` (already imported for `closeFilter`).
- Both the outfits branch and the eureka branch currently `return ( <Sidebar> <List>…</List> </Sidebar> )`. Change each to render a fragment with the toggle button + the body:

```tsx
return (
  <>
    <IconButton
      color={sidebarOpen ? 'primary' : 'default'}
      onClick={() => {
        const next = !sidebarOpen
        setSidebarOpen(next)
        localStorage.setItem('sidebar-open', String(next))
      }}
    >
      <FilterList />
    </IconButton>
    <SidebarBody>
      <List>{/* …existing list items unchanged… */}</List>
    </SidebarBody>
  </>
)
```

Apply this shape to BOTH branches (outfits + eureka), keeping each branch's existing `<List>` contents verbatim. `sidebarOpen` comes from `useSidebar()` — add it to the destructure.

- [ ] **Step 2: Type-check + lint**

Run: `yarn tsc --noEmit && yarn lint 2>&1 | tail -5`
Expected: tsc clean; lint no new errors (remove any now-unused imports it flags — e.g. `sidebarConfigFor`).

- [ ] **Step 3: Commit**

```bash
git add components/filter/filter-menu.tsx
git commit -m "refactor(filters): render toggle inline + filter body via SidebarBody"
```

---

### Task 5: Looks builder → composer via SidebarBody

**Files:**

- Modify: `app/looks/look-builder.tsx`

**Interfaces:**

- Consumes: `SidebarBody` (Task 3). Keeps its existing `Tune` toggle + `useSidebar` auto-open effect.

- [ ] **Step 1: Wrap the composer in SidebarBody**

In `app/looks/look-builder.tsx`:

- Remove `import Sidebar from '@/components/sidebar/sidebar'`; add `import SidebarBody from '@/components/sidebar/sidebar-body'`.
- The builder currently renders `<Sidebar icon={<TuneIcon />} title={…}>{composerPanel}</Sidebar>` inside its `NavBarToolbar`. The toggle must stay in the toolbar, and the composer moves to a `SidebarBody`. Replace that `<Sidebar>` element with a toggle `IconButton` (in the toolbar) plus a `<SidebarBody>` (anywhere in the builder's render — it portals regardless of position; put it right after the `NavBarToolbar` block):

Toolbar toggle (inside `<NavBarToolbar>`, after the Cancel/Save Stack):

```tsx
<IconButton
  color={sidebarOpen ? 'primary' : 'default'}
  onClick={() => {
    const next = !sidebarOpen
    setSidebarOpen(next)
    localStorage.setItem('sidebar-open', String(next))
  }}
>
  <TuneIcon />
</IconButton>
```

Body (after `</NavBarToolbar>`, before `<PageShell>`):

```tsx
<SidebarBody>{composerPanel}</SidebarBody>
```

Add `sidebarOpen` to the `useSidebar()` destructure (currently only `setSidebarOpen`). Ensure `IconButton` is imported from `@mui/material`.

- [ ] **Step 2: Type-check + lint**

Run: `yarn tsc --noEmit && yarn lint 2>&1 | tail -5`
Expected: tsc clean; no new lint errors.

- [ ] **Step 3: Commit**

```bash
git add 'app/looks/look-builder.tsx'
git commit -m "refactor(looks): render composer via SidebarBody, keep toggle in toolbar"
```

---

### Task 6: Root layout — mount SidebarShell, drop shim + one spacer

**Files:**

- Modify: `app/layout.tsx`

**Interfaces:**

- Consumes: `SidebarShell` (Task 2).

- [ ] **Step 1: Restructure the content column**

In `app/layout.tsx`:

- Add `import SidebarShell from '@/components/sidebar/sidebar-shell'`.
- Remove `import SidebarContentShim from '@/components/sidebar/sidebar-content-shim'`.
- Replace the `<SidebarContentShim>…</SidebarContentShim>` block. Current:

```tsx
<SidebarContentShim>
  <Suspense>
    <NavBar />
  </Suspense>
  <Toolbar sx={{ mb: 2 }} />
  <Toolbar sx={{ mb: 2 }} />
  {/* ^ Toolbar spacers for NavBar and NavBarToolbar */}
  <Suspense>
    <PullToRefresh />
  </Suspense>
  <Stack component="main" sx={{ flex: 1, p: 2 }}>
    {children}
  </Stack>
  <Footer />
</SidebarContentShim>
```

Replace with:

```tsx
<Stack sx={{ flex: 1, minWidth: 0 }}>
  <Suspense>
    <NavBar />
  </Suspense>
  <Toolbar sx={{ mb: 2 }} />
  {/* ^ single spacer for the fixed NavBar; NavBarToolbar is sticky/in-flow */}
  <Suspense>
    <PullToRefresh />
  </Suspense>
  <Box sx={{ display: 'flex', flex: 1, minWidth: 0 }}>
    <Stack component="main" sx={{ flex: 1, minWidth: 0, p: 2 }}>
      {children}
    </Stack>
    <SidebarShell />
  </Box>
  <Footer />
</Stack>
```

- Add `Box` to the `@mui/material` import (alongside `CssBaseline, Stack, Toolbar`).

Note: the outer `<Stack sx={{ flex: 1, minWidth: 0 }}>` replaces the content-column role the shim played (it was `flex: 1`). `minWidth: 0` lets `main` shrink so the sidebar can push it.

- [ ] **Step 2: Type-check + lint**

Run: `yarn tsc --noEmit && yarn lint 2>&1 | tail -5`
Expected: tsc clean; no new lint errors.

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "refactor(layout): mount SidebarShell beside main, drop content-shim + one spacer"
```

---

### Task 7: NavBar drop inset; NavBarToolbar fixed→sticky; delete dead files

**Files:**

- Modify: `components/navbar/nav-bar.tsx`
- Modify: `components/navbar/navbar-toolbar.tsx`
- Delete: `components/sidebar/sidebar.tsx`, `components/sidebar/sidebar-content-shim.tsx`, `lib/sidebar-registry.ts`

**Interfaces:**

- Removes: the old `Sidebar` default export, `SidebarContentShim`, `sidebarConfigFor`/`SidebarConfig`.

- [ ] **Step 1: NavBar — drop the sidebar inset (Option A)**

In `components/navbar/nav-bar.tsx`, remove the sidebar half of the inset math. Current derivation:

```tsx
const { sidebarOpen } = useSidebar()
const pathname = usePathname()
const theme = useTheme()
const sidebarConfig = sidebarConfigFor(pathname)
const filterInset = sidebarOpen && sidebarConfig ? `${sidebarConfig.width}px` : '0px'
const navInset = drawerOpen
  ? `calc(${NAV_DRAWER_WIDTH}px) - 21px`
  : `calc(${theme.spacing(10)} + 21px)`
```

Change to (drop `sidebarConfig`/`filterInset`/`useSidebar`/`usePathname`/`sidebarConfigFor`):

```tsx
const theme = useTheme()
const navInset = drawerOpen
  ? `calc(${NAV_DRAWER_WIDTH}px) - 21px`
  : `calc(${theme.spacing(10)} + 21px)`
```

In the `sx`, remove `mr: { xs: 0, sm: filterInset }` and change `width` from `calc(100% - ${navInset} - ${filterInset})` to `calc(100% - ${navInset})`. Remove now-unused imports: `useSidebar`, `usePathname`, `sidebarConfigFor`. Keep `useNavDrawer`, `useTheme`, `NAV_DRAWER_WIDTH`, `alpha`, `useColorTheme`.

- [ ] **Step 2: NavBarToolbar — fixed → sticky (validated values)**

Replace the entire body of `components/navbar/navbar-toolbar.tsx` with the validated sticky version:

```tsx
'use client'

import * as React from 'react'
import { AppBar, Toolbar } from '@mui/material'

export default function NavBarToolbar({ children }: { children: React.ReactNode }) {
  return (
    <AppBar
      color="transparent"
      component="div"
      position="sticky"
      sx={{
        borderColor: 'transparent',
        top: 80,
        zIndex: (theme) => theme.zIndex.appBar,
      }}
      variant="outlined"
    >
      <Toolbar sx={{ mb: 2 }}>{children}</Toolbar>
    </AppBar>
  )
}
```

This removes all inset math and imports (`usePathname`, `useNavDrawer`, `useSidebar`, `useTheme`, `sidebarConfigFor`, `NAV_DRAWER_WIDTH`) and collapses to one `<Toolbar>`.

- [ ] **Step 3: Delete the dead files**

```bash
git rm components/sidebar/sidebar.tsx components/sidebar/sidebar-content-shim.tsx lib/sidebar-registry.ts
```

- [ ] **Step 4: Type-check + lint + dead-symbol sweep**

Run: `yarn tsc --noEmit && yarn lint 2>&1 | tail -5`
Expected: tsc clean; no new lint errors.

Run: `grep -rn "sidebar-registry\|sidebarConfigFor\|SidebarContentShim\|sidebar-content-shim\|from '@/components/sidebar/sidebar'" app/ components/ lib/`
Expected: no matches.

- [ ] **Step 5: Commit**

```bash
git add components/navbar/nav-bar.tsx components/navbar/navbar-toolbar.tsx
git commit -m "refactor(navbar): drop sidebar inset, make NavBarToolbar sticky, remove dead sidebar files"
```

---

### Task 8: Final cross-cutting verification

**Files:** none (verification only; may add a small mobile-portal fix if Step 4 requires it).

- [ ] **Step 1: Full type-check + lint + sweep**

Run: `yarn tsc --noEmit && yarn lint 2>&1 | tail -5` — tsc clean; only the pre-existing `quick-access.tsx` warning.
Run: `grep -rn "sidebar-registry\|sidebarConfigFor\|SidebarContentShim\|filterInset\|from '@/components/sidebar/sidebar'" app/ components/ lib/` — no matches.

- [ ] **Step 2: Desktop sidebar push + reflow (running app)**

Dev server running. On `/eureka` at ≥1024px: toggle the filter button — the drawer opens as a flex sibling, `main` shrinks, the card grid reflows (5→4), the NavBar stays full width (no right-margin change). Close — reflows back. Repeat on `/outfits`.

- [ ] **Step 3: Sticky toolbar (running app)**

On `/eureka`, scroll down — confirm the "Showing…/sort/filter" toolbar pins at `top: 80` just below the NavBar (not hidden by the mask), spanning `main`'s width left of the sidebar. Confirm on `/profile` (non-sidebar) the toolbar sticks and there's no double gap (only one spacer). Confirm the page content isn't pushed down by a leftover second spacer.

- [ ] **Step 4: Mobile portal check**

Resize to <600px on `/eureka`. Toggle filters. Confirm the mobile (temporary) full-width drawer opens WITH the filter controls inside (the `isMobile`-gated portal target from Task 2 puts the body in the temporary drawer at this breakpoint). Cross the `sm` breakpoint (resize up past 600px with the drawer open) and confirm the body follows into the permanent drawer — no empty drawer, no lost content. If the mobile drawer is empty, the Task-2 `{isMobile && target}` / `{!isMobile && target}` gating or the `isMobile` effect dep is wrong — fix in `sidebar-shell.tsx` and re-verify.

- [ ] **Step 5: Looks builder (auth — user QA note)**

`/looks/new` requires login (test session unauthenticated). Note in the report that the controller/user must verify: composer portals into the shell, auto-opens for a new look, picker is full-width; `/looks/edit/[slug]` shows existing values.

- [ ] **Step 6: Non-sidebar + console**

`/about`: no drawer push, no toggle, unaffected. Console: no portal/hydration warnings beyond the known NavBar gradient warning.

- [ ] **Step 7: Push + PR update**

This folds into PR #254. Push the branch:

```bash
git push
```

If #254's PR body should mention the new architecture, update it. Note in the report that **#255 must rebase** (its `useAppBarInsets` shrinks to nav-drawer-only; `sidebar-registry` gone).

---

## Self-Review

**Spec coverage:**

- Context portal-target + hasBody → Task 1 ✓
- SidebarShell (root chrome, portal publish, hasBody gate) → Task 2 ✓
- SidebarBody (portal + presence) → Task 3 ✓
- FilterMenu toggle-inline + body + drop registry short-circuit → Task 4 ✓
- Looks composer via SidebarBody, toggle stays → Task 5 ✓
- Layout: SidebarShell beside main, drop shim + one spacer → Task 6 ✓
- NavBar drop inset (Option A) → Task 7 Step 1 ✓
- NavBarToolbar fixed→sticky (validated values) → Task 7 Step 2 ✓
- Delete Sidebar/shim/registry → Task 7 Step 3 ✓
- Verification incl. sticky, mobile portal risk, #255 rebase note → Task 8 ✓

**Placeholder scan:** No TBD/incomplete code steps. Task 2 uses a single `useMediaQuery`-gated portal target (mobile handled by design, not deferred); Task 8 Step 4 is a straight verification. PR-body update in Task 8 Step 7 is fill-at-time (standard).

**Type consistency:** `portalTarget`/`setPortalTarget`/`hasBody`/`registerBody`/`unregisterBody` consistent Tasks 1→2→3. `SidebarBody` default export consumed in Tasks 4/5. `DEFAULT_SIDEBAR_WIDTH` defined in sidebar-shell (Task 2), and the old private one is deleted with `sidebar.tsx` (Task 7) — no clash. `sidebar-open` localStorage string used consistently (matches existing context key).

**Ordering safety:** context (1) → shell (2) + body (3) both depend only on context → consumers (4,5) depend on body → layout (6) mounts shell → navbar/delete (7) removes old `Sidebar` only after no consumer references it (Tasks 4/5 already migrated). Tree compiles at each boundary.
