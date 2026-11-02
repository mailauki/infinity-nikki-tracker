import { Typography, Container } from '@mui/material'
import { Metadata } from 'next'
import { Suspense } from 'react'
import PageShell from '@/components/page-shell'
import { MarkdownSection } from '@/components/markdown-body'
import { getPageSections } from '@/hooks/data/page-sections'
import { pageTitle } from '@/lib/sitemap/routes'

export const metadata: Metadata = {
  title: pageTitle('/about'),
}

// The copy lives in page_sections (edit at /admin/content); only the legal
// disclaimer stays in code.
export default function AboutPage() {
  return (
    <PageShell component="article" maxWidth="md" title={pageTitle('/about')}>
      <Suspense>
        <AboutSections />
      </Suspense>

      <Container disableGutters maxWidth="sm">
        <Typography color="textSecondary" component="p" size="small" variant="body">
          This is a fan-made project and is not affiliated with, endorsed by, or officially
          connected to Papergames or the Infinity Nikki development team. All game content, names,
          and assets are the property of their respective owners.
        </Typography>
      </Container>
    </PageShell>
  )
}

async function AboutSections() {
  const sections = await getPageSections('about')
  return sections.map((section) => <MarkdownSection key={section.id} section={section} />)
}
