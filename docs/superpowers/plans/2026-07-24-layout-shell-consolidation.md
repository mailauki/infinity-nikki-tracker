# Layout Shell Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate the app's layout chrome into a single `LayoutShell` (mini-variant AppBar-on-top), migrate every per-page toolbar onto a portal-based context slot, and fold `PageShell`'s padding/min-width into the shell's `main` column.

**Architecture:** One `'use client'` `LayoutShell` owns the fixed `AppBar` (with the gradient/blur/mask styling moved off `NavBarToolbar`), both mini-variant drawers (left nav + right sidebar), and the `main` column. Pages inject a second AppBar toolbar row via a `ToolbarSlot` portal component — the same portal idiom the sidebar already uses — so injected toolbars keep executing under each page's own data providers. `NavDrawer`, `SidebarShell`, and `NavBarToolbar` are deleted once their logic moves in.

**Tech Stack:** Next.js 16 App Router, React 19, MUI v9 (`AppBar`/`Drawer`/`styled`/`useMediaQuery`), `react-dom` `createPortal`, TypeScript.

## Global Constraints

- **No test framework in the repo.** Every task's verification gate is `yarn tsc --noEmit` and `yarn lint` clean, plus the task's explicit manual smoke check. There is no `jest`/`vitest`; do NOT scaffold one.
- **Package manager: Yarn.** Never `npm`/`pnpm`.
- **Prettier:** no semicolons, single quotes, 2-space indent, 100-char width, ES5 trailing commas. The PostToolUse hook runs `yarn format && yarn lint:fix` then `yarn tsc --noEmit` after every edit.
- **Path alias:** `@/` = project root.
- **Dark-mode detection:** use `useColorScheme()` / the existing `useIsDarkMode()` hook, never `useTheme().palette.mode`.
- **Branch:** work on `layout-shell-consolidation` (already checked out). Never push to `main`.
- **`git add` with `[slug]` paths** must be quoted in zsh: `git add 'app/.../[slug]/page.tsx'`.
- **Cookie persistence rule:** the nav-drawer cookie (`NAV_DRAWER_STORAGE_KEY`) is written ONLY by the permanent (sm+) drawer's toggle. The temporary mobile drawer updates React state only (no cookie write). Neither sidebar variant persists.
- **Default-open rule:** initial open is `true` ONLY when a persisted value says so. Nav drawer opens on load only if the cookie equals `'true'`; the sidebar always starts closed.

---

## File Structure

- `components/navbar/navbar-toolbar-context.tsx` (modify) — add toolbar-slot state + a persist flag on the drawer setter.
- `components/toolbar-slot.tsx` (create) — portal component; the `SidebarBody` twin for the AppBar's second row.
- `components/layout-shell.tsx` (rewrite) — the single shell: AppBar + both mini drawers + main.
- `components/navbar/nav-drawer.tsx` (delete)
- `components/sidebar/sidebar-shell.tsx` (delete)
- `components/navbar/navbar-toolbar.tsx` (delete)
- `components/page-shell.tsx` (modify) — slim to width-variant wrapper.
- `app/layout.tsx` (modify) — remove commented block; drop moved imports.
- `lib/layout-constants.ts` (modify) — replace `navToolbarStackTop` with a shell-AppBar-height helper.
- `components/pull-to-refresh.tsx` (modify) — re-anchor to the shell AppBar bottom.
- 13 `*-toolbar.tsx` files (modify) — swap `<NavBarToolbar>` → `<ToolbarSlot>`.

---

## Task 1: Extend context with toolbar-slot state and a persist flag

**Files:**

- Modify: `components/navbar/navbar-toolbar-context.tsx`

**Interfaces:**

- Consumes: `NAV_DRAWER_STORAGE_KEY` from `@/lib/layout-constants`.
- Produces:
  - `useNavDrawer(): { drawerOpen: boolean; setDrawerOpen: (open: boolean, opts?: { persist?: boolean }) => void }` — `persist` defaults to `true`.
  - `useSidebar()` — unchanged signature.
  - `useToolbar(): { toolbarTarget: HTMLElement | null; setToolbarTarget: (el: HTMLElement | null) => void; hasToolbar: boolean; registerToolbar: () => void; unregisterToolbar: () => void }`

- [ ] **Step 1: Add toolbar state + persist flag to the provider**

Replace the body of `components/navbar/navbar-toolbar-context.tsx` with:

