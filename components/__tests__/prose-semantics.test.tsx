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

// The app-bar's PageTitle is nav chrome, so PageShell owns the page's h1. If
// this regresses, the h1 moves back outside the content root and reader mode
// silently promotes the first h2 as the title.
describe('page heading', () => {
  it('renders the title as an h1 inside the content root', () => {
    const { container } = renderWithTheme(
      <PageShell component="article" title="About">
        <SectionSubtitle>copy</SectionSubtitle>
      </PageShell>
    )
    const h1 = container.querySelector('article > h1')
    expect(h1?.textContent).toBe('About')
  })

  it('renders no h1 when no title is given', () => {
    const { container } = renderWithTheme(<PageShell>grid</PageShell>)
    expect(container.querySelector('h1')).toBeNull()
  })

  it('keeps a hidden title in the accessibility tree', () => {
    // Clipped, not `visibility: hidden` / `display: none` — those remove the
    // node from the a11y tree, making the heading useless to screen readers.
    renderWithTheme(<PageShell title="About">copy</PageShell>)
    const h1 = screen.getByRole('heading', { level: 1, name: 'About' })
    const style = getComputedStyle(h1)
    expect(style.visibility).not.toBe('hidden')
    expect(style.display).not.toBe('none')
    expect(style.position).toBe('absolute')
  })

  it('renders the title visibly when titleVisible is set', () => {
    renderWithTheme(
      <PageShell titleVisible title="About">
        copy
      </PageShell>
    )
    expect(getComputedStyle(screen.getByRole('heading', { level: 1 })).position).not.toBe(
      'absolute'
    )
  })
})
