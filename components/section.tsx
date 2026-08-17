import { Container, List, ListItem, ListItemText, Stack, Typography } from '@mui/material'

export function Section({ children }: { children: React.ReactNode }) {
  return (
    <Stack component="section" spacing={1}>
      {children}
    </Stack>
  )
}

export function SectionTitle({
  children,
  component = 'h2',
  size = 'medium',
}: {
  children: React.ReactNode
  component?: React.ElementType
  size?: 'medium' | 'small'
}) {
  return (
    <Typography component={component} size={size} variant="headline">
      {children}
    </Typography>
  )
}

// Body copy renders as a real <p>. Browser reader modes (Firefox Reader View,
// Safari Reader) run Readability, which scores a page by how much text sits
// directly inside <p> — prose built from <span> scores ~0 and the reader icon
// never appears. The theme maps every Typography variant to <span> by default,
// so prose components have to opt back in explicitly.
export function SectionSubtitle({ children }: { children: React.ReactNode }) {
  return (
    <Container disableGutters maxWidth="sm">
      <Typography color="textSecondary" component="p" sx={{ mt: 1 }} variant="title">
        {children}
      </Typography>
    </Container>
  )
}

export function SectionList({
  bullets,
  ordered = false,
}: {
  bullets: React.ReactNode[]
  ordered?: boolean
}) {
  return (
    <Container disableGutters maxWidth="sm">
      <List dense sx={{ listStyle: ordered ? 'decimal' : 'disc', pl: 4 }}>
        {bullets?.map((bullet, index) => (
          <ListItem key={index} sx={{ display: 'list-item' }}>
            {/*
              Style the primary slot rather than passing a <Typography> element as
              `primary`: ListItemText already wraps the slot in its own Typography,
              so an element here nests a <p> inside that <span>. Readability treats
              the malformed block as boilerplate and drops the bullet, which silently
              cost /about most of its links.
            */}
            <ListItemText
              primary={bullet}
              slotProps={{
                primary: {
                  color: 'textSecondary',
                  component: 'p',
                  size: 'large',
                  variant: 'body',
                },
              }}
            />
          </ListItem>
        ))}
      </List>
    </Container>
  )
}
