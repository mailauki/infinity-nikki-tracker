'use client'
import { lime, pink } from '@mui/material/colors'
import { createTheme } from '@mui/material/styles'

const theme = createTheme({
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
          main: lime[800],
        },
        secondary: {
          main: pink[200],
        },
      },
    },
    dark: {
      palette: {
        primary: {
          main: lime[500],
        },
        secondary: {
          main: pink[100],
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

export default theme
