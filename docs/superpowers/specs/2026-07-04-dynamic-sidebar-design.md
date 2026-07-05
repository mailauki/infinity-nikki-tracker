# Generic Dynamic Sidebar — Design

## Context

The app has a content-pushing "filter sidebar" on `/eureka` and `/outfits`: a right-anchored MUI Drawer (`FilterMenu`) whose internal shell (`FilterDrawer`) is already `children`-agnostic but is private to `components/filter/filter-menu.tsx`. The drawer's presence is hardcoded as `FILTER_PAGES = ['/eureka', '/outfits']` and its width as `FILTER_DRAWER_WIDTH = 400`, both consumed in **3 places** that reserve right-margin so the AppBars and content column shift when it opens:

- `components/filter/filter-content-shim.tsx:15` (content column margin)
- `components/navbar/nav-bar.tsx:19` (top AppBar inset)
- `components/navbar/navbar-toolbar.tsx:15` (per-page toolbar AppBar inset)

Because the shell is private and the route allowlist is baked into the margin math, no other page can show a content-pushing sidebar. This change extracts the shell into a reusable `Sidebar`, generalizes the allowlist into a registry, and wires up the **Custom Looks builder** (`/looks/new`, `/looks/edit/[slug]`) as the first non-filter consumer — moving its composer panel into a sidebar so the piece picker gets full width.

**Goal:** a generic content-pushing `Sidebar` any registered page can use, with filters as one consumer and the looks builder as the second. Same drawer UX as today (toggle button, overlay below `sm`, content-pushing at `sm+`).

**Approach chosen:** generic `Sidebar` component + path→config registry (Approach A). Rejected: per-page prop threading (the shim/navbars mount in the root layout, far from pages — forces a registry/context anyway) and a full imperative `SidebarProvider` registration model (larger change, navigation races, marginal gain over the registry).

## Components

### New: `components/sidebar/sidebar.tsx`

Extracted from the internal `FilterDrawer` shell (`filter-menu.tsx:108-162`). A `'use client'` component:

- Renders a toggle `IconButton` (default icon `FilterList`, overridable), a **temporary** right drawer (`display: { xs: 'block', sm: 'none' }`, full-width overlay), and a **permanent** content-pushing styled drawer (`display: { xs: 'none', sm: 'block' }`).
- Reads open/close from the shared sidebar context; the toggle writes it (+ localStorage), exactly as `FilterDrawer` does today.
- Props: `children` (body), `icon?` (default `<FilterList/>`), `title?` (header label), `width?` (default `DEFAULT_SIDEBAR_WIDTH = 400`). The `openedMixin`/`closedMixin` styled-drawer stays with this component, parameterized by `width`.

### New: `lib/sidebar-registry.ts`

Replaces `FILTER_PAGES`/`FILTER_DRAWER_WIDTH`. Match-function registry so it can express dynamic routes (`/looks/edit/[slug]`), which a plain `includes()` array cannot:

```ts
export type SidebarConfig = { width: number }

const SIDEBAR_ROUTES: Array<{ match: (p: string) => boolean; config: SidebarConfig }> = [
  { match: (p) => p === '/eureka' || p === '/outfits', config: { width: 400 } },
  { match: (p) => p === '/looks/new' || p.startsWith('/looks/edit/'), config: { width: 400 } },
]

export function sidebarConfigFor(pathname: string): SidebarConfig | null {
  return SIDEBAR_ROUTES.find((r) => r.match(pathname))?.config ?? null
}
```

### Renamed: sidebar context (`components/navbar/navbar-toolbar-context.tsx`)

`FilterDrawerContext` / `useFilterDrawer` / `filterOpen` / `setFilterOpen` → `SidebarContext` / `useSidebar` / `sidebarOpen` / `setSidebarOpen`. Same single-global-boolean shape and one localStorage key (`sidebar-open`, migrated from `filter-drawer-open`). Only one sidebar is active per route, so one boolean suffices.

### Renamed: `components/filter/filter-content-shim.tsx` → `components/sidebar/sidebar-content-shim.tsx`

No longer filter-specific. Consumes `sidebarConfigFor(pathname)` for both the active-check and the width.

### Modified: the 3 margin-math consumers

`sidebar-content-shim.tsx`, `nav-bar.tsx`, `navbar-toolbar.tsx` change from:

```ts
const pushed = filterOpen && FILTER_PAGES.includes(pathname) // width = FILTER_DRAWER_WIDTH
```

to:

