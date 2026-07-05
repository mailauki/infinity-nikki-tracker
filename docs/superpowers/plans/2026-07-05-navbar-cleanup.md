# Navbar/Drawer Cleanup (Phase 2b) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove dead navbar code, de-duplicate the AppBar inset math into a shared hook, centralize layout magic numbers into one constants file, and extract the dark-mode mounted-guard into a hook (migrating the navbar).

**Architecture:** A leaf `lib/layout-constants.ts` holds the shared numbers/keys. A `useAppBarInsets()` hook computes the AppBar margin/width/transition sx once (both AppBars spread it). A `useIsDarkMode()` hook replaces the duplicated mounted-guard in the 2 navbar files. Dead code (`nav-styled.tsx`, the `toolbarSlot` portal context) is deleted and the now-slimmer provider renamed.

**Tech Stack:** Next.js 16 App Router, MUI v9, React context, TypeScript. No unit-test framework in this repo.

## Global Constraints

- Package manager: **Yarn**. Only `dev/build/start/lint/format/lint:fix` are scripts.
- Code style: no semicolons, single quotes, 2-space indent, 100-char width, trailing commas ES5 (Prettier). Path alias `@/` = project root.
- **No unit-test framework.** Verification is `yarn tsc --noEmit`, `yarn lint`, and driving the running app. A PostToolUse hook runs `yarn format && yarn lint:fix` then `yarn tsc --noEmit` after every Edit/Write.
- Client components/hooks using React state or `usePathname`/`useColorScheme`/`useTheme` need `'use client'`.
- Branch `feat/navbar-cleanup` (already created, spec already committed there), stacked on `feat/dynamic-sidebar`. Never push to `main`.
- Known-benign: a NavBar gradient-className hydration warning pre-exists — ignore it during verification.
- Ordering keeps the tree compiling at every task: constants → hooks → consumers → dead-code/rename last.

## File Structure

- **Create** `lib/layout-constants.ts` — `NAV_DRAWER_WIDTH`, `NAV_RAIL_FUDGE`, `DEFAULT_SIDEBAR_WIDTH`, `NAV_DRAWER_STORAGE_KEY`, `SIDEBAR_STORAGE_KEY`.
- **Create** `components/navbar/use-app-bar-insets.ts` — `useAppBarInsets()` returning the inset sx fragment.
- **Create** `hooks/use-is-dark-mode.ts` — `useIsDarkMode(): boolean`.
- **Modify** `lib/sidebar-registry.ts`, `components/sidebar/sidebar.tsx`, `components/filter/filter-menu.tsx`, `components/navbar/nav-drawer.tsx`, `components/navbar/navbar-toolbar-context.tsx` — import shared constants.
- **Modify** `components/navbar/nav-bar.tsx`, `components/navbar/navbar-toolbar.tsx` — use `useAppBarInsets()`.
- **Modify** `components/navbar/nav-section.tsx`, `components/navbar/auth-appbar.tsx` — use `useIsDarkMode()`.
- **Delete** `components/navbar/nav-styled.tsx`; delete the `toolbarSlot` context from `navbar-toolbar-context.tsx`; rename `NavBarToolbarProvider`→`DrawerStateProvider` (update `app/layout.tsx`).

---

### Task 1: Layout constants file

**Files:**

- Create: `lib/layout-constants.ts`

**Interfaces:**

- Produces: `NAV_DRAWER_WIDTH = 240`, `NAV_RAIL_FUDGE = 21`, `DEFAULT_SIDEBAR_WIDTH = 400`, `NAV_DRAWER_STORAGE_KEY = 'nav-drawer-open'`, `SIDEBAR_STORAGE_KEY = 'sidebar-open'` (all `export const`).

- [ ] **Step 1: Create the file**

Create `lib/layout-constants.ts`:

