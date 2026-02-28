'use client'
import { lime, pink } from '@mui/material/colors'
import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  cssVariables: true,
  typography: {
    fontFamily: 'var(--font-roboto)',
  },
  palette: {
    primary: lime,
    secondary: pink,
  },
  colorSchemes: {
    light: true,
    dark: {
      palette: {
        primary: lime,
        secondary: pink,
      },
    },
  },
  shape: {
    borderRadius: 8,
    borderRadiusSm: 4, // new property
    borderRadiusMd: 8, // new property
    borderRadiusLg: 16, // new property
    borderRadiusXl: 24, // new property
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

declare module '@mui/material/styles' {
  interface Shape {
    borderRadiusSm: number
    borderRadiusMd: number
    borderRadiusLg: number
    borderRadiusXl: number
  }

  interface ShapeOptions {
    borderRadiusSm?: number
    borderRadiusMd?: number
    borderRadiusLg?: number
    borderRadiusXl?: number
  }
}

export default theme
