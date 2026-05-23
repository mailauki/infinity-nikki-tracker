import HelpActions from './help-actions'
import { getUserRole } from '@/hooks/user'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Button,
  Container,
  Link as Anchor,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { Metadata } from 'next'
import { Suspense } from 'react'

export const metadata: Metadata = {
  title: 'Help',
}

export default function HelpPage() {
  return (
    <Container maxWidth="md" sx={{ flexGrow: 1, py: 3 }}>
      <Stack spacing={3}>
        <Container component="section" maxWidth="sm">
          <Typography component="h2" variant="h5">
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
                    page. No account needed — you can browse freely as a guest.
                  </Typography>
                }
              />
            </ListItem>
            <ListItem sx={{ display: 'list-item' }}>
              <ListItemText
                primary={
                  <Typography color="textSecondary" variant="body1">
                    Sign in to enable collection tracking for your account. Progress won&apos;t be
                    saved without an account.
                  </Typography>
                }
              />
            </ListItem>
            <ListItem sx={{ display: 'list-item' }}>
              <ListItemText
                primary={
                  <Typography color="textSecondary" variant="body1">
                    Click individual items to mark them as obtained — either from the{' '}
                    <Anchor color="textSecondary" href="/eureka">
                      Eureka
                    </Anchor>{' '}
                    page or from within a set&apos;s detail page.
                  </Typography>
                }
              />
            </ListItem>
            <ListItem sx={{ display: 'list-item' }}>
              <ListItemText
                primary={
                  <Typography color="textSecondary" variant="body1">
                    Use the filters to narrow things down by category, color, rarity, or completion
                    status.
                  </Typography>
                }
              />
            </ListItem>
            <ListItem sx={{ display: 'list-item' }}>
              <ListItemText
                primary={
                  <Typography color="textSecondary" variant="body1">
                    Use the filter menu to show only missing pieces — select{' '}
                    <strong>Missing</strong> under completion status to see only what you
                    haven&apos;t collected yet.
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
                    Manage your display name and avatar, and view your overall collection stats,
                    from the{' '}
                    <Anchor color="textSecondary" href="/profile">
                      Profile
                    </Anchor>{' '}
                    page.
                  </Typography>
                }
              />
            </ListItem>
          </List>
        </Container>

        <Container component="section" maxWidth="sm">
          <Typography component="h2" variant="h5">
            Add to home screen
          </Typography>
          <Typography color="textSecondary" sx={{ mb: 2 }} variant="body1">
            You can add this app to your home screen or bookmark bar for quick access — no app store
            required.
          </Typography>

          <Accordion disableGutters>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">iOS / iPadOS (Safari)</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List dense sx={{ listStyle: 'decimal', pl: 4 }}>
                <ListItem sx={{ display: 'list-item' }}>
                  <ListItemText
                    primary={
                      <Typography color="textSecondary" variant="body2">
                        Open the app in <strong>Safari</strong>.
                      </Typography>
                    }
                  />
                </ListItem>
                <ListItem sx={{ display: 'list-item' }}>
                  <ListItemText
                    primary={
                      <Typography color="textSecondary" variant="body2">
                        Tap the <strong>Share</strong> button (the box with an arrow pointing up) in
                        the toolbar.
                      </Typography>
                    }
                  />
                </ListItem>
                <ListItem sx={{ display: 'list-item' }}>
                  <ListItemText
                    primary={
                      <Typography color="textSecondary" variant="body2">
                        Scroll down and tap <strong>Add to Home Screen</strong>.
                      </Typography>
                    }
                  />
                </ListItem>
                <ListItem sx={{ display: 'list-item' }}>
                  <ListItemText
                    primary={
                      <Typography color="textSecondary" variant="body2">
                        Tap <strong>Add</strong> to confirm.
                      </Typography>
                    }
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Accordion disableGutters>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">Android (Chrome)</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List dense sx={{ listStyle: 'decimal', pl: 4 }}>
                <ListItem sx={{ display: 'list-item' }}>
                  <ListItemText
                    primary={
                      <Typography color="textSecondary" variant="body2">
                        Open the app in <strong>Chrome</strong>.
                      </Typography>
                    }
                  />
                </ListItem>
                <ListItem sx={{ display: 'list-item' }}>
                  <ListItemText
                    primary={
                      <Typography color="textSecondary" variant="body2">
                        Tap the <strong>three-dot menu</strong> in the top-right corner.
                      </Typography>
                    }
                  />
                </ListItem>
                <ListItem sx={{ display: 'list-item' }}>
                  <ListItemText
                    primary={
                      <Typography color="textSecondary" variant="body2">
                        Tap <strong>Add to Home screen</strong> or <strong>Install app</strong> if
                        shown.
                      </Typography>
                    }
                  />
                </ListItem>
                <ListItem sx={{ display: 'list-item' }}>
                  <ListItemText
                    primary={
                      <Typography color="textSecondary" variant="body2">
                        Tap <strong>Add</strong> to confirm.
                      </Typography>
                    }
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Accordion disableGutters>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">Desktop (Chrome or Edge)</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List dense sx={{ listStyle: 'decimal', pl: 4 }}>
                <ListItem sx={{ display: 'list-item' }}>
                  <ListItemText
                    primary={
                      <Typography color="textSecondary" variant="body2">
                        Open the app in <strong>Chrome</strong> or <strong>Edge</strong>.
                      </Typography>
                    }
                  />
                </ListItem>
                <ListItem sx={{ display: 'list-item' }}>
                  <ListItemText
                    primary={
                      <Typography color="textSecondary" variant="body2">
                        Click the <strong>install icon</strong> (a computer with a down arrow) in
                        the address bar, or open the <strong>three-dot menu</strong> and select{' '}
                        <strong>Save and share → Install page as app</strong>.
                      </Typography>
                    }
                  />
                </ListItem>
                <ListItem sx={{ display: 'list-item' }}>
                  <ListItemText
                    primary={
                      <Typography color="textSecondary" variant="body2">
                        Click <strong>Install</strong> to confirm.
                      </Typography>
                    }
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Accordion disableGutters>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">Desktop (Safari on macOS)</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List dense sx={{ listStyle: 'decimal', pl: 4 }}>
                <ListItem sx={{ display: 'list-item' }}>
                  <ListItemText
                    primary={
                      <Typography color="textSecondary" variant="body2">
                        Open the app in <strong>Safari</strong>.
                      </Typography>
                    }
                  />
                </ListItem>
                <ListItem sx={{ display: 'list-item' }}>
                  <ListItemText
                    primary={
                      <Typography color="textSecondary" variant="body2">
                        From the menu bar, click <strong>File → Add to Dock</strong> (macOS Sonoma
                        and later).
                      </Typography>
                    }
                  />
                </ListItem>
                <ListItem sx={{ display: 'list-item' }}>
                  <ListItemText
                    primary={
                      <Typography color="textSecondary" variant="body2">
                        Click <strong>Add</strong> to confirm.
                      </Typography>
                    }
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>
        </Container>

        <Container component="section" maxWidth="sm">
          <Typography component="h2" variant="h5">
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
        </Container>

        <HelpActions />
      </Stack>
    </Container>
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
