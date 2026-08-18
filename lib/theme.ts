'use client'
import { createTheme, type CSSObject, type Theme, type ThemeOptions } from '@mui/material/styles'
import { AvatarSize } from './types/props'
import { toggleButtonGroupClasses } from '@mui/material'

const toggleButtonEdgeStyle = {
  borderColor: 'transparent',
  borderRadius: '6px',
  '&.Mui-disabled': { borderColor: 'transparent' },
} as const

// Resolves a palette lookup to its CSS variable when the theme is in
// CSS-variables mode, and to the literal color otherwise. Reading
// `theme.palette.*` directly inside a styleOverride freezes the value to the
// default color scheme — under `cssVariables` one class swaps both schemes, so
// anything derived from a palette color has to go through here to survive dark
// mode.
const paletteToken = (theme: Theme, pick: (palette: Theme['palette']) => string): string =>
  pick(((theme.vars ?? theme) as Theme).palette)

// A translucent version of a palette token. `alpha()` cannot parse `var(...)`,
// and `color-mix` against `transparent` in sRGB resolves to exactly the rgba()
// `alpha()` would have produced, so the CSS variable keeps flowing through.
const withOpacity = (token: string, opacity: number) =>
  `color-mix(in srgb, ${token} ${opacity * 100}%, transparent)`

/**
 * Semi-transparent `surface.main` for the blurred sticky bars. Exported rather
 * than written at the call sites because it has to be a color-mix over the CSS
 * variable — an `sx` callback reaching for `theme.palette.surface.main` would
 * pin the bars to the light scheme.
 */
export const TRANSLUCENT_SURFACE = withOpacity('var(--mui-palette-surface-main)', 0.7)

// The M3 surface ladder, split into a role (`surface`) and a step (`level`) the
// same way the type scale splits `variant` from `size`. Call sites read
// `<Card surface="container" level="high">` rather than naming a flattened
// `containerHigh` token.
export type SurfaceRole = 'base' | 'dim' | 'bright' | 'container'

export type SurfaceLevel = 'lowest' | 'low' | 'medium' | 'high' | 'highest'

// The container role's five steps. `medium` is the ladder's midpoint and the
// step a call site gets when it names the role alone, mirroring how `medium` is
// the type scale's default size.
const M3_CONTAINER_TONE: Record<SurfaceLevel, keyof Theme['palette']['surface']> = {
  lowest: 'containerLowest',
  low: 'containerLow',
  medium: 'container',
  high: 'containerHigh',
  highest: 'containerHighest',
}

const M3_DEFAULT_SURFACE_LEVEL: SurfaceLevel = 'medium'

// One tone per role, used whenever no `level` applies. M3 gives steps to the
// container role only — `dim`, the base surface and `bright` are single fixed
// tones — so `level` is inert on the other three.
const M3_SURFACE_TONE: Record<SurfaceRole, keyof Theme['palette']['surface']> = {
  base: 'main',
  dim: 'dim',
  bright: 'bright',
  container: M3_CONTAINER_TONE[M3_DEFAULT_SURFACE_LEVEL],
}

// The role a bare `variant="filled"` falls back to when no `surface` is named.
const M3_DEFAULT_SURFACE_ROLE: SurfaceRole = 'base'

// M3 filled surfaces are resting-only: a flat tonal fill, no shadow and no
// border. `elevation` plays no part in picking the tone — it stays MUI's plain
// shadow number for `variant="elevation"` papers.
const restingFilled = { border: 0, boxShadow: 'none' } as const

const filledSurface = (tone: keyof Theme['palette']['surface']) => ({
  props: { variant: 'filled' as const },
  style: ({ theme }: { theme: Theme }) => ({
    ...restingFilled,
    backgroundColor: paletteToken(theme, (p) => p.surface[tone]),
  }),
})

