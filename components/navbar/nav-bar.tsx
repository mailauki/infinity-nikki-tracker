'use client'

import { AppBar, Stack, Toolbar } from '@mui/material'
import React from 'react'
import PageTitle from './page-title'
import { NavUser } from './nav-user'

export const DRAWER_WIDTH = 350

export default function NavBar() {
  return (
    <>
      <AppBar color="inherit" position="fixed" variant='outlined' sx={{ zIndex: (theme) => theme.zIndex.appBar + 10 }}>
        <Toolbar>
          <Stack
            alignItems="center"
            direction="row"
            justifyContent="space-between"
            sx={{ flex: 1 }}
          >
						<Stack sx={{ width: (theme) => `calc(${theme.spacing(10)} + 40px)`, }} />
            <PageTitle />
            <NavUser />
          </Stack>
        </Toolbar>
      </AppBar>
    </>
  )
}
