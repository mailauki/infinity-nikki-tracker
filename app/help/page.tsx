import HelpActions from './help-actions'
import { getUserRole } from '@/hooks/user'
import { Alert, Button, Container } from '@mui/material'
import { Metadata } from 'next'
import { Fragment, Suspense } from 'react'
import AddToHomeScreenAccordion from './add-to-accordion'
import { AdminPanelSettings } from '@mui/icons-material'
import { MarkdownSection } from '@/components/markdown-body'
import { getPageSections } from '@/hooks/data/page-sections'
import PageShell from '@/components/page-shell'
import { pageTitle } from '@/lib/sitemap/routes'

export const metadata: Metadata = {
  title: pageTitle('/help'),
}

// The copy lives in page_sections (edit at /admin/content). The interactive
// pieces stay in code, anchored to their section's slug.
export default function HelpPage() {
  return (
    <PageShell component="article" maxWidth="md" title={pageTitle('/help')}>
      <Suspense>
        <HelpSections />
      </Suspense>
      <HelpActions />
    </PageShell>
  )
}

async function HelpSections() {
  const sections = await getPageSections('help')
  return sections.map((section) => (
    <Fragment key={section.id}>
      {section.slug === 'admin-access' ? (
        <MarkdownSection adornment={<AdminPanelSettings color="action" />} section={section}>
          <AdminButton />
        </MarkdownSection>
      ) : (
        <MarkdownSection section={section} />
      )}
      {section.slug === 'how-to-use' && (
        <Container disableGutters maxWidth="sm">
          <AddToHomeScreenAccordion />
        </Container>
      )}
    </Fragment>
  ))
}

async function AdminButton() {
  const role = await getUserRole()

  if (!role || role === 'admin') return null

  return (
    <Alert
      action={
        <Button
          color="inherit"
          href="mailto:julie.ux.dev@gmail.com?subject=Admin%20Access%20Request&body=Hi%2C%20I%27d%20like%20to%20request%20admin%20access%20for%20the%20Infinity%20Nikki%20Tracker."
          size="small"
        >
          Request access
        </Button>
      }
      severity="info"
      sx={{ my: 1 }}
    >
      You don&apos;t have admin access.
    </Alert>
  )
}
