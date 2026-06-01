'use client'

import { AppBar, Box, Toolbar } from '@mui/material'
import PageTitle from './page-title'
import { NavUser } from './nav-user'

export default function NavBar() {
  return (
    <AppBar
      color="transparent"
      position="sticky"
      sx={{ borderColor: 'transparent' }}
      variant="outlined"
    >
      <Toolbar sx={{ justifyContent: 'space-between', py: 3 }}>
        <Box sx={{ width: 40 }} />
        <PageTitle />
        <NavUser />
      </Toolbar>
    </AppBar>
  )
}
