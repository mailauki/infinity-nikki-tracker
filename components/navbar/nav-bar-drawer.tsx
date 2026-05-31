'use client'
import { Menu, MenuOpen } from '@mui/icons-material'
import { AppBar, Divider, Drawer, IconButton, Stack, Toolbar } from '@mui/material'
import React from 'react'
import { NavMain } from './nav-main'
import { navLinksData } from '@/lib/nav-links'
import { NavSecondary } from './nav-secondary'
import { NavExtra } from './nav-extra'
import PageTitle from './page-title'
import { NavUser } from './nav-user'
import NavTabs from './nav-section'
import NavSection from './nav-section'

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
            <NavUser />
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
        <Toolbar />

        <Stack component="nav" sx={{ flex: 1, mx: 1.5 }}>
          <NavSection
            items={navLinksData.navMain}
            open={openNav}
            onClose={() => setOpenNav(false)}
          />

          <Divider sx={{ my: 0.5 }} />

          <NavSection
            items={navLinksData.navSecondary}
            open={openNav}
            onClose={() => setOpenNav(false)}
          />

          <Stack sx={{ flex: 1 }}>
            <Stack sx={{ flex: 1 }} />
            <NavSection
              items={navLinksData.navExtra}
              open={openNav}
              onClose={() => setOpenNav(false)}
            />
            <Toolbar sx={{ mb: 2 }} />
          </Stack>
        </Stack>
      </Drawer>
    </>
  )
}
