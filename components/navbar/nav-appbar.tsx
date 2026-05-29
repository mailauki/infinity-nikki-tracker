'use client'

import * as React from 'react'
import { useColorScheme } from '@mui/material/styles'
import Toolbar from '@mui/material/Toolbar'
import Stack from '@mui/material/Stack'
import { Button, Container, Skeleton, Typography } from '@mui/material'
import { usePathname } from 'next/navigation'
import { JwtPayload } from '@supabase/supabase-js'
import Link from 'next/link'
import Image from 'next/image'

import { NavUser } from './nav-user'
import FilterMenu from './filter-menu'
import { AppBar, AppBarTitle } from './nav-styled'
import {
  EurekaSetEditButton,
  ProfileEditButton,
  SortButton,
  TrialEditButton,
} from './appbar-actions'
import { navLinksData } from '@/lib/nav-links'
import { toTitle } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

const allLinks = [
  navLinksData.home,
  ...navLinksData.navMain.flatMap((item) => [item, ...(item.items ?? [])]),
  ...navLinksData.navSecondary.flatMap((item) => [
    item,
    ...(item.items ?? []).map((sub) => ({ ...sub, url: item.url + sub.url })),
  ]),
  ...navLinksData.navExtra,
]

export default function NavAppBar() {
  const pathname = usePathname()
  const { mode, systemMode } = useColorScheme()
  const isDarkMode = (mode === 'system' ? systemMode : mode) === 'dark'

  const [user, setUser] = React.useState<JwtPayload | null | undefined>(undefined)
  const [isAdmin, setIsAdmin] = React.useState(false)

  React.useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      const jwt = data.user as JwtPayload | null
      setUser(jwt)
      if (jwt?.sub) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', jwt.sub)
          .single()
        setIsAdmin(profile?.role === 'admin')
      }
    })
  }, [])

  const bestMatch = allLinks
    .filter(
      (link) => link.url !== '/' && (pathname === link.url || pathname.startsWith(link.url + '/'))
    )
    .sort((a, b) => b.url.length - a.url.length)[0]

  const hasParams = bestMatch && pathname !== bestMatch.url
  const pageTitle = hasParams ? toTitle(pathname.split('/').at(-1) ?? '') : (bestMatch?.title ?? '')

  const isHome = pathname === '/'
  const isSortablePage =
    pathname === '/eureka' ||
    pathname.startsWith('/eureka/trials') ||
    pathname.startsWith('/dashboard')
  const eurekaSetSlugMatch = pathname.match(/^\/eureka\/([^/]+)$/)
  const eurekaSetSlug =
    eurekaSetSlugMatch && eurekaSetSlugMatch[1] !== 'trials' ? eurekaSetSlugMatch[1] : null
  const trialSlug = pathname.match(/^\/eureka\/trials\/([^/]+)$/)?.[1] ?? null
  const isProfilePage = pathname === '/profile'

  return (
    <AppBar color="inherit" position="fixed" variant="outlined">
      {/* <Toolbar
        alignItems="center"
        component={Stack}
        direction="row"
        justifyContent="center"
        sx={{
          flex: 1,
          width: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          py: 1.5,
          filter: isDarkMode ? 'none' : 'grayscale(100%) brightness(40%)',
        }}
      >
        <Link href="/" style={{ cursor: 'pointer' }}>
          <Image alt="Infinity Nikki Logo" height={39} src="/infinity-nikki-logo.png" width={90} />
        </Link>
      </Toolbar> */}

      <Toolbar>
        <Container disableGutters maxWidth="md" sx={{ position: 'relative' }}>
          <AppBarTitle
            direction="row"
            isHome={isHome}
            justifyContent={{ xs: 'center', sm: 'inherit' }}
          >
            <Typography
              component="h1"
              sx={{ fontSize: { xs: 'h6.fontSize', sm: 'h5.fontSize', md: 'h4.fontSize' } }}
              variant="h4"
            >
              {pageTitle}
            </Typography>
          </AppBarTitle>

          <Stack direction="row" sx={{ position: 'absolute', bottom: 0, right: 0 }}>
            {pathname === '/eureka' && (
              <React.Suspense fallback={null}>
                <FilterMenu />
              </React.Suspense>
            )}
            {isSortablePage && <SortButton />}
            {isProfilePage && <ProfileEditButton />}
            {eurekaSetSlug && <EurekaSetEditButton isAdmin={isAdmin} slug={eurekaSetSlug} />}
            {trialSlug && <TrialEditButton isAdmin={isAdmin} slug={trialSlug} />}
            <Stack
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
            </Stack>
          </Stack>
        </Container>
      </Toolbar>
    </AppBar>
  )
}
