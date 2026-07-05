# Generic Dynamic Sidebar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract the filter drawer into a generic content-pushing `Sidebar` + path→config registry, then wire up the Custom Looks builder as a second consumer so its composer panel lives in a sidebar and the piece picker gets full width.

**Architecture:** A single generic `Sidebar` component (toggle button + temporary overlay drawer below `sm` + permanent content-pushing drawer at `sm+`) reads a shared global open/close boolean from context. A `lib/sidebar-registry.ts` match-function registry maps pathnames to `{ width }`; the three margin-math consumers (content shim, NavBar, NavBarToolbar) gate on the registry instead of a hardcoded `FILTER_PAGES` array. `FilterMenu` and the looks builder are the two consumers.

**Tech Stack:** Next.js 16 App Router, MUI v9 (styled Drawer), React context, TypeScript. No unit-test framework exists in this repo.

## Global Constraints

- Package manager: **Yarn** (never npm/pnpm). Only `dev/build/start/lint/format/lint:fix` are scripts.
- Code style: no semicolons, single quotes, 2-space indent, 100-char width, trailing commas ES5 (Prettier). Path alias `@/` = project root.
- **No unit-test framework.** Each task's verification is `yarn tsc --noEmit`, `yarn lint`, and driving the running app. A PostToolUse hook runs `yarn format && yarn lint:fix` then `yarn tsc --noEmit` after every Edit/Write — expect it to auto-format and surface type errors.
- MUI dark mode via `useColorScheme()` (not `useTheme().palette.mode`). Client components need `'use client'`.
- `git add` with `[slug]` paths must be quoted (zsh glob): `git add 'app/looks/edit/[slug]/...'`.
- Branch: `feat/dynamic-sidebar` (already created, spec already committed there). Never push to `main`.
- Known-benign: a NavBar gradient-className hydration warning pre-exists on `main` — ignore it during verification.

## File Structure

- **Create** `lib/sidebar-registry.ts` — `SidebarConfig` type + `sidebarConfigFor(pathname)`. Single source of truth for which routes have a sidebar and how wide.
- **Create** `components/sidebar/sidebar.tsx` — the generic `Sidebar` component (extracted `FilterDrawer` shell + styled drawer mixins), parameterized by `width`, `icon`, `title`.
- **Create** `components/sidebar/sidebar-content-shim.tsx` — moved+renamed from `components/filter/filter-content-shim.tsx`, now registry-driven.
- **Delete** `components/filter/filter-content-shim.tsx` (replaced by the move above).
- **Modify** `components/navbar/navbar-toolbar-context.tsx` — rename filter context → sidebar context.
- **Modify** `components/filter/filter-menu.tsx` — becomes a `Sidebar` consumer; delete its private shell + constants.
- **Modify** `components/navbar/nav-bar.tsx` + `components/navbar/navbar-toolbar.tsx` — consume the registry + renamed context.
- **Modify** `app/layout.tsx` — update the `FilterContentShim` import to the new path.
- **Modify** `app/looks/look-builder.tsx` — composer into a `Sidebar`, picker full-width, auto-open on new.

---

### Task 1: Sidebar registry

**Files:**

- Create: `lib/sidebar-registry.ts`

**Interfaces:**

- Produces: `type SidebarConfig = { width: number }`; `sidebarConfigFor(pathname: string): SidebarConfig | null`.

- [ ] **Step 1: Create the registry**

Create `lib/sidebar-registry.ts`:

```ts
// Which routes show a content-pushing Sidebar, and how wide it is. A match
// function (not a plain path array) so dynamic routes like /looks/edit/[slug]
// can be expressed with prefix matching. Consumed by the Sidebar's margin-math
// consumers (sidebar-content-shim, NavBar, NavBarToolbar) to reserve right-margin
// when the sidebar is open.
export type SidebarConfig = { width: number }

const SIDEBAR_ROUTES: Array<{ match: (pathname: string) => boolean; config: SidebarConfig }> = [
  { match: (p) => p === '/eureka' || p === '/outfits', config: { width: 400 } },
  { match: (p) => p === '/looks/new' || p.startsWith('/looks/edit/'), config: { width: 400 } },
]

export function sidebarConfigFor(pathname: string): SidebarConfig | null {
  return SIDEBAR_ROUTES.find((route) => route.match(pathname))?.config ?? null
}
```

