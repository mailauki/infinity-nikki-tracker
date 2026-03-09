import {
  Button,
  Typography,
  Link as Anchor,
  Stack,
  ListItem,
  List,
  ListItemText,
  Alert,
} from '@mui/material'
import { getUserRole } from '@/hooks/user'
import { Suspense } from 'react'
import { Metadata } from 'next'
import PageContainer from '@/components/page-container'

export const metadata: Metadata = {
  title: 'About',
}

export default function AboutPage() {
  return (
    <PageContainer title="About">
      <Stack component="section">
        <Typography variant="subtitle1" color="textSecondary">
          Infinity Nikki Tracker is a collection tracker for{' '}
          <Anchor
            href="https://infinitynikki.infoldgames.com/"
            target="_blank"
            rel="noreferrer"
            color="textSecondary"
          >
            Infinity Nikki
          </Anchor>
          , the cozy open-world fashion game. Track your Eureka outfit progress across sets,
          categories, colors, and trials — with real-time updates and per-user collection state.
        </Typography>
      </Stack>

      <Stack component="section">
        <Typography variant="h4" component="h2">
          How to use
        </Typography>
        <List sx={{ listStyle: 'decimal', pl: 4 }} dense>
          <ListItem sx={{ display: 'list-item' }}>
            <ListItemText
              primary={
                <Typography color="textSecondary" variant="body1">
                  Browse all Eureka sets from the{' '}
                  <Anchor href="/eureka" color="textSecondary">
                    Eureka
                  </Anchor>{' '}
                  page.
                </Typography>
              }
            />
          </ListItem>
          <ListItem sx={{ display: 'list-item' }}>
            <ListItemText
              primary={
                <Typography color="textSecondary" variant="body1">
                  Sign in to enable collection tracking for your account.
                </Typography>
              }
            />
          </ListItem>
          <ListItem sx={{ display: 'list-item' }}>
            <ListItemText
              primary={
                <Typography color="textSecondary" variant="body1">
                  Open any set and click individual items to mark them as obtained.
                </Typography>
              }
            />
          </ListItem>
          <ListItem sx={{ display: 'list-item' }}>
            <ListItemText
              primary={
                <Typography color="textSecondary" variant="body1">
                  Use the{' '}
                  <Anchor href="/eureka/missing" color="textSecondary">
                    Missing
                  </Anchor>{' '}
                  view to see items you haven&apos;t collected yet.
                </Typography>
              }
            />
          </ListItem>
          <ListItem sx={{ display: 'list-item' }}>
            <ListItemText
              primary={
                <Typography color="textSecondary" variant="body1">
                  Use the{' '}
                  <Anchor href="/eureka/trials" color="textSecondary">
                    Trials
                  </Anchor>{' '}
                  view to see your progress grouped by in-game trial.
                </Typography>
              }
            />
          </ListItem>
          <ListItem sx={{ display: 'list-item' }}>
            <ListItemText
              primary={
                <Typography color="textSecondary" variant="body1">
                  Manage your display name and avatar from the{' '}
                  <Anchor href="/profile" color="textSecondary">
                    Profile
                  </Anchor>{' '}
                  page.
                </Typography>
              }
            />
          </ListItem>
        </List>
      </Stack>

      <Stack component="section">
        <Typography variant="h4" component="h2">
          Admin access
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{ mb: 1 }}>
          As an admin, you can manage the data that powers this tracker:
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Use the{' '}
          <Anchor href="/dashboard" color="textSecondary">
            Dashboard
          </Anchor>{' '}
          to manage Eureka sets, variants, and trials — add, edit, and track counts and recent
          activity.
        </Typography>
        <Suspense>
          <AdminButton />
        </Suspense>
      </Stack>

      <Stack component="section">
        <Typography variant="h4" component="h2">
          Links &amp; Resources
        </Typography>
        <List sx={{ listStyle: 'disc', pl: 4 }} dense>
          <ListItem sx={{ display: 'list-item' }}>
            <ListItemText
              primary={
                <Anchor
                  href="https://infinitynikki.fandom.com/"
                  target="_blank"
                  rel="noreferrer"
                  color="textSecondary"
                  variant="body1"
                >
                  Infinity Nikki Wiki
                </Anchor>
              }
            />
          </ListItem>
          <ListItem sx={{ display: 'list-item' }}>
            <ListItemText
              primary={
                <Anchor
                  href="https://infinitynikki.infoldgames.com/"
                  target="_blank"
                  rel="noreferrer"
                  color="textSecondary"
                  variant="body1"
                >
                  Infinity Nikki Official Website
                </Anchor>
              }
            />
          </ListItem>
          <ListItem sx={{ display: 'list-item' }}>
            <ListItemText
              primary={
                <Anchor
                  href="https://github.com/mailauki/infinity-nikki-tracker"
                  target="_blank"
                  rel="noreferrer"
                  color="textSecondary"
                  variant="body1"
                >
                  GitHub Repository
                </Anchor>
              }
            />
          </ListItem>
        </List>
      </Stack>

      <Stack component="section">
        <Typography variant="h4" component="h2">
          Roadmap
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          Planned features and improvements:
        </Typography>
        <List sx={{ listStyle: 'disc', pl: 4 }} dense>
          <ListItem sx={{ display: 'list-item' }}>
            <ListItemText
              primary={
                <Typography color="textSecondary" variant="body1">
                  More outfit types — expand tracking beyond Eureka sets
                </Typography>
              }
            />
          </ListItem>
          <ListItem sx={{ display: 'list-item' }}>
            <ListItemText
              primary={
                <Typography color="textSecondary" variant="body1">
                  Item search — search across all items globally
                </Typography>
              }
            />
          </ListItem>
        </List>
      </Stack>

      <Stack component="section">
        <Typography variant="h4" component="h2">
          Collaborate
        </Typography>
        <Typography variant="body1" color="textSecondary">
          This project is open source. Contributions are welcome — whether it&apos;s fixing a bug,
          improving the UI, or adding new data.
        </Typography>
        <List sx={{ listStyle: 'disc', pl: 4 }} dense>
          <ListItem sx={{ display: 'list-item' }}>
            <ListItemText
              primary={
                <Anchor
                  href="https://github.com/mailauki/infinity-nikki-tracker"
                  target="_blank"
                  rel="noreferrer"
                  color="textSecondary"
                  variant="body1"
                >
                  View the source on GitHub
                </Anchor>
              }
            />
          </ListItem>
          <ListItem sx={{ display: 'list-item' }}>
            <ListItemText
              primary={
                <Typography color="textSecondary" variant="body1">
                  <Anchor
                    href="https://github.com/mailauki/infinity-nikki-tracker/issues"
                    target="_blank"
                    rel="noreferrer"
                    color="textSecondary"
                  >
                    Open an issue
                  </Anchor>{' '}
                  for bugs or feature requests
                </Typography>
              }
            />
          </ListItem>
          <ListItem sx={{ display: 'list-item' }}>
            <ListItemText
              primary={
                <Anchor
                  href="https://github.com/mailauki/infinity-nikki-tracker/pulls"
                  target="_blank"
                  rel="noreferrer"
                  color="textSecondary"
                  variant="body1"
                >
                  Submit a pull request
                </Anchor>
              }
            />
          </ListItem>
        </List>
      </Stack>

      <Typography variant="caption" color="textDisabled">
        &copy; 2026 mailauki. Not affiliated with Infold Games or Infinity Nikki.
      </Typography>
    </PageContainer>
  )
}

async function AdminButton() {
  const role = await getUserRole()

  if (role === 'admin') return null

  return (
    <Alert
      severity="info"
      action={
        <Button
          color="inherit"
          size="small"
          href="mailto:julie.ux.dev@gmail.com?subject=Admin%20Access%20Request&body=Hi%2C%20I%27d%20like%20to%20request%20admin%20access%20for%20the%20Infinity%20Nikki%20Tracker."
        >
          Request access
        </Button>
      }
    >
      You don&apos;t have admin access.
    </Alert>
  )
}
