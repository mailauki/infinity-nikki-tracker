import { Suspense } from 'react'
import {
  Box,
  Button,
  Container,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import { getEurekaSets } from '@/lib/data'

export default function EurekaSetPage() {
  return (
    <Suspense>
      <Container maxWidth="md" sx={{ flexGrow: 1, py: 3 }}>
        <EurekaSetTable />
      </Container>
    </Suspense>
  )
}

async function EurekaSetTable() {
  const eurekaSets = await getEurekaSets()

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Stack direction="row" alignItems="flex-end" justifyContent="space-between">
        <Typography variant="h3" component="h1">
          Eureka Sets ({eurekaSets?.length ?? 0})
        </Typography>
        <Button variant="outlined" startIcon={<AddIcon />} size="small" href="/eureka-set/new">
          Add Eureka Set
        </Button>
      </Stack>
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
            <TableCell>Edit</TableCell>
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
              <TableCell align="right" sx={{ py: 0 }}>
                <Tooltip title={`Edit ${set.name}`}>
                  <IconButton size="small" color="secondary" href={`/eureka-set/edit/${set.slug}`}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  )
}
