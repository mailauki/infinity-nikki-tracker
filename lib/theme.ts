'use client'
import { lime, pink } from '@mui/material/colors'
import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  // cssVariables: true,
  typography: {
    fontFamily: 'var(--font-roboto)',
  },
  palette: {
    primary: lime,
    secondary: pink,
  },
  colorSchemes: {
    light: true,
    dark: true,
  },
})

export default theme
