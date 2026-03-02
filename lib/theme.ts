'use client'
import { lime, pink } from '@mui/material/colors'
import { createTheme, responsiveFontSizes } from '@mui/material/styles'

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
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
})

theme = responsiveFontSizes(theme)

export default theme
