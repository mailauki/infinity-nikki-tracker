'use client'

import { styled, Theme, CSSObject } from '@mui/material/styles'
import MuiDrawer from '@mui/material/Drawer'
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'

export const DRAWER_WIDTH = 240
export const xsHeight = 48 * 3
export const smHeight = 64 * 3
export const mdHeight = 56 * 3

export const openedMixin = (theme: Theme): CSSObject => ({
  borderColor: 'transparent',
  marginLeft: '1rem',
  marginRight: '0.5rem',
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

export const closedMixin = (theme: Theme): CSSObject => ({
  borderColor: 'transparent',
  marginLeft: 0,
  marginRight: '0.5rem',
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: 0,
  [theme.breakpoints.up('sm')]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
    marginLeft: '1rem',
    marginRight: '0.5rem',
  },
})

export const MainContainer = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'open',
})<AppBarProps>(({ theme }) => ({
  minWidth: 0,
  flex: 1,
  height: `calc(100vh - ${mdHeight + 6}px)`,
  [theme.breakpoints.up('xs')]: {
    '@media (orientation: landscape)': {
      height: `calc(100vh - ${xsHeight + 6}px)`,
    },
  },
  [theme.breakpoints.up('sm')]: {
    height: `calc(100vh - ${smHeight + 6}px)`,
  },
  overflowY: 'auto',
  overflowX: 'hidden',
  overscrollBehavior: 'auto',
  borderRadius: '12px',
  marginLeft: '0.5rem',
  marginRight: '1rem',
}))

interface AppBarTitleProps {
  open?: boolean
  isHome?: boolean
}

export const AppBarTitle = styled(Stack, {
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

export interface AppBarProps extends MuiAppBarProps {
  open?: boolean
}

export const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<AppBarProps>(({ theme }) => ({
  zIndex: theme.zIndex.drawer + 1,
  borderTop: 0,
  borderLeft: 0,
  borderRight: 0,
  borderColor: 'transparent',
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

export const StyledToolbar = styled(Toolbar)(({ theme }) => ({
  alignItems: 'flex-start',
  paddingTop: theme.spacing(1),
  paddingBottom: theme.spacing(2),
  minHeight: 114,
  [theme.breakpoints.up('sm')]: {
    minHeight: 128,
  },
}))

export const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme }) => ({
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
  })
)
