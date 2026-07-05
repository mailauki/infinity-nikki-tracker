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
