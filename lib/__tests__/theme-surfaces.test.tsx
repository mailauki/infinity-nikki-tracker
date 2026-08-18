import { ThemeProvider, createTheme } from '@mui/material/styles'
import Alert from '@mui/material/Alert'
import AppBar from '@mui/material/AppBar'
import Card from '@mui/material/Card'
import Paper from '@mui/material/Paper'
import SnackbarContent from '@mui/material/SnackbarContent'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { baseThemeOptions } from '../theme'
import { COLOR_THEME_PRESETS, buildColorSchemes } from '../theme-presets'
import type { ColorTheme } from '../types/eureka'

// Every tone a filled surface can render, and so every background the surface
// content tones have to stay readable against.
const SURFACE_TONES = [
  'main',
  'dim',
  'bright',
  'containerLowest',
  'containerLow',
  'container',
  'containerHigh',
  'containerHighest',
] as const

const relativeLuminance = (hex: string) =>
  [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((channel) => (channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4))
    .reduce((sum, channel, i) => sum + channel * [0.2126, 0.7152, 0.0722][i], 0)

function contrast(a: string, b: string) {
  const [lighter, darker] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x)
  return (lighter + 0.05) / (darker + 0.05)
}

const preset = COLOR_THEME_PRESETS.default

const theme = createTheme({
  ...baseThemeOptions,
  colorSchemes: buildColorSchemes(preset),
})

function renderWithTheme(ui: React.ReactNode) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>)
}

// The CSS variable a filled surface is expected to resolve to. Under
// `cssVariables` the rule is emitted as `background-color: var(--mui-...)`, so
// the assertion checks which token was selected rather than the hex behind it.
const surfaceVar = (token: string) => `var(--mui-palette-surface-${token})`

function backgroundOf(testId: string) {
  return getComputedStyle(screen.getByTestId(testId)).backgroundColor
}

describe('M3 filled surfaces', () => {
  it('leaves a paper alone when it names no role, however it is filled', () => {
    // The scoping rule: `variant="filled"` on its own picks no tone, so a
    // Paper-derived component that means something else by "filled" is safe.
    renderWithTheme(<Paper data-testid="paper" variant="filled" />)
    expect(backgroundOf('paper')).not.toContain('surface-')
  })

  it.each([
    ['base', 'main'],
    ['dim', 'dim'],
    ['bright', 'bright'],
    ['container', 'container'],
  ] as const)('resolves surface=%s to surface.%s', (surface, token) => {
    renderWithTheme(<Paper data-testid="paper" surface={surface} variant="filled" />)
    expect(backgroundOf('paper')).toBe(surfaceVar(token))
  })

  it.each([
    ['lowest', 'containerLowest'],
    ['low', 'containerLow'],
    ['medium', 'container'],
    ['high', 'containerHigh'],
    ['highest', 'containerHighest'],
  ] as const)('resolves the container role at level=%s to surface.%s', (level, token) => {
    renderWithTheme(
      <Paper data-testid="paper" level={level} surface="container" variant="filled" />
    )
    expect(backgroundOf('paper')).toBe(surfaceVar(token))
  })

  it('ignores level on the roles M3 gives no steps to', () => {
    renderWithTheme(<Paper data-testid="paper" level="highest" surface="dim" variant="filled" />)
    expect(backgroundOf('paper')).toBe(surfaceVar('dim'))
  })

  it('leaves elevation to the shadow ladder instead of the fill', () => {
    // A high elevation number must not pull a different tone out of the ladder;
    // the tone comes from the role alone.
    renderWithTheme(
      <Paper data-testid="paper" elevation={5} surface="container" variant="filled" />
    )
    expect(backgroundOf('paper')).toBe(surfaceVar('container'))
  })

  it('gives filled papers no shadow, whatever the elevation says', () => {
    renderWithTheme(<Paper data-testid="paper" elevation={5} surface="base" variant="filled" />)
    expect(getComputedStyle(screen.getByTestId('paper')).boxShadow).toBe('none')
  })

  it('keeps elevation papers on MUI shadows and off the surface ladder', () => {
    renderWithTheme(<Paper data-testid="paper" elevation={3} />)
    const style = getComputedStyle(screen.getByTestId('paper'))
    expect(style.backgroundColor).not.toContain('surface')
    expect(style.boxShadow).not.toBe('none')
  })

  it('defaults cards to the container role at the low step', () => {
    renderWithTheme(<Card data-testid="card" />)
    expect(backgroundOf('card')).toBe(surfaceVar('containerLow'))
  })

  it('picks the step over the role when both are named', () => {
    // The role rule and the role+level rule both match; source order has to put
    // the more specific one last or `level` would never do anything.
    renderWithTheme(
      <Paper data-testid="paper" level="highest" surface="container" variant="filled" />
    )
    expect(backgroundOf('paper')).toBe(surfaceVar('containerHighest'))
  })
})