```ts
// Left nav drawer expanded width.
export const NAV_DRAWER_WIDTH = 240

// The AppBar right/left insets correct for the nav drawer's `margin: 20` + 1px
// border. `spacing(10) + NAV_RAIL_FUDGE` (collapsed) and
// `NAV_DRAWER_WIDTH - NAV_RAIL_FUDGE` (expanded) keep the fixed AppBars aligned
// with the drawer edge.
export const NAV_RAIL_FUDGE = 21

// Right sidebar (filters + looks builder) width. The sidebar registry references
// this so the reserved margin and the drawer paper stay the same width.
export const DEFAULT_SIDEBAR_WIDTH = 400

// localStorage keys for persisted open/closed state.
export const NAV_DRAWER_STORAGE_KEY = 'nav-drawer-open'
export const SIDEBAR_STORAGE_KEY = 'sidebar-open'
```

- [ ] **Step 2: Type-check**

Run: `yarn tsc --noEmit`
Expected: no errors (new leaf file, no consumers yet).

- [ ] **Step 3: Commit**

```bash
git add lib/layout-constants.ts
git commit -m "feat(layout): add centralized layout constants"
```

---

### Task 2: Point existing consumers at the constants

**Files:**

- Modify: `components/navbar/nav-drawer.tsx`
- Modify: `components/navbar/navbar-toolbar-context.tsx`
- Modify: `components/sidebar/sidebar.tsx`
- Modify: `components/filter/filter-menu.tsx`
- Modify: `lib/sidebar-registry.ts`

**Interfaces:**

- Consumes: constants from Task 1.
- Produces: `nav-drawer.tsx` NO LONGER exports `NAV_DRAWER_WIDTH` (it re-exports it for now to avoid breaking `nav-bar`/`navbar-toolbar` until Task 4 — see Step 1). After this task, `sidebar.tsx` no longer defines `SIDEBAR_STORAGE_KEY`/`DEFAULT_SIDEBAR_WIDTH` privately.

- [ ] **Step 1: nav-drawer.tsx — import the width + storage key, re-export the width**

`nav-drawer.tsx` currently declares `export const NAV_DRAWER_WIDTH = 240` (line 20) and `const DRAWER_STORAGE_KEY = 'nav-drawer-open'` (line 89). Replace the `NAV_DRAWER_WIDTH` declaration with a re-export so existing importers (`nav-bar.tsx`, `navbar-toolbar.tsx`) keep working until Task 4:

Replace line 20 `export const NAV_DRAWER_WIDTH = 240` with:

```tsx
import { NAV_DRAWER_WIDTH, NAV_DRAWER_STORAGE_KEY } from '@/lib/layout-constants'
export { NAV_DRAWER_WIDTH }
```

(place the import with the other imports at the top; put the `export { NAV_DRAWER_WIDTH }` right after the imports.)

Replace line 89 `const DRAWER_STORAGE_KEY = 'nav-drawer-open'` — delete it, and change its one usage (`localStorage.setItem(DRAWER_STORAGE_KEY, ...)` in `toggleDrawer`) to use `NAV_DRAWER_STORAGE_KEY`.

- [ ] **Step 2: navbar-toolbar-context.tsx — import both storage keys**

Replace the two inline consts (lines 24-25):

```tsx
const DRAWER_STORAGE_KEY = 'nav-drawer-open'
const SIDEBAR_STORAGE_KEY = 'sidebar-open'
```

with an import at the top:

```tsx
import { NAV_DRAWER_STORAGE_KEY, SIDEBAR_STORAGE_KEY } from '@/lib/layout-constants'
```

Then update the two `localStorage.getItem(...)` calls in the post-mount effect: `DRAWER_STORAGE_KEY` → `NAV_DRAWER_STORAGE_KEY` (the `SIDEBAR_STORAGE_KEY` name is unchanged, now imported).

- [ ] **Step 3: sidebar.tsx — import the width + storage key**

In `components/sidebar/sidebar.tsx`, delete the private `export const DEFAULT_SIDEBAR_WIDTH = 400` and `const SIDEBAR_STORAGE_KEY = 'sidebar-open'`, and add at the top:

```tsx
import { DEFAULT_SIDEBAR_WIDTH, SIDEBAR_STORAGE_KEY } from '@/lib/layout-constants'
```

