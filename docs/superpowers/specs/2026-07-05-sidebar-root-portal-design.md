# Root-Mounted Sidebar via Portal + Sticky Toolbar — Design

## Context

The dynamic sidebar (PR #254) mounts its drawer **inside the content column**, deep under a page's toolbars, and fakes the content push with a `SidebarContentShim` that reserves right-margin plus per-AppBar `mr` insets keyed on a `sidebarConfigFor(pathname)` route registry. The nav drawer, by contrast, is a real flex sibling that pushes content structurally.

This change restructures the sidebar to push content the same structural way — but as a **sibling of `main`** (inside the content column, below the NavBar), not a sibling of the whole content column. Because the drawer becomes a real flexbox sibling of `main`, the margin-faking shim and the route registry are removed entirely; the push is pure flexbox.

The wrinkle: the sidebar's body reads data from providers scoped to route layouts (`EurekaDataProvider`, `OutfitDataProvider`, `SortProvider`, `OutfitImageModeProvider`, and the looks-builder's local state) — all **below** the layout where the shell mounts. So the shell cannot render the body directly. The body is rendered where its providers live and **portaled** into a target node the shell exposes.

**Goal:** move the sidebar drawer chrome to the root layout as a flex sibling of `main`; pages project their body into it via a portal; make the per-page `NavBarToolbar` **sticky** (in-flow) instead of fixed; remove the shim, the registry, the AppBar sidebar-inset, and one of the two layout `<Toolbar>` spacers. Motivated by cleaner, consistent structure.

**Decisions locked in brainstorming:**

- Sidebar is a **sibling of `main`** (not of the content column). NavBar spans full content-column width and **ignores** the sidebar (Option A — drop the `mr` inset).
- Body injection is a **React portal**: root shell exposes a target node via context; pages render a `<SidebarBody>` that `createPortal`s its children into it.
- The **toggle button stays in the page toolbar** (contextual per-page icon); only the body relocates.
- **Registry removed** — "does this route have a sidebar" becomes "is a `SidebarBody` mounted right now", tracked via context.
- **`NavBarToolbar` becomes `position: sticky`** (in-flow), replacing `position: fixed`. **Prototyped and validated in the running app** (see the NavBarToolbar section): `top: 80`, `zIndex: theme.zIndex.appBar`, single `<Toolbar>`. Because it's in normal flow inside `main`, it auto-sizes to `main`'s width (no inset math) and, on `sm+`, naturally sits left of the sidebar. This lets us drop one of the two layout spacers and the `pointerEvents` overlay trick.

**Baseline / sequencing:** this work folds into **PR #254 (`feat/dynamic-sidebar`)** so #254 ships the final architecture. On that branch the Phase 2b refactor does NOT exist yet: `lib/sidebar-registry.ts` and `components/sidebar/sidebar-content-shim.tsx` exist; nav-bar/navbar-toolbar have the **inline** duplicated inset math (no `useAppBarInsets` hook, no `layout-constants.ts`). After this lands, **PR #255 (`feat/navbar-cleanup`) must rebase** — its `useAppBarInsets` extraction will have no sidebar branch to extract and its `sidebar-registry` import disappears.

## Components

### New: `components/sidebar/sidebar-shell.tsx`

Mounted once in the root layout as a sibling of `main`. Renders the drawer chrome extracted from today's `Sidebar`: the temporary overlay drawer (`xs`, full-width, doesn't push) and the permanent content-pushing drawer (`sm+`, width `DEFAULT_SIDEBAR_WIDTH`), with the header + Close button. Behavior:

- Reads `sidebarOpen` from context.
- Holds a ref to the drawer paper's content area; publishes that node as `portalTarget` in context (set in a layout effect).
- Reads `hasBody` from context: when no `SidebarBody` is mounted, the shell renders collapsed (width 0, no push) regardless of `sidebarOpen`.
- The permanent drawer being a flex sibling of `main` makes the push structural — no margin math.

### New: `components/sidebar/sidebar-body.tsx`

Page-side. Reads `portalTarget` from context; registers presence (`hasBody`) on mount, unregisters on unmount; `createPortal(children, portalTarget)`. Renders `null` until `portalTarget` exists (avoids a pre-mount flash). Pages wrap their sidebar content in it.

