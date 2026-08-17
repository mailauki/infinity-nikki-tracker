import { ThemeProvider } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import theme from '../theme'

function renderWithTheme(ui: React.ReactNode) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>)
}

// The M3 scale, restated here rather than imported, so a typo in the theme's
// numbers fails the test instead of matching itself.
const EXPECTED_FONT_SIZE = {
  display: { large: '3.5625rem', medium: '2.8125rem', small: '2.25rem' },
  headline: { large: '2rem', medium: '1.75rem', small: '1.5rem' },
  title: { large: '1.375rem', medium: '1rem', small: '0.875rem' },
  body: { large: '1rem', medium: '0.875rem', small: '0.75rem' },
  label: { large: '0.875rem', medium: '0.75rem', small: '0.6875rem' },
} as const

const VARIANTS = ['display', 'headline', 'title', 'body', 'label'] as const
const SIZES = ['large', 'medium', 'small'] as const

describe('M3 typography scale', () => {
  it.each(VARIANTS)('renders %s at every size', (variant) => {
    for (const size of SIZES) {
      const { unmount } = renderWithTheme(
        <Typography size={size} variant={variant}>
          text
        </Typography>
      )
      expect(getComputedStyle(screen.getByText('text')).fontSize).toBe(
        EXPECTED_FONT_SIZE[variant][size]
      )
      unmount()
    }
  })

  it.each(VARIANTS)('defaults %s to the medium step when size is omitted', (variant) => {
    renderWithTheme(<Typography variant={variant}>text</Typography>)
    expect(getComputedStyle(screen.getByText('text')).fontSize).toBe(
      EXPECTED_FONT_SIZE[variant].medium
    )
  })
})

describe('semantic elements', () => {
  it.each(VARIANTS)('renders %s as a span, not a heading or paragraph', (variant) => {
    renderWithTheme(<Typography variant={variant}>text</Typography>)
    expect(screen.getByText('text').tagName).toBe('SPAN')
  })

  it('emits no headings of its own, so a TOC sees only explicit ones', () => {
    renderWithTheme(
      <>
        <Typography variant="display">not a heading</Typography>
        <Typography variant="headline">also not a heading</Typography>
      </>
    )
    expect(screen.queryAllByRole('heading')).toHaveLength(0)
  })

  it('still honors an explicit component override', () => {
    renderWithTheme(
      <Typography component="h2" variant="headline">
        real heading
      </Typography>
    )
    expect(screen.getByRole('heading', { level: 2 }).tagName).toBe('H2')
  })

  it('keeps the variant styling when component is overridden', () => {
    renderWithTheme(
      <Typography component="h2" size="large" variant="display">
        styled heading
      </Typography>
    )
    expect(getComputedStyle(screen.getByText('styled heading')).fontSize).toBe(
      EXPECTED_FONT_SIZE.display.large
    )
  })
})

describe('size prop', () => {
  // `size` is a custom prop. If MUI forwards it to the host element, React
  // renders <span size="small">, which is invalid HTML and logs a warning.
  it('is not forwarded to the DOM', () => {
    renderWithTheme(
      <Typography size="small" variant="body">
        text
      </Typography>
    )
    expect(screen.getByText('text').hasAttribute('size')).toBe(false)
  })
})
