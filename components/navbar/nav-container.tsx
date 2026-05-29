'use client'

import * as React from 'react'
import { useTheme, useColorScheme } from '@mui/material/styles'
import Box from '@mui/material/Box'
import Toolbar from '@mui/material/Toolbar'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import MenuIcon from '@mui/icons-material/Menu'
import Stack from '@mui/material/Stack'
import { Button, CircularProgress, Container, Fab, Slide, Tooltip, Typography } from '@mui/material'
import { FilterList, KeyboardArrowUp, MenuOpen } from '@mui/icons-material'
import { usePathname } from 'next/navigation'
import { JwtPayload } from '@supabase/supabase-js'
import Link from 'next/link'
import Image from 'next/image'

import { NavMain } from './nav-main'
import { NavSecondary } from './nav-secondary'
import { NavUser } from './nav-user'
import { NavExtra } from './nav-extra'
import Footer from './nav-footer'
import FilterMenu from './filter-menu'
import { AppBar, AppBarTitle, Drawer, MainContainer, StyledToolbar } from './nav-styled'
import {
  EurekaSetEditButton,
  ProfileEditButton,
  SortButton,
  TrialEditButton,
} from './appbar-actions'
import { useScrollContainer } from './use-scroll-container'
import { navLinksData } from '@/lib/nav-links'
import { toTitle } from '@/lib/utils'
import EurekaDataProvider from '@/components/eureka/eureka-data-provider'
import ProfileEditProvider from '@/app/profile/profile-edit-provider'
import { SortProvider } from '@/components/sort-context'

const allLinks = [
  navLinksData.home,
  ...navLinksData.navMain.flatMap((item) => [item, ...(item.items ?? [])]),
  ...navLinksData.navSecondary.flatMap((item) => [
    item,
    ...(item.items ?? []).map((sub) => ({ ...sub, url: item.url + sub.url })),
  ]),
  ...navLinksData.navExtra,
]