```tsx
'use client'

import * as React from 'react'
import { NAV_DRAWER_STORAGE_KEY } from '@/lib/layout-constants'

type NavDrawerContextType = {
  drawerOpen: boolean
  // persist defaults to true. The temporary mobile drawer passes { persist: false }
  // so opening the overlay never writes the cookie that seeds the permanent drawer.
  setDrawerOpen: (open: boolean, opts?: { persist?: boolean }) => void
}

type SidebarContextType = {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  portalTarget: HTMLElement | null
  setPortalTarget: (el: HTMLElement | null) => void
  hasBody: boolean
  registerBody: () => void
  unregisterBody: () => void
}

type ToolbarContextType = {
  toolbarTarget: HTMLElement | null
  setToolbarTarget: (el: HTMLElement | null) => void
  hasToolbar: boolean
  registerToolbar: () => void
  unregisterToolbar: () => void
}

export const NavDrawerContext = React.createContext<NavDrawerContextType | null>(null)
export const SidebarContext = React.createContext<SidebarContextType | null>(null)
export const ToolbarContext = React.createContext<ToolbarContextType | null>(null)

export function DrawerStateProvider({
  children,
  initialDrawerOpen = false,
}: {
  children: React.ReactNode
  initialDrawerOpen?: boolean
}) {
  const [drawerOpen, setDrawerOpenState] = React.useState(initialDrawerOpen)
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const [portalTarget, setPortalTarget] = React.useState<HTMLElement | null>(null)
  const [bodyCount, setBodyCount] = React.useState(0)
  const registerBody = React.useCallback(() => setBodyCount((n) => n + 1), [])
  const unregisterBody = React.useCallback(() => setBodyCount((n) => Math.max(0, n - 1)), [])
  const hasBody = bodyCount > 0

  const [toolbarTarget, setToolbarTarget] = React.useState<HTMLElement | null>(null)
  const [toolbarCount, setToolbarCount] = React.useState(0)
  const registerToolbar = React.useCallback(() => setToolbarCount((n) => n + 1), [])
  const unregisterToolbar = React.useCallback(() => setToolbarCount((n) => Math.max(0, n - 1)), [])
  const hasToolbar = toolbarCount > 0

  // persist defaults to true: the permanent drawer's toggle writes the cookie so the
  // server can seed the drawer's width next load (avoids CLS). The temporary mobile
  // drawer passes { persist: false } to update state only.
  const setDrawerOpen = React.useCallback((open: boolean, opts?: { persist?: boolean }) => {
    setDrawerOpenState(open)
    if (opts?.persist ?? true) {
      document.cookie = `${NAV_DRAWER_STORAGE_KEY}=${open}; path=/; max-age=31536000; samesite=lax`
    }
  }, [])

  return (
    <NavDrawerContext.Provider value={{ drawerOpen, setDrawerOpen }}>
      <SidebarContext.Provider
        value={{
          sidebarOpen,
          setSidebarOpen,
          portalTarget,
          setPortalTarget,
          hasBody,
          registerBody,
          unregisterBody,
        }}
      >
        <ToolbarContext.Provider
          value={{
            toolbarTarget,
            setToolbarTarget,
            hasToolbar,
            registerToolbar,
            unregisterToolbar,
          }}
        >
          {children}
        </ToolbarContext.Provider>
      </SidebarContext.Provider>
    </NavDrawerContext.Provider>
  )
}

export function useNavDrawer() {
  const ctx = React.useContext(NavDrawerContext)
  if (!ctx) throw new Error('useNavDrawer must be used within DrawerStateProvider')
  return ctx
}

export function useSidebar() {
  const ctx = React.useContext(SidebarContext)
  if (!ctx) throw new Error('useSidebar must be used within DrawerStateProvider')
  return ctx
}

export function useToolbar() {
  const ctx = React.useContext(ToolbarContext)
  if (!ctx) throw new Error('useToolbar must be used within DrawerStateProvider')
  return ctx
}
```

- [ ] **Step 2: Typecheck + lint**

Run: `yarn tsc --noEmit && yarn lint`
Expected: clean. (Existing `useNavDrawer` callers still compile — the new `opts` arg is optional.)

- [ ] **Step 3: Commit**

```bash
git add components/navbar/navbar-toolbar-context.tsx
git commit -m "feat(layout): add toolbar-slot context + persist flag on drawer setter"
```

---

## Task 2: Create the `ToolbarSlot` portal component

**Files:**

- Create: `components/toolbar-slot.tsx`

**Interfaces:**

- Consumes: `useToolbar()` from Task 1.
- Produces: `export default function ToolbarSlot({ children }: { children: React.ReactNode })` — registers presence and portals `children` into the shell AppBar's toolbar target.

- [ ] **Step 1: Write the component**

Create `components/toolbar-slot.tsx`:

```tsx
'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { useToolbar } from '@/components/navbar/navbar-toolbar-context'

// Renders its children into the root LayoutShell's AppBar second-row target.
// Registers presence so the shell knows a toolbar exists (hasToolbar → true rows).
// Rendered by a page UNDER its own data providers, so the toolbar's hooks
// (useOutfitImageMode, useSeasonFilter, useSidebar, etc.) still work while the DOM
// lands in the shell AppBar. Mirrors components/sidebar/sidebar-body.tsx.
export default function ToolbarSlot({ children }: { children: React.ReactNode }) {
  const { toolbarTarget, registerToolbar, unregisterToolbar } = useToolbar()

  React.useEffect(() => {
    registerToolbar()
    return unregisterToolbar
  }, [registerToolbar, unregisterToolbar])

  if (!toolbarTarget) return null
  return createPortal(children, toolbarTarget)
}
```