### Removed: `components/sidebar/sidebar.tsx`

Its three fused concerns split: toggle button → stays inline in the page toolbar (a plain `IconButton` calling `setSidebarOpen`); drawer chrome → `SidebarShell`; body → wrapped in `SidebarBody`.

### Removed: `components/sidebar/sidebar-content-shim.tsx`

The margin-push is now pure flexbox. Deleted; the root layout no longer wraps the content column in it.

### Removed: `lib/sidebar-registry.ts`

No route allowlist. The shell reacts to `hasBody`.

### Modified: `components/navbar/navbar-toolbar-context.tsx`

`SidebarContext` gains, beyond `sidebarOpen`/`setSidebarOpen`:

- `portalTarget: HTMLElement | null`, `setPortalTarget(el)` — shell publishes, body consumes.
- `hasBody: boolean` + `registerBody()/unregisterBody()` (or a counter) — `SidebarBody` sets on mount/unmount; shell reads.

### Modified: `components/navbar/nav-bar.tsx` (stays fixed)

`NavBar` stays `position: fixed` at the top. Remove the sidebar inset only (Option A): drop `sidebarConfig = sidebarConfigFor(pathname)`, `filterInset`, the `mr`, and the `- filterInset` term in `width` (→ `calc(100% - ${navInset})`, nav drawer only). Remove the now-unused `sidebarConfigFor`/`useSidebar` imports. It keeps the nav-drawer `ml`/`width`/`navInset` math and its gradient/mask appearance.

### Modified: `components/navbar/navbar-toolbar.tsx` (fixed → sticky) — prototyped & validated

`NavBarToolbar` changes from `position: fixed` to `position: sticky`, becoming a normal-flow element rendered at the top of each page's content (inside `main`). Validated values from the running-app prototype:

