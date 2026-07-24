# Layout Shell Consolidation — Design

**Date:** 2026-07-24
**Status:** Approved (pending spec review)

## Goal

Consolidate the app's layout chrome into a single `LayoutShell` component and adopt a
mini-variant "AppBar-on-top" look as the new shell. Today the layout composition is spread
across `app/layout.tsx`, `NavDrawer`, `SidebarShell`, per-page `NavBarToolbar` bars, and
`PageShell`. After this change, one component owns the shell structure so `layout.tsx` stays
thin, the drawer/main/sidebar/toolbar flow is easy to follow, and the padding and min/max
behavior of the content column are coordinated with the drawer widths in one place.

This is both a **consolidation** (fewer components, one owner) and a **visual redesign**
(flush mini-variant drawers under a full-width fixed AppBar, replacing the current floating
rounded-card drawers).

## Chosen decisions (from brainstorming)

- **Primary goal:** both consolidation and adopting the mini-variant AppBar-on-top look.
- **AppBar:** a single persistent shell toolbar, plus an optional second row that pages
  inject via context, rendered only when a page provides content.
- **Drawer look:** the demo's flush mini-variant look — squared drawers flush under a
  full-width AppBar, no floating margins, `Toolbar` spacers. A visual redesign away from the
  current rounded floating shell.
- **Scope:** full consolidation. `LayoutShell` becomes the single real shell with real nav
  content; `NavDrawer` and `SidebarShell` are deleted once their logic moves in.
- **Toolbar reconciliation:** approach **A** — migrate all per-page toolbars onto the context
  slot; `NavBarToolbar` is deleted and its styling moves onto the shell AppBar.
- **AppBar styling:** preserve the gradient/blur/mask styling on the shell AppBar.
- **PageShell:** fold its padding/`minWidth`/centering responsibilities into the shell `main`;
  keep a slimmed `PageShell` as a per-page width-variant wrapper. Leave its inline
  `sideContent` column as-is (approach **a** — do not reconcile it with the sidebar drawer).

## Architecture

`LayoutShell` (`components/layout-shell.tsx`, `'use client'`) is the single shell:

```text
<Box display="flex">
  <AppBar position="fixed" zIndex={drawer+1}>          ← NEW persistent top bar
    <Toolbar> menu toggle · PageTitle · NavUser </Toolbar>
    {hasToolbar && <Toolbar> <div ref={setToolbarTarget}/> </Toolbar>}   ← injected 2nd row
  </AppBar>

  <NavDrawer content>                                  ← left mini-variant drawer
    permanent (sm+, flush, squared) + temporary overlay (below sm)
    content = real NavSection / navLinksData
    toggle = useNavDrawer (cookie persistence kept)

  <Box component="main">                               ← owns gutter + minWidth:0 + centering
    <Toolbar spacer/>                                   ← always (row 1)
    {hasToolbar && <Toolbar spacer/>}                   ← matches AppBar row 2
    {children}
    <Footer/>

  <Sidebar content>                                     ← right mini-variant drawer
    permanent (md+) + temporary (below md)
    single <div ref={setToolbarTarget}> portal target, hasBody/open gating preserved
</Box>
```

`app/layout.tsx` renders `<LayoutShell>{children}</LayoutShell>` and nothing else in the shell
region. The commented-out `Stack`-based block is removed. `PageTitle` and `NavUser` move inside
the shell's AppBar (they are imported by `layout.tsx` today but belong to the shell now).

## Components

### `components/layout-shell.tsx` (rewritten)

Owns the `Box`/`flex` root, the fixed `AppBar` (with gradient/blur/mask styling moved from
`NavBarToolbar`), both mini-variant drawers, and the `main` column. Reads `useNavDrawer` and
`useSidebar`/toolbar state from context. Replaces all placeholder demo content (Inbox/Starred
lists) with the real nav.

### `components/navbar/navbar-toolbar-context.tsx` (extended)

Add toolbar-slot state alongside the existing sidebar state, mirroring the sidebar's portal
pattern exactly:

- `toolbarTarget: HTMLElement | null`, `setToolbarTarget(el)`
- `hasToolbar: boolean`, `registerToolbar()`, `unregisterToolbar()`

