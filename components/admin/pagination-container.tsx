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
  page?: number
  rowsPerPage?: number
  onPageChange?: (page: number) => void
  onRowsPerPageChange?: (rowsPerPage: number) => void
}

export default function PaginationContainer<T>({
  title,
  slug,
  rows,
  children,
  page: controlledPage,
  rowsPerPage: controlledRowsPerPage,
  onPageChange,
  onRowsPerPageChange,
}: PaginationContainerProps<T>) {
  const isControlled = controlledPage !== undefined
  const [localPage, setLocalPage] = useState(0)
  const [localRowsPerPage, setLocalRowsPerPage] = useState(15)

  const page = isControlled ? controlledPage : localPage
  const rowsPerPage = isControlled ? controlledRowsPerPage! : localRowsPerPage

  const handlePageChange = (_: unknown, newPage: number) => {
    if (isControlled) onPageChange?.(newPage)
    else setLocalPage(newPage)
  }

  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(e.target.value, 10)
    if (isControlled) {
      onRowsPerPageChange?.(newRowsPerPage)
    } else {
      setLocalRowsPerPage(newRowsPerPage)
      setLocalPage(0)
    }
  }

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

      <Paper elevation={3} sx={{ borderRadius: '12px', mb: 4 }}>
        <Box sx={{ flex: 1, height: '100%', minHeight: '592px' }}>{children(visibleRows)}</Box>
        <TablePagination
          component="div"
          count={allRows.length}
          page={page}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[6, 8, 15, 20, 30, 50, 100]}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
        />
      </Paper>
    </>
  )
}
