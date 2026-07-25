'use client'

import * as React from 'react'
import {
  alpha,
  AppBar,
  Box,
  CSSObject,
  Divider,
  Drawer as MuiDrawer,
  IconButton,
  Stack,
  styled,
  Theme,
  Toolbar,
  useMediaQuery,
  useTheme,
  Paper,
  Typography,
} from '@mui/material'
import { Close, Menu, MenuOpen } from '@mui/icons-material'
import NavSection from './navbar/nav-section'
import PageTitle from './navbar/page-title'
import { NavUser } from './navbar/nav-user'
import Footer from './navbar/nav-footer'
import PullToRefresh from './pull-to-refresh'
import { navLinksData } from '@/lib/nav-links'
import { NAV_DRAWER_WIDTH } from '@/lib/layout-constants'
import { COLOR_THEME_PRESETS } from '@/lib/theme-presets'
import { useColorTheme } from './color-theme-context'
import { useNavDrawer, useSidebar, useStickyBar, useToolbar } from './navbar/navbar-toolbar-context'

const SIDEBAR_WIDTH = 400

// Fixed height of the AppBar's injected second row (and every spacer that must
// clear it). The row's content — the portaled page toolbar — can be up to 40px
// tall; a fixed 56px row keeps the AppBar row and its main/drawer spacers in exact
// agreement regardless of content, so page content never sits under the second row.
const TOOLBAR_ROW_2_HEIGHT = 56

// ---- Left nav drawer (flush mini-variant) ------------------------------------

const navOpenedMixin = (theme: Theme): CSSObject => ({
  width: NAV_DRAWER_WIDTH,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
  border: 0,
  backgroundColor: 'transparent',
})

const navClosedMixin = (theme: Theme): CSSObject => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: theme.spacing(12),
  border: 0,
  backgroundColor: 'transparent',
})

const NavDrawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme }) => ({
    width: NAV_DRAWER_WIDTH,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    border: 0,
    variants: [
      {
        props: ({ open }) => open,
        style: { ...navOpenedMixin(theme), '& .MuiDrawer-paper': navOpenedMixin(theme) },
      },
      {
        props: ({ open }) => !open,
        style: { ...navClosedMixin(theme), '& .MuiDrawer-paper': navClosedMixin(theme) },
      },
    ],
  })
)

// ---- Right sidebar drawer (flush mini-variant) -------------------------------

const sidebarOpenedMixin = (theme: Theme): CSSObject => ({
  width: SIDEBAR_WIDTH,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
  border: 0,
  backgroundColor: 'transparent',
})

const sidebarClosedMixin = (theme: Theme): CSSObject => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: 0,
  border: 0,
  backgroundColor: 'transparent',
})

const SidebarDrawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme }) => ({
    width: SIDEBAR_WIDTH,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    border: 0,
    variants: [
      {
        props: ({ open }) => open,
        style: { ...sidebarOpenedMixin(theme), '& .MuiDrawer-paper': sidebarOpenedMixin(theme) },
      },
      {
        props: ({ open }) => !open,
        style: { ...sidebarClosedMixin(theme), '& .MuiDrawer-paper': sidebarClosedMixin(theme) },
      },
    ],
  })
)

// ---- Nav content (shared by permanent + temporary drawers) -------------------

const navContent = (open: boolean, onClose: () => void) => (
  <Stack component="nav" sx={{ flexGrow: 1, mx: 1.5, pb: 3 }}>
    <NavSection items={navLinksData.home} open={open} onClose={onClose} />
    <NavSection items={navLinksData.navMain} open={open} onClose={onClose} />
    <Divider sx={{ my: 0.5 }} />
    <NavSection items={navLinksData.navSecondary} open={open} onClose={onClose} />
    <Stack sx={{ flexGrow: 1 }} />
    <NavSection items={navLinksData.navExtra} open={open} onClose={onClose} />
  </Stack>
)

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(0, 2.5),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
}))

