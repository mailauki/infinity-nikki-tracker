'use client'

import * as React from 'react'
import { styled, useTheme, Theme, CSSObject } from '@mui/material/styles'
import Box from '@mui/material/Box'
import MuiDrawer from '@mui/material/Drawer'
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import List from '@mui/material/List'
import CssBaseline from '@mui/material/CssBaseline'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import MenuIcon from '@mui/icons-material/Menu'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import InboxIcon from '@mui/icons-material/MoveToInbox'
import MailIcon from '@mui/icons-material/Mail'
import InfoIcon from '@mui/icons-material/InfoOutline'
import DashboardIcon from '@mui/icons-material/Dashboard'
import Link from 'next/link'
import Image from 'next/image'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import Avatar from '@mui/material/Avatar'
import ImageIcon from '@mui/icons-material/Image'
import Stack from '@mui/material/Stack'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import { Link as Anchor } from '@mui/material'

const drawerWidth = 240

const navLinksData = {
  navMain: [
    {
      title: 'Eureka',
      url: '/eureka',
      image: '/icons/eureka.png',
      items: [
        {
          title: 'Trials',
          url: '/eureka/trials',
        },
        {
          title: 'Missing',
          url: '/eureka/missing',
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: 'Dashboard',
      url: '/dashboard',
      icon: <DashboardIcon />,
    },
    {
      title: 'About',
      url: '/about',
      icon: <InfoIcon />,
    },
  ],
}

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
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up('sm')]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
})

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
}))

interface AppBarProps extends MuiAppBarProps {
  open?: boolean
}

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<AppBarProps>(({ theme }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  variants: [
    {
      props: ({ open }) => open,
      style: {
        marginLeft: drawerWidth,
        width: `calc(100% - ${drawerWidth}px)`,
        transition: theme.transitions.create(['width', 'margin'], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
      },
    },
  ],
}))

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

const Footer = () => (
  <AppBar component="footer" position="fixed" sx={{ top: 'auto', bottom: 0 }} color="default">
    <Toolbar>
      <Stack direction="row" alignItems="center" justifyContent="center" flex={1}>
        <Typography variant="caption" color="textDisabled">
          &copy; 2026 mailauki
        </Typography>
      </Stack>
    </Toolbar>
  </AppBar>
)

export default function NavDrawer({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const theme = useTheme()
  const [open, setOpen] = React.useState(false)

  const handleDrawerOpen = () => {
    setOpen(true)
  }

  const handleDrawerClose = () => {
    setOpen(false)
  }

  return (
    <Stack className="h-screen overflow-hidden">
      <Stack direction="row">
        <CssBaseline />
        <AppBar position="fixed" open={open}>
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              onClick={handleDrawerOpen}
              edge="start"
              sx={[
                {
                  marginLeft: -1,
                  marginRight: 5,
                },
                open && { display: 'none' },
              ]}
            >
              <MenuIcon />
            </IconButton>
            {/* <Link href="/">
              <Image
                src="https://static.wikia.nocookie.net/infinity-nikki/images/e/e6/Site-logo.png/revision/latest?cb=20250212142911"
                alt="Infinity Nikki Logo"
                width={90}
                height={40}
                // className="mx-2 mb-4 brightness-[0.4] drop-shadow-md grayscale dark:filter-none"
              />
            </Link> */}
            <Anchor
              variant="h6"
              noWrap
              sx={{ color: 'inherit', cursor: 'pointer' }}
              underline="none"
              href="/"
            >
              Infinity Nikki Tracker
            </Anchor>
          </Toolbar>
        </AppBar>
        <Drawer variant="permanent" open={open} className="h-screen overflow-hidden">
          <DrawerHeader>
            <IconButton onClick={handleDrawerClose}>
              {theme.direction === 'rtl' ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            </IconButton>
          </DrawerHeader>
          <Divider />
          <List>
            {navLinksData.navMain.map((data) => (
              <>
                <ListItem key={data.title} disablePadding sx={{ display: 'block' }}>
                  <ListItemButton
                    component={Link}
                    href={data.url}
                    sx={[
                      {
                        minHeight: 48,
                        px: 2.5,
                      },
                      open
                        ? {
                            justifyContent: 'initial',
                          }
                        : {
                            justifyContent: 'center',
                          },
                    ]}
                  >
                    <ListItemAvatar
                      sx={[
                        {
                          minWidth: 0,
                          justifyContent: 'center',
                        },
                        open
                          ? {
                              mr: 1.5,
                            }
                          : {
                              mr: 'auto',
                            },
                      ]}
                    >
                      <Avatar
                        src={data.image}
                        alt={data.title}
                        className="brightness-[0.4] grayscale dark:filter-none"
                      >
                        <ImageIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={data.title}
                      sx={[
                        open
                          ? {
                              opacity: 1,
                            }
                          : {
                              opacity: 0,
                            },
                      ]}
                    />
                  </ListItemButton>
                </ListItem>
                {data.items.map((item) => (
                  <ListItem key={item.title} disablePadding>
                    <ListItemButton component={Link} href={item.url}>
                      <ListItemText inset primary={item.title} />
                    </ListItemButton>
                  </ListItem>
                ))}
              </>
            ))}
          </List>
          <Divider />
          <List>
            {navLinksData.navSecondary.map((data) => (
              <ListItem key={data.title} disablePadding sx={{ display: 'block' }}>
                <ListItemButton
                  component={Link}
                  href={data.url}
                  sx={[
                    {
                      minHeight: 48,
                      px: 2.5,
                    },
                    open
                      ? {
                          justifyContent: 'initial',
                        }
                      : {
                          justifyContent: 'center',
                        },
                  ]}
                >
                  <ListItemIcon
                    sx={[
                      {
                        minWidth: 0,
                        justifyContent: 'center',
                      },
                      open
                        ? {
                            mr: 3.5,
                          }
                        : {
                            mr: 'auto',
                          },
                    ]}
                  >
                    {data.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={data.title}
                    sx={[
                      open
                        ? {
                            opacity: 1,
                          }
                        : {
                            opacity: 0,
                          },
                    ]}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Drawer>
        <Box
          component="main"
          className="h-screen overflow-hidden"
          // sx={{ flexGrow: 1, p: 3 }}
        >
          <DrawerHeader />
          {children}
          <Toolbar />
        </Box>
      </Stack>
      <Footer />
    </Stack>
  )
}