- [ ] **Step 2: Type-check**

Run: `yarn tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/sidebar-registry.ts
git commit -m "feat(sidebar): add path→config registry"
```

---

### Task 2: Rename filter context → sidebar context

**Files:**

- Modify: `components/navbar/navbar-toolbar-context.tsx`

**Interfaces:**

- Consumes: nothing new.
- Produces: `SidebarContext`, `useSidebar()` returning `{ sidebarOpen: boolean; setSidebarOpen: (open: boolean) => void }`. (Replaces `FilterDrawerContext` / `useFilterDrawer` / `filterOpen` / `setFilterOpen`.)

This task only renames; consumers are updated in later tasks, so `yarn tsc` will report errors in the 3 not-yet-updated consumers until Task 5. That is expected — verify the intended errors, don't try to make tsc clean here.

- [ ] **Step 1: Rename the context type, state, provider, and hook**

In `components/navbar/navbar-toolbar-context.tsx`:

Replace the type block:

```tsx
type FilterDrawerContextType = {
  filterOpen: boolean
  setFilterOpen: (open: boolean) => void
}
```

with:

```tsx
type SidebarContextType = {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}
```

Replace:

```tsx
export const FilterDrawerContext = React.createContext<FilterDrawerContextType | null>(null)
```

with:

```tsx
export const SidebarContext = React.createContext<SidebarContextType | null>(null)
```

Replace the storage-key line:

```tsx
const FILTER_STORAGE_KEY = 'filter-drawer-open'
```

with:

```tsx
const SIDEBAR_STORAGE_KEY = 'sidebar-open'
```

In `NavBarToolbarProvider`, replace:

```tsx
const [filterOpen, setFilterOpen] = React.useState(false)
```

with:

```tsx
const [sidebarOpen, setSidebarOpen] = React.useState(false)
```

In the post-mount effect, replace:

```tsx
setFilterOpen(localStorage.getItem(FILTER_STORAGE_KEY) === 'true')
```

with:

```tsx
setSidebarOpen(localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true')
```

Replace the provider element:

```tsx
      <FilterDrawerContext.Provider value={{ filterOpen, setFilterOpen }}>
```

and its closing tag `</FilterDrawerContext.Provider>` with:

```tsx
      <SidebarContext.Provider value={{ sidebarOpen, setSidebarOpen }}>
```

closing `</SidebarContext.Provider>`.

Replace the hook:

```tsx
export function useFilterDrawer() {
  const ctx = React.useContext(FilterDrawerContext)
  if (!ctx) throw new Error('useFilterDrawer must be used within NavBarToolbarProvider')
  return ctx
}
```

with:

```tsx
export function useSidebar() {
  const ctx = React.useContext(SidebarContext)
  if (!ctx) throw new Error('useSidebar must be used within NavBarToolbarProvider')
  return ctx
}
```

- [ ] **Step 2: Verify only the expected consumers break**

Run: `yarn tsc --noEmit 2>&1 | grep -oE "components/[^ ]+\.tsx|app/[^ ]+\.tsx" | sort -u`
Expected: errors localized to `components/filter/filter-menu.tsx`, `components/filter/filter-content-shim.tsx`, `components/navbar/nav-bar.tsx`, `components/navbar/navbar-toolbar.tsx` (the not-yet-migrated consumers). No errors in unrelated files.

- [ ] **Step 3: Commit**

```bash
git add components/navbar/navbar-toolbar-context.tsx
git commit -m "refactor(sidebar): rename filter drawer context to generic sidebar context"
```

---

### Task 3: Generic Sidebar component

**Files:**

- Create: `components/sidebar/sidebar.tsx`

**Interfaces:**

- Consumes: `useSidebar()` from `@/components/navbar/navbar-toolbar-context` (Task 2).
- Produces: default export `Sidebar` with props `{ children: React.ReactNode; icon?: React.ReactNode; title?: React.ReactNode; width?: number }`; named export `DEFAULT_SIDEBAR_WIDTH = 400`.

- [ ] **Step 1: Create the Sidebar component**

Create `components/sidebar/sidebar.tsx` — this is the extracted `FilterDrawer` shell (from `components/filter/filter-menu.tsx:50-162`), parameterized by `width` and `icon`:

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
import { Close, FilterList } from '@mui/icons-material'
import { useSidebar } from '@/components/navbar/navbar-toolbar-context'

