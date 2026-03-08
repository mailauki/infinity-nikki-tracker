'use client'

import { ReactNode, useState } from 'react'
import { Add } from '@mui/icons-material'
import {
  Alert,
  Box,
  Button,
  CardHeader,
  Chip,
  Paper,
  Stack,
  TablePagination,
  Typography,
} from '@mui/material'

interface PaginationContainerProps<T> {
  title: string
  slug: string
  rows: T[] | null | undefined
  children: (visibleRows: T[]) => ReactNode
}

export default function PaginationContainer<T>({
  title,
  slug,
  rows,
  children,
}: PaginationContainerProps<T>) {
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(15)

  const allRows = rows ?? []
  const visibleRows = allRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  return (
    <>
      <CardHeader
        disableTypography
        title={
          <Typography variant="h4" component="h2">
            {title}s
          </Typography>
        }
        action={<Chip variant="outlined" color="secondary" label={`Total: ${allRows.length}`} />}
      />

      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-end"
        flexWrap="wrap"
        useFlexGap
        spacing={1}
        sx={{ mb: 2 }}
      >
        <Alert severity="info">Some items are automatically generated — edit with caution</Alert>

        <Stack direction="row" justifyContent="flex-end" sx={{ flex: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Add />}
            size="small"
            href={`/${slug}/new`}
            sx={{ '&.MuiButton-root': { textWrap: 'nowrap' } }}
          >
            Add {title}
          </Button>
        </Stack>
      </Stack>

      <Paper elevation={3} sx={{ borderRadius: '12px' }}>
        <Box sx={{ flex: 1, height: '100%', minHeight: '592px' }}>{children(visibleRows)}</Box>
        <TablePagination
          component="div"
          count={allRows.length}
          page={page}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[15, 20, 30, 50, 100]}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10))
            setPage(0)
          }}
        />
      </Paper>
    </>
  )
}
