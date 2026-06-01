'use client'

import {
  AppBar,
  Divider,
  Drawer as MuiDrawer,
  IconButton,
  Stack,
  Toolbar,
  Theme,
  CSSObject,
  styled,
} from '@mui/material'
import NavSection from './nav-section'
import { navLinksData } from '@/lib/nav-links'
import { MenuOpen, Menu } from '@mui/icons-material'
import React from 'react'

const drawerWidth = 240

const openedMixin = (theme: Theme): CSSObject => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
})

const closedMixin = (theme: Theme): CSSObject => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: `calc(${theme.spacing(10)} + 1px)`,
  [theme.breakpoints.down('sm')]: {
    width: 0,
  },
})

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(({ theme }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  variants: [
    {
      props: ({ open }) => open,
      style: {
        ...openedMixin(theme),
        '& .MuiDrawer-paper': openedMixin(theme),
      },
    },
    {
      props: ({ open }) => !open,
      style: {
        ...closedMixin(theme),
        '& .MuiDrawer-paper': closedMixin(theme),
      },
    },
  ],
}))
export default function NavDrawer() {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <AppBar
        color="transparent"
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 10,
          borderColor: 'transparent',
          width: (theme) => (open ? drawerWidth : `calc(${theme.spacing(10)} + 1px)`),
          top: 0,
          left: 0,
        }}
        variant="outlined"
      >
        <Toolbar>
          <IconButton onClick={() => setOpen(!open)}>{open ? <MenuOpen /> : <Menu />}</IconButton>
        </Toolbar>
      </AppBar>

      <Drawer anchor="left" open={open} variant="permanent">
        <Toolbar />
        <Toolbar />
        <Stack component="nav" sx={{ flex: 1, mx: 1.5 }}>
          <NavSection items={navLinksData.navMain} open={open} onClose={() => setOpen(false)} />

          <Divider sx={{ my: 0.5 }} />

          <NavSection
            items={navLinksData.navSecondary}
            open={open}
            onClose={() => setOpen(false)}
          />
        </Stack>
      </Drawer>
    </>
  )
}