export default function LayoutShell({ children }: { children?: React.ReactNode }) {
  const theme = useTheme()
  const { colorTheme } = useColorTheme()
  const { drawerOpen, drawerPreferOpen, setDrawerOpen } = useNavDrawer()
  const { sidebarOpen, sidebarPreferOpen, setSidebarOpen, setPortalTarget, hasBody } = useSidebar()
  const { setToolbarTarget, hasToolbar } = useToolbar()
  const { setStickyBarTarget, hasStickyBar } = useStickyBar()

  const isNavMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isSidebarMobile = useMediaQuery(theme.breakpoints.down('md'))

  // Reconcile the nav drawer to the viewport across the sm breakpoint. Keyed on the
  // breakpoint boolean so it fires only on the crossing, not on every render —
  // otherwise it would re-close the temporary overlay the moment the user opens it.
  //  - Shrinking to xs: close the (content-pushing) drawer so it doesn't conflict
  //    with the temporary overlay. persist:false keeps the user's saved preference.
  //  - Expanding to sm+: restore the drawer to the user's persisted preference, so a
  //    drawer that was auto-closed on shrink re-opens when there's room for it again.
  React.useEffect(() => {
    if (isNavMobile) {
      if (drawerOpen) setDrawerOpen(false, { persist: false })
    } else if (drawerPreferOpen !== drawerOpen) {
      setDrawerOpen(drawerPreferOpen, { persist: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNavMobile])

  // Reconcile the sidebar to the viewport across the md breakpoint, mirroring the nav
  // drawer. Crossing-only keying so it never re-closes the overlay the user just opened.
  //  - Shrinking below md: close the (content-pushing) sidebar so it doesn't conflict
  //    with the temporary overlay. persist:false keeps the user's saved preference.
  //  - Expanding to md+: restore the sidebar to the user's persisted preference — but
  //    only when a page has mounted a SidebarBody (hasBody), since the sidebar can't
  //    open without content to portal into.
  React.useEffect(() => {
    if (isSidebarMobile) {
      if (sidebarOpen) setSidebarOpen(false, { persist: false })
    } else if (hasBody && sidebarPreferOpen !== sidebarOpen) {
      setSidebarOpen(sidebarPreferOpen, { persist: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSidebarMobile])

  // Callback ref: publishes the sidebar portal target on attach/detach — robust to
  // MUI's temporary drawer mounting/unmounting its children on open/close.
  const setSidebarNode = React.useCallback(
    (node: HTMLDivElement | null) => setPortalTarget(node),
    [setPortalTarget]
  )
  const setToolbarNode = React.useCallback(
    (node: HTMLDivElement | null) => setToolbarTarget(node),
    [setToolbarTarget]
  )
  const setStickyBarNode = React.useCallback(
    (node: HTMLDivElement | null) => setStickyBarTarget(node),
    [setStickyBarTarget]
  )

  // Gradient/blur/mask AppBar styling (moved from the deleted NavBarToolbar).
  const preset = COLOR_THEME_PRESETS[colorTheme]
  const gradient = (surface: string) =>
    `linear-gradient(to bottom, ${alpha(surface, 0.7)} 0%, ${alpha(surface, 0.3)} 70%, ${alpha(surface, 0)} 100%)`
  const background = gradient(preset.light.surface.main)
  const darkBackground = gradient(preset.dark.surface.main)

  const sidebarTarget = <div ref={setSidebarNode} />
  const sidebarDrawerOpen = hasBody && sidebarOpen

  // The fixed AppBar's on-screen height: row 1 (responsive 56/48/64) + a 16px mask
  // spacer, plus row 2 (another 56/48/64) only when a page injected a ToolbarSlot.
  // The sticky bar pins flush beneath it, so its `top` mirrors that composition across
  // the same breakpoints the toolbar height uses.
  const MASK_SPACER = 16
  const row2 = hasToolbar ? 56 : 0
  const stickyTop = {
    top: 56 + MASK_SPACER + row2,
    '@media (orientation: landscape)': { top: 48 + MASK_SPACER + (hasToolbar ? 48 : 0) },
    '@media (min-width:600px)': { top: 64 + MASK_SPACER + (hasToolbar ? 64 : 0) },
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', overflowX: 'hidden' }}>
      <AppBar
        color="default"
        position="fixed"
        sx={(t) => ({
          zIndex: t.zIndex.drawer + 1,
          background,
          ...t.applyStyles('dark', { background: darkBackground }),
          border: 0,
          boxShadow: 'none',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          maskImage: 'linear-gradient(to bottom, rgba(0, 0, 0, 1) 80%, rgba(0, 0, 0, 0) 100%)',
        })}
      >
        <Toolbar>
          <Stack
            direction="row"
            spacing={1}
            sx={{ flexGrow: 1, alignItems: 'center', justifyContent: 'space-between', ml: 1.5 }}
          >
            <IconButton
              aria-label={drawerOpen ? 'Collapse navigation' : 'Expand navigation'}
              color="inherit"
              onClick={() =>
                isNavMobile
                  ? setDrawerOpen(!drawerOpen, { persist: false })
                  : setDrawerOpen(!drawerOpen)
              }
            >
              {drawerOpen ? <MenuOpen /> : <Menu />}
            </IconButton>
            <PageTitle />
            <NavUser />
          </Stack>
        </Toolbar>
        {/* Second row: the injected page toolbar. The single toolbar target lives here; ToolbarSlot portals page content in. Rendered only when a page has mounted a ToolbarSlot (hasToolbar). */}
        {hasToolbar && (
          <Toolbar>
            <Stack
              ref={setToolbarNode}
              direction="row"
              spacing={1}
              sx={{ flexGrow: 1, alignItems: 'center', justifyContent: 'flex-end' }}
            />
          </Toolbar>
        )}
        <Box sx={{ height: theme.spacing(2) }} /> {/* Box spacer for AppBar mask */}
      </AppBar>
      <PullToRefresh />

      {/* Left nav: temporary overlay below sm, permanent mini-variant at sm+ */}
      <MuiDrawer
        anchor="left"
        open={drawerOpen}
        slotProps={{ root: { keepMounted: true, disableScrollLock: true } }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { width: '100%' },
          zIndex: theme.zIndex.drawer + 2,
        }}
        variant="temporary"
        onClose={() => setDrawerOpen(false, { persist: false })}
      >
        <Toolbar disableGutters sx={{ px: 2.4, pt: 3 }}>
          <IconButton
            aria-label="Close navigation"
            onClick={() => setDrawerOpen(false, { persist: false })}
          >
            <MenuOpen />
          </IconButton>
        </Toolbar>
        <Toolbar />
        {navContent(true, () => setDrawerOpen(false, { persist: false }))}
      </MuiDrawer>
      <NavDrawer
        anchor="left"
        open={drawerOpen}
        sx={{ display: { xs: 'none', sm: 'block' }, zIndex: theme.zIndex.drawer + 2 }}
        variant="permanent"
      >
        <Paper sx={{ borderRadius: 3, m: 2, mr: 0, flexGrow: 1 }} variant="filled">
          <Stack sx={{ flexGrow: 1, height: '100%' }}>
            <DrawerHeader>
              <IconButton
                aria-label={drawerOpen ? 'Collapse navigation' : 'Expand navigation'}
                color="inherit"
                onClick={() =>
                  isNavMobile
                    ? setDrawerOpen(!drawerOpen, { persist: false })
                    : setDrawerOpen(!drawerOpen)
                }
              >
                {drawerOpen ? <MenuOpen /> : <Menu />}
              </IconButton>
            </DrawerHeader>
            <Toolbar />
            {navContent(drawerOpen, () => {})}
          </Stack>
        </Paper>
      </NavDrawer>

      {/* Main column: owns the gutter, minWidth:0 (grid reflow), and top spacers that track the AppBar's row count. */}
      <Stack
        component="main"
        sx={{ flexGrow: 1, minHeight: '100vh', minWidth: { xs: 0, md: 320 }, px: 2 }}
      >
        <DrawerHeader />
        {hasToolbar && <Toolbar />}
        <Box sx={{ height: theme.spacing(2) }} /> {/* Box spacer for AppBar mask */}
        {hasStickyBar && (
          <Box
            sx={{
              position: 'sticky',
              top: stickyTop,
              zIndex: (t) => t.zIndex.appBar - 1,
              bgcolor: 'background.paper',
              borderBottom: 1,
              borderColor: 'divider',
              mx: -2,
              px: 2,
            }}
          >
            <Box ref={setStickyBarNode} />
          </Box>
        )}
        {children}
        <Footer />
      </Stack>

      {/* Right sidebar: temporary overlay below md, permanent at md+. Exactly one portal target div, rendered inside whichever drawer is active. */}
      <MuiDrawer
        anchor="right"
        open={sidebarDrawerOpen}
        slotProps={{ root: { disableScrollLock: true } }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { width: '100%' },
          zIndex: theme.zIndex.drawer + 2,
        }}
        variant="temporary"
        onClose={() => setSidebarOpen(false)}
      >
        <Toolbar />
        <Toolbar>
          <Stack direction="row" sx={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
            <IconButton aria-label="Close details" onClick={() => setSidebarOpen(false)}>
              <Close />
            </IconButton>
          </Stack>
        </Toolbar>
        {isSidebarMobile && sidebarTarget}
      </MuiDrawer>
      <SidebarDrawer
        anchor="right"
        open={sidebarDrawerOpen}
        sx={{ display: { xs: 'none', md: 'block' } }}
        variant="permanent"
      >
        <DrawerHeader />
        {hasToolbar && <Toolbar />}
        <Paper sx={{ borderRadius: 3, m: 2, ml: 0, flexGrow: 1 }} variant="filled">
          <Toolbar>
            <Stack
              direction="row"
              sx={{ flex: 1, alignItems: 'center', justifyContent: 'space-between' }}
            >
              <Typography variant="subtitle2">Details</Typography>
              <IconButton aria-label="Close details" onClick={() => setSidebarOpen(false)}>
                <Close />
              </IconButton>
            </Stack>
          </Toolbar>
          {!isSidebarMobile && sidebarTarget}
        </Paper>
      </SidebarDrawer>
    </Box>
  )
}