- [ ] **Step 2: Typecheck + lint**

Run: `yarn tsc --noEmit && yarn lint`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add components/toolbar-slot.tsx
git commit -m "feat(layout): add ToolbarSlot portal component"
```

---

## Task 3: Add the shell AppBar height helper to layout-constants

**Files:**

- Modify: `lib/layout-constants.ts`

**Interfaces:**

- Produces: `shellToolbarTop` — a responsive `top` sx offset equal to a SINGLE `Toolbar`'s height (the shell AppBar's row-1 height, which `PullToRefresh` and fixed overlays anchor below). Keeps `NAV_DRAWER_WIDTH` and `NAV_DRAWER_STORAGE_KEY`. Removes `navToolbarStackTop` (the old two-Toolbar stack height) — no consumer remains after Task 9.

- [ ] **Step 1: Replace the stack helper with a single-toolbar helper**

In `lib/layout-constants.ts`, replace the `TOOLBAR_STACK_MARGIN` / `stacked` / `navToolbarStackTop` block (lines 12–29) with:

```ts
// Responsive `top` offset (in px) equal to a single Toolbar's height — the shell
// AppBar's first row. MUI's Toolbar minHeight is responsive (56 default, 48
// landscape-phone, 64 desktop), matching theme.mixins.toolbar. Fixed overlays that
// must sit just below the shell AppBar (e.g. PullToRefresh) anchor to this.
export const shellToolbarTop = {
  top: 56,
  '@media (min-width:0px)': {
    '@media (orientation: landscape)': { top: 48 },
  },
  '@media (min-width:600px)': { top: 64 },
}
```

Keep the `NAV_DRAWER_WIDTH` and `NAV_DRAWER_STORAGE_KEY` exports and their comments unchanged.

- [ ] **Step 2: Typecheck**

Run: `yarn tsc --noEmit`
Expected: FAIL — `pull-to-refresh.tsx` still imports `navToolbarStackTop`. This is expected; Task 4 fixes it. (If running tasks strictly in order, this is the one place a mid-task typecheck is red by design — proceed to Task 4 before committing, OR commit Task 3+4 together. To keep commits green, defer the commit to the end of Task 4.)

- [ ] **Step 3: Do not commit yet** — proceed to Task 4 (the only consumer). Task 4 ends with the combined commit.

---

## Task 4: Re-anchor PullToRefresh to the shell AppBar bottom

**Files:**

- Modify: `components/pull-to-refresh.tsx`

**Interfaces:**

- Consumes: `shellToolbarTop` from Task 3.

- [ ] **Step 1: Swap the import**

In `components/pull-to-refresh.tsx` line 7, change:

```tsx
import { navToolbarStackTop } from '@/lib/layout-constants'
```

to:

```tsx
import { shellToolbarTop } from '@/lib/layout-constants'
```

- [ ] **Step 2: Swap the usage**

In the pull-indicator `Box` `sx` (around line 92–93), replace:

```tsx
            // Anchor below the sticky NavBarToolbar's full stack height, matched
            // to its responsive Toolbar breakpoints via navToolbarStackTop.
            ...navToolbarStackTop,
```

with:

```tsx
            // Anchor just below the shell AppBar's first row, matched to its
            // responsive Toolbar breakpoints via shellToolbarTop.
            ...shellToolbarTop,
```

- [ ] **Step 3: Typecheck + lint**

Run: `yarn tsc --noEmit && yarn lint`
Expected: clean (no remaining `navToolbarStackTop` references).

- [ ] **Step 4: Commit (Tasks 3 + 4 together)**

```bash
git add lib/layout-constants.ts components/pull-to-refresh.tsx
git commit -m "refactor(layout): replace stacked-toolbar offset with shell AppBar offset"
```

---

## Task 5: Rewrite LayoutShell — AppBar + mini drawers + main

This is the core task. It moves the nav content (from `nav-drawer.tsx`), the sidebar portal-target logic (from `sidebar-shell.tsx`), and the gradient/blur/mask styling (from `navbar-toolbar.tsx`) into one component, in the flush mini-variant layout.

**Files:**

- Rewrite: `components/layout-shell.tsx`

**Interfaces:**

- Consumes: `useNavDrawer`, `useSidebar`, `useToolbar` (Task 1); `NAV_DRAWER_WIDTH` (`@/lib/layout-constants`); `navLinksData` (`@/lib/nav-links`); `NavSection` (`@/components/navbar/nav-section`); `PageTitle`, `NavUser` (`@/components/navbar/…`); `Footer` (default export of `@/components/navbar/nav-footer`); `PullToRefresh` (default export of `@/components/pull-to-refresh`); `useColorTheme` (`@/components/color-theme-context`); `COLOR_THEME_PRESETS` (`@/lib/theme-presets`).
- Produces: `export default function LayoutShell({ children }: { children?: React.ReactNode })`.

- [ ] **Step 1: Write the rewritten LayoutShell**

Replace the entire contents of `components/layout-shell.tsx` with:

```tsx
'use client'

