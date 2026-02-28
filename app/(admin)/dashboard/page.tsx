import { Suspense } from 'react'
import {
  Avatar,
  Box,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { getAdminData } from '@/lib/data'

export default function DashboardPage() {
  return (
    <Suspense>
      <AdminDashboard />
    </Suspense>
  )
}

async function AdminDashboard() {
  const { eurekaSets, categories, colors } = await getAdminData()

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Typography variant="h5">Admin Dashboard</Typography>

      <Box>
        <Typography variant="h6" gutterBottom>
          Eureka Sets ({eurekaSets?.length ?? 0})
        </Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Slug</TableCell>
              <TableCell>Quality</TableCell>
              <TableCell>Style</TableCell>
              <TableCell>Trial</TableCell>
              <TableCell>Labels</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {eurekaSets?.map((set) => (
              <TableRow key={set.id}>
                <TableCell>{set.id}</TableCell>
                <TableCell>{set.name}</TableCell>
                <TableCell>
                  <Typography variant="caption" fontFamily="monospace">
                    {set.slug}
                  </Typography>
                </TableCell>
                <TableCell>{set.quality}</TableCell>
                <TableCell>{set.style}</TableCell>
                <TableCell>{set.trial ? 'Yes' : '—'}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {(set.labels as string[] | null)?.map((label) => (
                      <Chip key={label} label={label} size="small" />
                    ))}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>

      <Divider />

      <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        <Box sx={{ flex: 1, minWidth: 200 }}>
          <Typography variant="h6" gutterBottom>
            Categories ({categories?.length ?? 0})
          </Typography>
          <List dense>
            {categories?.map((category) => (
              <ListItem key={category.name}>
                <ListItemAvatar>
                  <Avatar src={category.image_url ?? undefined} alt={category.name} />
                </ListItemAvatar>
                <ListItemText primary={category.name} />
              </ListItem>
            ))}
          </List>
        </Box>

        <Box sx={{ flex: 1, minWidth: 200 }}>
          <Typography variant="h6" gutterBottom>
            Colors ({colors?.length ?? 0})
          </Typography>
          <List dense>
            {colors?.map((color) => (
              <ListItem key={color.name}>
                <ListItemAvatar>
                  <Avatar src={color.image_url ?? undefined} alt={color.name} />
                </ListItemAvatar>
                <ListItemText primary={color.name} />
              </ListItem>
            ))}
          </List>
        </Box>
      </Box>
    </Box>
  )
}
