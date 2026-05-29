'use client'

import { useState } from 'react'
import { navLinksData } from '@/lib/nav-links'
import { MenuOpen } from '@mui/icons-material'
import MenuIcon from '@mui/icons-material/Menu'
import { Divider, IconButton, Paper, Stack, Toolbar } from '@mui/material'
import { NavMain } from './nav-main'
import { NavSecondary } from './nav-secondary'
import { NavExtra } from './nav-extra'
import { closedMixin, openedMixin } from './nav-styled'
import { useTheme } from '@mui/material/styles'

export default function NavRail() {
  const theme = useTheme()
  const [open, setOpen] = useState(false)

  const mixin = open ? openedMixin(theme) : closedMixin(theme)

  return (
    <Paper
      sx={{
        ...mixin,
        borderRadius: 4,
        overflow: 'clip',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        transition: mixin.transition,
        position: 'sticky',
        top: 16,
        left: 16,
        zIndex: 1206,
      }}
      variant="outlined"
    >
      <Stack justifyContent="space-between" sx={{ flex: 1, width: '100%', height: '100%' }}>
        <Stack>
          <Toolbar disableGutters sx={{ px: 1 }}>
            <IconButton
              aria-label={open ? 'close drawer' : 'open drawer'}
              onClick={() => setOpen((prev) => !prev)}
            >
              {open ? <MenuOpen /> : <MenuIcon />}
            </IconButton>
          </Toolbar>

          <NavMain items={navLinksData.navMain} open={open} onClose={() => setOpen(false)} />

          <Divider />

          <NavSecondary
            items={navLinksData.navSecondary}
            open={open}
            onClose={() => setOpen(false)}
          />
        </Stack>

        <NavExtra items={navLinksData.navExtra} open={open} onClose={() => setOpen(false)} />
      </Stack>
    </Paper>
  )
}
