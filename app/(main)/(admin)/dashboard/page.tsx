import { Suspense } from 'react'
import {
  Box,
  Button,
  Container,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { getEurekaSets } from '@/lib/data'

export default function DashboardPage() {
  return (
    <Suspense>
      <Container maxWidth="md" sx={{ flexGrow: 1, py: 3 }}>
        <AdminDashboard />
      </Container>
    </Suspense>
  )
}

async function AdminDashboard() {
  const eurekaSets = await getEurekaSets()

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Typography variant="h3" component="h1">
        Admin Dashboard
      </Typography>

      <Box>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography variant="h4" component="h2">
            Eureka Sets ({eurekaSets?.length ?? 0})
          </Typography>
          <Button
            variant="outlined"
            endIcon={<ArrowForwardIcon />}
            size="small"
            href="/eureka-set"
          >
            View all
          </Button>
        </Stack>
        <List disablePadding>
          {eurekaSets?.map((set) => (
            <ListItem key={set.id} disablePadding divider>
              <ListItemButton href={`/eureka-set/edit/${set.slug}`}>
                <ListItemText
                  primary={set.name}
                  secondary={set.trial ?? '—'}
                  slotProps={{ primary: { variant: 'body2' }, secondary: { variant: 'caption' } }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </Box>
  )
}