Keep `DEFAULT_SIDEBAR_WIDTH` available to this file's default (`width = DEFAULT_SIDEBAR_WIDTH`). If any other file imported `DEFAULT_SIDEBAR_WIDTH` from sidebar.tsx, it must now import from layout-constants — check with `grep -rn "DEFAULT_SIDEBAR_WIDTH" app/ components/`. (Expected: only sidebar.tsx used it.)

- [ ] **Step 4: filter-menu.tsx — use the storage-key constant**

In `components/filter/filter-menu.tsx`, `closeFilter` does `localStorage.setItem('sidebar-open', 'false')`. Add `import { SIDEBAR_STORAGE_KEY } from '@/lib/layout-constants'` and replace the `'sidebar-open'` literal with `SIDEBAR_STORAGE_KEY`.

- [ ] **Step 5: sidebar-registry.ts — reference the width constant**

In `lib/sidebar-registry.ts`, add `import { DEFAULT_SIDEBAR_WIDTH } from '@/lib/layout-constants'` and replace each `config: { width: 400 }` with `config: { width: DEFAULT_SIDEBAR_WIDTH }`.

- [ ] **Step 6: Type-check + lint + no-circular-import check**

Run: `yarn tsc --noEmit && yarn lint 2>&1 | tail -5`
Expected: tsc clean; lint no new errors (pre-existing `quick-access.tsx` CardContent warning OK).

Run: `grep -rn "'sidebar-open'\|'nav-drawer-open'" app/ components/ lib/ | grep -v layout-constants.ts`
Expected: no matches (all string literals now come from the constants file).

- [ ] **Step 7: Commit**

```bash
git add components/navbar/nav-drawer.tsx components/navbar/navbar-toolbar-context.tsx components/sidebar/sidebar.tsx components/filter/filter-menu.tsx lib/sidebar-registry.ts
git commit -m "refactor(layout): source widths and storage keys from layout-constants"
```

---

### Task 3: useAppBarInsets hook

**Files:**

- Create: `components/navbar/use-app-bar-insets.ts`
- Modify: `components/navbar/nav-bar.tsx`
- Modify: `components/navbar/navbar-toolbar.tsx`

**Interfaces:**

- Consumes: `useNavDrawer`, `useSidebar` from `./navbar-toolbar-context`; `sidebarConfigFor` from `@/lib/sidebar-registry`; `NAV_DRAWER_WIDTH`, `NAV_RAIL_FUDGE` from `@/lib/layout-constants`.
- Produces: `useAppBarInsets(): { ml, mr, width, transition }` — a plain object spreadable into an MUI `sx`.

- [ ] **Step 1: Create the hook**

Create `components/navbar/use-app-bar-insets.ts`:

```ts
'use client'

import { usePathname } from 'next/navigation'
import { useTheme } from '@mui/material/styles'
import { useNavDrawer, useSidebar } from './navbar-toolbar-context'
import { sidebarConfigFor } from '@/lib/sidebar-registry'
import { NAV_DRAWER_WIDTH, NAV_RAIL_FUDGE } from '@/lib/layout-constants'

// Shared AppBar positioning: the fixed NavBar and NavBarToolbar both offset their
// left margin by the nav-drawer rail and their right margin by the open sidebar,
// then shrink their width to fit. Returns a plain object to spread into each
// AppBar's `sx`; the AppBars keep their own appearance (gradient, pointerEvents).
export function useAppBarInsets() {
  const { drawerOpen } = useNavDrawer()
  const { sidebarOpen } = useSidebar()
  const pathname = usePathname()
  const theme = useTheme()

  const sidebarConfig = sidebarConfigFor(pathname)
  const sidebarInset = sidebarOpen && sidebarConfig ? `${sidebarConfig.width}px` : '0px'
  const navInset = drawerOpen
    ? `calc(${NAV_DRAWER_WIDTH}px - ${NAV_RAIL_FUDGE}px)`
    : `calc(${theme.spacing(10)} + ${NAV_RAIL_FUDGE}px)`

  return {
    ml: { xs: 0, sm: navInset },
    mr: { xs: 0, sm: sidebarInset },
    width: { xs: '100%', sm: `calc(100% - ${navInset} - ${sidebarInset})` },
    transition: theme.transitions.create(['margin-left', 'margin-right', 'width'], {
      easing: theme.transitions.easing.sharp,
      duration: drawerOpen
        ? theme.transitions.duration.enteringScreen
        : theme.transitions.duration.leavingScreen,
    }),
  }
}
```

