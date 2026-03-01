import { Suspense } from 'react'
import {
  Box,
  Button,
  Chip,
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
import { getEurekaVariants } from '@/lib/data'
import { toEurekaVariantSlug } from '@/lib/utils'

export default function EurekaVariantPage() {
  return (
    <Suspense>
      <Container maxWidth="md" sx={{ flexGrow: 1, py: 3 }}>
        <EurekaVariantTable />
      </Container>
    </Suspense>
  )
}

async function EurekaVariantTable() {
  const eurekaVariants = await getEurekaVariants()

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Stack direction="row" alignItems="flex-end" justifyContent="space-between">
        <Typography variant="h3" component="h1">
          Eureka Variants ({eurekaVariants?.length ?? 0})
        </Typography>
        <Button variant="outlined" startIcon={<AddIcon />} size="small" href="/eureka-variant/new">
          Add Eureka Variant
        </Button>
      </Stack>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Eureka Set</TableCell>
            <TableCell>Category</TableCell>
            <TableCell>Color</TableCell>
            <TableCell>Image URL</TableCell>
            <TableCell>Default</TableCell>
            <TableCell>Edit</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {eurekaVariants?.map((variant) => (
            <TableRow key={variant.id}>
              <TableCell>{variant.id}</TableCell>
              <TableCell>
                <Typography variant="caption" fontFamily="monospace">
                  {variant.eureka_set}
                </Typography>
              </TableCell>
              <TableCell>{variant.category}</TableCell>
              <TableCell>{variant.color}</TableCell>
              <TableCell>
                <Typography
                  variant="caption"
                  fontFamily="monospace"
                  sx={{ wordBreak: 'break-all' }}
                >
                  {variant.image_url}
                </Typography>
              </TableCell>
              <TableCell>
                {variant.default && (
                  <Chip label="default" size="small" color="secondary" variant="outlined" />
                )}
              </TableCell>
              <TableCell align="right" sx={{ py: 0 }}>
                <Tooltip
                  title={`Edit ${[variant.eureka_set, variant.category, variant.color].filter(Boolean).join(' • ')}`}
                >
                  <IconButton
                    size="small"
                    color="secondary"
                    href={`/eureka-variant/edit/${variant.slug ?? toEurekaVariantSlug(variant.eureka_set ?? '', variant.category ?? '', variant.color ?? '')}`}
                  >
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