// MuiPaper's styleOverrides reach every component built on Paper, so the ladder
// has to stay off the ones that already give `variant="filled"` their own
// meaning.
describe('components built on Paper that own their fill', () => {
  it('leaves a filled Alert on its severity color', () => {
    renderWithTheme(
      <Alert data-testid="alert" severity="success" variant="filled">
        done
      </Alert>
    )
    expect(backgroundOf('alert')).toBe('var(--mui-palette-Alert-successFilledBg)')
  })

  it('leaves SnackbarContent on its own fill', () => {
    renderWithTheme(<SnackbarContent data-testid="snackbar" message="saved" />)
    expect(backgroundOf('snackbar')).toBe('var(--mui-palette-SnackbarContent-bg)')
  })

  it('leaves a filled AppBar on its own background', () => {
    // AppBar drives its own --AppBar-background and its styleOverrides land
    // after MuiPaper's, so it wins the cascade either way — the point here is
    // that MuiPaper no longer emits a competing surface fill for it at all.
    renderWithTheme(
      <AppBar color="transparent" data-testid="appbar" variant="filled">
        nav
      </AppBar>
    )
    expect(backgroundOf('appbar')).toBe('var(--AppBar-background)')
  })
})

describe('color theme presets', () => {
  const themes = Object.keys(COLOR_THEME_PRESETS) as ColorTheme[]

  it.each(themes)('%s carries a complete M3 role set in both schemes', (key) => {
    for (const scheme of [COLOR_THEME_PRESETS[key].light, COLOR_THEME_PRESETS[key].dark]) {
      for (const role of ['primary', 'secondary', 'tertiary', 'error', 'success'] as const) {
        for (const tone of ['main', 'on', 'container', 'onContainer'] as const) {
          expect(scheme[role][tone]).toMatch(/^#[0-9A-F]{6}$/)
        }
      }
      for (const tone of [
        ...SURFACE_TONES,
        'on',
        'onVariant',
        'variant',
        'inverse',
        'inverseOn',
      ] as const) {
        expect(scheme.surface[tone]).toMatch(/^#[0-9A-F]{6}$/)
      }
    }
  })

  it.each(themes)('%s derives background, text and divider from its M3 tokens', (key) => {
    const { light, dark } = buildColorSchemes(COLOR_THEME_PRESETS[key])
    for (const [scheme, source] of [
      [light, COLOR_THEME_PRESETS[key].light],
      [dark, COLOR_THEME_PRESETS[key].dark],
    ] as const) {
      expect(scheme.palette.background.default).toBe(source.surface.main)
      expect(scheme.palette.text.primary).toBe(source.surface.on)
      expect(scheme.palette.text.secondary).toBe(source.surface.onVariant)
      expect(scheme.palette.divider).toBe(source.outlineVariant)
    }
  })

  it.each(themes)('%s exposes each accent tone as contrastText for MUI', (key) => {
    const { light, dark } = buildColorSchemes(COLOR_THEME_PRESETS[key])
    for (const scheme of [light, dark]) {
      expect(scheme.palette.primary.contrastText).toBe(scheme.palette.primary.on)
      expect(scheme.palette.tertiary.contrastText).toBe(scheme.palette.tertiary.on)
    }
  })

  it.each(themes)('%s clears WCAG AA on every M3 content pair', (key) => {
    for (const scheme of [COLOR_THEME_PRESETS[key].light, COLOR_THEME_PRESETS[key].dark]) {
      for (const tone of SURFACE_TONES) {
        expect(contrast(scheme.surface.on, scheme.surface[tone])).toBeGreaterThanOrEqual(4.5)
        expect(contrast(scheme.surface.onVariant, scheme.surface[tone])).toBeGreaterThanOrEqual(4.5)
      }
      for (const role of ['primary', 'secondary', 'tertiary', 'error', 'success'] as const) {
        expect(contrast(scheme[role].on, scheme[role].main)).toBeGreaterThanOrEqual(4.5)
        expect(contrast(scheme[role].onContainer, scheme[role].container)).toBeGreaterThanOrEqual(
          4.5
        )
      }
      expect(contrast(scheme.surface.inverseOn, scheme.surface.inverse)).toBeGreaterThanOrEqual(4.5)
      // A non-text boundary, so the 3:1 threshold for UI components applies.
      expect(contrast(scheme.outline, scheme.surface.main)).toBeGreaterThanOrEqual(3)
    }
  })

  it('carries no hover token anywhere in the palette', () => {
    // The `*Hover` surface duplicates were dropped; translucency now comes from
    // color-mix over the live CSS variable, which follows the color scheme.
    const serialized = JSON.stringify(COLOR_THEME_PRESETS)
    expect(serialized).not.toMatch(/Hover/)
  })
})