Note the intentional CSS correction: `calc(${NAV_DRAWER_WIDTH}px - ${NAV_RAIL_FUDGE}px)` — a single valid `calc()`, replacing the old `calc(240px) - 21px` (which had `- 21px` outside the calc).

- [ ] **Step 2: Rewrite nav-bar.tsx to use the hook**

In `components/navbar/nav-bar.tsx`:

Remove these imports: `usePathname` from 'next/navigation', `useSidebar` + `useNavDrawer` (the hook reads them now — but `useTheme` is still used for nothing else? check), `sidebarConfigFor`, `NAV_DRAWER_WIDTH`. KEEP `alpha`/`useTheme` ONLY if still used by the gradient (they are not — the gradient uses `alpha` from `@mui/material/styles` and the `sx` callback receives its own `theme`). Precisely: after the edit, the component no longer needs `usePathname`, `useNavDrawer`, `useSidebar`, `sidebarConfigFor`, `NAV_DRAWER_WIDTH`, or the top-level `useTheme()` call/`theme` variable (the drawer-open transition duration moves into the hook). `alpha` is still needed for the gradient.

Replace the derivation block (current lines 14-24):

```tsx
export default function NavBar() {
  const { drawerOpen } = useNavDrawer()
  const { sidebarOpen } = useSidebar()
  const pathname = usePathname()
  const theme = useTheme()
  const sidebarConfig = sidebarConfigFor(pathname)
  const filterInset = sidebarOpen && sidebarConfig ? `${sidebarConfig.width}px` : '0px'
  const navInset = drawerOpen
    ? `calc(${NAV_DRAWER_WIDTH}px) - 21px`
    : `calc(${theme.spacing(10)} + 21px)`
  const { colorTheme } = useColorTheme()
```

with:

```tsx
export default function NavBar() {
  const insets = useAppBarInsets()
  const { colorTheme } = useColorTheme()
```

Add the import: `import { useAppBarInsets } from './use-app-bar-insets'`. Remove the now-unused imports: `usePathname`, `useNavDrawer`, `useSidebar`, `sidebarConfigFor`, `NAV_DRAWER_WIDTH`, and the top-level `useTheme` (keep `alpha` — change `import { alpha, useTheme } from '@mui/material/styles'` to `import { alpha } from '@mui/material/styles'`). NOTE: the `sx={(theme) => ({...})}` callback below uses its OWN `theme` parameter (for `theme.applyStyles('dark', ...)`) — that is unrelated to the removed top-level `const theme = useTheme()`, so `applyStyles` keeps working. Only the top-level `useTheme()` call/variable is removed.

In the `sx={(theme) => ({...})}` callback, replace the manual positioning lines:

```tsx
        ml: { xs: 0, sm: navInset },
        mr: { xs: 0, sm: filterInset },
        width: {
          xs: '100%',
          sm: `calc(100% - ${navInset} - ${filterInset})`,
        },
        transition: theme.transitions.create(['margin-left', 'margin-right', 'width'], {
          easing: theme.transitions.easing.sharp,
          duration: drawerOpen
            ? theme.transitions.duration.enteringScreen
            : theme.transitions.duration.leavingScreen,
        }),
```

with:

```tsx
        ...insets,
```

Keep everything else in the `sx` (background, `theme.applyStyles('dark', ...)`, `border`, `backdropFilter`, `WebkitBackdropFilter`, `maskImage`). The `sx` callback still receives `theme` and uses it for `applyStyles` — that stays.

- [ ] **Step 3: Rewrite navbar-toolbar.tsx to use the hook**

In `components/navbar/navbar-toolbar.tsx`:

Replace the derivation (current lines 10-19):