export const DEFAULT_SIDEBAR_WIDTH = 400
const SIDEBAR_STORAGE_KEY = 'sidebar-open'

const openedMixin = (theme: Theme, width: number): CSSObject => ({
  height: 'calc(100vh - 100px)',
  border: 0,
  borderRadius: '30px',
  marginTop: 80,
  marginBottom: 20,
  width,
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

const PermanentDrawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== 'open' && prop !== 'width',
})<{ width: number }>(({ theme, width }) => ({
  width,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  variants: [
    {
      props: ({ open }) => open,
      style: {
        ...openedMixin(theme, width),
        '& .MuiDrawer-paper': openedMixin(theme, width),
      },
    },
    {
      props: ({ open }) => !open,
      style: {
        ...closedMixin(theme),
        '& .MuiDrawer-paper': closedMixin(theme),
      },
    },
  ],
}))

// Generic content-pushing sidebar: a temporary overlay drawer below `sm` and a
// permanent, content-pushing drawer at `sm`+, mirroring the nav-drawer split. The
// body is passed as children so any page can reuse it. Open/close is the shared
// global sidebar boolean (one sidebar is active per route). The margin reservation
// that makes the permanent drawer "push" content lives in sidebar-content-shim /
// NavBar / NavBarToolbar, keyed on the sidebar registry.
export default function Sidebar({
  children,
  icon = <FilterList />,
  title,
  width = DEFAULT_SIDEBAR_WIDTH,
}: {
  children: React.ReactNode
  icon?: React.ReactNode
  title?: React.ReactNode
  width?: number
}) {
  const { sidebarOpen, setSidebarOpen } = useSidebar()

  function toggle(value: boolean) {
    setSidebarOpen(value)
    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(value))
  }

  const header = (
    <Toolbar>
      <Stack
        direction="row"
        sx={{ flex: 1, alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}
      >
        {title}
        <IconButton onClick={() => toggle(false)}>
          <Close />
        </IconButton>
      </Stack>
    </Toolbar>
  )

  return (
    <>
      <IconButton color={sidebarOpen ? 'primary' : 'default'} onClick={() => toggle(!sidebarOpen)}>
        {icon}
      </IconButton>

      <MuiDrawer
        anchor="right"
        open={sidebarOpen}
        slotProps={{ root: { disableScrollLock: true } }}
        sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { width: '100%' } }}
        variant="temporary"
        onClose={() => setSidebarOpen(false)}
      >
        {header}
        {children}
      </MuiDrawer>
      <PermanentDrawer
        anchor="right"
        open={sidebarOpen}
        sx={{ display: { xs: 'none', sm: 'block' } }}
        variant="permanent"
        width={width}
      >
        {header}
        {children}
      </PermanentDrawer>
    </>
  )
}
```

Note: the header now renders `title` on the left (the old `FilterDrawer` header had no title — this is a superset, and `FilterMenu` will pass no `title`, so its header stays visually a right-aligned Close button as before).

- [ ] **Step 2: Type-check the new file**

Run: `yarn tsc --noEmit 2>&1 | grep 'sidebar/sidebar.tsx' || echo "sidebar.tsx clean"`
Expected: `sidebar.tsx clean` (the 4 pre-existing consumer errors from Task 2 still show for other files; that's fine).

- [ ] **Step 3: Commit**

```bash
git add components/sidebar/sidebar.tsx
git commit -m "feat(sidebar): add generic content-pushing Sidebar component"
```

---

### Task 4: Move + generalize the content shim

**Files:**

- Create: `components/sidebar/sidebar-content-shim.tsx`
- Delete: `components/filter/filter-content-shim.tsx`
- Modify: `app/layout.tsx` (import path + component name)

**Interfaces:**

- Consumes: `useSidebar()` (Task 2), `sidebarConfigFor` (Task 1).
- Produces: default export `SidebarContentShim`.

- [ ] **Step 1: Create the generalized shim**

Create `components/sidebar/sidebar-content-shim.tsx`:

```tsx
'use client'

import { Stack } from '@mui/material'
import { usePathname } from 'next/navigation'
import { useSidebar } from '../navbar/navbar-toolbar-context'
import { sidebarConfigFor } from '@/lib/sidebar-registry'

