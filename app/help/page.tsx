import HelpActions from './help-actions'
import { getUserRole } from '@/hooks/user'
import { Alert, Button, Link as Anchor, Stack } from '@mui/material'
import { Metadata } from 'next'
import { Suspense } from 'react'
import AddToHomeScreenAccordion from './add-to-accordion'
import { AdminPanelSettings } from '@mui/icons-material'
import { Section, SectionList, SectionSubtitle, SectionTitle } from '@/components/section'

export const metadata: Metadata = {
  title: 'Help',
}

export default function HelpPage() {
  return (
    <Stack spacing={3} sx={{ flexGrow: 1, py: 3 }}>
      <Section>
        <SectionTitle>How to use</SectionTitle>
        <SectionSubtitle>
          No account needed — browse freely as a guest. Sign in to save and track your own
          collection; progress won&apos;t be saved without an account.
        </SectionSubtitle>
        <SectionList
          ordered
          bullets={[
            <>
              Track full outfit sets, evolutions, and glow-ups from the{' '}
              <Anchor color="textSecondary" href="/outfits">
                Outfits
              </Anchor>{' '}
              page, and explore them by season on the{' '}
              <Anchor color="textSecondary" href="/outfits/seasons">
                Seasons
              </Anchor>{' '}
              page.
            </>,
            <>
              Browse every Eureka set and its pieces from the{' '}
              <Anchor color="textSecondary" href="/eureka">
                Eureka
              </Anchor>{' '}
              page. Click an item to mark it as obtained — from the grid or a set&apos;s detail
              page.
            </>,
            <>
              Use the{' '}
              <Anchor color="textSecondary" href="/eureka/trials">
                Trials
              </Anchor>{' '}
              view to see your Eureka progress grouped by in-game trial.
            </>,
            <>
              Open the filter menu to narrow things down by category, color, rarity, evolution, or
              completion status — and to switch grouping, density, and sort order.
            </>,
            <>
              To see only what you&apos;re still missing, set completion status to{' '}
              <strong>Missing</strong>
							{' '}in the filter menu (available once you&apos;re signed in).
            </>,
            <>
              Build and save your own outfit combinations from the{' '}
              <Anchor color="textSecondary" href="/looks">
                Custom Looks
              </Anchor>{' '}
              page.
            </>,
            <>
              View your collection stats and recent updates on the{' '}
              <Anchor color="textSecondary" href="/profile">
                Profile
              </Anchor>{' '}
              page.
            </>,
            <>
              Personalize the app and manage your account from the{' '}
              <Anchor color="textSecondary" href="/settings">
                Settings
              </Anchor>{' '}
              page — theme mode, default sort, color theme, profile details, and account options.
            </>,
          ]}
        />
      </Section>

      <AddToHomeScreenAccordion />

      <Section>
        <SectionTitle>
          Admin access <AdminPanelSettings color="action" />
        </SectionTitle>
        <SectionSubtitle>
          As an admin, you can manage the data that powers this tracker. Use the{' '}
          <Anchor color="textSecondary" href="/admin">
            Admin Panel
          </Anchor>{' '}
          to add and edit database items, and track counts and recent activity.
        </SectionSubtitle>
        <Suspense>
          <AdminButton />
        </Suspense>
      </Section>

      <HelpActions />
    </Stack>
  )
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
