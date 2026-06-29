'use client'
import { alpha, createTheme, type Theme, type ThemeOptions } from '@mui/material/styles'
import { AvatarSize } from './types/props'
import { toggleButtonGroupClasses } from '@mui/material'

const toggleButtonEdgeStyle = {
  borderColor: 'transparent',
  borderRadius: '6px',
  '&.Mui-disabled': { borderColor: 'transparent' },
} as const

// M3 Filled Paper: resting-only filled surfaces selected by either the numeric
// `elevation` (M3 0-5 ladder) or the named `surface` prop. Both resolve to the
// active color scheme via theme.vars (CSS variables) so they switch with dark mode.
type FilledSurfaceTone =
  | 'main'
  | 'dim'
  | 'bright'
  | 'containerLowest'
  | 'containerLow'
  | 'container'
  | 'containerHigh'
  | 'containerHighest'

const restingFilled = { border: 0, boxShadow: 'none' } as const

const filledElevationTone: Record<number, FilledSurfaceTone> = {
  0: 'containerLowest',
  1: 'containerLow',
  2: 'container',
  3: 'containerHigh',
  4: 'containerHigh',
  5: 'containerHighest',
}

const filledSurfaceTone: Record<'base' | 'main' | 'dim' | 'bright', FilledSurfaceTone> = {
  base: 'main',
  main: 'main',
  dim: 'dim',
  bright: 'bright',
}

const filledPaperVariants = [
  // numeric M3 elevation ladder (0-5)
  ...Object.entries(filledElevationTone).map(([elevation, tone]) => ({
    props: { variant: 'filled' as const, elevation: Number(elevation) },
    style: ({ theme }: { theme: Theme }) => ({
      ...restingFilled,
      backgroundColor: theme.vars?.palette.surface[tone] ?? theme.palette.surface[tone],
    }),
  })),
  // named M3 surface roles (ordered after elevation so `surface` wins when both set)
  ...Object.entries(filledSurfaceTone).map(([surface, tone]) => ({
    props: { variant: 'filled' as const, surface: surface as 'base' | 'main' | 'dim' | 'bright' },
    style: ({ theme }: { theme: Theme }) => ({
      ...restingFilled,
      backgroundColor: theme.vars?.palette.surface[tone] ?? theme.palette.surface[tone],
    }),
  })),
]

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
    surface?: 'base' | 'main' | 'dim' | 'bright'
  }
  interface PaperPropsVariantOverrides {
    filled: true
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
    tertiary: Palette['primary']
    neutral: Palette['primary']
  }

  interface PaletteOptions {
    surface?: SurfacePaletteColorOptions
    tertiary?: PaletteOptions['primary']
    neutral?: PaletteOptions['primary']
  }
}

export const baseThemeOptions: ThemeOptions = {
  cssVariables: {
    colorSchemeSelector: 'class',
  },
  typography: {
    fontFamily: 'var(--font-noto-sans-jp), var(--font-roboto), sans-serif',
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
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '@media (prefers-reduced-motion: reduce)': {
          '*, *::before, *::after': {
            animationDuration: '1ms !important',
            animationIterationCount: '1 !important',
            transitionDuration: '1ms !important',
            scrollBehavior: 'auto !important',
          },
        },
      },
    },
    MuiCardActionArea: {
      styleOverrides: {
        root: {
          '&:not(:disabled):not([aria-disabled="true"])': {
            cursor: 'pointer',
          },
          '&[aria-disabled="true"]': {
            pointerEvents: 'none',
          },
        },
      },
    },
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
        orientation: 'horizontal',
      },
      styleOverrides: {
        root: {
          gap: '0.25rem',
          variants: [
            {
              props: { orientation: 'horizontal' },
              style: {
                [`& .${toggleButtonGroupClasses.firstButton}`]: {
                  ...toggleButtonEdgeStyle,
                  borderTopLeftRadius: '40px',
                  borderBottomLeftRadius: '40px',
                },
                [`& .${toggleButtonGroupClasses.middleButton}`]: toggleButtonEdgeStyle,
                [`& .${toggleButtonGroupClasses.lastButton}`]: {
                  ...toggleButtonEdgeStyle,
                  borderTopRightRadius: '40px',
                  borderBottomRightRadius: '40px',
                },
              },
            },
            {
              props: { orientation: 'vertical' },
              style: {
                [`& .${toggleButtonGroupClasses.firstButton}`]: {
                  ...toggleButtonEdgeStyle,
                  borderTopLeftRadius: '40px',
                  borderTopRightRadius: '40px',
                },
                [`& .${toggleButtonGroupClasses.middleButton}`]: toggleButtonEdgeStyle,
                [`& .${toggleButtonGroupClasses.lastButton}`]: {
                  ...toggleButtonEdgeStyle,
                  borderBottomRightRadius: '40px',
                  borderBottomLeftRadius: '40px',
                },
              },
            },
          ],
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
    MuiListItemButton: {
      defaultProps: {
        style: {
          borderRadius: 8,
        },
      },
    },
    MuiAccordion: {
      defaultProps: {
        elevation: 0,
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          variants: filledPaperVariants,
        },
      },
    },
  },
}

export default createTheme(baseThemeOptions)