// Wraps the main content column and reserves space on the right for the permanent
// sidebar when it is open (sm+ only — below sm the sidebar overlays as a temporary
// drawer and does not push content). Mirrors the margin/width transition the left
// nav drawer drives on NavBar. Registry-driven: any registered route participates.
export default function SidebarContentShim({ children }: { children: React.ReactNode }) {
  const { sidebarOpen } = useSidebar()
  const pathname = usePathname()
  const config = sidebarConfigFor(pathname)
  const pushed = sidebarOpen && config !== null

  return (
    <Stack
      sx={{
        flex: 1,
        minHeight: '100vh',
        minWidth: '300px',
        justifyContent: 'flex-start',
        mr: { xs: 0, sm: pushed ? `${config!.width}px` : 0 },
        transition: (theme) =>
          theme.transitions.create('margin-right', {
            easing: theme.transitions.easing.sharp,
            duration: pushed
              ? theme.transitions.duration.enteringScreen
              : theme.transitions.duration.leavingScreen,
          }),
      }}
    >
      {children}
    </Stack>
  )
}
```

- [ ] **Step 2: Delete the old shim**

```bash
git rm components/filter/filter-content-shim.tsx
```

- [ ] **Step 3: Update the root layout import**

In `app/layout.tsx`, replace:

```tsx
import FilterContentShim from '@/components/filter/filter-content-shim'
```

with:

```tsx
import SidebarContentShim from '@/components/sidebar/sidebar-content-shim'
```

Then replace the JSX usage `<FilterContentShim>` … `</FilterContentShim>` with `<SidebarContentShim>` … `</SidebarContentShim>` (one open + one close tag).

- [ ] **Step 4: Type-check**

Run: `yarn tsc --noEmit 2>&1 | grep -oE "(components|app)/[^ ]+\.tsx" | sort -u`
Expected: remaining errors only in `components/filter/filter-menu.tsx`, `components/navbar/nav-bar.tsx`, `components/navbar/navbar-toolbar.tsx` (still on old context). `app/layout.tsx` and the shim are clean.

- [ ] **Step 5: Commit**

```bash
git add components/sidebar/sidebar-content-shim.tsx app/layout.tsx
git commit -m "refactor(sidebar): move content shim to sidebar/, drive it from the registry"
```

---

### Task 5: Update NavBar + NavBarToolbar to the registry

**Files:**

- Modify: `components/navbar/nav-bar.tsx:9,11,16,19,20` (and the sx that reads `filterInset`)
- Modify: `components/navbar/navbar-toolbar.tsx:5,7,12,15,16`

**Interfaces:**

- Consumes: `useSidebar()` (Task 2), `sidebarConfigFor` (Task 1).
- Produces: nothing new.

- [ ] **Step 1: Update NavBar**

In `components/navbar/nav-bar.tsx`:

Replace the import:

```tsx
import { useNavDrawer, useFilterDrawer } from './navbar-toolbar-context'
```

with:

```tsx
import { useNavDrawer, useSidebar } from './navbar-toolbar-context'
```

Delete the filter-menu import:

```tsx
import { FILTER_DRAWER_WIDTH, FILTER_PAGES } from '@/components/filter/filter-menu'
```

and add:

```tsx
import { sidebarConfigFor } from '@/lib/sidebar-registry'
```

Replace:

```tsx
const { filterOpen } = useFilterDrawer()
```

with:

```tsx
const { sidebarOpen } = useSidebar()
```

Replace:

```tsx
const filterPushed = filterOpen && FILTER_PAGES.includes(pathname)
const filterInset = filterPushed ? `${FILTER_DRAWER_WIDTH}px` : '0px'
```

with:

```tsx
const sidebarConfig = sidebarConfigFor(pathname)
const filterInset = sidebarOpen && sidebarConfig ? `${sidebarConfig.width}px` : '0px'
```

(The `filterInset` variable name and everything downstream in the AppBar `sx` stays unchanged.)

- [ ] **Step 2: Update NavBarToolbar**

In `components/navbar/navbar-toolbar.tsx`, apply the identical set of changes: import `useSidebar` instead of `useFilterDrawer`; replace the `FILTER_DRAWER_WIDTH, FILTER_PAGES` import with `import { sidebarConfigFor } from '@/lib/sidebar-registry'`; replace `const { filterOpen } = useFilterDrawer()` with `const { sidebarOpen } = useSidebar()`; and replace:

```tsx
const filterPushed = filterOpen && FILTER_PAGES.includes(pathname)
const filterInset = filterPushed ? `${FILTER_DRAWER_WIDTH}px` : '0px'
```

with:

```tsx
const sidebarConfig = sidebarConfigFor(pathname)
const filterInset = sidebarOpen && sidebarConfig ? `${sidebarConfig.width}px` : '0px'
```

- [ ] **Step 3: Type-check**

Run: `yarn tsc --noEmit 2>&1 | grep -oE "(components|app)/[^ ]+\.tsx" | sort -u`
Expected: the only remaining error file is `components/filter/filter-menu.tsx` (still exports the now-unused `FILTER_PAGES`/`FILTER_DRAWER_WIDTH` and uses the old context) — fixed in Task 6.

- [ ] **Step 4: Commit**

```bash
git add components/navbar/nav-bar.tsx components/navbar/navbar-toolbar.tsx
git commit -m "refactor(sidebar): drive AppBar insets from the sidebar registry"
```

---

### Task 6: FilterMenu becomes a Sidebar consumer

**Files:**

- Modify: `components/filter/filter-menu.tsx` (delete lines 45-162 shell/constants; rewrite the two `<FilterDrawer>` usages to `<Sidebar>`)

**Interfaces:**

- Consumes: `Sidebar` (Task 3). Removes exports `FILTER_PAGES`, `FILTER_DRAWER_WIDTH` (no longer imported anywhere after Task 5).
- Produces: default export `FilterMenu` (unchanged signature).

- [ ] **Step 1: Delete the private shell and constants**

In `components/filter/filter-menu.tsx`, delete:

- The exports `export const FILTER_PAGES = ['/eureka', '/outfits']` and `export const FILTER_DRAWER_WIDTH = 400` and `const FILTER_STORAGE_KEY = 'filter-drawer-open'` (lines ~45-48).
- The `openedMixin`, `closedMixin`, `PermanentDrawer` definitions (lines ~50-103).
- The entire `function FilterDrawer({ children }) { … }` (lines ~105-162).

Remove now-unused imports from this file: `CSSObject`, `Drawer as MuiDrawer`, `styled`, `Theme`, `Toolbar`, `Close`, `FilterList`, and `useFilterDrawer`. Keep imports still used by the filter bodies (`Button`, `Divider`, `IconButton`, `List`, `ListItem`, `SelectChangeEvent`, `Stack`, `Typography`, etc.). Add:

```tsx
import Sidebar from '@/components/sidebar/sidebar'
```

- [ ] **Step 2: Replace the `useFilterDrawer` usage inside FilterMenu**

`FilterMenu` calls `const { setFilterOpen } = useFilterDrawer()` and defines `closeFilter`. Replace the hook call with `const { setSidebarOpen } = useSidebar()` (import `useSidebar` from `'../navbar/navbar-toolbar-context'`), and update `closeFilter`:

```tsx
const closeFilter = () => {
  setSidebarOpen(false)
  localStorage.setItem('sidebar-open', 'false')
}
```

Keep the route short-circuit but drive it from the registry — replace `if (!FILTER_PAGES.includes(pathname)) return null` with:

```tsx
if (!sidebarConfigFor(pathname)) return null
```

and add `import { sidebarConfigFor } from '@/lib/sidebar-registry'`.

- [ ] **Step 3: Swap both `<FilterDrawer>` wrappers for `<Sidebar>`**

Both the outfits branch and the eureka branch wrap their `<List>` in `<FilterDrawer>…</FilterDrawer>`. Replace each opening `<FilterDrawer>` with `<Sidebar>` and each closing `</FilterDrawer>` with `</Sidebar>`. (No `icon`/`title`/`width` props → defaults: `FilterList` icon, width 400, no title — identical to today.)

- [ ] **Step 4: Type-check + lint**

Run: `yarn tsc --noEmit && yarn lint 2>&1 | tail -5`
Expected: tsc clean (no output); lint reports no NEW errors (a pre-existing unrelated `quick-access.tsx` `CardContent` warning may remain).

- [ ] **Step 5: Verify the filter regression in the running app**

Start the dev server if not running: `yarn dev` (note the port). Then drive it:

- Navigate to `/eureka`. Confirm the page renders and the filter toggle (funnel icon) is in the top toolbar.
- Click the filter toggle. Confirm the filter panel slides in from the right, the content column shifts left, and the card grid reflows to fewer columns (5→4).
- Close it. Confirm the grid returns to 5 columns.
- Repeat on `/outfits` (grid 2→… reflow).
- Check the browser console: no NEW errors (ignore the known NavBar gradient hydration warning).

- [ ] **Step 6: Commit**

```bash
git add components/filter/filter-menu.tsx
git commit -m "refactor(filters): render FilterMenu through the generic Sidebar"
```

---

### Task 7: Looks builder uses the Sidebar

**Files:**

- Modify: `app/looks/look-builder.tsx` (toolbar region + the two-column render at ~683-731; add auto-open effect)

**Interfaces:**

- Consumes: `Sidebar` (Task 3), `useSidebar()` (Task 2).
- Produces: nothing new.

- [ ] **Step 1: Add imports and the auto-open effect**

In `app/looks/look-builder.tsx`:

Add imports near the existing ones:

```tsx
import Sidebar from '@/components/sidebar/sidebar'
import { useSidebar } from '@/components/navbar/navbar-toolbar-context'
import TuneIcon from '@mui/icons-material/Tune'
```

Inside the component body (with the other hooks/state), add:

```tsx
const { setSidebarOpen } = useSidebar()

