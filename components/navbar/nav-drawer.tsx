'use client'

import {
  Divider,
  Drawer as MuiDrawer,
  IconButton,
  Stack,
  Toolbar,
  Theme,
  CSSObject,
  styled,
  useMediaQuery,
  useTheme,
	Box,
} from '@mui/material'
import NavSection from './nav-section'
import { navLinksData } from '@/lib/nav-links'
import { MenuOpen, Menu } from '@mui/icons-material'
import React from 'react'

const drawerWidth = 240

const openedMixin = (theme: Theme): CSSObject => ({
  height: 'calc(100vh - 40px)',
  borderColor: 'transparent',
  borderRadius: '30px',
  margin: 20,
  marginRight: 0,
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
})

const closedMixin = (theme: Theme): CSSObject => ({
  height: 'calc(100vh - 40px)',
  borderColor: 'transparent',
  borderRadius: '30px',
  margin: 20,
  marginRight: 0,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: `calc(${theme.spacing(10)} + 1px)`,
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

const navContent = (open: boolean, onClose: () => void) => (
  <Stack component="nav" sx={{ flex: 1, mx: 1.5, pb: 3 }}>
    <NavSection items={navLinksData.navMain} open={open} onClose={onClose} />

    <Divider sx={{ my: 0.5 }} />

    <NavSection items={navLinksData.navSecondary} open={open} onClose={onClose} />

    <Stack sx={{ flex: 1, justifyContent: 'flex-end' }}>
      <NavSection items={navLinksData.navExtra} open={open} onClose={onClose} />
    </Stack>
  </Stack>
)

export default function NavDrawer() {
  const theme = useTheme()
  const [open, setOpen] = React.useState(false) // TODO: store in user_preferences so that drawer can stay open if preferred (ignored for temporary drawer)

  return (
	<>
        {!open && (
          <IconButton
            sx={{ position: 'fixed', top: 24, left: 18, zIndex: theme.zIndex.drawer + 1, display: { xs: 'flex', sm: 'none' } }}
            onClick={() => setOpen(true)}
          >
            <Menu />
          </IconButton>
        )}
				<MuiDrawer
          variant="temporary"
          anchor="left"
          open={open}
          onClose={() => setOpen(false)}
          sx={{
            display: { xs: 'block', sm: 'none' },
						'& .MuiDrawer-paper': { width: '100%' }
          }}
          slotProps={{
            root: {
              keepMounted: true, // Better open performance on mobile.
            },
          }}
        >
      
      <Toolbar disableGutters sx={{ px: 2.4, pt: 3 }}>
            <IconButton onClick={() => setOpen(false)}>
              <MenuOpen />
            </IconButton>
          </Toolbar>
          <Toolbar />
          {navContent(true, () => setOpen(false))}
        </MuiDrawer>
    <Drawer anchor="left" open={open} variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
          }}>
      <Toolbar disableGutters sx={{ px: 2.4, pt: 3 }}>
        <IconButton onClick={() => setOpen(!open)}>{open ? <MenuOpen /> : <Menu />}</IconButton>
      </Toolbar>
      <Toolbar />
      {navContent(open, () => setOpen(false))}
    </Drawer>
		</>
  )
}