```tsx
export default function NavBarToolbar({ children }: { children: React.ReactNode }) {
  const { drawerOpen } = useNavDrawer()
  const { sidebarOpen } = useSidebar()
  const pathname = usePathname()
  const theme = useTheme()
  const sidebarConfig = sidebarConfigFor(pathname)
  const filterInset = sidebarOpen && sidebarConfig ? `${sidebarConfig.width}px` : '0px'
  const navInset = drawerOpen
    ? `calc(${NAV_DRAWER_WIDTH}px) - 21px`
    : `calc(${theme.spacing(10)} + 21px)`
  return (
```

with:

```tsx
export default function NavBarToolbar({ children }: { children: React.ReactNode }) {
  const insets = useAppBarInsets()
  return (
```

Update imports: add `import { useAppBarInsets } from './use-app-bar-insets'`; remove `usePathname`, `useNavDrawer`, `useSidebar`, `sidebarConfigFor`, `NAV_DRAWER_WIDTH`, and `useTheme` (change `import { AppBar, Toolbar, useTheme } from '@mui/material'` to `import { AppBar, Toolbar } from '@mui/material'`). Keep `import * as React from 'react'`.

In the `sx={{...}}` object, replace the manual positioning lines:

```tsx
        ml: { xs: 0, sm: navInset },
        mr: { xs: 0, sm: filterInset },
        width: {
          xs: '100%',
          sm: `calc(100% - ${navInset} - ${filterInset})`,
        },
        transition: (theme) =>
          theme.transitions.create(['margin-left', 'margin-right', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: drawerOpen
              ? theme.transitions.duration.enteringScreen
              : theme.transitions.duration.leavingScreen,
          }),
```

with:

```tsx
        ...insets,
```

Keep `borderColor: 'transparent'` and `pointerEvents: 'none'`.

- [ ] **Step 4: Type-check + lint**

Run: `yarn tsc --noEmit && yarn lint 2>&1 | tail -5`
Expected: tsc clean; no new lint errors (no unused imports left in either file).

- [ ] **Step 5: Verify AppBar insets in the running app (controller does this; implementer notes it)**

The implementer should NOT drive the browser. Report that Step 4 passed and note that the controller will run the running-app inset check (nav drawer toggle sync + `/eureka` sidebar push + the `calc()` alignment before/after).

- [ ] **Step 6: Commit**

```bash
git add components/navbar/use-app-bar-insets.ts components/navbar/nav-bar.tsx components/navbar/navbar-toolbar.tsx
git commit -m "refactor(navbar): extract shared useAppBarInsets hook"
```

---

### Task 4: useIsDarkMode hook + migrate navbar

**Files:**

- Create: `hooks/use-is-dark-mode.ts`
- Modify: `components/navbar/nav-section.tsx`
- Modify: `components/navbar/auth-appbar.tsx`

**Interfaces:**

- Produces: `useIsDarkMode(): boolean`.

- [ ] **Step 1: Create the hook**

Create `hooks/use-is-dark-mode.ts`:

```ts
'use client'

import { useEffect, useState } from 'react'
import { useColorScheme } from '@mui/material'

// True when the effective color scheme is dark. The mounted guard avoids an
// SSR/client hydration mismatch: the derived value is false until after mount,
// then reflects the resolved scheme (system → systemMode, otherwise mode).
export function useIsDarkMode() {
  const { mode, systemMode } = useColorScheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted && (mode === 'system' ? systemMode : mode) === 'dark'
}
```

- [ ] **Step 2: Migrate nav-section.tsx**

In `components/navbar/nav-section.tsx`, replace the inline pattern (lines 32-35):

```tsx
const { mode, systemMode } = useColorScheme()
const [mounted, setMounted] = useState(false)
useEffect(() => setMounted(true), [])
const isDarkMode = mounted && (mode === 'system' ? systemMode : mode) === 'dark'
```

with:

```tsx
const isDarkMode = useIsDarkMode()
```

