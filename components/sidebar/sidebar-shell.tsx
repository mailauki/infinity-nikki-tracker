'use client'

import * as React from 'react'
import {
  CSSObject,
  Drawer as MuiDrawer,
  IconButton,
  Stack,
  styled,
  Theme,
  Toolbar,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { Close } from '@mui/icons-material'
import { useSidebar } from '@/components/navbar/navbar-toolbar-context'

export const DEFAULT_SIDEBAR_WIDTH = 400

const openedMixin = (theme: Theme): CSSObject => ({
  height: 'calc(100vh - 100px)',
  border: 0,
  borderRadius: '30px',
  marginTop: 80,
  marginBottom: 20,
  width: DEFAULT_SIDEBAR_WIDTH,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
})

const closedMixin = (theme: Theme): CSSObject => ({
  height: 'calc(100vh - 100px)',
  border: 0,
  borderRadius: '30px',
  marginTop: 80,
  marginBottom: 20,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: 0,
})

const PermanentDrawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme }) => ({
    width: DEFAULT_SIDEBAR_WIDTH,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    variants: [
      {
        props: ({ open }) => open,
        style: { ...openedMixin(theme), '& .MuiDrawer-paper': openedMixin(theme) },
      },
      {
        props: ({ open }) => !open,
        style: { ...closedMixin(theme), '& .MuiDrawer-paper': closedMixin(theme) },
      },
    ],
  })
)

// Root-mounted sidebar chrome: a temporary overlay drawer below `sm` and a
// permanent, content-pushing drawer at `sm`+. Renders nothing until a page mounts
// a <SidebarBody> (hasBody). Publishes its content node as the portal target so the
// page body (rendered under its own data providers) can portal in.
//
// Portal-target correctness: only ONE `<div ref={contentRef}>` exists. It is
// rendered inside whichever drawer is currently active for the viewport
// (temporary below `sm`, permanent at `sm`+), chosen by `useMediaQuery`. Because
// only one drawer is shown at a time, the single ref reattaches to the visible
// drawer's node on breakpoint change, and the layout effect re-publishes it.
export default function SidebarShell() {
  const { sidebarOpen, setSidebarOpen, setPortalTarget, hasBody } = useSidebar()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const contentRef = React.useRef<HTMLDivElement | null>(null)

  // Re-publish the target whenever the active drawer (breakpoint) changes, so the
  // portal always points at the mounted node. `isMobile` in the dep array forces
  // the effect to re-run after the ref reattaches to the other drawer.
  React.useLayoutEffect(() => {
    setPortalTarget(contentRef.current)
    return () => setPortalTarget(null)
  }, [setPortalTarget, isMobile])

  const header = (
    <Toolbar>
      <Stack
        direction="row"
        sx={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', mt: 0.5 }}
      >
        <IconButton onClick={() => setSidebarOpen(false)}>
          <Close />
        </IconButton>
      </Stack>
    </Toolbar>
  )

  const target = <div ref={contentRef} />

  // The drawer opens/pushes only when a body is present and the sidebar is open.
  const open = hasBody && sidebarOpen

  return (
    <>
      <MuiDrawer
        anchor="right"
        open={open}
        slotProps={{ root: { disableScrollLock: true } }}
        sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { width: '100%' } }}
        variant="temporary"
        onClose={() => setSidebarOpen(false)}
      >
        {header}
        {isMobile && target}
      </MuiDrawer>
      <PermanentDrawer
        anchor="right"
        open={open}
        sx={{ display: { xs: 'none', sm: 'block' } }}
        variant="permanent"
      >
        {header}
        {!isMobile && target}
      </PermanentDrawer>
    </>
  )
}
