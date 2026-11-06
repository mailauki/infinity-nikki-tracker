import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MarkdownBody } from '@/components/markdown-body'

describe('MarkdownBody', () => {
  it('opens off-site links in a new tab and keeps internal ones in place', () => {
    render(<MarkdownBody markdown="See [Wiki](https://example.test) or [Outfits](/outfits)." />)
    expect(screen.getByRole('link', { name: 'Wiki' })).toHaveAttribute('target', '_blank')
    expect(screen.getByRole('link', { name: 'Wiki' })).toHaveAttribute('rel', 'noreferrer')
    expect(screen.getByRole('link', { name: 'Outfits' })).not.toHaveAttribute('target')
  })

  it('renders body paragraphs as real <p> and bullets as list items', () => {
    const { container } = render(<MarkdownBody markdown={'Intro text\n\n- one\n- **two**'} />)
    expect(container.querySelector('p')).toHaveTextContent('Intro text')
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(container.querySelector('strong')).toHaveTextContent('two')
  })

  it('lays out each ### block as its own card in the cards layout', () => {
    render(
      <MarkdownBody layout="cards" markdown={'Intro\n\n### Eureka\n\nA\n\n### Outfits\n\nB'} />
    )
    const headings = screen.getAllByRole('heading', { level: 3 })
    expect(headings.map((h) => h.textContent)).toEqual(['Eureka', 'Outfits'])
    expect(headings[0].closest('.MuiCard-root')).not.toBe(headings[1].closest('.MuiCard-root'))
  })

  it('does not render raw HTML', () => {
    const { container } = render(<MarkdownBody markdown={'<img src=x onerror="alert(1)">'} />)
    expect(container.querySelector('img')).toBeNull()
  })
})