// MUI applies every variant whose `props` match, in source order, so the
// broadest rule is listed first and the most specific one wins:
// bare `filled` -> role -> role + level.
const filledPaperVariants = [
  filledSurface(M3_SURFACE_TONE[M3_DEFAULT_SURFACE_ROLE]),
  ...(Object.keys(M3_SURFACE_TONE) as SurfaceRole[]).map((surface) => ({
    ...filledSurface(M3_SURFACE_TONE[surface]),
    props: { variant: 'filled' as const, surface },
  })),
  ...(Object.keys(M3_CONTAINER_TONE) as SurfaceLevel[]).map((level) => ({
    ...filledSurface(M3_CONTAINER_TONE[level]),
    props: { variant: 'filled' as const, surface: 'container' as const, level },
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
    // The M3 surface role, and the step within it. Both only mean anything on
    // `variant="filled"`; an elevation paper still reads plain `elevation`.
    surface?: SurfaceRole
    level?: SurfaceLevel
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
  // The M3 tonal roles every accent color carries. `contrastText` is MUI's name
  // for the same token M3 calls `on-<role>`, so both are populated from one
  // preset value in buildColorSchemes.
  interface PaletteColor {
    on: string
    container: string
    onContainer: string
  }

  interface SimplePaletteColorOptions {
    on?: string
    container?: string
    onContainer?: string
  }

  // The M3 surface roles. Deliberately not a PaletteColor — a surface has no
  // light/dark/contrastText pair, it has the container ladder plus its content
  // tones.
  interface SurfacePalette {
    main: string
    dim: string
    bright: string
    containerLowest: string
    containerLow: string
    container: string
    containerHigh: string
    containerHighest: string
    on: string
    onVariant: string
    variant: string
    inverse: string
    inverseOn: string
  }

  interface Palette {
    surface: SurfacePalette
    tertiary: PaletteColor
    outline: string
    outlineVariant: string
    inversePrimary: string
  }

  interface PaletteOptions {
    surface?: SurfacePalette
    tertiary?: PaletteOptions['primary']
    outline?: string
    outlineVariant?: string
    inversePrimary?: string
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
        // M3's elevated card tone. Named through the role/step pair rather than
        // an elevation number so the card's fill and MUI's shadow ladder stay
        // separate concerns.
        variant: 'filled',
        surface: 'container',
        level: 'low',
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
              style: ({ theme }) => {
                const main = paletteToken(theme, (p) => p.primary.main)
                return {
                  backgroundColor: withOpacity(main, 0.08),
                  borderRadius: '6px',
                  '&:hover': {
                    borderRadius: '12px',
                    backgroundColor: withOpacity(main, 0.16),
                  },
                  '&.Mui-selected': {
                    borderRadius: '40px',
                    backgroundColor: main,
                    color: paletteToken(theme, (p) => p.primary.contrastText),
                  },
                  '&.Mui-selected:hover': {
                    borderRadius: '12px',
                    backgroundColor: withOpacity(main, 0.84),
                    color: paletteToken(theme, (p) => p.primary.contrastText),
                  },
                  '&.Mui-disabled': {
                    backgroundColor: withOpacity(main, 0.12),
                  },
                }
              },
            },
            {
              props: { variant: 'filled', color: 'secondary' },
              style: ({ theme }) => {
                const main = paletteToken(theme, (p) => p.secondary.main)
                return {
                  backgroundColor: withOpacity(main, 0.12),
                  borderRadius: '6px',
                  borderColor: 'transparent',
                  '&:hover': {
                    borderRadius: '12px',
                    backgroundColor: withOpacity(main, 0.24),
                  },
                  '&.Mui-selected': {
                    borderRadius: '40px',
                    backgroundColor: main,
                    color: paletteToken(theme, (p) => p.secondary.contrastText),
                  },
                  '&.Mui-selected:hover': {
                    borderRadius: '12px',
                    backgroundColor: withOpacity(main, 0.84),
                    color: paletteToken(theme, (p) => p.secondary.contrastText),
                  },
                  '&.Mui-disabled': {
                    backgroundColor: withOpacity(main, 0.12),
                  },
                }
              },
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
    MuiListItemText: {
      defaultProps: {
        slotProps: {
          primary: { variant: 'title' },
          secondary: { variant: 'body' },
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
          paper: { variant: 'filled', surface: 'base' },
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
                backgroundColor: withOpacity(
                  paletteToken(theme, (p) => p.secondary.main),
                  0.12
                ),
              }),
            },
            {
              props: { variant: 'outlined', color: 'default' },
              style: ({ theme }) => ({
                backgroundColor: withOpacity(
                  paletteToken(theme, (p) => p.secondary.main),
                  0.04
                ),
                borderColor: withOpacity(
                  paletteToken(theme, (p) => p.secondary.main),
                  0.44
                ),
              }),
            },
            {
              props: { variant: 'outlined', color: 'success' },
              style: ({ theme }) => ({
                backgroundColor: withOpacity(
                  paletteToken(theme, (p) => p.success.main),
                  0.04
                ),
                borderColor: withOpacity(
                  paletteToken(theme, (p) => p.success.main),
                  0.44
                ),
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
                backgroundColor: withOpacity(
                  paletteToken(theme, (p) => p.tertiary.main),
                  0.24
                ),
              }),
            },
          ],
        },
      },
    },
  },
}

export default createTheme(baseThemeOptions)
