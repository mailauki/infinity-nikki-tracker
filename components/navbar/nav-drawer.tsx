'use client'

import * as React from 'react'
import { styled, useTheme, Theme, CSSObject, useColorScheme } from '@mui/material/styles'
import Box from '@mui/material/Box'
import MuiDrawer from '@mui/material/Drawer'
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import MenuIcon from '@mui/icons-material/Menu'
import Stack from '@mui/material/Stack'
import { Button, Container, Paper, Typography } from '@mui/material'
import { NavMain } from './nav-main'
import { NavSecondary } from './nav-secondary'
import { navLinksData } from '@/lib/nav-links'
import { NavUser } from './nav-user'
import { JwtPayload } from '@supabase/supabase-js'
import { NavExtra } from './nav-extra'
import Link from 'next/link'
import Footer from './nav-footer'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Edit, FilterList, MenuOpen } from '@mui/icons-material'
import FilterMenu from './filter-menu'
import EurekaDataProvider from '@/components/eureka/eureka-data-provider'

const DRAWER_WIDTH = 240
const xsHeight = 48 * 3 // based on number of toolbars and toolbar minHeight
const smHeight = 64 * 3
const mdHeight = 56 * 3

const openedMixin = (theme: Theme): CSSObject => ({
  width: '100%',
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
  [theme.breakpoints.up('sm')]: {
    width: DRAWER_WIDTH,
  },
})

const closedMixin = (theme: Theme): CSSObject => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: 0,
  [theme.breakpoints.up('sm')]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
})

const MainContainer = styled(Paper)(({ theme }) => ({
  // Default height for small screens (portrait)
  height: `calc(100vh - ${mdHeight}px)`,
  [theme.breakpoints.up('xs')]: {
    '@media (orientation: landscape)': {
      height: `calc(100vh - ${xsHeight}px)`,
    },
  },
  // Large screens (sm breakpoint and up)
  [theme.breakpoints.up('sm')]: {
    height: `calc(100vh - ${smHeight}px)`,
  },
  overflowY: 'auto',
  borderRadius: 0,
}))

interface AppBarTitleProps {
  open?: boolean
  isHome?: boolean
}

const AppBarTitle = styled(Stack, {
  shouldForwardProp: (prop) => prop !== 'open' && prop !== 'isHome',
})<AppBarTitleProps>(({ theme, open, isHome }) => ({
  flex: 1,
  alignSelf: 'flex-end',
  color: isHome ? 'transparent' : 'inherit',
  marginLeft: 0,
  transition: theme.transitions.create('margin-left', {
    easing: theme.transitions.easing.sharp,
    duration: open
      ? theme.transitions.duration.enteringScreen
      : theme.transitions.duration.leavingScreen,
  }),
  [theme.breakpoints.up('sm')]: {
    marginLeft: open ? 0 : '64px',
  },
}))

interface AppBarProps extends MuiAppBarProps {
  open?: boolean
}

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<AppBarProps>(({ theme }) => ({
  zIndex: theme.zIndex.drawer + 1,
  borderTop: 0,
  borderLeft: 0,
  borderRight: 0,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  variants: [
    {
      props: ({ open }) => open,
      style: {
        display: 'none',
        transition: theme.transitions.create(['width', 'margin'], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
        [theme.breakpoints.up('sm')]: {
          display: 'flex',
          marginLeft: DRAWER_WIDTH,
          width: `calc(100% - ${DRAWER_WIDTH}px)`,
        },
      },
    },
  ],
}))

const StyledToolbar = styled(Toolbar)(({ theme }) => ({
  alignItems: 'flex-start',
  paddingTop: theme.spacing(1),
  paddingBottom: theme.spacing(2),
  // Override media queries injected by theme.mixins.toolbar
  minHeight: 114,
  [theme.breakpoints.up('sm')]: {
    minHeight: 128,
  },
}))

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(({ theme }) => ({
  width: 0,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  [theme.breakpoints.up('sm')]: {
    width: DRAWER_WIDTH,
  },
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

export default function NavDrawer({
  children,
  isAdmin = false,
  user,
}: Readonly<{
  children: React.ReactNode
  isAdmin?: boolean
  user: JwtPayload
}>) {
  const pathname = usePathname()
  const theme = useTheme()
  const { mode, systemMode } = useColorScheme()
  const isDarkMode = (mode === 'system' ? systemMode : mode) === 'dark'

  const [open, setOpen] = React.useState(false)

  const handleDrawerOpen = () => {
    setOpen(true)
  }

  const handleDrawerClose = () => {
    setOpen(false)
  }

  const allLinks = [
    navLinksData.home,
    ...navLinksData.navMain.flatMap((item) => [item, ...(item.items ?? [])]),
    ...navLinksData.navSecondary.flatMap((item) => [
      item,
      ...(item.items ?? []).map((sub) => ({ ...sub, url: item.url + sub.url })),
    ]),
    ...navLinksData.navExtra,
  ]

  const pageTitle =
    allLinks
      .filter((link) => pathname === link.url || pathname.startsWith(link.url + '/'))
      .sort((a, b) => b.url.length - a.url.length)[0]?.title ?? ''

  const isEurekaPage = pathname === '/eureka'
  const userId = user?.sub ?? null
  const isLoggedIn = !!userId

  const content = (
    <>
      <Stack direction="row">
        <AppBar color="default" open={open} position="fixed" variant="outlined">
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
                  sx={[
                    {
                      marginLeft: -1,
                      marginRight: 5,
                      zIndex: theme.zIndex.drawer + 1,
                    },
                    open && { display: 'none' },
                  ]}
                  onClick={handleDrawerOpen}
                >
                  <MenuIcon />
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
              filter: isDarkMode ? 'none' : 'brightness(40%)',
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
                isHome={pathname === '/'}
                justifyContent={{ xs: 'center', sm: 'inherit' }}
                open={open}
              >
                <Typography component="h1" variant="h4">
                  {pageTitle}
                </Typography>
              </AppBarTitle>

              <Stack sx={{ position: 'absolute', bottom: 0, right: 0 }}>
                {pathname === '/eureka' && (
                  <React.Suspense fallback={<IconButton disabled><FilterList /></IconButton>}>
                    <FilterMenu />
                  </React.Suspense>
                )}
                {pathname === '/profile' && (
                  <IconButton>
                    <Edit />
                  </IconButton>
                )}
              </Stack>
            </Container>
          </Toolbar>
        </AppBar>

        <Drawer className="h-screen overflow-hidden" open={open} variant="permanent">
          <StyledToolbar>
            <IconButton onClick={handleDrawerClose}>
              <MenuOpen />
            </IconButton>
          </StyledToolbar>

          <Divider />

          <NavMain items={navLinksData.navMain} open={open} onClose={handleDrawerClose} />

          <Divider />

          <NavSecondary
            items={navLinksData.navSecondary.filter((item) => !item.adminOnly || isAdmin)}
            open={open}
            onClose={handleDrawerClose}
          />

          <NavExtra items={navLinksData.navExtra} open={open} onClose={handleDrawerClose} />
        </Drawer>

        <Box className="h-screen w-full" component="main">
          <StyledToolbar />
          <MainContainer elevation={0}>{children}</MainContainer>
          <Toolbar />
        </Box>
      </Stack>

      <Footer />
    </>
  )

  if (isEurekaPage) {
    return (
      <EurekaDataProvider isLoggedIn={isLoggedIn} userId={userId}>
        {content}
      </EurekaDataProvider>
    )
  }

  return content
}
