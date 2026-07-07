'use client'

import * as React from 'react'
import { AppBar, Toolbar } from '@mui/material'

export default function NavBarToolbar({ children }: { children: React.ReactNode }) {
  return (
    <AppBar
      color="transparent"
      component="div"
      position="sticky"
      sx={{
        borderColor: 'transparent',
        top: 80,
        zIndex: (theme) => theme.zIndex.appBar,
      }}
      variant="outlined"
    >
      <Toolbar sx={{ mb: 2 }}>{children}</Toolbar>
    </AppBar>
  )
}
