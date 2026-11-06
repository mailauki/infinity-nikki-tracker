import { Children, isValidElement, type ReactElement, type ReactNode } from 'react'
import Markdown, { type Components } from 'react-markdown'
import { Card, CardContent, Link as Anchor } from '@mui/material'
import { Section, SectionList, SectionSubtitle, SectionTitle } from '@/components/section'
import { SimpleGrid } from '@/components/card-grid'
import type { PageSection } from '@/hooks/data/page-sections'

// Renders page_sections Markdown (About/Help, edited at /admin/content) through
// the same Section components the pages were hand-written with, so moving the
// copy into the DB doesn't change how it looks — or its reader-mode-friendly
// <p> bodies (see components/section.tsx). Raw HTML in the Markdown is not
// rendered (react-markdown's default), so admin-entered copy can't inject markup.

// SectionList takes the bullets as an array, so unwrap the <li> elements.
function bullets(children: ReactNode): ReactNode[] {
  return Children.toArray(children)
    .filter(isValidElement)
    .map((li) => (li as ReactElement<{ children?: ReactNode }>).props.children)
}

const components: Components = {
  h2: ({ children }) => <SectionTitle>{children}</SectionTitle>,
  h3: ({ children }) => (
    <SectionTitle component="h3" size="small">
      {children}
    </SectionTitle>
  ),
  p: ({ children }) => <SectionSubtitle>{children}</SectionSubtitle>,
  ul: ({ children }) => <SectionList bullets={bullets(children)} />,
  ol: ({ children }) => <SectionList ordered bullets={bullets(children)} />,
  a: ({ href = '', children }) => (
    <Anchor
      color="textSecondary"
      href={href}
      // Internal links stay in the tab; everything off-site opens a new one.
      {...(/^https?:/.test(href) && { rel: 'noreferrer', target: '_blank' })}
    >
      {children}
    </Anchor>
  ),
}

/**
 * A section body. `cards` lays out each `### Heading` block as an outlined card
 * in a two-column grid, after whatever intro precedes the first heading.
 */
export function MarkdownBody({
  markdown,
  layout = 'prose',
}: {
  markdown: string
  layout?: string
}) {
  if (layout !== 'cards') return <Markdown components={components}>{markdown}</Markdown>

  const [intro, ...cards] = markdown.split(/^### /m)
  return (
    <>
      <Markdown components={components}>{intro}</Markdown>
      <SimpleGrid columns={{ xs: '1fr', sm: '1fr 1fr' }} sx={{ pt: 1.5 }}>
        {cards.map((card, i) => (
          <Card key={i} sx={{ height: '100%' }} variant="outlined">
            <CardContent>
              <Markdown components={components}>{`### ${card}`}</Markdown>
            </CardContent>
          </Card>
        ))}
      </SimpleGrid>
    </>
  )
}

/** A full page section: title (plus optional adornment), body, then any built-in extras. */
export function MarkdownSection({
  section,
  adornment,
  children,
}: {
  section: Pick<PageSection, 'title' | 'body' | 'layout'>
  adornment?: ReactNode
  children?: ReactNode
}) {
  return (
    <Section>
      <SectionTitle>
        {section.title}
        {adornment && <> {adornment}</>}
      </SectionTitle>
      <MarkdownBody layout={section.layout} markdown={section.body} />
      {children}
    </Section>
  )
}
