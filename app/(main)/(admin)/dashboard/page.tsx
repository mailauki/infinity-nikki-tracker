import { Suspense } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { getAdminData, getEurekaVariants } from '@/lib/data'

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
  const [{ eurekaSets }, eurekaVariants] = await Promise.all([getAdminData(), getEurekaVariants()])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Typography variant="h3" component="h1">
        Admin Dashboard
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          gap: 2,
        }}
      >
        <StatCard
          title="Eureka Sets"
          count={eurekaSets?.length ?? 0}
          addHref="/eureka-set/new"
          viewHref="/eureka-set"
        />
        <StatCard
          title="Eureka Variants"
          count={eurekaVariants?.length ?? 0}
          addHref="/eureka-variant/new"
          viewHref="/eureka-variant"
        />
      </Box>

      <Box>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography variant="h5" component="h2">
            Recently Updated Eureka Sets
          </Typography>
          <Button variant="text" endIcon={<ArrowForwardIcon />} size="small" href="/eureka-set">
            View all
          </Button>
        </Stack>
        <List disablePadding>
          {eurekaSets?.slice(0, 5).map((set) => (
            <ListItem key={set.id} disablePadding divider>
              <ListItemButton href={`/eureka-set/edit/${set.slug}`}>
                <ListItemText
                  primary={set.name}
                  secondary={set.updated_at ? new Date(set.updated_at).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '—'}
                  slotProps={{ primary: { variant: 'body2' }, secondary: { variant: 'caption' } }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>

      <Box>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography variant="h5" component="h2">
            Recently Added Eureka Variants
          </Typography>
          <Button variant="text" endIcon={<ArrowForwardIcon />} size="small" href="/eureka-variant">
            View all
          </Button>
        </Stack>
        <List disablePadding>
          {[...(eurekaVariants ?? [])].sort((a, b) => b.id - a.id).slice(0, 5).map((variant) => (
            <ListItem
              key={variant.id}
              disablePadding
              divider
              secondaryAction={
                variant.default && <Chip size="small" label="default" color="secondary" variant="outlined" />
              }
            >
              <ListItemButton href={`/eureka-variant/edit/${variant.slug}`}>
                <ListItemText
                  primary={variant.eureka_set}
                  secondary={[variant.category, variant.color].filter(Boolean).join(' • ')}
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

function StatCard({
  title,
  count,
  addHref,
  viewHref,
}: {
  title: string
  count: number
  addHref: string
  viewHref: string
}) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="overline" color="text.secondary">
          {title}
        </Typography>
        <Typography variant="h2" component="p" sx={{ my: 1 }}>
          {count}
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" size="small" startIcon={<AddIcon />} href={addHref}>
            Add
          </Button>
          <Button variant="text" size="small" endIcon={<ArrowForwardIcon />} href={viewHref}>
            View all
          </Button>
        </Stack>
      </CardContent>
    </Card>
  )
}
