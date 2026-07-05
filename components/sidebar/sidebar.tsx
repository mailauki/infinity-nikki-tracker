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
} from '@mui/material'
import { Close, FilterList } from '@mui/icons-material'
import { useSidebar } from '@/components/navbar/navbar-toolbar-context'

export const DEFAULT_SIDEBAR_WIDTH = 400
const SIDEBAR_STORAGE_KEY = 'sidebar-open'

const openedMixin = (theme: Theme, width: number): CSSObject => ({
  height: 'calc(100vh - 100px)',
  border: 0,
  borderRadius: '30px',
  marginTop: 80,
  marginBottom: 20,
  width,
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

const PermanentDrawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== 'open' && prop !== 'width',
})<{ width: number }>(({ theme, width }) => ({
  width,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  variants: [
    {
      props: ({ open }) => open,
      style: {
        ...openedMixin(theme, width),
        '& .MuiDrawer-paper': openedMixin(theme, width),
      },
    },
    {
      props: ({ open }) => !open,
      style: {
        ...closedMixin(theme),
        '& .MuiDrawer-paper': closedMixin(theme),
      },
    },
  ],
}))

// Generic content-pushing sidebar: a temporary overlay drawer below `sm` and a
// permanent, content-pushing drawer at `sm`+, mirroring the nav-drawer split. The
// body is passed as children so any page can reuse it. Open/close is the shared
// global sidebar boolean (one sidebar is active per route). The margin reservation
// that makes the permanent drawer "push" content lives in sidebar-content-shim /
// NavBar / NavBarToolbar, keyed on the sidebar registry.
export default function Sidebar({
  children,
  icon = <FilterList />,
  title,
  width = DEFAULT_SIDEBAR_WIDTH,
}: {
  children: React.ReactNode
  icon?: React.ReactNode
  title?: React.ReactNode
  width?: number
}) {
  const { sidebarOpen, setSidebarOpen } = useSidebar()

  function toggle(value: boolean) {
    setSidebarOpen(value)
    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(value))
  }

  const header = (
    <Toolbar>
      <Stack
        direction="row"
        sx={{ flex: 1, alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}
      >
        {title}
        <IconButton onClick={() => toggle(false)}>
          <Close />
        </IconButton>
      </Stack>
    </Toolbar>
  )

  return (
    <>
      <IconButton color={sidebarOpen ? 'primary' : 'default'} onClick={() => toggle(!sidebarOpen)}>
        {icon}
      </IconButton>

      <MuiDrawer
        anchor="right"
        open={sidebarOpen}
        slotProps={{ root: { disableScrollLock: true } }}
        sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { width: '100%' } }}
        variant="temporary"
        onClose={() => setSidebarOpen(false)}
      >
        {header}
        {children}
      </MuiDrawer>
      <PermanentDrawer
        anchor="right"
        open={sidebarOpen}
        sx={{ display: { xs: 'none', sm: 'block' } }}
        variant="permanent"
        width={width}
      >
        {header}
        {children}
      </PermanentDrawer>
    </>
  )
}