import * as React from 'react'
import {
  alpha,
  AppBar,
  Box,
  CSSObject,
  Divider,
  Drawer as MuiDrawer,
  IconButton,
  Stack,
  styled,
  Theme,
  Toolbar,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { Close, Menu, MenuOpen } from '@mui/icons-material'
import NavSection from './navbar/nav-section'
import PageTitle from './navbar/page-title'
import { NavUser } from './navbar/nav-user'
import Footer from './navbar/nav-footer'
import PullToRefresh from './pull-to-refresh'
import { navLinksData } from '@/lib/nav-links'
import { NAV_DRAWER_WIDTH } from '@/lib/layout-constants'
import { COLOR_THEME_PRESETS } from '@/lib/theme-presets'
import { useColorTheme } from './color-theme-context'
import { useNavDrawer, useSidebar, useToolbar } from './navbar/navbar-toolbar-context'

const SIDEBAR_WIDTH = 400

// ---- Left nav drawer (flush mini-variant) ------------------------------------

const navOpenedMixin = (theme: Theme): CSSObject => ({
  width: NAV_DRAWER_WIDTH,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
  border: 0,
})

const navClosedMixin = (theme: Theme): CSSObject => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: `calc(${theme.spacing(10)} + 1px)`,
  border: 0,
})

const NavDrawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme }) => ({
    width: NAV_DRAWER_WIDTH,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    border: 0,
    variants: [
      {
        props: ({ open }) => open,
        style: { ...navOpenedMixin(theme), '& .MuiDrawer-paper': navOpenedMixin(theme) },
      },
      {
        props: ({ open }) => !open,
        style: { ...navClosedMixin(theme), '& .MuiDrawer-paper': navClosedMixin(theme) },
      },
    ],
  })
)

// ---- Right sidebar drawer (flush mini-variant) -------------------------------

const sidebarOpenedMixin = (theme: Theme): CSSObject => ({
  width: SIDEBAR_WIDTH,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
  border: 0,
})

const sidebarClosedMixin = (theme: Theme): CSSObject => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: 0,
  border: 0,
})

const SidebarDrawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme }) => ({
    width: SIDEBAR_WIDTH,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    border: 0,
    variants: [
      {
        props: ({ open }) => open,
        style: { ...sidebarOpenedMixin(theme), '& .MuiDrawer-paper': sidebarOpenedMixin(theme) },
      },
      {
        props: ({ open }) => !open,
        style: { ...sidebarClosedMixin(theme), '& .MuiDrawer-paper': sidebarClosedMixin(theme) },
      },
    ],
  })
)

// ---- Nav content (shared by permanent + temporary drawers) -------------------

const navContent = (open: boolean, onClose: () => void) => (
  <Stack component="nav" sx={{ flex: 1, mx: 1.5, pb: 3 }}>
    <NavSection items={navLinksData.home} open={open} onClose={onClose} />
    <NavSection items={navLinksData.navMain} open={open} onClose={onClose} />
    <Divider sx={{ my: 0.5 }} />
    <NavSection items={navLinksData.navSecondary} open={open} onClose={onClose} />
    <Stack sx={{ flex: 1, justifyContent: 'flex-end' }}>
      <NavSection items={navLinksData.navExtra} open={open} onClose={onClose} />
    </Stack>
  </Stack>
)

