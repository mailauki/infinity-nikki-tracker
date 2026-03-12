import HelpActions from './help-actions'
import PageContainer from '@/components/page-container'
import { getUserRole } from '@/hooks/user'
import {
  Alert,
  Button,
  Link as Anchor,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material'
import { Metadata } from 'next'
import { Suspense } from 'react'

export const metadata: Metadata = {
  title: 'Help',
}

export default function HelpPage() {
  return (
    <PageContainer title="Help">
      <Stack component="section" sx={{ mb: 2 }}>
        <Typography component="h2" variant="h4">
          How to use
        </Typography>
        <List dense sx={{ listStyle: 'decimal', pl: 4 }}>
          <ListItem sx={{ display: 'list-item' }}>
            <ListItemText
              primary={
                <Typography color="textSecondary" variant="body1">
                  Browse all Eureka sets from the{' '}
                  <Anchor color="textSecondary" href="/eureka">
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
                  <Anchor color="textSecondary" href="/eureka/missing">
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
                  <Anchor color="textSecondary" href="/eureka/trials">
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
                  <Anchor color="textSecondary" href="/profile">
                    Profile
                  </Anchor>{' '}
                  page.
                </Typography>
              }
            />
          </ListItem>
        </List>
      </Stack>

      <Stack component="section" sx={{ mb: 2 }}>
        <Typography component="h2" variant="h4">
          Admin access
        </Typography>
        <Typography color="textSecondary" sx={{ mb: 1 }} variant="body1">
          As an admin, you can manage the data that powers this tracker:
        </Typography>
        <Typography color="textSecondary" variant="body1">
          Use the{' '}
          <Anchor color="textSecondary" href="/dashboard">
            Dashboard
          </Anchor>{' '}
          to manage Eureka sets, variants, and trials — add, edit, and track counts and recent
          activity.
        </Typography>
        <Suspense>
          <AdminButton />
        </Suspense>
      </Stack>

      <HelpActions />
    </PageContainer>
  )
}

async function AdminButton() {
  const role = await getUserRole()

  if (role === 'admin') return null

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
    >
      You don&apos;t have admin access.
    </Alert>
  )
}
