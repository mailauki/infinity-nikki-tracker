import {
  Typography,
  Link as Anchor,
  Stack,
  ListItem,
  List,
  ListItemText,
} from '@mui/material'
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
        </List>
      </Stack>

      <Typography variant="caption" color="textDisabled">
        &copy; 2026 mailauki. Not affiliated with Infold Games or Infinity Nikki.
      </Typography>
    </PageContainer>
  )
}