export default function LayoutShell({ children }: { children?: React.ReactNode }) {
  const theme = useTheme()
  const { colorTheme } = useColorTheme()
  const { drawerOpen, setDrawerOpen } = useNavDrawer()
  const { sidebarOpen, setSidebarOpen, setPortalTarget, hasBody } = useSidebar()
  const { setToolbarTarget, hasToolbar } = useToolbar()

  const isNavMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isSidebarMobile = useMediaQuery(theme.breakpoints.down('md'))

  // Callback ref: publishes the sidebar portal target on attach/detach — robust to
  // MUI's temporary drawer mounting/unmounting its children on open/close.
  const setSidebarNode = React.useCallback(
    (node: HTMLDivElement | null) => setPortalTarget(node),
    [setPortalTarget]
  )
  const setToolbarNode = React.useCallback(
    (node: HTMLDivElement | null) => setToolbarTarget(node),
    [setToolbarTarget]
  )

  // Gradient/blur/mask AppBar styling (moved from the deleted NavBarToolbar).
  const preset = COLOR_THEME_PRESETS[colorTheme]
  const gradient = (surface: string) =>
    `linear-gradient(to bottom, ${alpha(surface, 0.7)} 0%, ${alpha(surface, 0.3)} 70%, ${alpha(surface, 0)} 100%)`
  const background = gradient(preset.light.surface.containerLowest)
  const darkBackground = gradient(preset.dark.surface.containerLowest)

  const sidebarTarget = <div ref={setSidebarNode} />
  const sidebarDrawerOpen = hasBody && sidebarOpen

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        color="default"
        position="fixed"
        sx={(t) => ({
          zIndex: t.zIndex.drawer + 1,
          background,
          ...t.applyStyles('dark', { background: darkBackground }),
          border: 0,
          boxShadow: 'none',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          maskImage: 'linear-gradient(to bottom, rgba(0, 0, 0, 1) 80%, rgba(0, 0, 0, 0) 100%)',
        })}
      >
        <Toolbar>
          <Stack
            direction="row"
            spacing={1}
            sx={{ flexGrow: 1, alignItems: 'center', justifyContent: 'space-between' }}
          >
            <IconButton
              color="inherit"
              aria-label={drawerOpen ? 'Collapse navigation' : 'Expand navigation'}
              onClick={() =>
                isNavMobile
                  ? setDrawerOpen(!drawerOpen, { persist: false })
                  : setDrawerOpen(!drawerOpen)
              }
            >
              {drawerOpen ? <MenuOpen /> : <Menu />}
            </IconButton>
            <PageTitle />
            <NavUser />
          </Stack>
        </Toolbar>
        {/* Second row: the injected page toolbar. The single toolbar target lives
            here; ToolbarSlot portals page content in. Rendered only when a page has
            mounted a ToolbarSlot (hasToolbar). */}
        {hasToolbar && (
          <Toolbar sx={{ minHeight: 'unset' }}>
            <Box ref={setToolbarNode} sx={{ flexGrow: 1 }} />
          </Toolbar>
        )}
      </AppBar>
      <PullToRefresh />

      {/* Left nav: temporary overlay below sm, permanent mini-variant at sm+ */}
      <MuiDrawer
        anchor="left"
        open={drawerOpen}
        slotProps={{ root: { keepMounted: true, disableScrollLock: true } }}
        sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { width: '100%' } }}
        variant="temporary"
        onClose={() => setDrawerOpen(false, { persist: false })}
      >
        <Toolbar disableGutters sx={{ px: 2.4, pt: 3 }}>
          <IconButton
            aria-label="Close navigation"
            onClick={() => setDrawerOpen(false, { persist: false })}
          >
            <MenuOpen />
          </IconButton>
        </Toolbar>
        {navContent(true, () => setDrawerOpen(false, { persist: false }))}
      </MuiDrawer>
      <NavDrawer
        anchor="left"
        open={drawerOpen}
        sx={{ display: { xs: 'none', sm: 'block' } }}
        variant="permanent"
      >
        <Toolbar />
        {hasToolbar && <Toolbar sx={{ minHeight: 'unset' }} />}
        {navContent(drawerOpen, () => {})}
      </NavDrawer>

      {/* Main column: owns the gutter, minWidth:0 (grid reflow), and top spacers
          that track the AppBar's row count. */}
      <Box component="main" sx={{ flexGrow: 1, minWidth: { xs: 0, md: 320 }, px: 2 }}>
        <Toolbar />
        {hasToolbar && <Toolbar sx={{ minHeight: 'unset' }} />}
        {children}
        <Footer />
      </Box>

      {/* Right sidebar: temporary overlay below md, permanent at md+. Exactly one
          portal target div, rendered inside whichever drawer is active. */}
      <MuiDrawer
        anchor="right"
        open={sidebarDrawerOpen}
        slotProps={{ root: { disableScrollLock: true } }}
        sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: '100%' } }}
        variant="temporary"
        onClose={() => setSidebarOpen(false)}
      >
        <Toolbar />
        {hasToolbar && <Toolbar sx={{ minHeight: 'unset' }} />}
        <Toolbar>
          <Stack direction="row" sx={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
            <IconButton aria-label="Close details" onClick={() => setSidebarOpen(false)}>
              <Close />
            </IconButton>
          </Stack>
        </Toolbar>
        {isSidebarMobile && sidebarTarget}
      </MuiDrawer>
      <SidebarDrawer
        anchor="right"
        open={sidebarDrawerOpen}
        sx={{ display: { xs: 'none', md: 'block' } }}
        variant="permanent"
      >
        <Toolbar />
        {hasToolbar && <Toolbar sx={{ minHeight: 'unset' }} />}
        <Toolbar>
          <Stack direction="row" sx={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
            <IconButton aria-label="Close details" onClick={() => setSidebarOpen(false)}>
              <Close />
            </IconButton>
          </Stack>
        </Toolbar>
        {!isSidebarMobile && sidebarTarget}
      </SidebarDrawer>
    </Box>
  )
}
```

- [ ] **Step 2: Typecheck + lint**

Run: `yarn tsc --noEmit && yarn lint`
Expected: clean. (`nav-drawer.tsx` and `sidebar-shell.tsx` still exist and still compile — they are deleted in Task 6. `layout.tsx` still imports them via the commented block? No — the commented block is inert; `layout.tsx` only imports `NavDrawer`/`SidebarShell` at top level. Those imports remain valid until Task 6/7.)

- [ ] **Step 3: Manual smoke check**

Run: `yarn dev`, open `http://localhost:3000`.
Expected: fixed AppBar on top with menu toggle + page title + user avatar. Left mini drawer toggles between icon-rail and full width; state persists on reload (desktop). No second AppBar row yet (no page has migrated to `ToolbarSlot`). Main content sits below the AppBar. (Per-page `NavBarToolbar` bars still render their own sticky bars for now — expected until Task 9.)

