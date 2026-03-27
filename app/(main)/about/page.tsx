import {
  Container,
  Typography,
  Link as Anchor,
  Stack,
  ListItem,
  List,
  ListItemText,
} from '@mui/material'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About',
}

export default function AboutPage() {
  return (
    <Container maxWidth="md" sx={{ flexGrow: 1, py: 3 }}>
      <Stack spacing={3}>
        <Container component="section" maxWidth="sm">
          <Typography component="h2" variant="h5">
            What is this?
          </Typography>
          <Typography color="textSecondary" variant="subtitle2">
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
          </Typography>
        </Container>

        <Container component="section" maxWidth="sm">
          <Typography component="h2" variant="h5">
            Features
          </Typography>
          <List dense sx={{ listStyle: 'disc', pl: 4 }}>
            <ListItem sx={{ display: 'list-item' }}>
              <ListItemText
                primary={
                  <Typography color="textSecondary" variant="body1">
                    Browse all Eureka sets — see every set and its individual pieces in one place,
                    organized by style and rarity
                  </Typography>
                }
              />
            </ListItem>
            <ListItem sx={{ display: 'list-item' }}>
              <ListItemText
                primary={
                  <Typography color="textSecondary" variant="body1">
                    Track what you have — mark pieces as obtained and watch your progress update in
                    real time
                  </Typography>
                }
              />
            </ListItem>
            <ListItem sx={{ display: 'list-item' }}>
              <ListItemText
                primary={
                  <Typography color="textSecondary" variant="body1">
                    See what&apos;s missing — a dedicated view filters down to only the pieces you
                    haven&apos;t collected yet
                  </Typography>
                }
              />
            </ListItem>
            <ListItem sx={{ display: 'list-item' }}>
              <ListItemText
                primary={
                  <Typography color="textSecondary" variant="body1">
                    Progress by trial — see how far along you are in each in-game trial
                  </Typography>
                }
              />
            </ListItem>
            <ListItem sx={{ display: 'list-item' }}>
              <ListItemText
                primary={
                  <Typography color="textSecondary" variant="body1">
                    Filter and sort — narrow things down by category, color, rarity, or completion
                    status
                  </Typography>
                }
              />
            </ListItem>
            <ListItem sx={{ display: 'list-item' }}>
              <ListItemText
                primary={
                  <Typography color="textSecondary" variant="body1">
                    Use it as a guest or sign in — browse freely without an account, or sign in to
                    save and track your own personal collection
                  </Typography>
                }
              />
            </ListItem>
          </List>
        </Container>

        <Container component="section" maxWidth="sm">
          <Typography component="h2" variant="h5">
            Links &amp; Resources
          </Typography>
          <Typography color="textSecondary" sx={{ mt: 1 }} variant="subtitle2">
            This project
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
                    GitHub Repository
                  </Anchor>
                }
              />
            </ListItem>
            <ListItem sx={{ display: 'list-item' }}>
              <ListItemText
                primary={
                  <Anchor
                    color="textSecondary"
                    href="https://medium.com/@julieuxdev/i-built-a-collection-tracker-for-infinity-nikki-because-the-game-wouldnt-tell-me-what-i-was-missing-95ffcf3b2109"
                    rel="noreferrer"
                    target="_blank"
                    variant="body1"
                  >
                    Behind the build — Medium article
                  </Anchor>
                }
              />
            </ListItem>
          </List>
          <Typography color="textSecondary" sx={{ mt: 1 }} variant="subtitle2">
            Helpful resources
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
          </List>
        </Container>

        <Container component="section" maxWidth="sm">
          <Typography component="h2" variant="h5">
            Roadmap
          </Typography>
          <Typography color="textSecondary" variant="subtitle2">
            Planned features and improvements:
          </Typography>
          <List dense sx={{ listStyle: 'disc', pl: 4 }}>
            <ListItem sx={{ display: 'list-item' }}>
              <ListItemText
                primary={
                  <Typography color="textSecondary" variant="body1">
                    Search — quickly find sets and variants by name
                  </Typography>
                }
              />
            </ListItem>
            <ListItem sx={{ display: 'list-item' }}>
              <ListItemText
                primary={
                  <Typography color="textSecondary" variant="body1">
                    Outfits (Glow-up) — tracking support for Glow-up outfit variants
                  </Typography>
                }
              />
            </ListItem>
            <ListItem sx={{ display: 'list-item' }}>
              <ListItemText
                primary={
                  <Typography color="textSecondary" variant="body1">
                    Outfits (Evolution) — tracking support for Evolution outfit variants
                  </Typography>
                }
              />
            </ListItem>
          </List>
        </Container>

        <Container component="section" maxWidth="sm">
          <Typography component="h2" variant="h5">
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
        </Container>

        <Typography color="textDisabled" variant="caption">
          This is a fan-made project and is not affiliated with, endorsed by, or officially
          connected to Papergames or the Infinity Nikki development team. All game content, names,
          and assets are the property of their respective owners.
        </Typography>
      </Stack>
    </Container>
  )
}