Add `import { useIsDarkMode } from '@/hooks/use-is-dark-mode'`. Then remove now-unused imports: `useColorScheme` and `useEffect`. IMPORTANT: **keep `useState`** — nav-section.tsx uses it again for `const [expandOpen, setExpandOpen] = useState(false)` (around line 147). So the `import { useEffect, useState } from 'react'` becomes `import { useState } from 'react'`, and `useColorScheme` is removed from its `@mui/material` import. Confirm with `grep -n "useColorScheme\|useEffect\|useState" components/navbar/nav-section.tsx` after the edit: `useColorScheme`/`useEffect` should have zero remaining usages, `useState` one.

- [ ] **Step 3: Migrate auth-appbar.tsx**

In `components/navbar/auth-appbar.tsx`, replace the inline pattern (lines 9-12):

```tsx
const { mode, systemMode } = useColorScheme()
const [mounted, setMounted] = useState(false)
useEffect(() => setMounted(true), [])
const isDarkMode = mounted && (mode === 'system' ? systemMode : mode) === 'dark'
```

with:

```tsx
const isDarkMode = useIsDarkMode()
```

Add `import { useIsDarkMode } from '@/hooks/use-is-dark-mode'`. Remove now-unused imports: change `import { AppBar, Stack, Toolbar, useColorScheme } from '@mui/material'` to `import { AppBar, Stack, Toolbar } from '@mui/material'`, and remove `import { useEffect, useState } from 'react'` if `useEffect`/`useState` are unused elsewhere in the file (check with grep).

- [ ] **Step 4: Type-check + lint**

Run: `yarn tsc --noEmit && yarn lint 2>&1 | tail -5`
Expected: tsc clean; no new lint errors.

- [ ] **Step 5: Commit**

```bash
git add hooks/use-is-dark-mode.ts components/navbar/nav-section.tsx components/navbar/auth-appbar.tsx
git commit -m "refactor(navbar): extract useIsDarkMode hook and adopt in navbar"
```

---

### Task 5: Delete dead code + rename provider

**Files:**

- Delete: `components/navbar/nav-styled.tsx`
- Modify: `components/navbar/navbar-toolbar-context.tsx`
- Modify: `app/layout.tsx`

**Interfaces:**

- Removes: `NavBarToolbarContext`, `useNavBarToolbar`, `toolbarSlot`/`setToolbarSlot`. Renames `NavBarToolbarProvider` → `DrawerStateProvider`.
- Keeps: `NavDrawerContext`/`useNavDrawer`, `SidebarContext`/`useSidebar`.

- [ ] **Step 1: Delete nav-styled.tsx**

```bash
git rm components/navbar/nav-styled.tsx
```

- [ ] **Step 2: Remove the toolbarSlot context**

In `components/navbar/navbar-toolbar-context.tsx`, delete:

- the `NavBarToolbarContextType` type (lines 5-8),
- `export const NavBarToolbarContext = ...` (line 20),
- the `const [toolbarSlot, setToolbarSlot] = React.useState(...)` line (line 28),
- the `<NavBarToolbarContext.Provider value={{ toolbarSlot, setToolbarSlot }}>` wrapper and its closing tag (lines 41, 43) — leave its `{children}` as the child of `SidebarContext.Provider`,
- the entire `useNavBarToolbar` function (lines 49-53).

- [ ] **Step 3: Rename the provider**

In the same file, rename `export function NavBarToolbarProvider(` → `export function DrawerStateProvider(`.

After edits, the provider returns:

```tsx
return (
  <NavDrawerContext.Provider value={{ drawerOpen, setDrawerOpen }}>
    <SidebarContext.Provider value={{ sidebarOpen, setSidebarOpen }}>
      {children}
    </SidebarContext.Provider>
  </NavDrawerContext.Provider>
)
```

- [ ] **Step 4: Update app/layout.tsx**

In `app/layout.tsx`, change the import `NavBarToolbarProvider` → `DrawerStateProvider` (from `@/components/navbar/navbar-toolbar-context`) and both the opening `<NavBarToolbarProvider>` and closing `</NavBarToolbarProvider>` JSX tags to `<DrawerStateProvider>` / `</DrawerStateProvider>`.

- [ ] **Step 5: Type-check + lint + dead-symbol sweep**

Run: `yarn tsc --noEmit && yarn lint 2>&1 | tail -5`
Expected: tsc clean; no new lint errors.