```ts
const config = sidebarConfigFor(pathname)
const pushed = sidebarOpen && config !== null // width = config?.width ?? 0
```

Width is now per-route (from the registry) instead of one global constant.

### Consumer 1: `FilterMenu` (`components/filter/filter-menu.tsx`)

Becomes a `Sidebar` consumer. Its two `<List>` bodies (eureka via `useEurekaData()`, outfits via `useOutfitData()`, branched on `pathname.startsWith('/outfits')`) are passed as `Sidebar` children. Width stays 400, icon stays `FilterList` — eureka/outfits must look and behave identically. The private `FilterDrawer`, `openedMixin`, `closedMixin`, `PermanentDrawer`, `FILTER_PAGES`, `FILTER_DRAWER_WIDTH`, `FILTER_STORAGE_KEY` are deleted from this file (moved to `Sidebar` / registry / context).

### Consumer 2: Custom Looks builder (`app/looks/look-builder.tsx`)

- The `composerPanel` (name / description / cover image / selected-pieces accordion) moves into the `Sidebar` body: `<Sidebar icon={<TuneIcon/>} title="Look details">{composerPanel}</Sidebar>`, rendered inside the builder's `NavBarToolbar` so the toggle sits next to Cancel/Save.
- The `pickerPanel` becomes full-width main content. The two-column grid `Box` (look-builder.tsx:702-729) and its mobile-composer duplication are removed. The picker's `auto-fill minmax(120px)` grid reflows when the sidebar pushes content, same as the eureka grid.
- `/looks/new` and `/looks/edit/[slug]` are added to the registry.

## Data flow

Open/close is a single global boolean in context (`sidebarOpen`), persisted to one localStorage key, read post-mount to avoid hydration mismatch. The `Sidebar` toggle reads/writes it; the 3 margin-math consumers read it and gate on `sidebarConfigFor(pathname) !== null` so a page not in the registry never pushes content regardless of the boolean's value.

**Save gate / auto-open:** the Save button lives in the always-visible `NavBarToolbar` and is `disabled={!name.trim()}`; `name` now lives in the drawer. To keep an unnamed new look's name field visible, the builder calls `setSidebarOpen(true)` in a `useEffect` gated on `!initialLook` (new-look route only) — this runs after the provider's post-mount localStorage read, so it isn't clobbered. On edit, the sidebar respects persisted state (the look already has a name).

## Edge cases

- **Persisted state across route types.** One global key means an open filter carries `open=true` into `/looks/new` (fine — the builder wants it open) but must not reserve margin on a non-sidebar page like `/about`. Handled by the `sidebarConfigFor(pathname) !== null` gate.
- **Auto-open race.** Builder's `setSidebarOpen(true)` runs in a `useEffect`, after the context's post-mount localStorage effect — safe.
- **Mobile.** Below `sm` the sidebar overlays full-width and does not push; the picker stays full-width. Unchanged from filters.
- **`FilterMenu` parity.** Same width, icon, and body → eureka/outfits behave identically. Primary regression check.
- **Storage-key rename.** The localStorage key changes `filter-drawer-open` → `sidebar-open` (one-way; no migration read). A returning user's old persisted value is ignored, so the sidebar simply starts closed once after this ships — acceptable, not worth a migration shim.

## Scope boundary

This change does the sidebar extraction, the registry, the context rename, and the two consumers only. **Not in scope** (deferred to Phase 2b): the navbar inset-math de-duplication (`useAppBarInsets` hook) and dead-code removal (`nav-styled.tsx`, dead `toolbarSlot`). Keeping the diff focused.

## Verification (end-to-end, via the running app)

1. `yarn tsc --noEmit` + `yarn lint` clean.
2. **Filter regression:** `/eureka` and `/outfits` — toggle the sidebar; confirm the filter panel opens/pushes content and the card grid still reflows 5↔4 (eureka) / 2↔… (outfits). Proves the rename + registry didn't break the existing consumer.
3. **New builder consumer:** `/looks/new` — sidebar auto-opens with the name field; picker is full-width; toggling pushes/reflows the picker grid; Save works after naming. `/looks/edit/[slug]` — sidebar respects persisted state; composer shows existing values; Save updates.
4. **Non-sidebar pages** (`/about`, `/profile`) — no margin reserved, no toggle button, unaffected.
5. Playwright screenshots at desktop + mobile widths for the builder and one filter page; check console for errors (ignore the known pre-existing NavBar gradient-className hydration warning).