- `position: sticky`, `sx={{ top: 80, zIndex: (theme) => theme.zIndex.appBar, borderColor: 'transparent' }}`. `top: 80` parks it just below the fixed NavBar; `zIndex.appBar` keeps it above content but is not overlapped by the NavBar's gradient mask.
- Collapse the internal structure from two `<Toolbar>`s to **one** `<Toolbar sx={{ mb: 2 }}>{children}</Toolbar>` (the first was a spacer for the old fixed layering; the `pointerEvents: 'none'/'auto'` overlay trick is no longer needed since it's in flow).
- **Remove all inset math** (`drawerOpen`/`sidebarOpen`/`pathname`/`useTheme`/`sidebarConfigFor`/`navInset`/`filterInset`/`ml`/`mr`/`width`/`transition`). Because it's in normal flow inside `main`, it auto-sizes to `main`'s width and sits left of the sidebar on `sm+` with zero manual offset. Remove the now-unused `useNavDrawer`/`useSidebar`/`sidebarConfigFor`/`NAV_DRAWER_WIDTH`/`usePathname`/`useTheme` imports.

Prototype evidence: at desktop width, scrolling `/eureka` pins the toolbar at `top: 80` below the NavBar, spanning `main`'s width to the left of the open filter sidebar; the toolbar content is no longer hidden by the NavBar mask.

### Modified consumers

- `components/filter/filter-menu.tsx` — render the `FilterList` toggle `IconButton` directly (was inside `<Sidebar>`), wired to `setSidebarOpen`; wrap the eureka/outfits `<List>` bodies in `<SidebarBody>`. Delete the `if (!sidebarConfigFor(pathname)) return null` short-circuit — it is redundant: `FilterMenu` is only rendered by `eureka-toolbar.tsx` and `outfit-toolbar.tsx` (verified — no other render site), so its `SidebarBody` inherently mounts only on those routes.
- `app/looks/look-builder.tsx` — the `Tune` toggle stays in `NavBarToolbar`; the composer wraps in `<SidebarBody>` instead of `<Sidebar>`.

### Root layout ([app/layout.tsx](app/layout.tsx))

Content column becomes:

```text
content column
├── NavBar                      (fixed)
├── <Toolbar mb:2 />            ← single spacer, for the fixed NavBar only
├── PullToRefresh
├── <Box sx={{ display:'flex', flex:1 }}>
│    ├── <main sx={{ flex:1 }}>
│    │     {children}           ← page renders its sticky NavBarToolbar as its
│    │                            first element (top:80), then content + <SidebarBody>
│    └── <SidebarShell />       ← flex sibling of main
└── Footer
```

Changes: `SidebarContentShim` wrapper removed; the **two** `<Toolbar>` spacers collapse to **one** (only the fixed NavBar needs a spacer now — the sticky NavBarToolbar is in flow and reserves its own space). The sticky NavBarToolbar continues to be rendered by each page's toolbar component (unchanged mount site — ~13 consumers), just now in-flow inside `main`.

## Data flow

Open/close: unchanged global `sidebarOpen` + `sidebar-open` localStorage, toggled from page toolbars. Body: page renders `<SidebarBody>` under its providers → registers `hasBody` + portals children into `portalTarget` → the content appears inside the shell's drawer paper, which (as a flex sibling) pushes `main`. Grids inside `main` reflow off `main`'s width via their existing container queries.

## Edge cases

- **Portal timing:** `SidebarBody` renders `null` until `portalTarget` is set (shell publishes it in a layout effect) — no flash.
- **Empty shell:** no `SidebarBody` mounted (e.g. `/about`) → `hasBody` false → shell collapsed, no push. Replaces the registry gate.
- **Mobile (`< sm`):** temporary overlay drawer, full-width, does not push `main`. Portal targets the temp drawer's paper.
- **One at a time:** single global boolean + single portal target; only one route mounts a `SidebarBody` at once — same assumption as today.
- **Navigation:** leaving a sidebar route unmounts its `SidebarBody` → `hasBody` clears → shell collapses.
- **`hasBody` vs `sidebarOpen`:** the shell pushes only when `hasBody && sidebarOpen`. A stale persisted `sidebarOpen=true` on a page with no body stays collapsed until a body mounts.
- **Sticky toolbar stacking:** `NavBarToolbar` sticks at `top: 80` under the fixed NavBar (`zIndex.appBar`). Its stickiness is bounded by `main`'s box (its containing block), which is tall (the whole page), so it stays pinned through the page's scroll — verified. On short pages it simply never needs to stick.
- **Sticky toolbar vs sidebar:** with the sidebar open, the sticky toolbar sits inside the narrowed `main` and auto-tracks its width (validated) — no manual coordination needed.

## Scope boundary

Replaces #254's shim + registry approach and converts `NavBarToolbar` fixed→sticky. **Not touched:** the nav drawer (stays fixed), the toggle buttons' placement, the domain data providers, the looks-builder auto-open effect, and the ~13 `NavBarToolbar` mount sites (they keep rendering it; only the AppBar's own positioning changes). **Downstream:** #255 rebases — its `useAppBarInsets` extraction had two consumers (NavBar + NavBarToolbar) and a sidebar branch; after this, NavBarToolbar has no inset math to extract and NavBar's inset is nav-drawer-only, so #255's hook shrinks to nav-drawer-only for the one remaining consumer (or is dropped). Flag this to whoever rebases #255.

## Verification (running app)

1. `yarn tsc --noEmit` + `yarn lint` clean. Sweep: `SidebarContentShim`, `sidebarConfigFor`, `sidebar-registry`, and the old `Sidebar` component fully removed (zero references).
2. `/eureka` + `/outfits`: toggle filters — drawer slides in as a flex sibling, `main` shrinks, grid reflows (5→4 eureka), NavBar stays full width. Close — reflows back.
3. **Sticky toolbar:** on `/eureka`, scroll down — the "Showing…/sort/filter" toolbar pins at `top: 80` below the NavBar (not hidden by the mask), spanning `main`'s width to the left of the sidebar. Confirm on a non-sidebar page (e.g. `/looks` list or `/profile`) the toolbar also sticks correctly. Confirm no double gap / no leftover spacer pushing content down (only one spacer remains).
4. `/looks/new` (auth — user QA): composer portals into the shell, auto-opens, picker full-width; `/looks/edit/[slug]` shows existing values.
5. `/about`, `/profile`: no shell push, no toggle, unaffected.
6. Mobile width: drawer overlays, does not push `main`; sticky toolbar behaves (spans full width, sticks).
7. Console: no portal/hydration warnings; the pre-existing NavBar gradient hydration warning is the only known error.
