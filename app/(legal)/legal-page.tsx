import { Alert, Container, Typography, Link as Anchor } from '@mui/material'
import PageShell from '@/components/page-shell'
import { Section, SectionSubtitle, SectionTitle } from '@/components/section'
import { LEGAL_CONTACT_EMAIL, LEGAL_EFFECTIVE_DATE } from './legal-meta'

// Shared chrome for both legal documents: the visible h1, the effective date,
// the plain-language summary callout, and the contact + fan-project footer.
// The two pages differ only in their body sections, so everything framing them
// lives here and can't drift apart between the documents.
export default function LegalPage({
  children,
  summary,
  title,
}: {
  children: React.ReactNode
  /** Plain-language "what this means" line, shown in a callout above the body. */
  summary: React.ReactNode
  title: string
}) {
  return (
    <PageShell titleVisible component="article" maxWidth="md" title={title}>
      <Container disableGutters maxWidth="sm">
        <Typography color="textSecondary" component="p" size="small" variant="body">
          Effective {LEGAL_EFFECTIVE_DATE}
        </Typography>
      </Container>

      <Container disableGutters maxWidth="sm">
        <Alert icon={false} severity="info" variant="outlined">
          <Typography component="p" variant="body">
            <strong>In short:</strong> {summary}
          </Typography>
        </Alert>
      </Container>

      {children}

      <Section>
        <SectionTitle>Contact</SectionTitle>
        <SectionSubtitle>
          Questions about this document, or a request about your data? Email{' '}
          <Anchor color="textSecondary" href={`mailto:${LEGAL_CONTACT_EMAIL}`}>
            {LEGAL_CONTACT_EMAIL}
          </Anchor>
          . You can also{' '}
          <Anchor
            color="textSecondary"
            href="https://github.com/mailauki/infinity-nikki-tracker/issues"
            rel="noreferrer"
            target="_blank"
          >
            open an issue on GitHub
          </Anchor>
          .
        </SectionSubtitle>
      </Section>

      {/*
        Plain <a> links, not `component={NextLink}`. These pages are Server
        Components and the sibling page passes its links in through a prop, so a
        component function here would cross the RSC boundary and fail to
        serialize at build time. Legal documents are static and rarely visited,
        so a full navigation costs nothing; the footer's copies of these links
        live in a Client Component and do use NextLink.
      */}
      <Container disableGutters maxWidth="sm">
        <Typography color="textSecondary" component="p" size="small" variant="body">
          This is a fan-made project and is not affiliated with, endorsed by, or officially
          connected to Papergames or the Infinity Nikki development team. All game content, names,
          and assets are the property of their respective owners. See also our{' '}
          <Anchor color="textSecondary" href="/privacy-policy">
            Privacy Policy
          </Anchor>{' '}
          and{' '}
          <Anchor color="textSecondary" href="/terms-of-service">
            Terms of Service
          </Anchor>
          .
        </Typography>
      </Container>
    </PageShell>
  )
}
