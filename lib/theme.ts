'use client'
import {
  alpha,
  createTheme,
  type CSSObject,
  type Theme,
  type ThemeOptions,
} from '@mui/material/styles'
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

// Opts the M3 tertiary role into LinearProgress's `color` prop, matching the
// `props: { color: 'tertiary' }` style variant registered below.
declare module '@mui/material/LinearProgress' {
  interface LinearProgressPropsColorOverrides {
    tertiary: true
  }
}

// The M3 type scale, split into a role (`variant`) and a step (`size`) so call
// sites read `<Typography variant="display" size="medium">` instead of
// `variant="displayMedium"`.
type M3TypographyVariant = 'display' | 'headline' | 'title' | 'body' | 'label'

export type M3TypographySize = 'large' | 'medium' | 'small'

// M3's default step for each role, applied when `size` is omitted. `medium` is
// the scale's midpoint and what M3 uses when a role is named without a step.
const M3_DEFAULT_SIZE: M3TypographySize = 'medium'

// The raw scale. Kept as a plain lookup (rather than 15 theme.typography keys)
// because `variant` and `size` are resolved together by the style variants
// registered on MuiTypography below.
const M3_TYPE_SCALE: Record<M3TypographyVariant, Record<M3TypographySize, CSSObject>> = {
  display: {
    large: {
      fontSize: '3.5625rem',
      lineHeight: 1.123,
      fontWeight: 400,
      letterSpacing: '-0.015625rem',
    },
    medium: { fontSize: '2.8125rem', lineHeight: 1.156, fontWeight: 400, letterSpacing: '0' },
    small: { fontSize: '2.25rem', lineHeight: 1.222, fontWeight: 400, letterSpacing: '0' },
  },
  headline: {
    large: { fontSize: '2rem', lineHeight: 1.25, fontWeight: 400, letterSpacing: '0' },
    medium: { fontSize: '1.75rem', lineHeight: 1.286, fontWeight: 400, letterSpacing: '0' },
    small: { fontSize: '1.5rem', lineHeight: 1.333, fontWeight: 400, letterSpacing: '0' },
  },
  title: {
    large: { fontSize: '1.375rem', lineHeight: 1.273, fontWeight: 400, letterSpacing: '0' },
    medium: {
      fontSize: '1rem',
      lineHeight: 1.5,
      fontWeight: 500,
      letterSpacing: '0.009375rem',
    },
    small: {
      fontSize: '0.875rem',
      lineHeight: 1.429,
      fontWeight: 500,
      letterSpacing: '0.00625rem',
    },
  },
  body: {
    large: { fontSize: '1rem', lineHeight: 1.5, fontWeight: 400, letterSpacing: '0.03125rem' },
    medium: {
      fontSize: '0.875rem',
      lineHeight: 1.429,
      fontWeight: 400,
      letterSpacing: '0.015625rem',
    },
    small: {
      fontSize: '0.75rem',
      lineHeight: 1.333,
      fontWeight: 400,
      letterSpacing: '0.025rem',
    },
  },
  label: {
    large: {
      fontSize: '0.875rem',
      lineHeight: 1.429,
      fontWeight: 500,
      letterSpacing: '0.00625rem',
    },
    medium: {
      fontSize: '0.75rem',
      lineHeight: 1.333,
      fontWeight: 500,
      letterSpacing: '0.03125rem',
    },
    small: {
      fontSize: '0.6875rem',
      lineHeight: 1.455,
      fontWeight: 500,
      letterSpacing: '0.03125rem',
    },
  },
}

// One style variant per (variant, size) pair, plus a no-`size` variant per role
// so `<Typography variant="title">` picks up the default step. MUI matches
// every entry whose `props` are satisfied, so the explicit-size rules are
// listed second and win over the default when both apply.
const m3TypographyVariants = [
  ...(Object.keys(M3_TYPE_SCALE) as M3TypographyVariant[]).map((variant) => ({
    props: { variant },
    style: M3_TYPE_SCALE[variant][M3_DEFAULT_SIZE],
  })),
  ...(Object.keys(M3_TYPE_SCALE) as M3TypographyVariant[]).flatMap((variant) =>
    (Object.keys(M3_TYPE_SCALE[variant]) as M3TypographySize[]).map((size) => ({
      props: { variant, size },
      style: M3_TYPE_SCALE[variant][size],
    }))
  ),
]

// MUI's built-in variants, switched off so a leftover `variant="h6"` is a
// type error rather than an unstyled element.
type RetiredTypographyVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'subtitle1'
  | 'subtitle2'
  | 'body1'
  | 'body2'
  | 'caption'
  | 'overline'
  | 'button'

