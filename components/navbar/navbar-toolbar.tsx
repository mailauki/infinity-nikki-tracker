'use client'

import * as React from 'react'
import { AppBar, Toolbar } from '@mui/material'
import { useAppBarInsets } from './use-app-bar-insets'

export default function NavBarToolbar({ children }: { children: React.ReactNode }) {
  const insets = useAppBarInsets()
  return (
    <AppBar
      color="transparent"
      component="div"
      position="fixed"
      sx={{
        borderColor: 'transparent',
        pointerEvents: 'none',
        ...insets,
      }}
      variant="outlined"
    >
      <Toolbar sx={{ mb: 2 }} />
      <Toolbar sx={{ mb: 2, pointerEvents: 'auto' }}>{children}</Toolbar>
    </AppBar>
  )
}
