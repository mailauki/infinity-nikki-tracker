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

export function SectionSubtitle({ children }: { children: React.ReactNode }) {
  return (
    <Container disableGutters maxWidth="sm">
      <Typography color="textSecondary" sx={{ mt: 1 }} variant="title">
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
            <ListItemText
              primary={
                <Typography color="textSecondary" size="large" variant="body">
                  {bullet}
                </Typography>
              }
            />
          </ListItem>
        ))}
      </List>
    </Container>
  )
}
