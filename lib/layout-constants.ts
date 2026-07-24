// Left nav drawer expanded width.
export const NAV_DRAWER_WIDTH = 240

// Cookie key for the persisted nav drawer open state. A cookie (not localStorage)
// so the server can read it during the initial render and seed the drawer's width
// correctly — localStorage is only readable after hydration, which caused a layout
// shift (CLS) as the content-pushing desktop drawer widened post-mount. The
// filter/composer sidebar deliberately does not persist its open state (it always
// starts closed), so only the nav drawer has a key here.
export const NAV_DRAWER_STORAGE_KEY = 'nav-drawer-open'

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