- [ ] **Step 4: Commit**

```bash
git add components/layout-shell.tsx
git commit -m "feat(layout): rewrite LayoutShell as the single mini-variant shell"
```

---

## Task 6: Delete NavDrawer and SidebarShell

**Files:**

- Delete: `components/navbar/nav-drawer.tsx`
- Delete: `components/sidebar/sidebar-shell.tsx`
- Modify: `app/layout.tsx` (remove their imports + the commented-out block)

**Interfaces:**

- Consumes: nothing new. `LayoutShell` (Task 5) already replaces both.

- [ ] **Step 1: Delete the two components**

```bash
git rm components/navbar/nav-drawer.tsx components/sidebar/sidebar-shell.tsx
```

- [ ] **Step 2: Clean up app/layout.tsx**

In `app/layout.tsx`, remove these now-unused top-level imports:

```tsx
import Footer from '@/components/navbar/nav-footer'
import PullToRefresh from '@/components/pull-to-refresh'
import NavDrawer from '@/components/navbar/nav-drawer'
import SidebarShell from '@/components/sidebar/sidebar-shell'
import { NavUser } from '@/components/navbar/nav-user'
import PageTitle from '@/components/navbar/page-title'
```

Keep `LayoutShell`, `DrawerStateProvider`, `SnackbarAlertProvider`, `connection`, `cookies`, `getUserID`, `getPreferences`, `NAV_DRAWER_STORAGE_KEY`, `Analytics`, `SpeedInsights`, theme imports, and `Suspense`. Then replace the `SnackbarAlertProvider` body (the `<LayoutShell>…</LayoutShell>` line PLUS the entire commented-out `{/* <Stack …> */}` block) with just:

```tsx
<SnackbarAlertProvider>
  <LayoutShell>{children}</LayoutShell>
  <Analytics />
  <SpeedInsights />
</SnackbarAlertProvider>
```

Note: `CssBaseline` and `Box`/`Stack` may now be unused imports in `layout.tsx` — remove any that are (`yarn lint` will flag them). Keep `CssBaseline` only if still rendered in `ThemedApp`. (`PullToRefresh` and `Footer` are now rendered inside `LayoutShell` from Task 5, so `layout.tsx` no longer references them — that is why their imports are removed here.)

- [ ] **Step 3: Typecheck + lint**

Run: `yarn tsc --noEmit && yarn lint`
Expected: clean. No references to `nav-drawer` or `sidebar-shell` remain: `grep -rn "nav-drawer\|sidebar-shell" app components` returns nothing.

- [ ] **Step 4: Manual smoke check**

Reload `http://localhost:3000`. Nav drawer, footer, and pull-to-refresh FAB all still work (now rendered by `LayoutShell`). Mobile (<sm) shows the temporary nav overlay.

- [ ] **Step 5: Commit**

```bash
git add app/layout.tsx
git commit -m "refactor(layout): delete NavDrawer/SidebarShell; wire layout.tsx to LayoutShell"
```

---

## Task 7: Migrate one toolbar (eureka-toolbar) to ToolbarSlot — reference

**Files:**

- Modify: `app/eureka/eureka-toolbar.tsx`

**Interfaces:**

- Consumes: `ToolbarSlot` (Task 2).

- [ ] **Step 1: Read the current file**

Read `app/eureka/eureka-toolbar.tsx` to see its exact `<NavBarToolbar>…</NavBarToolbar>` wrapper and inner content.

- [ ] **Step 2: Swap the wrapper**

Replace the import:

```tsx
import NavBarToolbar from '@/components/navbar/navbar-toolbar'
```

with:

```tsx
import ToolbarSlot from '@/components/toolbar-slot'
```

