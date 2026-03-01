import {
  Button,
  Typography,
  Link as Anchor,
  Stack,
  ListItem,
  List,
  ListItemText,
  Container,
} from '@mui/material'

export default function AboutPage() {
  return (
    <Container maxWidth="md" sx={{ flexGrow: 1, py: 3 }}>
      <Stack spacing={3}>
        <Stack component="section">
          <Typography variant="h3" component="h1">
            About
          </Typography>
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
          </List>
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
                    href="https://infinity-nikki.fandom.com/"
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
            <ListItem sx={{ display: 'list-item' }}>
              <ListItemText
                primary={
                  <Typography color="textSecondary" variant="body1">
                    Admin dashboard — manage backend data directly from the frontend
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
          <Typography variant="body1" color="textSecondary">
            The backend runs on{' '}
            <Anchor
              href="https://supabase.com"
              target="_blank"
              rel="noreferrer"
              color="textSecondary"
            >
              Supabase
            </Anchor>
            . Data can be manually added from the dashboard, found in the{' '}
            <Anchor
              href="https://supabase.com/dashboard/project/ykfuevyqpjvtxidjnhxm"
              target="_blank"
              rel="noreferrer"
              color="textSecondary"
            >
              Supabase project&apos;s API settings
            </Anchor>
            .
          </Typography>
        </Stack>

        <Stack component="section">
          <Typography variant="h4" component="h2">
            Feedback &amp; Support
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Found a bug or have a suggestion? Reach out via email —{' '}
            <Anchor href="mailto:julie.ux.dev@gmail.com" color="textSecondary">
              julie.ux.dev@gmail.com
            </Anchor>
            .
          </Typography>
          <Stack direction="row" spacing={1} sx={{ my: 2 }}>
            <Button
              href="https://patreon.com/mailauki"
              target="_blank"
              rel="noreferrer"
              variant="contained"
            >
              Support on Patreon
            </Button>
            <Button
              href="https://buymeacoffee.com/mailauki"
              target="_blank"
              rel="noreferrer"
              variant="outlined"
            >
              Buy Me a Coffee
            </Button>
          </Stack>
        </Stack>

        <Typography variant="caption" color="textDisabled">
          &copy; 2026 mailauki. Not affiliated with Infold Games or Infinity Nikki.
        </Typography>
      </Stack>
    </Container>
  )
}