`useNavDrawer` and `useSidebar` are unchanged. A `useToolbar()` hook (or extension of the
existing sidebar hook) exposes the toolbar state. Both contexts continue to live in this file
under `DrawerStateProvider`.

### `components/toolbar-slot.tsx` (new)

The `SidebarBody` twin for the toolbar row. On mount calls `registerToolbar()` (and
`unregisterToolbar` on cleanup); renders `createPortal(children, toolbarTarget)`. Because it
renders in the **page's** React tree (under that page's data providers), a toolbar's hooks
(`useOutfitImageMode`, `useSeasonFilter`, `useSidebar`, etc.) keep working while the DOM lands
in the shell AppBar's second row.

### `components/sidebar/sidebar-body.tsx` (unchanged)

Contract is identical; the portal target now lives in `LayoutShell` instead of `SidebarShell`.

### `components/page-shell.tsx` (slimmed)

Keeps `maxWidth` (the `full`/`wide`/`md`/`sm`/`xs` vocabulary — intrinsically per-page) and the
optional inline `sideContent` column. **Drops** `px`, `minWidth: 0`, and the `mx: 'auto'`
centering — those move to the shell `main` so they coordinate with the drawer widths in one
place. 19 pages keep calling `<PageShell maxWidth=…>` unchanged in signature.

## Data flow: the portal-based toolbar slot

A naive "context holds a `ReactNode`" approach breaks: a page calling
`setToolbarSlot(<SlugToolBar/>)` would render `SlugToolBar` in the **shell's** tree, above the
page's providers, so `useOutfitImageMode()` and friends throw. The sidebar already solved this
class of problem with a portal, so the toolbar reuses that idiom:

1. Shell AppBar renders the second `<Toolbar>` row containing a single
   `<div ref={setToolbarTarget}>`, shown only when `hasToolbar`.
2. A page's `*-toolbar.tsx` renders `<ToolbarSlot>…</ToolbarSlot>` (replacing its old
   `<NavBarToolbar>…</NavBarToolbar>` wrapper). Inner `Stack`/`IconButton` content is unchanged.
3. `ToolbarSlot` registers presence (`hasToolbar → true`) and portals its children into the
   shell AppBar's target. The children execute in the page's tree, so page hooks work.

This keeps one consistent portal idiom for both the sidebar and the toolbar, and it is the only
approach that respects each page's provider boundary.

## Migration surface

**Delete:**

- `components/navbar/nav-drawer.tsx` (logic → shell)
- `components/sidebar/sidebar-shell.tsx` (logic → shell)
- `components/navbar/navbar-toolbar.tsx` (styling → shell AppBar)

**Edit — 13 toolbar files** (swap `<NavBarToolbar>` → `<ToolbarSlot>`, drop the import):

- `app/admin/admin-toolbar.tsx`
- `app/admin/form-toolbar.tsx`
- `app/eureka/eureka-toolbar.tsx`
- `app/eureka/trials/trials-tool-bar.tsx`
- `app/looks/[slug]/look-detail.tsx`
- `app/looks/look-builder.tsx`
- `app/looks/looks-toolbar.tsx`
- `app/outfits/outfit-toolbar.tsx`
- `app/outfits/seasons/seasons-toolbar.tsx`
- `app/page.tsx`
- `app/profile/profile-toolbar.tsx`
- `app/settings/settings-tabs.tsx`
- `components/slug-toolbar.tsx` (shared toolbar, same swap)

**Edit — other:**

- `app/layout.tsx` — remove commented block; keep `<LayoutShell>`; drop now-unused
  `PageTitle`/`NavUser` imports (they move into the shell).
- `components/page-shell.tsx` — slim as described.
- `components/navbar/navbar-toolbar-context.tsx` — extend with toolbar state.
- `lib/layout-constants.ts` — reconcile `navToolbarStackTop` / `NAV_DRAWER_WIDTH` with the
  shell's fixed AppBar height (spacers in `main` must match the AppBar's real 1- or 2-row height).
- `components/pull-to-refresh.tsx` — re-anchor from `navToolbarStackTop` to the shell AppBar's
  bottom edge.

**New:**

