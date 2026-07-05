import { Typography, Link as Anchor, Card, CardContent, Container } from '@mui/material'
import { Metadata } from 'next'
import { Section, SectionList, SectionSubtitle, SectionTitle } from '@/components/section'
import PageShell from '@/components/page-shell'
import { SimpleGrid } from '@/components/card-grid'

const featurePages = [
  {
    title: 'Eureka',
    subtitle:
      'Browse every Eureka set and its individual pieces in one place, mark pieces as obtained, and watch your progress update in real time.',
    bullets: [
      'Group by set or view pieces individually, and filter to a single Eureka set',
      'Switch to a by-color view, or filter by a specific color',
      'Filter by category and rarity, and sort newest or oldest first',
      'When signed in, filter to only obtained or only missing pieces — plus a dedicated Missing view that lists everything you haven’t collected yet',
      'Trials view — see how far along you are in each in-game trial',
    ],
  },
  {
    title: 'Outfits',
    subtitle:
      'Track full outfit sets along with their evolutions and glow-ups, and mark what you own.',
    bullets: [
      'Group by set or view variants individually, and filter to a single outfit set',
      'Filter by evolution stage, or hide evolutions and glow-ups to focus on base sets',
      'Filter by one or more outfit categories and by rarity',
      'Adjust the display density and sort order, and when signed in filter to only obtained or only missing items',
    ],
  },
  {
    title: 'Seasons',
    subtitle:
      'Explore outfits by season — grouped by location, with each season’s categories and set counts at a glance.',
    bullets: [
      'Sort seasons newest or oldest first',
      'Open any season to see its outfit sets grouped by category',
    ],
  },
  {
    title: 'Custom Looks',
    subtitle: 'Build and save your own outfit combinations from Eureka and outfit pieces.',
    bullets: [
      'Mix and match pieces into a saved look, with thumbnail previews',
      'Save a few looks for free, or upgrade to premium for unlimited looks',
    ],
  },
  {
    title: 'Profile',
    subtitle: 'Your collection at a glance once you’re signed in.',
    bullets: [
      'See completed Outfit Sets, Evolutions, Glow-ups, and Eureka Sets at a glance',
      'Toggle between Outfit and Eureka stats — each with completion charts and your most recent updates',
    ],
  },
  {
    title: 'Settings',
    subtitle: 'Personalize the app and manage your account.',
    bullets: [
      'Appearance — choose a system, light, or dark mode, set a default sort order, and pick a color theme (additional themes with premium)',
      'Profile — update your display name, username, and avatar',
      'Account — change your email or password, request admin access, or delete your account',
    ],
  },
]

export const metadata: Metadata = {
  title: 'About',
}

