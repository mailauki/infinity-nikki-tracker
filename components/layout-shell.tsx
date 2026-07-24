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
import { useNavDrawer, useSidebar, useToolbar } from './navbar/navbar-toolbar-context'

const SIDEBAR_WIDTH = 400

// ---- Left nav drawer (flush mini-variant) ------------------------------------

const navOpenedMixin = (theme: Theme): CSSObject => ({
  width: NAV_DRAWER_WIDTH,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
  border: 0,
})

const navClosedMixin = (theme: Theme): CSSObject => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: `calc(${theme.spacing(10)} + 1px)`,
  border: 0,
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
})

const sidebarClosedMixin = (theme: Theme): CSSObject => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: 0,
  border: 0,
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
  <Stack component="nav" sx={{ flex: 1, mx: 1.5, pb: 3 }}>
    <NavSection items={navLinksData.home} open={open} onClose={onClose} />
    <NavSection items={navLinksData.navMain} open={open} onClose={onClose} />
    <Divider sx={{ my: 0.5 }} />
    <NavSection items={navLinksData.navSecondary} open={open} onClose={onClose} />
    <Stack sx={{ flex: 1, justifyContent: 'flex-end' }}>
      <NavSection items={navLinksData.navExtra} open={open} onClose={onClose} />
    </Stack>
  </Stack>
)

export default function LayoutShell({ children }: { children?: React.ReactNode }) {
  const theme = useTheme()
  const { colorTheme } = useColorTheme()
  const { drawerOpen, setDrawerOpen } = useNavDrawer()
  const { sidebarOpen, setSidebarOpen, setPortalTarget, hasBody } = useSidebar()
  const { setToolbarTarget, hasToolbar } = useToolbar()

  const isNavMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isSidebarMobile = useMediaQuery(theme.breakpoints.down('md'))

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

  // Gradient/blur/mask AppBar styling (moved from the deleted NavBarToolbar).
  const preset = COLOR_THEME_PRESETS[colorTheme]
  const gradient = (surface: string) =>
    `linear-gradient(to bottom, ${alpha(surface, 0.7)} 0%, ${alpha(surface, 0.3)} 70%, ${alpha(surface, 0)} 100%)`
  const background = gradient(preset.light.surface.containerLowest)
  const darkBackground = gradient(preset.dark.surface.containerLowest)

  const sidebarTarget = <div ref={setSidebarNode} />
  const sidebarDrawerOpen = hasBody && sidebarOpen

  return (
    <Box sx={{ display: 'flex' }}>
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
            sx={{ flexGrow: 1, alignItems: 'center', justifyContent: 'space-between' }}
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
        {/* Second row: the injected page toolbar. The single toolbar target lives
            here; ToolbarSlot portals page content in. Rendered only when a page has
            mounted a ToolbarSlot (hasToolbar). */}
        {hasToolbar && (
          <Toolbar sx={{ minHeight: 'unset' }}>
            <Box ref={setToolbarNode} sx={{ flexGrow: 1 }} />
          </Toolbar>
        )}
      </AppBar>
      <PullToRefresh />

      {/* Left nav: temporary overlay below sm, permanent mini-variant at sm+ */}
      <MuiDrawer
        anchor="left"
        open={drawerOpen}
        slotProps={{ root: { keepMounted: true, disableScrollLock: true } }}
        sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { width: '100%' } }}
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
        {navContent(true, () => setDrawerOpen(false, { persist: false }))}
      </MuiDrawer>
      <NavDrawer
        anchor="left"
        open={drawerOpen}
        sx={{ display: { xs: 'none', sm: 'block' } }}
        variant="permanent"
      >
        <Toolbar />
        {hasToolbar && <Toolbar sx={{ minHeight: 'unset' }} />}
        {navContent(drawerOpen, () => {})}
      </NavDrawer>

      {/* Main column: owns the gutter, minWidth:0 (grid reflow), and top spacers
          that track the AppBar's row count. */}
      <Box component="main" sx={{ flexGrow: 1, minWidth: { xs: 0, md: 320 }, px: 2 }}>
        <Toolbar />
        {hasToolbar && <Toolbar sx={{ minHeight: 'unset' }} />}
        {children}
        <Footer />
      </Box>

      {/* Right sidebar: temporary overlay below md, permanent at md+. Exactly one
          portal target div, rendered inside whichever drawer is active. */}
      <MuiDrawer
        anchor="right"
        open={sidebarDrawerOpen}
        slotProps={{ root: { disableScrollLock: true } }}
        sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: '100%' } }}
        variant="temporary"
        onClose={() => setSidebarOpen(false)}
      >
        <Toolbar />
        {hasToolbar && <Toolbar sx={{ minHeight: 'unset' }} />}
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
        <Toolbar />
        {hasToolbar && <Toolbar sx={{ minHeight: 'unset' }} />}
        <Toolbar>
          <Stack direction="row" sx={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
            <IconButton aria-label="Close details" onClick={() => setSidebarOpen(false)}>
              <Close />
            </IconButton>
          </Stack>
        </Toolbar>
        {!isSidebarMobile && sidebarTarget}
      </SidebarDrawer>
    </Box>
  )
}
