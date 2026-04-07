'use client'
import { alpha, createTheme } from '@mui/material/styles'
import { AvatarSize } from './types/props'
import { blueGrey } from '@mui/material/colors'

declare module '@mui/material/Avatar' {
  interface AvatarOwnProps {
    size?: AvatarSize
    color?: 'transparent'
  }
}
declare module '@mui/material/ToggleButton' {
  interface ToggleButtonOwnProps {
    variant?: 'filled'
  }
}
declare module '@mui/material/ToggleButtonGroup' {
  interface ToggleButtonGroupProps {
    variant?: 'filled'
  }
}

declare module '@mui/material/Paper' {
  interface PaperOwnProps {
    color?: 'surface'
  }
}

declare module '@mui/material/styles' {
  interface PaletteColor {
    // M3 tonal roles for primary/secondary/tertiary
    on: string
    container: string
    onContainer: string
    // M3 surface roles (surface palette only)
    dim: string
    dimHover: string
    main: string
    mainHover: string
    bright: string
    brightHover: string
    containerLowest: string
    containerLowestHover: string
    containerLow: string
    containerLowHover: string
    containerHover: string
    containerHigh: string
    containerHighHover: string
    containerHighest: string
    containerHighestHover: string
  }

  interface SurfacePaletteColorOptions {
    dim?: string
    dimHover?: string
    main?: string
    mainHover?: string
    bright?: string
    brightHover?: string
    containerLowest?: string
    containerLowestHover?: string
    containerLow?: string
    containerLowHover?: string
    container?: string
    containerHover?: string
    containerHigh?: string
    containerHighHover?: string
    containerHighest?: string
    containerHighestHover?: string
  }

  interface Palette {
    surface: Palette['primary']
  }

  interface PaletteOptions {
    surface?: SurfacePaletteColorOptions
  }
}