export default function AboutPage() {
  return (
    <PageShell maxWidth="md">
      <Section>
        <SectionTitle>What is this?</SectionTitle>
        <SectionSubtitle>
          A fan-made collection tracker for{' '}
          <Anchor
            color="textSecondary"
            href="https://infinitynikki.infoldgames.com/"
            rel="noreferrer"
            target="_blank"
          >
            Infinity Nikki
          </Anchor>{' '}
          — see your Eureka sets and variants at a glance, track your progress, and know exactly
          what you&apos;re still missing.
        </SectionSubtitle>
      </Section>

      <Section>
        <SectionTitle>About me</SectionTitle>
        <SectionSubtitle>
          I&apos;m Julie Evans, a UX-focused developer. This tracker is a side project built with
          Next.js, Supabase, and MUI — born out of playing the game and wanting a clearer view of my
          own collection.
        </SectionSubtitle>
        <SectionList
          bullets={[
            <>
              GitHub:{' '}
              <Anchor
                key="me-github"
                color="textSecondary"
                href="https://github.com/mailauki"
                rel="noreferrer"
                target="_blank"
              >
                github.com/mailauki
              </Anchor>
            </>,
            <>
              Instagram:{' '}
              <Anchor
                key="me-instagram"
                color="textSecondary"
                href="https://www.instagram.com/julieuxdev"
                rel="noreferrer"
                target="_blank"
              >
                instagram.com/julieuxdev
              </Anchor>
            </>,
            <Anchor
              key="me-medium"
              color="textSecondary"
              href="https://medium.com/@julieuxdev/i-built-a-collection-tracker-for-infinity-nikki-because-the-game-wouldnt-tell-me-what-i-was-missing-95ffcf3b2109"
              rel="noreferrer"
              target="_blank"
            >
              Behind the build — Medium article
            </Anchor>,
            <>
              Contact:{' '}
              <Anchor key="me-email" color="textSecondary" href="mailto:julie.ux.dev@gmail.com">
                julie.ux.dev@gmail.com
              </Anchor>
            </>,
          ]}
        />
      </Section>

      <Section>
        <SectionTitle>Features &amp; Pages</SectionTitle>
        <SectionSubtitle>
          Browse freely without an account, or sign in to save and track your own personal
          collection. Filtering, sorting, and views are available either way — obtained and missing
          filters unlock once you&apos;re signed in.
        </SectionSubtitle>
        <SimpleGrid columns={{ xs: '1fr', sm: '1fr 1fr' }} sx={{ pt: 1.5 }}>
          {featurePages.map((page) => (
            <FeatureCard
              key={page.title}
              bullets={page.bullets}
              subtitle={page.subtitle}
              title={page.title}
            />
          ))}
        </SimpleGrid>
      </Section>

      <Section>
        <SectionTitle>Links &amp; Resources</SectionTitle>
        <SectionSubtitle>
          This project is open source. Contributions are welcome — whether it&apos;s fixing a bug,
          improving the UI, or adding new data.
        </SectionSubtitle>
        <SectionList
          bullets={[
            <Anchor
              key="github"
              color="textSecondary"
              href="https://github.com/mailauki/infinity-nikki-tracker"
              rel="noreferrer"
              target="_blank"
            >
              GitHub Repository
            </Anchor>,
            <Typography key="issue" color="textSecondary" component="span" variant="body1">
              <Anchor
                color="textSecondary"
                href="https://github.com/mailauki/infinity-nikki-tracker/issues"
                rel="noreferrer"
                target="_blank"
              >
                Open an issue
              </Anchor>{' '}
              for bugs or feature requests
            </Typography>,
          ]}
        />
        <SectionSubtitle>Helpful resources</SectionSubtitle>
        <SectionList
          bullets={[
            <Anchor
              key="official"
              color="textSecondary"
              href="https://infinitynikki.infoldgames.com/"
              rel="noreferrer"
              target="_blank"
            >
              Infinity Nikki Official Website
            </Anchor>,
            <Anchor
              key="wiki"
              color="textSecondary"
              href="https://infinitynikki.fandom.com/"
              rel="noreferrer"
              target="_blank"
            >
              Infinity Nikki Wiki
            </Anchor>,
            <Anchor
              key="miraland"
              color="textSecondary"
              href="https://www.miralandcollection.com/"
              rel="noreferrer"
              target="_blank"
            >
              Miraland Collection
            </Anchor>,
            <Anchor
              key="library"
              color="textSecondary"
              href="https://infinitynikkilibrary.com/"
              rel="noreferrer"
              target="_blank"
            >
              Infinity Nikki Library
            </Anchor>,
          ]}
        />
      </Section>

      <Section>
        <SectionTitle>Roadmap</SectionTitle>
        <SectionSubtitle>Planned features and improvements:</SectionSubtitle>
        <SectionList
          bullets={[
            'Search — quickly find sets and variants by name',
            'Outfit Pieces — tracking support for pieces not part of any outfit sets',
            'Make-up Sets — tracking support for make-up sets and pieces',
            "Momo's Cloaks — tracking support for Momo's cloaks",
            'Favorites — save your favorite sets and pieces',
            'Friends — follow friends to compare collection progress',
            'Sharing — shareable links to your looks and collection',
          ]}
        />
      </Section>

      <Container disableGutters maxWidth="sm">
        <Typography color="textDisabled" variant="caption">
          This is a fan-made project and is not affiliated with, endorsed by, or officially
          connected to Papergames or the Infinity Nikki development team. All game content, names,
          and assets are the property of their respective owners.
        </Typography>
      </Container>
    </PageShell>
  )
}

function FeatureCard({
  title,
  subtitle,
  bullets,
}: {
  title: string
  subtitle: string
  bullets: string[]
}) {
  return (
    <Card sx={{ height: '100%' }} variant="outlined">
      <CardContent>
        <SectionTitle component="h3" variant="h6">
          {title}
        </SectionTitle>
        <SectionSubtitle>{subtitle}</SectionSubtitle>
        <SectionList bullets={bullets} />
      </CardContent>
    </Card>
  )
}