// For a brand-new look, open the sidebar on mount so the (required) name field
// is visible — the Save button in the toolbar is disabled until the look is
// named, and the name field lives inside the sidebar. Runs after the provider's
// post-mount localStorage read, so it isn't clobbered. On edit, respect the
// persisted open/closed state (the look already has a name).
React.useEffect(() => {
  if (!initialLook) setSidebarOpen(true)
}, [initialLook, setSidebarOpen])
```

(If the file imports `useEffect` directly rather than `React`, use `useEffect(...)` to match the file's existing style — check the top-of-file imports.)

- [ ] **Step 2: Put the composer in a Sidebar in the toolbar**

In the `return`, the `NavBarToolbar` currently holds the title + Cancel + Save `Stack`. Add the `Sidebar` toggle to that toolbar. Locate:

```tsx
<NavBarToolbar>
  <Typography variant="subtitle2">{initialLook ? 'Edit Look' : 'New Look'}</Typography>
  <Stack direction="row" spacing={1} sx={{ flex: 1, justifyContent: 'flex-end' }}>
    <Button component="a" href={cancelHref} variant="outlined">
      Cancel
    </Button>
    <Button
      color="primary"
      disabled={!name.trim() || isPending}
      startIcon={<SaveIcon />}
      variant="contained"
      onClick={handleSave}
    >
      {isPending ? 'Saving…' : saveLabel}
    </Button>
  </Stack>