Replace the outer `<NavBarToolbar>` open tag with `<ToolbarSlot>` and the closing `</NavBarToolbar>` with `</ToolbarSlot>`. Leave the inner `Stack`/controls unchanged.

- [ ] **Step 3: Typecheck + lint**

Run: `yarn tsc --noEmit && yarn lint`
Expected: clean.

- [ ] **Step 4: Manual smoke check — the slot contract**

Reload `http://localhost:3000/eureka`.
Expected: the eureka filter/sort controls now render in the shell AppBar's **second row** (not a separate sticky bar). The AppBar is now two rows on `/eureka`; the main content spacer grows to match (content not hidden under the bar). Navigate away to `/about` (no toolbar): the AppBar collapses back to one row. Controls remain functional (they still execute under the eureka providers via the portal).

- [ ] **Step 5: Commit**

```bash
git add app/eureka/eureka-toolbar.tsx
git commit -m "feat(layout): migrate eureka-toolbar to ToolbarSlot (reference)"
```

---

## Task 8: Slim PageShell; verify grid reflow

**Files:**

- Modify: `components/page-shell.tsx`

**Interfaces:**

- Produces: `PageShell` with unchanged public props (`maxWidth`, `sideContent`, `spacing`, `sx`), but no longer setting `px`/`minWidth`/`mx` on the main column (those now live in the shell `main`, Task 5). `maxWidth` centering is retained via `mx: 'auto'` on the width-cap wrapper (the cap still needs to center within the shell gutter).

- [ ] **Step 1: Slim the component**

Replace `components/page-shell.tsx` contents with:

```tsx
import { Box, Stack } from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'

export type PageWidth = 'full' | 'wide' | 'md' | 'sm' | 'xs'

// Maps the width vocabulary to a max-width cap. 'full' is uncapped so the card
// grids on /eureka and /outfits keep reflowing when the sidebar narrows the
// content column (their container-query grids read content width, not viewport).
const WIDTH_MAP: Record<PageWidth, number | 'none'> = {
  full: 'none',
  wide: 1400,
  md: 900,
  sm: 600,
  xs: 480,
}

export interface PageShellProps {
  children: React.ReactNode
  /** Per-domain width variant. Default 'full' preserves the card-grid behavior. */
  maxWidth?: PageWidth
  /** Optional right-hand column (md+); stacks above the main content below md. */
  sideContent?: React.ReactNode
  /** Vertical spacing between direct children of the main column. Default 2. */
  spacing?: number
  /** Escape hatch for one-off overrides on the outer wrapper. */
  sx?: SxProps<Theme>
}

// Thin per-page width wrapper. Horizontal padding, minWidth:0 (grid reflow), and
// the content gutter now live in LayoutShell's <main>; this component only caps the
// max-width per domain and optionally lays out an inline side column. The main
// column keeps minWidth:0 so CSS grids shrink instead of overflowing.
export default function PageShell({
  children,
  maxWidth = 'full',
  sideContent,
  spacing = 2,
  sx,
}: PageShellProps) {
  const cap = WIDTH_MAP[maxWidth]

  const main = (
    <Stack spacing={spacing} sx={{ flexGrow: 1, minWidth: 0 }}>
      {children}
    </Stack>
  )

  if (!sideContent) {
    return (
      <Box sx={{ width: '100%', maxWidth: cap === 'none' ? 'none' : cap, mx: 'auto', ...sx }}>
        {main}
      </Box>
    )
  }

  return (
    <Stack
      direction="row"
      spacing={2}
      sx={{ width: '100%', maxWidth: cap === 'none' ? 'none' : cap, mx: 'auto', ...sx }}
    >
      <Box sx={{ flexGrow: 1, order: { md: 1 }, minWidth: 0 }}>{main}</Box>
      <Box sx={{ order: { md: 2 }, width: { md: 320 }, minWidth: { md: 240 }, flexShrink: 0 }}>
        {sideContent}
      </Box>
    </Stack>
  )
}
```

- [ ] **Step 2: Typecheck + lint**

Run: `yarn tsc --noEmit && yarn lint`
Expected: clean.

- [ ] **Step 3: Manual smoke check — grid reflow + gutter**

Reload `http://localhost:3000/eureka` and `/outfits`. Expected: the card grid has a consistent horizontal gutter (from the shell `main` `px: 2`), not doubled padding. Open a detail page with a sidebar (e.g. an outfit set) and toggle the sidebar: the `/eureka` and `/outfits` grids reflow (cards re-columnize) rather than overflowing. A capped page (e.g. `/settings`, `maxWidth="md"`) stays centered.

- [ ] **Step 4: Commit**

```bash
git add components/page-shell.tsx
git commit -m "refactor(layout): slim PageShell to a width wrapper; gutter/minWidth move to shell"
```

---

## Task 9: Migrate the remaining 12 toolbars; delete NavBarToolbar

