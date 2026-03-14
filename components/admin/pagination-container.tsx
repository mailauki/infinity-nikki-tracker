'use client'

import { ReactNode, useState } from 'react'
import { Add } from '@mui/icons-material'
import {
  Alert,
  Box,
  Button,
  Card,
  CardHeader,
  Chip,
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
        action={<Chip color="secondary" label={`Total: ${allRows.length}`} variant="outlined" />}
        title={
          <Typography component="h2" variant="h5">
            {title}s
          </Typography>
        }
      />

      <Stack
        useFlexGap
        alignItems="flex-end"
        direction="row"
        flexWrap="wrap"
        justifyContent="space-between"
        spacing={1}
        sx={{ mb: 2 }}
      >
        <Alert severity="info">Some items are automatically generated — edit with caution</Alert>

        <Stack direction="row" justifyContent="flex-end" sx={{ flex: 1 }}>
          <Button
            href={`/${slug}/new`}
            size="small"
            startIcon={<Add />}
            sx={{ '&.MuiButton-root': { textWrap: 'nowrap' } }}
            variant="outlined"
          >
            Add {title}
          </Button>
        </Stack>
      </Stack>
      <Card>
        <Box
          sx={{
            flex: 1,
            overflowX: 'auto',
            overscrollBehavior: 'contain',
            height: '100%',
            minHeight: '592px',
          }}
        >
          {children(visibleRows)}
        </Box>
      </Card>
      <TablePagination
        component="div"
        count={allRows.length}
        page={page}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[6, 8, 15, 20, 30, 50, 100]}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
      />
    </>
  )
}
