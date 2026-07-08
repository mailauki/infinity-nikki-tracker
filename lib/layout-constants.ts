// Left nav drawer expanded width.
export const NAV_DRAWER_WIDTH = 240

// localStorage keys for persisted drawer/sidebar open state. Centralized so the
// nav drawer, the sidebar context, the filter menu, and the looks builder all
// agree on the exact strings.
export const NAV_DRAWER_STORAGE_KEY = 'nav-drawer-open'
export const SIDEBAR_STORAGE_KEY = 'sidebar-open'

// NavBarToolbar stacks two <Toolbar> bars, each followed by an mb: 2 (16px)
// margin, so its total height is 2 * Toolbar minHeight + 32px. Toolbar minHeight
// is responsive (56 default, 48 landscape-phone, 64 desktop) — the same
// breakpoints MUI bakes into theme.mixins.toolbar. navToolbarStackTop mirrors
// those so consumers like PullToRefresh can anchor to the toolbar's real bottom
// edge. Keep in sync with NavBarToolbar's markup (two Toolbars, each mb: 2).
const TOOLBAR_STACK_MARGIN = 32
const stacked = (minHeight: number) => minHeight * 2 + TOOLBAR_STACK_MARGIN

// Responsive `top` offset (in px) equal to the full NavBarToolbar stack height,
// for fixed-positioned overlays that must sit just below the sticky toolbar.
export const navToolbarStackTop = {
  top: stacked(56),
  '@media (min-width:0px)': {
    '@media (orientation: landscape)': { top: stacked(48) },
  },
  '@media (min-width:600px)': { top: stacked(64) },
}