Each file swaps its `<NavBarToolbar>` wrapper for `<ToolbarSlot>`, identical to Task 7. Do them one at a time, verifying each route.

**Files (modify):**

- `app/outfits/outfit-toolbar.tsx`
- `app/outfits/seasons/seasons-toolbar.tsx`
- `app/eureka/trials/trials-tool-bar.tsx`
- `app/looks/looks-toolbar.tsx`
- `app/looks/look-builder.tsx`
- `app/looks/[slug]/look-detail.tsx`
- `app/admin/admin-toolbar.tsx`
- `app/admin/form-toolbar.tsx`
- `app/profile/profile-toolbar.tsx`
- `app/settings/settings-tabs.tsx`
- `app/page.tsx`
- `components/slug-toolbar.tsx`
- Delete: `components/navbar/navbar-toolbar.tsx`

**Interfaces:**

- Consumes: `ToolbarSlot` (Task 2).

- [ ] **Step 1: Swap each file**

For EACH file above: replace `import NavBarToolbar from '@/components/navbar/navbar-toolbar'` with `import ToolbarSlot from '@/components/toolbar-slot'`, then replace the `<NavBarToolbar>` / `</NavBarToolbar>` tags with `<ToolbarSlot>` / `</ToolbarSlot>`. Inner content unchanged. (Some files may reference `NavBarToolbar` with different relative import paths — search each file's actual import line. `slug-toolbar.tsx` imports it as `@/components/navbar/navbar-toolbar`.)

- [ ] **Step 2: Confirm no NavBarToolbar references remain**

Run: `grep -rn "NavBarToolbar\|navbar-toolbar'" app components --include="*.tsx"`
Expected: no matches (only `navbar-toolbar-context` may match the `navbar-toolbar` substring — verify those are the `-context` import, not the deleted component).

- [ ] **Step 3: Delete NavBarToolbar**

```bash
git rm components/navbar/navbar-toolbar.tsx
```

- [ ] **Step 4: Typecheck + lint**

Run: `yarn tsc --noEmit && yarn lint`
Expected: clean.

- [ ] **Step 5: Manual smoke check — every route group**

Visit and confirm the toolbar renders in the shell's second row and its controls work, on: `/outfits`, `/outfits/seasons`, `/outfits/<a set>` (image-swap + sidebar toggle), `/outfits/seasons/<a season>` (evolution/glowup toggles), `/eureka/trials`, `/eureka/<a set>`, `/looks`, `/looks/new` (builder), `/looks/<a look>`, `/profile`, `/settings`, `/admin` (admin toolbar), an admin form page (form toolbar), and `/` (home). For each: no orphaned second sticky bar, spacer height correct, controls functional.

- [ ] **Step 6: Commit**

```bash
git add app components/slug-toolbar.tsx
git commit -m "feat(layout): migrate remaining toolbars to ToolbarSlot; delete NavBarToolbar"
```

---

## Task 10: Full regression pass + cookie-scope verification

**Files:** none (verification only).

- [ ] **Step 1: Static checks**

Run: `yarn tsc --noEmit && yarn lint && yarn build`
Expected: all clean (a production build catches PPR/`use cache` issues the dev server hides).

- [ ] **Step 2: Cookie-scope manual test**

- Desktop (≥sm): toggle the permanent nav drawer open → reload → it stays open (cookie persisted). Toggle closed → reload → stays closed.
- Shrink to <sm (temporary overlay): open the mobile nav overlay, then resize back to ≥sm. Expected: the permanent drawer is in its previously-persisted state (NOT force-opened by the mobile open). Inspect: opening the overlay did not change the `nav-drawer-open` cookie.
- Sidebar: on a detail page, open the sidebar → reload → sidebar is closed (never persisted).

- [ ] **Step 3: Default-open manual test**

Clear the `nav-drawer-open` cookie (devtools → Application → Cookies → delete) → reload. Expected: nav drawer starts CLOSED (mini rail). Set the cookie to `nav-drawer-open=true` → reload → starts open. Any other value or absent → closed.

- [ ] **Step 4: Responsive + sidebar portal pass**

- <md: sidebar is a full-width temporary overlay; open/close via the page's info toggle works; content portals in.
- ≥md: sidebar is a permanent content-pushing drawer; grids reflow when it opens.
- Mobile nav (<sm) overlay opens full width and closes on link tap.

- [ ] **Step 5: Commit (if any final tweaks were needed)**

```bash
git add -A
git commit -m "test(layout): full regression pass for shell consolidation"
```

- [ ] **Step 6: Open PR**

```bash
git push -u origin layout-shell-consolidation
gh pr create --title "Consolidate layout into LayoutShell (mini-variant + toolbar slot)" --body "Implements docs/superpowers/specs/2026-07-24-layout-shell-consolidation-design.md"
```
