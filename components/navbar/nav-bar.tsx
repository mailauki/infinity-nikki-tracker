'use client'

import { AppBar, Toolbar } from '@mui/material'
import PageTitle from './page-title'
import { useNavDrawer } from './navbar-toolbar-context'
import { NavUser } from './nav-user'

export default function NavBar() {
  const { drawerOpen } = useNavDrawer()

  return (
    <AppBar
      color="transparent"
      position="fixed"
      sx={{
        borderColor: 'transparent',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        maskImage: 'linear-gradient(to bottom, rgba(0, 0, 0, 1) 80%, rgba(0, 0, 0, 0) 100%)',
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
      <Toolbar sx={{ alignItems: 'flex-end', justifyContent: 'center', mb: 2 }}>
        <PageTitle />
        <NavUser />
      </Toolbar>
      <Toolbar sx={{ mb: 2 }} />
    </AppBar>
  )
}