Run: `grep -rn "nav-styled\|useNavBarToolbar\|NavBarToolbarContext\|toolbarSlot\|NavBarToolbarProvider" app/ components/`
Expected: no matches.

- [ ] **Step 6: Commit**

```bash
git add components/navbar/navbar-toolbar-context.tsx app/layout.tsx
git commit -m "refactor(navbar): remove dead nav-styled + toolbarSlot context, rename provider"
```

---

### Task 6: Final cross-cutting verification

**Files:** none (verification only).

- [ ] **Step 1: Full type-check + lint + format**

Run: `yarn tsc --noEmit && yarn lint 2>&1 | tail -5`
Expected: tsc clean; lint shows only the pre-existing `quick-access.tsx` `CardContent` warning.

- [ ] **Step 2: Dead-symbol + magic-number sweep**

Run: `grep -rn "nav-styled\|useNavBarToolbar\|NavBarToolbarContext\|toolbarSlot\|NavBarToolbarProvider" app/ components/` — expect no matches.
Run: `grep -rn "'sidebar-open'\|'nav-drawer-open'\|+ 21px\|) - 21px" app/ components/ lib/ | grep -v layout-constants.ts` — expect no matches (all consumed from constants / single-calc form).

- [ ] **Step 3: Running-app AppBar inset check (the critical one)**

With the dev server running:

- On any page at desktop width, toggle the nav drawer open then closed. Confirm the title AppBar and the toolbar AppBar shift left/right and resize **together in sync** (they now share `useAppBarInsets`). Capture the open-drawer state — confirm the AppBar's left edge aligns with the drawer (this exercises the corrected `calc(240px - 21px)`).
- On `/eureka`, toggle the filter sidebar. Confirm both AppBars reserve the right margin and the grid still reflows.
- Open both nav drawer + filter sidebar together. Confirm `width` accounts for both insets, no overlap.
- Console: no NEW errors (ignore the known NavBar gradient hydration warning).

- [ ] **Step 4: Dark-mode check**

- Toggle theme (system/light/dark) on a page with the nav drawer visible (`nav-section` consumer) and on `/login` (`auth-appbar` consumer). Confirm correct light/dark rendering and no hydration warning tied to these components.

- [ ] **Step 5: Push and open PR (base = feat/dynamic-sidebar)**

```bash
git push -u origin feat/navbar-cleanup
gh pr create --base feat/dynamic-sidebar --title "refactor(navbar): Phase 2b cleanup — dedupe insets, centralize constants, remove dead code" --body "<summary + verification + note: stacked on #254, retarget to main after #254 merges>"
```

---

## Self-Review

**Spec coverage:**

- Delete nav-styled + toolbarSlot context → Task 5 ✓
- Rename provider → Task 5 ✓
- lib/layout-constants.ts → Task 1; consumers → Task 2 ✓
- Registry references DEFAULT_SIDEBAR_WIDTH → Task 2 Step 5 ✓
- useAppBarInsets + the `calc()` correction → Task 3 ✓
- useIsDarkMode + navbar migration → Task 4 ✓
- Verification (inset sync, sidebar push, dark mode, sweeps) → Task 6 ✓

**Placeholder scan:** No TBD/TODO; all code steps show full before/after. The PR body in Task 6 Step 5 is the one intentional fill-at-time item (standard).

**Type consistency:** `NAV_DRAWER_WIDTH` / `NAV_RAIL_FUDGE` / `DEFAULT_SIDEBAR_WIDTH` / `NAV_DRAWER_STORAGE_KEY` / `SIDEBAR_STORAGE_KEY` used consistently Tasks 1-3. `useAppBarInsets()` return shape `{ ml, mr, width, transition }` matches the `...insets` spread in both consumers. `useIsDarkMode()` returns the same boolean the inline code produced.

**Ordering safety:** Task 2's re-export of `NAV_DRAWER_WIDTH` from nav-drawer keeps `nav-bar`/`navbar-toolbar` compiling until Task 3 removes those imports; Task 5's deletions run only after all consumers stopped referencing the removed symbols. Tree compiles at every task boundary.
