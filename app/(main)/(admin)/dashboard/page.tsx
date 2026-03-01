import { Suspense } from 'react'
import {
  Box,
  Container,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
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
        <Typography variant="h4" component="h2" gutterBottom>
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
              <TableCell>Labels</TableCell>
              <TableCell>Trial</TableCell>
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
                <TableCell>{set.labels}</TableCell>
                <TableCell>{set.trial}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </Box>
  )
}
