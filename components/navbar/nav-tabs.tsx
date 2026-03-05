'use client'

import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Box from '@mui/material/Box'
import Link from 'next/link'
import { navLinksData } from '@/lib/nav-links'
import { usePathname } from 'next/navigation'
import { NavLink } from '@/lib/types/props'
import { Button, Stack, Toolbar } from '@mui/material'
import { Logout } from '@mui/icons-material'

function NavTabs() {
  const pathname = usePathname()
  const path = pathname.split('/')
  const title = pathname === '/' ? 'home' : path[1]
  const slug = path.length > 2 ? path[2] : ''

  const allSections: NavLink[] = [
    ...navLinksData.navMain,
    ...navLinksData.navSecondary,
    ...navLinksData.navExtra,
  ]

  const navLinks: NavLink =
    navLinksData.navMain.find((item) => item.url === `/${title}`) ||
    navLinksData.navSecondary.find((item) => item.url === `/${title}`) ||
    navLinksData.navExtra.find((item) => item.url === `/${title}`) ||
    allSections.find((item) =>
      item.items?.some((sub) => sub.url === pathname || pathname.startsWith(sub.url + '/'))
    ) ||
    navLinksData.home

  // For sections with exclusiveItems, show only the item matching the current path
  const exclusiveSection = navLinks.exclusiveItems && pathname !== navLinks.url
  const matchedItem = exclusiveSection
    ? navLinks.items?.find((item) => item.url === pathname || pathname.startsWith(item.url + '/'))
    : undefined

  let allNavLinks: NavLink[]
  if (matchedItem) {
    allNavLinks = [navLinks, matchedItem]
  } else if (navLinks.exclusiveItems) {
    allNavLinks = [navLinks]
  } else {
    allNavLinks = [navLinks].concat(navLinks.items || [])
  }

  const isNavLink = !!allNavLinks.find((link) => link.url === pathname)
  // For prefix-matched dynamic sub-routes, activate the item's base URL
  let activePath: string | false
  if (matchedItem && !isNavLink) {
    activePath = matchedItem.url
  } else if (slug && !isNavLink) {
    activePath = false
  } else {
    activePath = pathname
  }

  return (
    <Toolbar disableGutters sx={{ alignItems: 'flex-end' }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ width: '100%', borderBottom: 1, borderColor: 'divider' }}
      >
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
        {pathname === '/profile' && (
          <Box sx={{ px: 2 }}>
            <form action="/auth/signout" method="post">
              <Button
                size="small"
                type="submit"
                variant="outlined"
                startIcon={<Logout fontSize="small" />}
              >
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