const theme = createTheme({
  cssVariables: {
    colorSchemeSelector: 'class',
  },
  typography: {
    fontFamily: 'var(--font-roboto)',
    // Display Large
    h1: {
      fontSize: '3.5625rem',
      lineHeight: 1.123,
      fontWeight: 400,
      letterSpacing: '-0.015625rem',
    },
    // Display Medium
    h2: {
      fontSize: '2.8125rem',
      lineHeight: 1.156,
      fontWeight: 400,
      letterSpacing: '0',
    },
    // Display Small
    h3: {
      fontSize: '2.25rem',
      lineHeight: 1.222,
      fontWeight: 400,
      letterSpacing: '0',
    },
    // Headline Large
    h4: {
      fontSize: '2rem',
      lineHeight: 1.25,
      fontWeight: 400,
      letterSpacing: '0',
    },
    // Headline Medium
    h5: {
      fontSize: '1.75rem',
      lineHeight: 1.286,
      fontWeight: 400,
      letterSpacing: '0',
    },
    // Headline Small
    h6: {
      fontSize: '1.5rem',
      lineHeight: 1.333,
      fontWeight: 400,
      letterSpacing: '0',
    },
    // Title Large
    subtitle1: {
      fontSize: '1.375rem',
      lineHeight: 1.273,
      fontWeight: 400,
      letterSpacing: '0',
    },
    // Title Medium
    subtitle2: {
      fontSize: '1rem',
      lineHeight: 1.5,
      fontWeight: 500,
      letterSpacing: '0.009375rem',
    },
    // Body Large
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
      fontWeight: 400,
      letterSpacing: '0.03125rem',
    },
    // Body Medium
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.429,
      fontWeight: 400,
      letterSpacing: '0.015625rem',
    },
    // Body Small
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.333,
      fontWeight: 400,
      letterSpacing: '0.025rem',
    },
    // Label Large
    button: {
      fontSize: '0.875rem',
      lineHeight: 1.429,
      fontWeight: 500,
      letterSpacing: '0.00625rem',
    },
    // Label Small
    overline: {
      fontSize: '0.6875rem',
      lineHeight: 1.455,
      fontWeight: 500,
      letterSpacing: '0.03125rem',
      textTransform: 'uppercase' as const,
    },
  },
  colorSchemes: {
    light: {
      palette: {
        primary: {
          main: '#8F4C33',
        },
        secondary: {
          main: '#77574C',
        },
        success: {
          main: '#695E2F',
        },
        error: {
          main: '#BA1A1A',
        },
        info: {
          main: blueGrey[600],
        },
        background: {
          default: '#FFF8F6',
          paper: '#FFF8F6',
        },
        text: {
          primary: '#180F0C',
          secondary: '#41332E',
        },
        divider: '#D8C2BB',
        surface: {
          // Surface Dim — darkened base (below Surface)
          dim: '#E8D6D1',
          dimHover: alpha('#E8D6D1', 0.7),
          // Surface — base page/app background
          main: '#FFF8F6',
          mainHover: alpha('#FFF8F6', 0.7),
          // Surface Bright — elevated base (above Surface)
          bright: '#FFF8F6',
          brightHover: alpha('#FFF8F6', 0.7),
          // Surface Container Lowest → Highest
          containerLowest: '#FFFFFF',
          containerLowestHover: alpha('#FFFFFF', 0.7),
          containerLow: '#FFF1EC',
          containerLowHover: alpha('#FFF1EC', 0.7),
          container: '#FCEAE4',
          containerHover: alpha('#FCEAE4', 0.7),
          containerHigh: '#F7E4DF',
          containerHighHover: alpha('#F7E4DF', 0.7),
          containerHighest: '#F1DFD9',
          containerHighestHover: alpha('#F1DFD9', 0.7),
        },
      },
    },
    dark: {
      palette: {
        primary: {
          main: '#FFB59A',
        },
        secondary: {
          main: '#E7BEAF',
        },
        success: {
          main: '#D5C68E',
        },
        error: {
          main: '#FFB4AB',
        },
        info: {
          main: blueGrey[400],
        },
        background: {
          default: '#1a110e',
          paper: '#1a110e',
        },
        text: {
          primary: '#f1dfd9',
          secondary: '#d8c2bb',
        },
        divider: '#53433e',
        surface: {
          // Surface Dim — darkened base (below Surface)
          dim: '#1A110E',
          dimHover: alpha('#1A110E', 0.7),
          // Surface — base page/app background
          main: '#1A110E',
          mainHover: alpha('#1A110E', 0.7),
          // Surface Bright — elevated base (above Surface)
          bright: '#423733',
          brightHover: alpha('#423733', 0.7),
          // Surface Container Lowest → Highest
          containerLowest: '#140C09',
          containerLowestHover: alpha('#140C09', 0.7),
          containerLow: '#231A16',
          containerLowHover: alpha('#231A16', 0.7),
          container: '#271E1A',
          containerHover: alpha('#271E1A', 0.7),
          containerHigh: '#322824',
          containerHighHover: alpha('#322824', 0.7),
          containerHighest: '#3D322F',
          containerHighestHover: alpha('#3D322F', 0.7),
        },
      },
    },
  },
  components: {
    MuiCard: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
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
              style: { width: 24, height: 24, fontSize: '0.75rem' },
            },
            {
              props: { size: 'sm' },
              style: { width: 40, height: 40 },
            },
            {
              props: { size: 'md' },
              style: { width: 56, height: 56, fontSize: '1.5rem' },
            },
            {
              props: { size: 'lg' },
              style: { width: 94, height: 94, fontSize: '2rem' },
            },
            {
              props: { size: 'xl' },
              style: { width: 140, height: 140, fontSize: '3rem' },
            },
            {
              props: { color: 'transparent' },
              style: { backgroundColor: 'transparent', color: 'inherit' },
            },
          ],
        },
      },
    },
    MuiToggleButtonGroup: {
      defaultProps: {
        variant: 'filled',
        color: 'secondary',
      },
      styleOverrides: {
        root: {
          gap: '0.25rem',
        },
        firstButton: {
          borderColor: 'transparent',
          borderRadius: '6px',
          borderTopLeftRadius: '40px',
          borderBottomLeftRadius: '40px',
          '&.Mui-disabled': {
            borderColor: 'transparent',
          },
        },
        middleButton: {
          borderColor: 'transparent',
          borderRadius: '6px',
          '&.Mui-disabled': {
            borderColor: 'transparent',
          },
        },
        lastButton: {
          borderColor: 'transparent',
          borderRadius: '6px',
          borderTopRightRadius: '40px',
          borderBottomRightRadius: '40px',
          '&.Mui-disabled': {
            borderColor: 'transparent',
          },
        },
      },
    },
    MuiToggleButton: {
      defaultProps: {
        variant: 'filled',
        color: 'secondary',
      },
      styleOverrides: {
        root: {
          variants: [
            {
              props: { variant: 'filled', color: 'primary' },
              style: ({ theme }) => ({
                backgroundColor: alpha(theme.palette.primary.main, 0.08),
                borderRadius: '6px',
                '&:hover': {
                  borderRadius: '12px',
                  backgroundColor: alpha(theme.palette.primary.main, 0.16),
                },
                '&.Mui-selected': {
                  borderRadius: '40px',
                  backgroundColor: theme.palette.primary.main,
                  color: theme.palette.primary.contrastText,
                },
                '&.Mui-selected:hover': {
                  borderRadius: '12px',
                  backgroundColor: alpha(theme.palette.primary.main, 0.84),
                  color: theme.palette.primary.contrastText,
                },
                '&.Mui-disabled': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.12),
                },
              }),
            },
            {
              props: { variant: 'filled', color: 'secondary' },
              style: ({ theme }) => ({
                backgroundColor: alpha(theme.palette.secondary.main, 0.12),
                borderRadius: '6px',
                borderColor: 'transparent',
                '&:hover': {
                  borderRadius: '12px',
                  backgroundColor: alpha(theme.palette.secondary.main, 0.24),
                },
                '&.Mui-selected': {
                  borderRadius: '40px',
                  backgroundColor: theme.palette.secondary.main,
                  color: theme.palette.secondary.contrastText,
                },
                '&.Mui-selected:hover': {
                  borderRadius: '12px',
                  backgroundColor: alpha(theme.palette.secondary.main, 0.84),
                  color: theme.palette.primary.contrastText,
                },
                '&.Mui-disabled': {
                  backgroundColor: alpha(theme.palette.secondary.main, 0.12),
                },
              }),
            },
          ],
        },
      },
    },
  },
})

export default theme
