# Navbar/Drawer Cleanup (Phase 2b) — Design

## Context

Phase 2b of the layout redesign: remove dead navbar code, de-duplicate the AppBar inset math, and centralize layout magic numbers. This was deferred from the original redesign until the dynamic sidebar (Phase 3, PR #254) existed, because the AppBar inset math depends on the sidebar registry — that dependency is now satisfied.

Problems this addresses (verified on the current `feat/dynamic-sidebar` branch):

1. **Dead code.** `components/navbar/nav-styled.tsx` is an entire alternate styled-drawer/AppBar system with **zero importers**. The `NavBarToolbarContext` / `useNavBarToolbar` / `toolbarSlot` portal machinery in `navbar-toolbar-context.tsx` is referenced **only inside that file itself** (the portal was abandoned in favor of the `NavBarToolbar` AppBar).
2. **Duplicated inset math.** `nav-bar.tsx` (lines 15-23, 47-58) and `navbar-toolbar.tsx` (lines 15-19, 28-40) compute `sidebarConfig` / `sidebarInset` / `navInset` and the AppBar `ml`/`mr`/`width`/`transition` sx **verbatim**. Only their appearance (gradient vs transparent, pointerEvents) and children differ.
3. **Magic numbers.** `NAV_DRAWER_WIDTH` lives in `nav-drawer.tsx`; the `+21px`/`-21px` rail fudge is an unexplained inline literal appearing 2×; the collapsed rail is `spacing(10)+1px` in the drawer but `spacing(10)+21px` in the navbar inset — synced by convention. PR #254's review also flagged the `'sidebar-open'` string and the `400` width as duplicated across files.
4. **Duplicated dark-mode guard.** The mounted-guard `useColorScheme` pattern is copy-pasted in 7 files; this pass extracts a hook and migrates the 2 navbar files (the other 5 are left for later adoption).

**Goal:** delete the dead code, extract the inset math into one hook, centralize the constants (including the sidebar width + storage keys, resolving #254's Minors), and extract the dark-mode guard — migrating only the navbar. Structural refactor; preserve current behavior except one intentional CSS correction (below).

**Branch:** stacks on `feat/dynamic-sidebar` (PR #254 unmerged; Phase 2b edits the same files). The Phase 2b PR therefore depends on #254 merging first.

## Components

### Delete

- `components/navbar/nav-styled.tsx` (whole file, 0 importers).
- In `navbar-toolbar-context.tsx`: `NavBarToolbarContextType`, `NavBarToolbarContext`, the `toolbarSlot`/`setToolbarSlot` state + its Provider wrapper, and `useNavBarToolbar`. Keep `NavDrawerContext`/`useNavDrawer` and `SidebarContext`/`useSidebar`.

### Rename

- `NavBarToolbarProvider` → `DrawerStateProvider` (it now carries only drawer + sidebar state, no toolbar slot). Update its single import + usage in `app/layout.tsx`. **Keep the filename** `navbar-toolbar-context.tsx` to minimize churn.

### Create: `lib/layout-constants.ts`

Single source of truth:

```ts
export const NAV_DRAWER_WIDTH = 240
export const NAV_RAIL_FUDGE = 21 // reconciles drawer margin:20 + border with AppBar margins
export const DEFAULT_SIDEBAR_WIDTH = 400
export const NAV_DRAWER_STORAGE_KEY = 'nav-drawer-open'
export const SIDEBAR_STORAGE_KEY = 'sidebar-open'
```

Consumers updated to import from here:

- `nav-drawer.tsx` — `NAV_DRAWER_WIDTH` (stops exporting its own), `NAV_DRAWER_STORAGE_KEY`.
- `navbar-toolbar-context.tsx` — both storage keys (were inline consts).
- `components/sidebar/sidebar.tsx` — `DEFAULT_SIDEBAR_WIDTH`, `SIDEBAR_STORAGE_KEY` (were private consts).
- `components/filter/filter-menu.tsx` — `SIDEBAR_STORAGE_KEY` (was the `'sidebar-open'` literal in `closeFilter`). Resolves #254 Minor.
- `lib/sidebar-registry.ts` — its per-route `width: 400` references `DEFAULT_SIDEBAR_WIDTH` so there is genuinely one `400` (closes the drawer-width-vs-registry-width coupling flagged in #254's final review).
- the new `useAppBarInsets` hook — `NAV_DRAWER_WIDTH`, `NAV_RAIL_FUDGE`.

### Create: `components/navbar/use-app-bar-insets.ts`

`'use client'` hook owning the inset math; returns an sx fragment:

```ts
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

Consumers:

- `nav-bar.tsx` — replace the derivation (lines 15-23) with `const insets = useAppBarInsets()`; spread `...insets` into its `sx` callback where `ml`/`mr`/`width`/`transition` are; keep gradient background / `backdropFilter` / `maskImage` / `useColorTheme`.
- `navbar-toolbar.tsx` — same; keep `color="transparent"` / `pointerEvents` / two-`Toolbar` structure.

**Intentional CSS correction:** the current open-drawer `navInset` string is `` `calc(${NAV_DRAWER_WIDTH}px) - 21px` `` — the `- 21px` sits _outside_ the `calc()`, so it is not part of the computed width the way `calc(240px - 21px)` would be. The hook writes the correct single-`calc` form `calc(240px - 21px)`. This is a real pixel change (a fix, not byte-identical), so verification includes a visual before/after of the open-drawer AppBar alignment; fall back to preserving the exact quirk only if the fix looks wrong.

### Create: `hooks/use-is-dark-mode.ts`

`'use client'` hook extracting the mounted-guard pattern:

```ts
export function useIsDarkMode() {
  const { mode, systemMode } = useColorScheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted && (mode === 'system' ? systemMode : mode) === 'dark'
}
```

Migrate the 2 navbar consumers only: `nav-section.tsx` (lines 32-35) and `auth-appbar.tsx` (lines 9-12) → `const isDarkMode = useIsDarkMode()`. The other 5 files (quick-access, toggle-icon, category-image, 2 profile charts) are left for later.

## Data flow

No behavior change to state flow. `useAppBarInsets` reads the same two contexts (`useNavDrawer`, `useSidebar`) + `sidebarConfigFor(pathname)` the two AppBars already read, and returns the same computed sx — just once instead of twice. `useIsDarkMode` returns the same boolean the inline pattern produced. Constants move files but keep their values.

## Edge cases

- **`NAV_DRAWER_WIDTH` relocation.** It moves out of `nav-drawer.tsx` (which now imports it). Grep confirmed only `nav-bar.tsx`/`navbar-toolbar.tsx` imported it from there, and both move to the hook — so no dangling import. `nav-drawer.tsx` itself still uses it internally (its styled mixins) via the new import.
- **nav-bar's `sx` is a callback** `(theme) => ({...})`; spreading the plain `insets` object inside it is valid.
- **Registry width referencing a constant.** `lib/sidebar-registry.ts` gains an import of `DEFAULT_SIDEBAR_WIDTH`; verify no circular import (layout-constants imports nothing app-specific, so it's a leaf — safe).
- **Provider rename** is the only change touching `app/layout.tsx` (import + one JSX tag pair).

## Scope boundary

Navbar-focused. **Out of scope:** the 5 non-navbar dark-mode files; the drawer's `openedMixin`/`closedMixin` styling; collapsing the two `<Toolbar>` spacers in the layout (plan flagged brittle/low-priority); the styled-drawer-factory idea for the shared drawer mixins (nav-drawer vs the sidebar's — different enough that a factory adds indirection without much gain now).

## Verification (end-to-end)

1. `yarn tsc --noEmit` + `yarn lint` clean (only the known pre-existing `quick-access.tsx` warning).
2. **Dead-code sweep:** `grep -rn "nav-styled|useNavBarToolbar|NavBarToolbarContext|toolbarSlot|NavBarToolbarProvider"` over `app/ components/` → zero matches (`NavBarToolbarProvider` fully renamed).
3. **AppBar inset (critical), running app:**
   - Desktop: toggle the nav drawer open/closed on a page — both AppBars (title bar + toolbar row) shift/resize together in sync; capture the open-drawer alignment (the `calc()` fix) before/after.
   - `/eureka`: toggle the filter sidebar — both AppBars reserve the right margin via the shared hook; grid still reflows.
   - Both open at once — `width: calc(100% - navInset - sidebarInset)` holds; no overlap.
4. **Dark mode:** toggle theme on a drawer page (`nav-section`) and `/login` (`auth-appbar`) — correct rendering, no hydration warning in console (the nav-bar gradient hydration warning is pre-existing/known — ignore it).
5. Confirm `sidebarConfigFor` still returns `400` for its routes (now via `DEFAULT_SIDEBAR_WIDTH`) so the sidebar push width is unchanged.
