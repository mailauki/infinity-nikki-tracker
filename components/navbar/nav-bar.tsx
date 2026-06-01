'use client'

import { AppBar, Stack, Toolbar } from '@mui/material'
import React from 'react'
import PageTitle from './page-title'
import { NavUser } from './nav-user'

export default function NavBar() {
  return (
    <>
      <AppBar
        color="transparent"
        position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.appBar + 10, borderColor: 'transparent' }}
        variant="outlined"
      >
        <Toolbar>
          <Stack
            alignItems="center"
            direction="row"
            justifyContent="space-between"
            sx={{ flex: 1 }}
          >
            <Stack sx={{ width: (theme) => `calc(${theme.spacing(10)} + 40px)` }} />
            <PageTitle />
            <NavUser />
          </Stack>
        </Toolbar>
      </AppBar>
    </>
  )
}
