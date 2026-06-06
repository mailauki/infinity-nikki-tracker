'use client'

import * as React from 'react'
import { useNavDrawer } from './navbar-toolbar-context'
import { AppBar, Toolbar } from '@mui/material'

export default function NavBarToolbar({ children }: { children: React.ReactNode }) {
  const { drawerOpen } = useNavDrawer()
  return (
    <AppBar
      color="transparent"
      component="div"
      position="fixed"
      sx={{
        borderColor: 'transparent',
        ml: { xs: 0, sm: drawerOpen ? '260px' : 'calc(var(--mui-spacing) * 10 + 21px)' },
        width: {
          xs: '100%',
          sm: drawerOpen ? 'calc(100% - 260px)' : 'calc(100% - (var(--mui-spacing) * 10 + 21px))',
        },
        transition: (theme) =>
          theme.transitions.create(['margin-left', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: drawerOpen
              ? theme.transitions.duration.enteringScreen
              : theme.transitions.duration.leavingScreen,
          }),
      }}
      variant="outlined"
    >
      <Toolbar sx={{ mb: 2 }} />
      <Toolbar sx={{ mb: 2 }}>{children}</Toolbar>
    </AppBar>
  )
}