</NavBarToolbar>
```

Add the `Sidebar` (with the composer as its body) immediately after the action `Stack`, still inside `NavBarToolbar`:

```tsx
<Sidebar icon={<TuneIcon />} title={<Typography variant="subtitle2">Look details</Typography>}>
  {composerPanel}
</Sidebar>
```

So the toolbar row becomes: title, Cancel/Save stack, then the sidebar toggle button (the `Sidebar` renders its own toggle IconButton inline).

- [ ] **Step 3: Replace the two-column grid with a full-width picker**

Replace the entire grid block (currently `app/looks/look-builder.tsx:703-731`):

```tsx
<PageShell maxWidth="wide">
  <Box
    sx={{
      display: 'grid',
      gridTemplateColumns: { xs: '1fr', md: '1fr 340px' },
      gap: 3,
      alignItems: 'start',
    }}
  >
    {/* On mobile, composer comes first */}
    <Box sx={{ display: { xs: 'block', md: 'none' } }}>{composerPanel}</Box>
    <Box sx={{ display: { xs: 'block', md: 'none' } }}>
      <Divider />
    </Box>

    {/* Picker (left on desktop, bottom on mobile) */}
    {pickerPanel}

    {/* Composer (right on desktop, hidden on mobile since it's at top) */}
    <Box
      sx={{
        display: { xs: 'none', md: 'block' },
        position: 'sticky',
        top: 80,
      }}
    >
      {composerPanel}
    </Box>
  </Box>