- `components/toolbar-slot.tsx`

## Edge cases

1. **Main-content spacer must track AppBar row count.** AppBar is 1 row when `hasToolbar` is
   false, 2 rows when true. The `main` top spacer renders the same conditional second `Toolbar`
   keyed off `hasToolbar` (single source of truth: the context boolean), or content hides under
   the bar.
2. **`PullToRefresh`** anchors to the old two-toolbar height (`navToolbarStackTop`); re-point it
   at the shell AppBar's bottom edge.
3. **Mobile breakpoints preserved exactly:** left drawer = temporary overlay below `sm`; right
   sidebar = temporary below `md`, permanent at `md`+.
4. **CLS / cookie seed:** `initialDrawerOpen` still seeds the left drawer width server-side; the
   mini-variant closed state is a fixed icon width, so first paint is stable.
5. **Cookie persistence is permanent-drawer only.** The nav-drawer cookie (`NAV_DRAWER_STORAGE_KEY`)
   exists solely to seed the **permanent** (sm+) drawer's width server-side and avoid CLS. The
   **temporary** mobile drawer must NOT write it — otherwise opening the mobile overlay persists an
   open state that then widens the permanent desktop drawer on the next larger-viewport load.
   Today this is violated: `setDrawerOpen` unconditionally writes the cookie, and the temporary
   drawer calls the same `setDrawerOpen(true/false)` on open/close. Fix: split the persisting
   toggle from the ephemeral one. The permanent drawer's toggle persists (writes the cookie); the
   temporary drawer's open/close updates React state only (no cookie write) — e.g. a
   `setDrawerOpen(open, { persist })` flag, or a separate non-persisting setter the temporary
   drawer uses. The right sidebar already never persists (always starts closed); keep that — no
   cookie for either sidebar variant.
6. **`PageShell` reflow floor:** `minWidth: 0` (needed so container-query card grids shrink
   instead of overflowing when a drawer narrows the column) moves to the shell `main`; verify
   the `/eureka` and `/outfits` grids still reflow when the sidebar opens.
7. **Provider boundary:** every migrated toolbar that reads page-scoped hooks
   (`slug-toolbar`, etc.) must render via `ToolbarSlot` so it stays under its page providers.

## Testing

No test framework in the repo — manual verification plus static checks.

- `yarn tsc --noEmit` and `yarn lint` clean.
- **Nav:** left drawer toggle works; open state persists across reload (cookie); mobile overlay
  opens/closes; collapsed mini-variant shows icons only.
- **Cookie scope:** toggling the **permanent** drawer persists across reload; opening the
  **temporary** mobile overlay does NOT write the cookie — resizing back to desktop after a mobile
  open shows the permanent drawer in its previously-persisted state, not force-opened.
- **Toolbar slot:** each route group's toolbar renders in the shell's second row; page-scoped
  controls still function — outfit image-swap, season filters, admin edit, sidebar toggle.
- **Sidebar:** on an outfit/eureka detail page, `SidebarBody` portals in; open/close works;
  content reflows; mobile overlay works.
- **Spacer:** content sits below the AppBar with and without an injected toolbar row (toggle a
  page that has one vs. a page that doesn't).
- **Grid reflow:** `/eureka` and `/outfits` card grids reflow when the sidebar opens/closes.

## Sequencing (for the implementation plan)

Land as a verifiable milestone before the bulk toolbar migration:

1. Extend context with toolbar state; add `ToolbarSlot`.
2. Rewrite `LayoutShell` (AppBar + mini drawers + main + spacers + real nav + portal targets);
   delete `NavDrawer`/`SidebarShell`; wire `layout.tsx`.
3. Migrate **one** toolbar (`eureka-toolbar`) to `ToolbarSlot` as the reference; verify the slot
   contract end to end.
4. Slim `PageShell`; move padding/`minWidth`/centering to shell `main`; verify grid reflow.
5. Migrate the remaining 11 toolbars + `slug-toolbar`; delete `NavBarToolbar`.
6. Re-anchor `PullToRefresh`; reconcile `layout-constants`.

Each step ends with `yarn tsc --noEmit` + `yarn lint` clean and a manual smoke check of the
affected routes.
