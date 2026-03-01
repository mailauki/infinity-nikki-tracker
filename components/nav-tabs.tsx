'use client'

import React from 'react'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Box from '@mui/material/Box'
import Link from 'next/link'
import { navLinksData } from '@/lib/nav-links'
import { usePathname } from 'next/navigation'
import { NavMainLink, NavSecondaryLink } from '@/lib/types/types'
import { Button, Stack, Toolbar } from '@mui/material'
import { Logout } from '@mui/icons-material'

function NavTabs() {
  const pathname = usePathname()
  const path = pathname.split('/')
  const title = pathname === '/' ? 'home' : path[1]
  const slug = path.length > 2 ? path[2] : ''

  const navLinks =
    (navLinksData.navMain.find((item) => item.url === `/${title}`) as NavMainLink) ||
    (navLinksData.navSecondary.find((item) => item.url === `/${title}`) as NavSecondaryLink) ||
    (navLinksData.navExtra.find((item) => item.url === `/${title}`) as NavSecondaryLink) ||
    (navLinksData.home as NavSecondaryLink)
  const allNavLinks = [navLinks].concat(navLinks.items! || [])

  const isNavLink = !!allNavLinks.find((link) => link.url === pathname)
  const activePath = slug && !isNavLink ? false : pathname

  return (
    <Toolbar disableGutters sx={{ alignItems: 'flex-end' }}>
      <Stack direction='row' alignItems='center' justifyContent='space-between' sx={{ width: '100%', borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activePath} aria-label="Next.js MUI Nav Tabs Example" role="navigation">
          {allNavLinks.map((link) => (
            <Tab
              key={link.title}
              label={link.title}
              value={link.url}
              component={Link}
              href={link.url}
            />
          ))}
        </Tabs>
				{pathname === "/profile" && (
					<Box sx={{ px: 2 }}>
          <form action="/auth/signout" method="post">
            <Button size='small' type="submit" variant="outlined" startIcon={<Logout fontSize="small" />}>
              Log out
            </Button>
          </form>
        </Box>
				)}
      </Stack>
    </Toolbar>
  )
}

export default NavTabs
