// Left nav drawer expanded width.
export const NAV_DRAWER_WIDTH = 240

// Cookie keys for the persisted drawer open states. Cookies (not localStorage) so
// the server can read them during the initial render and seed each drawer's width
// correctly — localStorage is only readable after hydration, which caused a layout
// shift (CLS) as a content-pushing drawer widened post-mount. Both the left nav
// drawer and the right sidebar persist their open state across reloads; user toggles
// write the cookie, while ephemeral breakpoint reconciliation (auto-close on shrink /
// restore on expand) does not.
export const NAV_DRAWER_STORAGE_KEY = 'nav-drawer-open'
export const SIDEBAR_STORAGE_KEY = 'sidebar-open'

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
