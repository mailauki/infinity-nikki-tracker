import { ThemeProvider } from '@mui/material/styles'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import PageShell from '../page-shell'
import { SectionList, SectionSubtitle } from '../section'
import theme from '@/lib/theme'

function renderWithTheme(ui: React.ReactNode) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>)
}

// Browser reader modes (Firefox Reader View, Safari Reader) run Readability,
// which scores a page by how much text sits directly inside <p> and discards
// subtrees it considers hidden. The theme maps every Typography variant to
// <span>, so prose components must opt back into <p> explicitly — these tests
// pin that, since losing it degrades silently (the reader icon just stops
// appearing, nothing errors).
describe('prose semantics for reader mode', () => {
  it('renders SectionSubtitle body copy as a paragraph', () => {
    renderWithTheme(<SectionSubtitle>intro copy</SectionSubtitle>)
    expect(screen.getByText('intro copy').tagName).toBe('P')
  })

  it('renders SectionList bullets as paragraphs', () => {
    renderWithTheme(<SectionList bullets={['first bullet', 'second bullet']} />)
    expect(screen.getByText('first bullet').tagName).toBe('P')
    expect(screen.getByText('second bullet').tagName).toBe('P')
  })

  it('does not nest a <p> inside another <p>', () => {
    const { container } = renderWithTheme(<SectionList bullets={['bullet']} />)
    expect(container.querySelectorAll('p p')).toHaveLength(0)
  })

  it('gives prose routes an <article> root to extract', () => {
    const { container } = renderWithTheme(
      <PageShell component="article" maxWidth="md">
        <SectionSubtitle>copy</SectionSubtitle>
      </PageShell>
    )
    const article = container.querySelector('article')
    expect(article).not.toBeNull()
    expect(article?.querySelector('p')?.textContent).toBe('copy')
  })

  it('leaves non-prose routes as a plain div', () => {
    const { container } = renderWithTheme(<PageShell>grid</PageShell>)
    expect(container.querySelector('article')).toBeNull()
  })
})
