'use client'

import { ReactNode, useState } from 'react'
import { Add } from '@mui/icons-material'
import { Alert, Box, Button, Card, Stack, TablePagination } from '@mui/material'

interface PaginationContainerProps<T> {
  title: string
  addHref?: string
  rows: T[] | null | undefined
  children: (visibleRows: T[]) => ReactNode
  noPagination?: boolean
  page?: number
  rowsPerPage?: number
  onPageChange?: (page: number) => void
  onRowsPerPageChange?: (rowsPerPage: number) => void
}

export default function PaginationContainer<T>({
  title,
  addHref,
  rows,
  children,
  noPagination = false,
  page: controlledPage,
  rowsPerPage: controlledRowsPerPage,
  onPageChange,
  onRowsPerPageChange,
}: PaginationContainerProps<T>) {
  const isControlled = controlledPage !== undefined
  const [localPage, setLocalPage] = useState(0)
  const [localRowsPerPage, setLocalRowsPerPage] = useState(10)

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
  const visibleRows = noPagination
    ? allRows
    : allRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  return (
    <>
      <Stack
        useFlexGap
        direction="row"
        spacing={1}
        sx={{ mb: 2, alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap' }}
      >
        <Alert severity="info">Some items are automatically generated — edit with caution</Alert>

        {addHref && (
          <Stack direction="row" sx={{ flex: 1, justifyContent: 'flex-end' }}>
            <Button
              aria-label={`Add ${title}`}
              component="a"
              href={addHref}
              size="small"
              startIcon={<Add />}
              sx={{ '&.MuiButton-root': { textWrap: 'nowrap' } }}
              variant="outlined"
            >
              Add {title}
            </Button>
          </Stack>
        )}
      </Stack>
      <Card sx={{ borderColor: 'transparent' }}>
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
      {!noPagination && (
        <TablePagination
          component="div"
          count={allRows.length}
          page={page}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[6, 8, 10, 15, 20, 30, 50, 100]}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
        />
      )}
    </>
  )
}
