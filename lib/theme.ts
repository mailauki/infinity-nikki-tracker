'use client'
import { lime, pink } from '@mui/material/colors'
import { createTheme, responsiveFontSizes } from '@mui/material/styles'

declare module '@mui/material/Avatar' {
  interface AvatarOwnProps {
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  }
}

let theme = createTheme({
  cssVariables: {
    colorSchemeSelector: 'class',
  },
  typography: {
    fontFamily: 'var(--font-roboto)',
  },
  colorSchemes: {
    light: {
      palette: {
        primary: {
          main: lime['900'],
        },
        secondary: {
          main: pink['400'],
        },
      },
    },
    dark: {
      palette: {
        primary: {
          main: lime['500'],
        },
        secondary: {
          main: pink['100'],
        },
      },
    },
  },
  components: {
    MuiPaper: {
      defaultProps: {
        elevation: 3,
      },
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          borderRadius: 0,
        },
      },
    },
    MuiAvatar: {
      defaultProps: {
        size: 'sm',
      },
      styleOverrides: {
        root: {
          variants: [
            {
              props: { size: 'xs' },
              style: { width: 24, height: 24 },
            },
            {
              props: { size: 'sm' },
              style: { width: 40, height: 40 },
            },
            {
              props: { size: 'md' },
              style: { width: 56, height: 56 },
            },
            {
              props: { size: 'lg' },
              style: { width: 94, height: 94 },
            },
            {
              props: { size: 'xl' },
              style: { width: 140, height: 140 },
            },
          ],
        },
      },
    },
  },
})

theme = responsiveFontSizes(theme)

export default theme