export default function NavContainer({
  children,
  isAdmin = false,
  user,
}: Readonly<{
  children: React.ReactNode
  isAdmin?: boolean
  user: JwtPayload | null
}>) {
  const pathname = usePathname()
  const theme = useTheme()
  const { mode, systemMode } = useColorScheme()
  const isDarkMode = (mode === 'system' ? systemMode : mode) === 'dark'

  const [open, setOpen] = React.useState(false)

  const { setScrollRef, scrollToTop, isVisible, pullDistance, isRefreshing } = useScrollContainer()

  const bestMatch = allLinks
    .filter(
      (link) => link.url !== '/' && (pathname === link.url || pathname.startsWith(link.url + '/'))
    )
    .sort((a, b) => b.url.length - a.url.length)[0]

  const hasParams = bestMatch && pathname !== bestMatch.url
  const pageTitle = hasParams ? toTitle(pathname.split('/').at(-1) ?? '') : (bestMatch?.title ?? '')

  const isHome = pathname === '/'
  const isEurekaPage = pathname === '/eureka' || pathname.startsWith('/eureka/trials')
  const isProfilePage = pathname === '/profile'
  const isSortablePage =
    pathname === '/eureka' ||
    pathname.startsWith('/eureka/trials') ||
    pathname.startsWith('/dashboard')
  const eurekaSetSlugMatch = pathname.match(/^\/eureka\/([^/]+)$/)
  const eurekaSetSlug =
    eurekaSetSlugMatch && eurekaSetSlugMatch[1] !== 'trials' ? eurekaSetSlugMatch[1] : null
  const trialSlug = pathname.match(/^\/eureka\/trials\/([^/]+)$/)?.[1] ?? null
  const userId = user?.sub ?? null
  const isLoggedIn = !!userId

  const content = (
    <>
      <Stack direction="row">
        <AppBar color="inherit" open={open} position="fixed" variant="outlined">
          <Toolbar>
            <Stack direction="row" justifyContent="space-between" sx={{ flex: 1 }}>
              <Stack
                alignItems="center"
                direction="row"
                justifyContent="flex-start"
                sx={{ width: '64px' }}
              >
                <IconButton
                  aria-label="open drawer"
                  color="inherit"
                  edge="start"
                  sx={{
                    zIndex: theme.zIndex.drawer + 1,
                    position: 'fixed',
                    top: 12,
                    left: 40,
                  }}
                  onClick={() => (open ? setOpen(false) : setOpen(true))}
                >
                  {open ? <MenuOpen /> : <MenuIcon />}
                </IconButton>
              </Stack>
              <Stack
                alignItems="center"
                direction="row"
                justifyContent="flex-end"
                sx={{ width: '64px', zIndex: theme.zIndex.drawer + 1 }}
              >
                {!user ? (
                  <Button color="inherit" href="/auth/login">
                    Login
                  </Button>
                ) : (
                  <NavUser isAdmin={isAdmin} user={user} />
                )}
              </Stack>
            </Stack>
          </Toolbar>

          <Toolbar
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
              zIndex: theme.zIndex.drawer,
              filter: isDarkMode ? 'none' : 'grayscale(100%) brightness(40%)',
            }}
          >
            <Link href="/" style={{ cursor: 'pointer' }}>
              <Image
                alt="Infinity Nikki Logo"
                height={39}
                src="/infinity-nikki-logo.png"
                width={90}
              />
            </Link>
          </Toolbar>

          <Toolbar>
            <Container disableGutters maxWidth="md" sx={{ position: 'relative' }}>
              <AppBarTitle
                direction="row"
                isHome={isHome}
                justifyContent={{ xs: 'center', sm: 'inherit' }}
                open={open}
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
                  <React.Suspense
                    fallback={
                      <IconButton disabled>
                        <FilterList />
                      </IconButton>
                    }
                  >
                    <FilterMenu />
                  </React.Suspense>
                )}
                {isSortablePage && <SortButton />}
                {isProfilePage && <ProfileEditButton />}
                {eurekaSetSlug && <EurekaSetEditButton isAdmin={isAdmin} slug={eurekaSetSlug} />}
                {trialSlug && <TrialEditButton isAdmin={isAdmin} slug={trialSlug} />}
              </Stack>
            </Container>
          </Toolbar>
        </AppBar>

        <Drawer className="h-screen overflow-hidden" open={open} variant="permanent">
          <StyledToolbar>
            <IconButton
              aria-label="close drawer"
              color="inherit"
              edge="start"
              sx={{
                display: { xs: open ? 'flex' : 'none', sm: 'none' },
                zIndex: theme.zIndex.drawer + 1,
                position: 'fixed',
                top: 12,
                left: 40,
              }}
              onClick={() => setOpen(false)}
            >
              <MenuOpen />
            </IconButton>
          </StyledToolbar>

          <NavMain items={navLinksData.navMain} open={open} onClose={() => setOpen(false)} />

          <Divider />

          <NavSecondary
            items={navLinksData.navSecondary.filter((item) => !item.adminOnly || isAdmin)}
            open={open}
            onClose={() => setOpen(false)}
          />

          <NavExtra items={navLinksData.navExtra} open={open} onClose={() => setOpen(false)} />
        </Drawer>

        <Box className="h-screen" component="main" sx={{ flex: 1, minWidth: 0 }}>
          <StyledToolbar />
          <MainContainer
            ref={setScrollRef}
            elevation={0}
            open={open}
            sx={{ backgroundColor: 'surface.containerLowest' }}
          >
            <Slide direction="down" in={pullDistance > 0 || isRefreshing}>
              <Box
                sx={{
                  display: isHome ? 'none' : 'flex',
                  justifyContent: 'center',
                  pt: 1,
                  pb: 0.5,
                  transform: `translateY(${pullDistance}px)`,
                  transition: pullDistance === 0 ? 'transform 0.3s ease' : 'none',
                }}
              >
                <CircularProgress
                  size={24}
                  sx={{ opacity: isRefreshing ? 1 : pullDistance / 80 }}
                  value={isRefreshing ? undefined : (pullDistance / 80) * 100}
                  variant={isRefreshing ? 'indeterminate' : 'determinate'}
                />
              </Box>
            </Slide>
            <Box
              sx={{
                transform: `translateY(${pullDistance}px)`,
                transition: pullDistance === 0 ? 'transform 0.3s ease' : 'none',
              }}
            >
              {children}
              {!isHome && <Toolbar />}
            </Box>

            <Tooltip placement="top-end" title="Back to Top">
              <Slide direction="up" in={isVisible}>
                <Fab
                  aria-label="scroll back to top"
                  color="primary"
                  size="small"
                  sx={{ position: 'fixed', bottom: 80, right: 50 }}
                  onClick={scrollToTop}
                >
                  <KeyboardArrowUp />
                </Fab>
              </Slide>
            </Tooltip>
          </MainContainer>
          <Toolbar />
        </Box>
      </Stack>

      <Footer />
    </>
  )

  const wrapped = <SortProvider>{content}</SortProvider>

  if (isEurekaPage) {
    return (
      <EurekaDataProvider isAdmin={isAdmin} isLoggedIn={isLoggedIn} userId={userId}>
        {wrapped}
      </EurekaDataProvider>
    )
  }

  if (isProfilePage) {
    return <ProfileEditProvider>{wrapped}</ProfileEditProvider>
  }

  return wrapped
}
