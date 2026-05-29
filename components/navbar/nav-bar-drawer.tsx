'use client'
import { Menu, MenuOpen } from '@mui/icons-material'
import { AppBar, Box, Divider, Drawer, IconButton, Stack, Toolbar } from '@mui/material'
import React from 'react'
import { NavMain } from './nav-main'
import { navLinksData } from '@/lib/nav-links'
import { NavSecondary } from './nav-secondary'
import { NavExtra } from './nav-extra'
import FilterMenu from './filter-menu'
import PageTitle from './page-title'
import { NavUser } from './nav-user'

export const DRAWER_WIDTH = 350

export default function NavBar() {
  const [openNav, setOpenNav] = React.useState(false)

  return (
    <>
      <AppBar color="inherit" position="fixed" sx={{ zIndex: (theme) => theme.zIndex.appBar + 10 }}>
        <Toolbar>
          <Stack
            alignItems="center"
            direction="row"
            justifyContent="space-between"
            sx={{ flex: 1 }}
          >
            <IconButton onClick={() => setOpenNav(true)}>
              <Menu />
            </IconButton>
            <PageTitle />
            <Box sx={{ width: '64px' }} />
						{/* <Stack
              alignItems="center"
              direction="row"
              justifyContent="flex-end"
              sx={{ width: '64px' }}
            >
              {!user && (
                <Button color="inherit" href="/auth/login">
                  Login
                </Button>
              )}
              {user === undefined ? (
                <Skeleton height={40} variant="circular" width={40} />
              ) : (
                <NavUser isAdmin={isAdmin} user={user!} />
              )}
            </Stack> */}
          </Stack>
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="left"
        open={openNav}
        sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}
        onClose={() => setOpenNav(false)}
      >
        <Toolbar>
          <IconButton onClick={() => setOpenNav(false)}>
            <MenuOpen />
          </IconButton>
        </Toolbar>
        <NavMain items={navLinksData.navMain} open={openNav} onClose={() => setOpenNav(false)} />

        <Divider />

        <NavSecondary
          items={navLinksData.navSecondary}
          open={openNav}
          onClose={() => setOpenNav(false)}
        />
        <NavExtra items={navLinksData.navExtra} open={openNav} onClose={() => setOpenNav(false)} />
      </Drawer>
    </>
  )
}