</PageShell>
```

with a full-width picker (the composer now lives in the sidebar):

```tsx
<PageShell maxWidth="wide">{pickerPanel}</PageShell>
```

- [ ] **Step 4: Remove now-unused pieces**

`composerPanel` is still referenced (inside `Sidebar`), so keep it. Check whether `Divider` and `Box` are still used elsewhere in the file:

Run: `grep -n '<Divider\|<Box' 'app/looks/look-builder.tsx'`
If either has no remaining usages, remove it from the `@mui/material` import. (The picker and composer internals use `Box`, so `Box` almost certainly stays; `Divider` may become unused — remove only if the grep shows zero remaining `<Divider` usages.)

- [ ] **Step 5: Type-check + lint**

Run: `yarn tsc --noEmit && yarn lint 2>&1 | tail -5`
Expected: tsc clean; no new lint errors.

- [ ] **Step 6: Verify the builder in the running app**

With the dev server running:

- Navigate to `/looks/new` (sign in if required for this route). Confirm: the sidebar **auto-opens** showing the "Look details" header + name/description fields; the picker fills the width to the left of the sidebar; the funnel/Tune toggle is in the toolbar.
- Type a name. Confirm the toolbar Save button enables.
- Toggle the sidebar closed. Confirm the picker expands to full width and its category grid reflows to more columns; toggle open again — picker narrows.
- Resize to a narrow (mobile) width. Confirm the sidebar overlays full-width (doesn't push) and the picker stays full-width underneath.
- Navigate to `/looks/edit/<an existing look slug>`. Confirm the composer shows the existing name/description/cover image; Save updates.
- Console: no NEW errors.

- [ ] **Step 7: Commit**

```bash
git add 'app/looks/look-builder.tsx'
git commit -m "feat(looks): move look composer into the dynamic sidebar, full-width picker"
```

---

### Task 8: Final cross-cutting verification

**Files:** none (verification only).

- [ ] **Step 1: Full type-check + lint**

Run: `yarn tsc --noEmit && yarn lint 2>&1 | tail -5`
Expected: tsc clean; lint shows only the pre-existing unrelated `quick-access.tsx` `CardContent` warning.

- [ ] **Step 2: Confirm the dead exports are gone**

Run: `grep -rn "FILTER_PAGES\|FILTER_DRAWER_WIDTH\|useFilterDrawer\|filter-content-shim" app/ components/ lib/`
Expected: no matches (all renamed/removed).

- [ ] **Step 3: Non-sidebar page regression**

In the running app, navigate to `/about` and `/profile`. Confirm: no sidebar toggle button, no right margin reserved, layout unchanged from `main`.

- [ ] **Step 4: Screenshots**

Capture Playwright screenshots at desktop (1280×900) and mobile (390×844) for `/looks/new` (sidebar open) and `/eureka` (filter open). Confirm both sidebars look correct and content is pushed at desktop / overlaid at mobile.

- [ ] **Step 5: Push and open PR**

```bash
git push -u origin feat/dynamic-sidebar
gh pr create --base main --title "feat(layout): generic dynamic sidebar + looks builder consumer" --body "<summary + verification>"
```

---

## Self-Review

**Spec coverage:**

- Generic `Sidebar` component → Task 3 ✓
- `lib/sidebar-registry.ts` → Task 1 ✓
- Context rename → Task 2 ✓
- Shim move+generalize → Task 4 ✓
- NavBar/NavBarToolbar registry → Task 5 ✓
- FilterMenu as consumer → Task 6 ✓
- Looks builder consumer + auto-open → Task 7 ✓
- Edge cases (persisted state gate, auto-open race, mobile overlay, storage-key rename) → covered in Tasks 4/6/7 verification + the effect ordering note in Task 7 ✓
- Verification (filter regression, builder, non-sidebar pages, screenshots) → Tasks 6/7/8 ✓

**Placeholder scan:** No TBD/TODO; all code steps show full code. The PR body in Task 8 Step 5 is `<summary + verification>` — that is the one intentional fill-at-time item (standard for the push step).

**Type consistency:** `sidebarConfigFor` / `SidebarConfig` / `useSidebar` / `sidebarOpen` / `setSidebarOpen` / `DEFAULT_SIDEBAR_WIDTH` used consistently across Tasks 1-7. The `Sidebar` prop shape `{ children, icon?, title?, width? }` matches its consumers (FilterMenu passes none; builder passes `icon`+`title`).
