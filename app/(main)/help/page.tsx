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

      <Stack component="section" sx={{ mb: 2 }}>
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

      <HelpActions />
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