// Adds the M3 roles to `variant` and removes MUI's built-ins. MUI reads these
// override maps as `Record<variant, true | false>`; `false` deletes the key
// from the accepted union.
declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides
    extends Record<M3TypographyVariant, true>, Record<RetiredTypographyVariant, false> {}

  interface TypographyOwnProps {
    // The step within the role. Defaults to M3_DEFAULT_SIZE when omitted.
    size?: M3TypographySize
  }
}

// MUI Link forwards `variant` to Typography, so it needs the same treatment or
// `<Link variant="title">` fails to type-check.
declare module '@mui/material/Link' {
  interface LinkPropsVariantOverrides
    extends Record<M3TypographyVariant, true>, Record<RetiredTypographyVariant, false> {}
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
    // Roboto ships from @fontsource (app/layout.tsx imports the weight CSS), so
    // the family is named directly rather than through a next/font CSS variable.
    fontFamily: 'Roboto, sans-serif',

    // The M3 scale itself lives in M3_TYPE_SCALE above and is applied through
    // style variants on MuiTypography, because it's keyed on two props
    // (`variant` + `size`) and theme.typography can only key on one.
    //
    // MUI's built-in scale is retired: `createTheme` merges these over its
    // defaults, so `undefined` removes the style entirely and a stale
    // `variant="h6"` is a type error rather than an unstyled element.
    h1: undefined,
    h2: undefined,
    h3: undefined,
    h4: undefined,
    h5: undefined,
    h6: undefined,
    subtitle1: undefined,
    subtitle2: undefined,
    body1: undefined,
    body2: undefined,
    caption: undefined,
    overline: undefined,
    // `button` stays: MuiButton/MuiTab/MuiChip read theme.typography.button
    // internally, so removing it would strip their label styling. It mirrors
    // label/large and is not offered as a Typography variant.
    button: {
      fontSize: '0.875rem',
      lineHeight: 1.429,
      fontWeight: 500,
      letterSpacing: '0.00625rem',
      textTransform: 'none' as const,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiTypography: {
      defaultProps: {
        // M3's midpoint step, and the step each role falls back to when a call
        // site names only the role.
        size: M3_DEFAULT_SIZE,
        // Every variant renders a <span>. Semantics are opted into explicitly
        // per call site via `component="h2"` (which overrides this mapping),
        // so the type scale never decides document outline on its own and
        // can't inject headings that fight a table of contents.
        variantMapping: {
          display: 'span',
          headline: 'span',
          title: 'span',
          body: 'span',
          label: 'span',
          // MUI maps `inherit` to <p> by default; the retired h1-h6 / body /
          // caption / overline keys are gone from the prop union entirely, so
          // they can't be mapped (or used) here.
          inherit: 'span',
        },
      },
      styleOverrides: {
        root: {
          // Resolves `variant` + `size` into the M3 scale. `size` is a custom
          // prop; MUI drops unknown props on host elements, so it never
          // reaches the DOM (guarded by lib/__tests__/theme-typography.test.tsx).
          variants: m3TypographyVariants,
        },
      },
    },
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
          borderRadius: 12,
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
        variant: 'filled',
        elevation: 1,
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
          // MUI's default unselected color is rgba(0,0,0,0.54), which lands at
          // 4.35:1 on our filled toggle background — just under AA. The preset's
          // text.secondary is an opaque token that clears 4.5:1 in every scheme.
          color: 'var(--mui-palette-text-secondary)',
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
                  color: theme.palette.secondary.contrastText,
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
        disableGutters: true,
        sx: {
          border: 0,
          '&:not(:last-child)': {
            borderBottom: 0,
          },
          '&::before': {
            display: 'none',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          variants: filledPaperVariants,
        },
      },
    },
    MuiDrawer: {
      defaultProps: {
        slotProps: {
          paper: { variant: 'filled', surface: 'main' },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          variants: [
            {
              props: { variant: 'filled', color: 'default' },
              style: ({ theme }) => ({
                backgroundColor: alpha(theme.palette.secondary.main, 0.12),
              }),
            },
            {
              props: { variant: 'outlined', color: 'default' },
              style: ({ theme }) => ({
                backgroundColor: alpha(theme.palette.secondary.main, 0.04),
                borderColor: alpha(theme.palette.secondary.main, 0.44),
              }),
            },
            {
              props: { variant: 'outlined', color: 'success' },
              style: ({ theme }) => ({
                backgroundColor: alpha(theme.palette.success.main, 0.04),
                borderColor: alpha(theme.palette.success.main, 0.44),
              }),
            },
          ],
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          variants: [
            {
              props: { color: 'tertiary' },
              style: ({ theme }) => ({
                backgroundColor: alpha(theme.palette.tertiary.main, 0.24),
              }),
            },
          ],
        },
      },
    },
  },
}

export default createTheme(baseThemeOptions)
