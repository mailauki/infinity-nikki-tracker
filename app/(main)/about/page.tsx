import { Container, Typography, Link as Anchor, Stack, ListItem, List, ListItemText } from '@mui/material'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About',
}

export default function AboutPage() {
  return (
    <Container maxWidth="md" sx={{ flexGrow: 1, py: 3 }}>
      <Stack spacing={3}>
      <Stack component="section">
        <Typography color="textSecondary" variant="subtitle1">
          Infinity Nikki Tracker is a collection tracker for{' '}
          <Anchor
            color="textSecondary"
            href="https://infinitynikki.infoldgames.com/"
            rel="noreferrer"
            target="_blank"
          >
            Infinity Nikki
          </Anchor>
          , the cozy open-world fashion game. Track your Eureka outfit progress across sets,
          categories, colors, and trials — with real-time updates and per-user collection state.
        </Typography>
      </Stack>

      <Stack component="section">
        <Typography component="h2" variant="h4">
          Links &amp; Resources
        </Typography>
        <List dense sx={{ listStyle: 'disc', pl: 4 }}>
          <ListItem sx={{ display: 'list-item' }}>
            <ListItemText
              primary={
                <Anchor
                  color="textSecondary"
                  href="https://infinitynikki.fandom.com/"
                  rel="noreferrer"
                  target="_blank"
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
                  color="textSecondary"
                  href="https://infinitynikki.infoldgames.com/"
                  rel="noreferrer"
                  target="_blank"
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
                  color="textSecondary"
                  href="https://github.com/mailauki/infinity-nikki-tracker"
                  rel="noreferrer"
                  target="_blank"
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
        <Typography component="h2" variant="h4">
          Roadmap
        </Typography>
        <Typography color="textSecondary" variant="subtitle1">
          Planned features and improvements:
        </Typography>
        <List dense sx={{ listStyle: 'disc', pl: 4 }}>
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
        <Typography component="h2" variant="h4">
          Collaborate
        </Typography>
        <Typography color="textSecondary" variant="body1">
          This project is open source. Contributions are welcome — whether it&apos;s fixing a bug,
          improving the UI, or adding new data.
        </Typography>
        <List dense sx={{ listStyle: 'disc', pl: 4 }}>
          <ListItem sx={{ display: 'list-item' }}>
            <ListItemText
              primary={
                <Anchor
                  color="textSecondary"
                  href="https://github.com/mailauki/infinity-nikki-tracker"
                  rel="noreferrer"
                  target="_blank"
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
                    color="textSecondary"
                    href="https://github.com/mailauki/infinity-nikki-tracker/issues"
                    rel="noreferrer"
                    target="_blank"
                  >
                    Open an issue
                  </Anchor>{' '}
                  for bugs or feature requests
                </Typography>
              }
            />
          </ListItem>
        </List>
      </Stack>

      <Typography color="textDisabled" variant="caption">
        &copy; 2026 mailauki. Not affiliated with Infold Games or Infinity Nikki.
      </Typography>
      </Stack>
    </Container>
  )
}
