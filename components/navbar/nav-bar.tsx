'use client'
import { FilterList, Menu, MenuOpen } from '@mui/icons-material'
import { AppBar, Divider, Drawer, IconButton, Stack, Toolbar } from '@mui/material'
import React from 'react'
import { NavMain } from './nav-main'
import { navLinksData } from '@/lib/nav-links'
import { NavSecondary } from './nav-secondary'
import { NavExtra } from './nav-extra'
import FilterMenu from './filter-menu'
import PageTitle from './page-title'

export const DRAWER_WIDTH = 350

export default function NavBar() {
  const [openNav, setOpenNav] = React.useState(false)
  const [openFilter, setOpenFilter] = React.useState(false)

  const toggleNavDrawer = (newOpen: boolean) => () => {
    setOpenNav(newOpen)
  }

  const toggleFilterDrawer = (newOpen: boolean) => () => {
    setOpenFilter(newOpen)
  }

  return (
    <>
		<AppBar color="inherit" position="fixed">
      <Toolbar>
        <Stack alignItems="center" direction="row" justifyContent="space-between" sx={{ flex: 1 }}>
          <IconButton onClick={toggleNavDrawer(true)}>
            <Menu />
          </IconButton>
          <PageTitle />
          <IconButton onClick={toggleFilterDrawer(true)}>
            <FilterList />
          </IconButton>
        </Stack>
      </Toolbar>
			</AppBar>

      <Drawer
        anchor="left"
        open={openNav}
        sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}
        onClose={toggleNavDrawer(false)}
      >
        <Toolbar>
          <IconButton onClick={toggleNavDrawer(false)}>
            <MenuOpen />
          </IconButton>
        </Toolbar>
        <NavMain items={navLinksData.navMain} open={openNav} onClose={toggleNavDrawer(false)} />

        <Divider />

        <NavSecondary
          items={navLinksData.navSecondary}
          open={openNav}
          onClose={toggleNavDrawer(false)}
        />
        <NavExtra items={navLinksData.navExtra} open={openNav} onClose={toggleNavDrawer(false)} />
      </Drawer>

      <Drawer
        anchor="right"
        open={openFilter}
        sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}
        onClose={toggleFilterDrawer(false)}
      >
        <Toolbar>
          <Stack direction="row" justifyContent="flex-end" sx={{ flex: 1, mx: 2 }}>
            <IconButton onClick={toggleFilterDrawer(false)}>
              <FilterList />
            </IconButton>
          </Stack>
        </Toolbar>
        <FilterMenu />
      </Drawer>
    </>
  )
}
