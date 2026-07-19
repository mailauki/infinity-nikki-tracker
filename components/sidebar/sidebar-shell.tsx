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
  marginRight: 20,
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
  marginRight: 0,
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

// Root-mounted sidebar chrome: a temporary overlay drawer below `md` and a
// permanent, content-pushing drawer at `md`+. The permanent breakpoint is `md`
// (not `sm`) so the drawer only pushes content where the viewport can fit both the
// 400px drawer and the main column's minWidth floor; below `md` it overlays instead
// of shrinking the content. Renders nothing until a page mounts a <SidebarBody>
// (hasBody). Publishes its content node as the portal target so the page body
// (rendered under its own data providers) can portal in.
//
// Portal-target correctness: only ONE `<div ref={setTargetNode}>` exists. It is
// rendered inside whichever drawer is currently active for the viewport
// (temporary below `md`, permanent at `md`+), chosen by `useMediaQuery`. A callback
// ref (not a ref + effect) publishes the node, because MUI's temporary drawer
// unmounts its children entirely while closed — the target only exists in the DOM
// once the drawer is open, and a callback ref fires exactly on attach/detach
// regardless of that timing or breakpoint changes.
export default function SidebarShell() {
  const { sidebarOpen, setSidebarOpen, setPortalTarget, hasBody } = useSidebar()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  // Callback ref: publishes the target node the moment it attaches (and null when it
  // detaches). This is robust to MUI's temporary drawer mounting/unmounting its
  // children on open/close and to breakpoint changes — no effect timing to get wrong.
  const setTargetNode = React.useCallback(
    (node: HTMLDivElement | null) => setPortalTarget(node),
    [setPortalTarget]
  )

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

  const target = <div ref={setTargetNode} />

  // The drawer opens/pushes only when a body is present and the sidebar is open.
  const open = hasBody && sidebarOpen

  return (
    <>
      <MuiDrawer
        anchor="right"
        open={open}
        slotProps={{ root: { disableScrollLock: true } }}
        sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: '100%' } }}
        variant="temporary"
        onClose={() => setSidebarOpen(false)}
      >
				{isMobile && <Toolbar sx={{ mb: 2 }} />}
        {header}
        {isMobile && target}
      </MuiDrawer>
      <PermanentDrawer
        anchor="right"
        open={open}
        sx={{ display: { xs: 'none', md: 'block' } }}
        variant="permanent"
      >
        {header}
        {!isMobile && target}
      </PermanentDrawer>
    </>
  )
}
